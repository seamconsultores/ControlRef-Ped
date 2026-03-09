"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import { Search, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

interface SelloAsignado {
    id: string;
    numero_serie: string;
    patente: string;
    aduana_id?: string;
    sociedad?: string;
    estado: string;
    asignado_a?: string;
    fecha_asignacion?: string;
    cliente?: string;
    pedimento?: string;
    referencia?: string;
    aduana?: string;
    caja?: string;
    placas?: string;
}

export default function HistorialSellosPage() {
    const router = useRouter();
    const supabase = createClient();
    const [sellos, setSellos] = useState<SelloAsignado[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [userRole, setUserRole] = useState('user');
    const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) setUserRole(storedRole);
        fetchProfiles();
        fetchSellos();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('sessionContext');
        router.push('/');
    };

    const fetchProfiles = async () => {
        const { data, error } = await supabase.from('profiles').select('id, full_name');
        if (!error && data) {
            const map: Record<string, string> = {};
            data.forEach((p: any) => {
                map[p.id] = p.full_name || 'Desconocido';
            });
            setProfilesMap(map);
        }
    };

    const fetchSellos = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            // Solamente traer los que ya tienen fecha_asignacion
            let query = supabase.from('sellos_fiscales')
                .select('*')
                .not('fecha_asignacion', 'is', null)
                .order('fecha_asignacion', { ascending: false });

            if (searchTerm) {
                query = query.or(`numero_serie.ilike.%${searchTerm}%,cliente.ilike.%${searchTerm}%,pedimento.ilike.%${searchTerm}%,referencia.ilike.%${searchTerm}%,caja.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setSellos(data || []);
        } catch (err: any) {
            console.warn('Error fetching sellos:', err);
            setErrorMsg('No se pudo conectar a la base de datos para cargar el historial.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSellos();
    };

    return (
        <div className="min-h-screen pl-64 bg-[#f8fafc]">
            <Sidebar userRole={userRole} onLogout={handleLogout} />

            {/* Header */}
            <header className="h-24 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
                <div className="flex items-center gap-3">
                    <div className="bg-[#D1BD85] p-2.5 rounded-xl text-[#244635] shadow-sm">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#244635] tracking-tight">HISTORIAL DE SELLOS FISCALES</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Consulta la trazabilidad de sellos asignados
                        </p>
                    </div>
                </div>
            </header>

            <div className="p-8 animate-in fade-in duration-500">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-8 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por Sello, Cliente, Pedimento, Referencia o Caja..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#244635]/20 focus:border-[#244635] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="bg-[#244635] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1a3326] transition-colors shadow-sm">
                        Buscar
                    </button>
                    <button type="button" onClick={() => { setSearchTerm(''); fetchSellos(); }} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
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
                            <thead className="bg-[#244635]/5 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-extrabold text-[#244635] uppercase tracking-wider">No. Serie Sello</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Referencia</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Información Despacho</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transporte</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Uso / Reponsable</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="animate-spin" size={20} />
                                                Cargando...
                                            </div>
                                        </td>
                                    </tr>
                                ) : sellos.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            No se encontraron sellos asignados o registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    sellos.map((sello) => (
                                        <tr key={sello.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-[#244635] text-lg mb-1">{sello.numero_serie}</div>
                                                <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">P: {sello.patente}</span>
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">AD: {sello.aduana_id || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-slate-800 tracking-tight">{sello.referencia || 'S/N'}</div>
                                                <div className="text-xs text-slate-500 mt-1 uppercase font-semibold">Ped: {sello.pedimento || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-semibold text-slate-700">{sello.cliente || 'Desconocido'}</div>
                                                <div className="text-xs font-bold text-slate-400 mt-1 uppercase">Aduana: {sello.aduana || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-semibold text-slate-600 block bg-slate-50 px-2 py-1 border border-slate-100 rounded-md w-fit">
                                                        <span className="text-slate-400 mr-2">Caja:</span>{sello.caja || 'N/A'}
                                                    </span>
                                                    <span className="text-sm font-semibold text-slate-600 block bg-slate-50 px-2 py-1 border border-slate-100 rounded-md w-fit">
                                                        <span className="text-slate-400 mr-2">Placas:</span>{sello.placas || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-sm font-medium text-slate-800">
                                                    {sello.fecha_asignacion ? new Date(sello.fecha_asignacion).toLocaleDateString('es-MX', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'N/A'}
                                                </div>
                                                <div className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block mt-2">
                                                    {sello.asignado_a ? (profilesMap[sello.asignado_a] || sello.asignado_a.slice(0, 8)) : 'Desconocido'}
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
