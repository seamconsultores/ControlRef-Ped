"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import { Search, Plus, Edit2, Trash2, CheckCircle, X, Users, Loader2 } from 'lucide-react';

interface Cliente {
    id: string;
    nombre_razon_social: string;
    rfc: string | null;
    activo: boolean;
}

export default function ClientesPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState('user');
    
    // Modal state for Edit/Add
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCliente, setCurrentCliente] = useState<Cliente | null>(null);
    const [formData, setFormData] = useState({ nombre: '', rfc: '', activo: true });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchUserContext = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             if (session) {
                 const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                 if (profile) setUserRole(profile.role);
             }
        };
        fetchUserContext();
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nombre_razon_social', { ascending: true });
            
        if (!error && data) {
            setClientes(data);
        }
        setLoading(false);
    };

    const handleOpenModal = (cliente?: Cliente) => {
        if (cliente) {
            setCurrentCliente(cliente);
            setFormData({ 
                nombre: cliente.nombre_razon_social, 
                rfc: cliente.rfc || '', 
                activo: cliente.activo 
            });
        } else {
            setCurrentCliente(null);
            setFormData({ nombre: '', rfc: '', activo: true });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCliente(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const nombreStand = formData.nombre.trim().toUpperCase();
            
            if (currentCliente) {
                // Update
                const { error } = await supabase
                    .from('clientes')
                    .update({ 
                        nombre_razon_social: nombreStand,
                        rfc: formData.rfc.trim().toUpperCase() || null,
                        activo: formData.activo
                    })
                    .eq('id', currentCliente.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('clientes')
                    .insert({ 
                        nombre_razon_social: nombreStand,
                        rfc: formData.rfc.trim().toUpperCase() || null,
                        activo: formData.activo
                    });
                if (error) throw error;
            }
            
            handleCloseModal();
            fetchClientes();
        } catch (error: any) {
            alert('Error guardando cliente: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, nombre: string) => {
        if (!window.confirm(`¿Estás seguro que deseas eliminar el cliente "${nombre}"?\nEsto puede fallar si ya tiene pedimentos o sellos ligados por historial.`)) return;
        
        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            fetchClientes();
        } catch (error: any) {
            alert('No se pudo eliminar: ' + error.message);
        }
    };

    // Filtered list
    const filteredClientes = clientes.filter(c => 
        c.nombre_razon_social.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.rfc && c.rfc.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen pl-64 bg-[#f8fafc]">
            <Sidebar userRole={userRole} />

            <header className="h-24 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
                <div className="flex items-center gap-3">
                    <div className="bg-[#D1BD85]/20 p-2.5 rounded-xl text-[#244635] shadow-sm border border-[#D1BD85]/30">
                        <Users size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#244635] tracking-tight">CATÁLOGO DE CLIENTES</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Administración y Estandarización
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => handleOpenModal()} 
                    className="bg-[#244635] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#1a3326] transition-colors shadow-sm flex items-center gap-2"
                >
                    <Plus size={18} /> Nuevo Cliente
                </button>
            </header>

            <div className="p-8 animate-in fade-in duration-500">
                {/* Search Bar */}
                <div className="mb-8 relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar cliente por razón social o RFC..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#244635]/20 focus:border-[#244635] transition-all bg-white shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#244635]/5 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-extrabold text-[#244635] uppercase tracking-wider">Razón Social</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">RFC</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="animate-spin" size={20} /> Cargando...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredClientes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No hay clientes registrados en el catálogo.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClientes.map((cliente) => (
                                        <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-slate-800 text-sm tracking-tight">{cliente.nombre_razon_social}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded w-fit uppercase font-mono tracking-widest">{cliente.rfc || 'S/R'}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {cliente.activo ? (
                                                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1 w-fit">
                                                        <CheckCircle size={14} /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1 w-fit">
                                                        <X size={14} /> Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right space-x-2">
                                                <button 
                                                    onClick={() => handleOpenModal(cliente)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                    title="Editar Cliente"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(cliente.id, cliente.nombre_razon_social)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    title="Eliminar (Sólo si no hay referencias)"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Edición/Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-[#244635]">
                                {currentCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">Razón Social (Mayúsculas Recomendado)</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#244635]/20 font-medium uppercase"
                                    value={formData.nombre}
                                    placeholder="Ej. EMPRESA MODELO SA DE CV"
                                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">RFC (Opcional)</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#244635]/20 font-medium uppercase font-mono"
                                    value={formData.rfc}
                                    placeholder="12 o 13 Caracteres"
                                    maxLength={13}
                                    onChange={(e) => setFormData({...formData, rfc: e.target.value})}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="activo"
                                    className="w-5 h-5 rounded border-slate-300 text-[#244635] focus:ring-[#244635]"
                                    checked={formData.activo}
                                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                                />
                                <label htmlFor="activo" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                                    Cliente Activo
                                </label>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-3 font-bold text-white bg-[#244635] hover:bg-[#1a3326] active:scale-[0.98] rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
