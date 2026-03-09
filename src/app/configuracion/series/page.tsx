"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import { Search, Plus, Edit2, Trash2, ShieldCheck, Loader2, Building, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface SerieAsignacion {
    id: string;
    patente: string;
    aduana: string;
    oficina: string;
    serie_inicio: number;
    serie_fin: number;
    fecha_asignacion: string;
}

export default function SeriesPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [series, setSeries] = useState<SerieAsignacion[]>([]);
    const [userRole, setUserRole] = useState('user');
    const [availableContext, setAvailableContext] = useState<{ aduanas: string[], patentes: string[] }>({ aduanas: [], patentes: [] });

    // Filtros activos
    const [selectedAduana, setSelectedAduana] = useState<string>('');
    const [selectedPatente, setSelectedPatente] = useState<string>('');

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentEdit, setCurrentEdit] = useState<SerieAsignacion | null>(null);
    const [formData, setFormData] = useState({
        oficina: '',
        serie_inicio: '',
        serie_fin: '',
        fecha_asignacion: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        // Fetch user access context to populate dropdowns and check roles
        const fetchUserContext = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             if (session) {
                 const { data: profile } = await supabase.from('profiles').select('role, access_aduanas, access_patentes').eq('id', session.user.id).single();
                 if (profile) {
                    setUserRole(profile.role);
                    const aduanas = Array.isArray(profile.access_aduanas) ? profile.access_aduanas : JSON.parse(profile.access_aduanas || '[]');
                    const patentes = Array.isArray(profile.access_patentes) ? profile.access_patentes : JSON.parse(profile.access_patentes || '[]');
                    setAvailableContext({ aduanas, patentes });
                    
                    // Set defaults if empty
                    if (aduanas.length > 0) setSelectedAduana(aduanas[0]);
                    if (patentes.length > 0) setSelectedPatente(patentes[0]);
                 }
             }
        };
        fetchUserContext();
    }, []);

    useEffect(() => {
        if (selectedAduana && selectedPatente) {
            fetchSeries();
        }
    }, [selectedAduana, selectedPatente]);

    const fetchSeries = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('series_pedimentos')
            .select('*')
            .eq('aduana', selectedAduana)
            .eq('patente', selectedPatente)
            .order('serie_inicio', { ascending: true });
            
        if (!error && data) {
            setSeries(data);
        }
        setLoading(false);
    };

    const handleOpenModal = (serie?: SerieAsignacion) => {
        if (serie) {
            setCurrentEdit(serie);
            setFormData({
                oficina: serie.oficina,
                serie_inicio: serie.serie_inicio.toString(),
                serie_fin: serie.serie_fin.toString(),
                fecha_asignacion: new Date(serie.fecha_asignacion).toISOString().split('T')[0]
            });
        } else {
            setCurrentEdit(null);
            setFormData({
                oficina: '',
                serie_inicio: '',
                serie_fin: '',
                fecha_asignacion: new Date().toISOString().split('T')[0]
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            requestAnimationFrame(async () => {
                 const savePayload = {
                    patente: selectedPatente,
                    aduana: selectedAduana,
                    oficina: formData.oficina.trim().toUpperCase(),
                    serie_inicio: parseInt(formData.serie_inicio, 10),
                    serie_fin: parseInt(formData.serie_fin, 10),
                    fecha_asignacion: formData.fecha_asignacion,
                    created_by: session?.user?.id
                 };

                 if (currentEdit) {
                    const { error } = await supabase.from('series_pedimentos').update(savePayload).eq('id', currentEdit.id);
                    if (error) alert("Error actualizando: " + error.message);
                 } else {
                    const { error } = await supabase.from('series_pedimentos').insert(savePayload);
                    if (error) alert("Error guardando: " + error.message);
                 }

                 setIsModalOpen(false);
                 fetchSeries();
                 setIsSaving(false);
            });
        } catch (error: any) {
            alert('Error: ' + error.message);
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, oficina: string) => {
        if (!window.confirm(`¿Estás seguro que deseas eliminar las series de pedimentos asociadas a "${oficina}"?`)) return;
        const { error } = await supabase.from('series_pedimentos').delete().eq('id', id);
        if (!error) fetchSeries();
    };

    if (!['admin', 'director', 'gerente', 'coordinador'].includes(userRole.toLowerCase())) {
        return (
            <div className="flex h-screen bg-slate-50 items-center justify-center pl-64">
                <Sidebar userRole={userRole} />
                <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
                    <h2 className="text-xl font-bold text-slate-800">Acceso Restringido</h2>
                    <p className="text-slate-500">No tienes permisos para visualizar o editar la asignación de series maestras.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pl-64 bg-[#f8fafc]">
            <Sidebar userRole={userRole} />

            <header className="h-24 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
                <div className="flex items-center gap-4">
                    <div className="bg-[#244635] p-3 rounded-2xl text-[#fdfaf2] shadow-sm">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#244635] tracking-tight">ASIGNACIÓN DE SERIES</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Control por Sociedades
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Filtros Master */}
                    <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                        <select 
                            className="bg-transparent font-bold text-[#244635] text-sm px-4 py-1 outline-none border-r border-slate-300"
                            value={selectedPatente}
                            onChange={(e) => setSelectedPatente(e.target.value)}
                        >
                            <option value="" disabled>Patente...</option>
                            {availableContext.patentes.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select 
                            className="bg-transparent font-bold text-[#244635] text-sm px-4 py-1 outline-none"
                            value={selectedAduana}
                            onChange={(e) => setSelectedAduana(e.target.value)}
                        >
                            <option value="" disabled>Aduana...</option>
                            {availableContext.aduanas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    <button 
                        onClick={() => handleOpenModal()} 
                        disabled={!selectedAduana || !selectedPatente}
                        className="bg-[#D1BD85] text-[#244635] px-6 py-2.5 rounded-xl font-bold hover:bg-[#c2ad74] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={18} /> Asignar Remesa
                    </button>
                </div>
            </header>

            <div className="p-8 animate-in fade-in duration-500">
                {/* Visual Format of "Control de Pedimentos 2025" */}
                {selectedPatente && selectedAduana && (
                    <div className="mb-8 text-center bg-white p-6 rounded-2xl shadow-sm border border-[#D1BD85]/20">
                        <h1 className="text-2xl font-black text-[#244635] tracking-tight uppercase">CONTROL DE PEDIMENTOS {new Date().getFullYear()}</h1>
                        <h3 className="text-sm font-bold text-slate-500 tracking-widest mt-2 uppercase">PATENTE {selectedPatente}</h3>
                        <h2 className="text-xl font-bold text-[#D1BD85] mt-1 tracking-widest uppercase">ADUANA : {selectedAduana}</h2>
                    </div>
                )}

                {/* Main Table Matching Excel Style exactly but modern */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 bg-[#006400] text-white text-sm font-bold uppercase tracking-widest border-r border-[#005000]">Oficina / Sociedad</th>
                                    <th className="px-6 py-4 bg-[#006400] text-white text-sm font-bold uppercase tracking-widest text-center border-r border-[#005000]" colSpan={3}>Serie</th>
                                    <th className="px-6 py-4 bg-[#006400] text-white text-sm font-bold uppercase tracking-widest">Nota</th>
                                    <th className="px-6 py-4 bg-[#006400] text-white w-24"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="animate-spin" size={20} /> Cargando Series...
                                            </div>
                                        </td>
                                    </tr>
                                ) : series.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            Seleccione Patente y Aduana para comenzar o no hay asignaciones para esta plaza.
                                        </td>
                                    </tr>
                                ) : (
                                    series.map((s, idx) => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors uppercase">
                                            <td className="px-6 py-5 border-r border-slate-100 text-slate-800 font-bold">{s.oficina}</td>
                                            <td className="px-6 py-5 text-right font-mono text-[#244635] text-lg font-black">{s.serie_inicio}</td>
                                            <td className="px-4 py-5 text-center text-slate-400 font-bold tracking-widest text-xs">AL</td>
                                            <td className="px-6 py-5 text-left font-mono text-[#244635] text-lg font-black border-r border-slate-100">{s.serie_fin}</td>
                                            <td className="px-6 py-5 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                                ASIGNADO {new Date(s.fecha_asignacion).toLocaleDateString('es-ES').replace(/\//g,'-')}
                                            </td>
                                            <td className="px-6 py-5 text-right space-x-2 border-l border-slate-100">
                                                <button 
                                                    onClick={() => handleOpenModal(s)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(s.id, s.oficina)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                                                >
                                                    <Trash2 size={16} />
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

            {/* Modal Editor */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#244635] px-6 py-5">
                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                <Building size={20} className="text-[#D1BD85]" />
                                {currentEdit ? 'Editar Asignación' : 'Nueva Asignación de Serie'}
                            </h3>
                            <p className="text-xs text-white/70 mt-1 uppercase tracking-widest font-bold">Patente {selectedPatente} • Aduana {selectedAduana}</p>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">Sociedad / Oficina</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#244635]/20 font-medium uppercase"
                                    value={formData.oficina}
                                    placeholder="Ej. GARBER NUEVO LAREDO"
                                    onChange={(e) => setFormData({...formData, oficina: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Serie Inicial</label>
                                    <input 
                                        type="number" 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#244635]/20 font-medium font-mono text-[#244635]"
                                        value={formData.serie_inicio}
                                        placeholder="6000001"
                                        onChange={(e) => setFormData({...formData, serie_inicio: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-700 block mb-2">Serie Final</label>
                                    <input 
                                        type="number" 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#244635]/20 font-medium font-mono text-[#244635]"
                                        value={formData.serie_fin}
                                        placeholder="6001000"
                                        onChange={(e) => setFormData({...formData, serie_fin: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">Fecha de Asignación</label>
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#244635]/20 font-medium text-slate-600"
                                    value={formData.fecha_asignacion}
                                    onChange={(e) => setFormData({...formData, fecha_asignacion: e.target.value})}
                                />
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-3 font-bold text-[#244635] bg-[#D1BD85] hover:bg-[#c2ad74] active:scale-[0.98] rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Guardar Serie'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
