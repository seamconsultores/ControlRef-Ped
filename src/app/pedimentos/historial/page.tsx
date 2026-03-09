"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import { Search, Filter, Calendar, ChevronDown, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

// Tipos adaptados a nuestro esquema real
interface Pedimento {
    id: number;
    referencia: string;
    numero_pedimento: string;
    cve_doc: string;
    fecha_pago?: string;
    fecha_creacion: string;
    importador: string;
    rfc_importador?: string;
    bultos?: number;
    aduana: string;
    patente: string;
    cliente: string;
    tipo_operacion: string;
    clave_pedimento: string;
    es_inbond: boolean;
    usuario_id?: string;
}

const ADUANA_NAMES: Record<string, string> = {
    '240': 'NUEVO LAREDO',
    '800': 'COLOMBIA',
    '300': 'REYNOSA',
    '430': 'VERACRUZ',
    '280': 'MATAMOROS',
    '160': 'MONTERREY',
    '810': 'ALTAMIRA'
};

export default function HistorialPage() {
    const router = useRouter();
    const supabase = createClient();
    const [pedimentos, setPedimentos] = useState<Pedimento[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [userRole, setUserRole] = useState('user');
    const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) setUserRole(storedRole);
        fetchProfiles();
        fetchPedimentos();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('sessionContext');
        router.push('/');
    };

    const fetchProfiles = async () => {
        // Fetch users to map UUIDs to their real names
        const { data, error } = await supabase.from('profiles').select('id, full_name, role');
        if (!error && data) {
            const map: Record<string, string> = {};
            data.forEach((p: any) => {
                map[p.id] = p.full_name || 'Desconocido';
            });
            setProfilesMap(map);
        }
    };

    const fetchPedimentos = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            // Build query
            let query = supabase.from('pedimentos').select('*').order('fecha_creacion', { ascending: false });

            // Recuperar contexto (Patente / Aduana) para filtrar historial
            const storedContext = localStorage.getItem('sessionContext');
            if (storedContext) {
                try {
                    const ctx = JSON.parse(storedContext);
                    if (ctx.aduana) query = query.eq('aduana', ctx.aduana);
                    if (ctx.patente) query = query.eq('patente', ctx.patente);
                } catch (e) { console.error('Error parsing sessionContext', e); }
            }

            if (searchTerm) {
                // Simple OR search across multiple fields
                query = query.or(`referencia.ilike.%${searchTerm}%,numero_pedimento.ilike.%${searchTerm}%,cliente.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setPedimentos(data || []);
        } catch (err: any) {
            console.warn('Error fetching pedimentos:', err);
            // Si falla la conexión, mostramos mensaje amigable
            setErrorMsg('No se pudo conectar a la base de datos (Verifique Tablas/Conexión).');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPedimentos();
    };

    return (
        <div className="min-h-screen pl-64 bg-[#f8fafc]">
            <Sidebar userRole={userRole} onLogout={handleLogout} />

            {/* Header */}
            <header className="h-24 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
                <div>
                    <h2 className="text-2xl font-bold text-[#244635] tracking-tight">HISTORIAL DE PEDIMENTOS</h2>
                    <p className="text-xs font-bold text-[#D1BD85] uppercase tracking-widest mt-1">Consulta General</p>
                </div>
            </header>

            <div className="p-8 animate-in fade-in duration-500">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-8 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por Referencia, Pedimento o Cliente..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#244635]/20 focus:border-[#244635] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="bg-[#244635] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1a3326] transition-colors">
                        Buscar
                    </button>
                    <button type="button" onClick={() => { setSearchTerm(''); fetchPedimentos(); }} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                        Ver Todos
                    </button>
                </form>

                {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 flex items-center gap-2 border border-red-100">
                        <AlertCircle size={20} />
                        <span className="font-bold">{errorMsg}</span>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Referencia</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pedimento</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aduana / Patente</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Operación</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha / Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="animate-spin" size={20} />
                                                Loading...
                                            </div>
                                        </td>
                                    </tr>
                                ) : pedimentos.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            No se encontraron registros.
                                        </td>
                                    </tr>
                                ) : (
                                    pedimentos.map((ped) => (
                                        <tr key={ped.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-[#244635]">{ped.referencia}</td>
                                            <td className="px-6 py-4 font-mono text-slate-600 font-medium">{ped.numero_pedimento}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{ped.aduana} - {ADUANA_NAMES[ped.aduana] || ''}</span>
                                                    <span className="text-xs text-slate-400">Patente {ped.patente}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 font-medium">{ped.cliente}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${ped.tipo_operacion === 'EXP' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                                    {ped.tipo_operacion} - {ped.clave_pedimento}
                                                </span>
                                                {ped.es_inbond && (
                                                    <span className="ml-2 px-2 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700">INBOND</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                <div suppressHydrationWarning>
                                                    {ped.fecha_creacion ? new Date(ped.fecha_creacion).toLocaleDateString('es-MX', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'N/A'}
                                                </div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1" title={ped.usuario_id || 'Sistema'}>
                                                    Usuario: {ped.usuario_id ? (profilesMap[ped.usuario_id] || ped.usuario_id.slice(0, 8)) : 'SISTEMA'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
