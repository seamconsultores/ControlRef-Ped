"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import { Search, Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function HistoricoExcelPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState('user');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) setUserRole(storedRole);
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            let query = supabase.from('pedimentos_historicos').select('*').order('created_at', { ascending: false }).limit(200);

            if (searchTerm) {
                query = query.or(`referencia.ilike.%${searchTerm}%,pedimento.ilike.%${searchTerm}%,cliente.ilike.%${searchTerm}%`);
            }

            const { data: results, error } = await query;
            if (error) throw error;
            setData(results || []);
        } catch (err: any) {
            console.error("Error fetching history:", err);
            setErrorMsg("Error al cargar datos.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const jsonData = XLSX.utils.sheet_to_json(ws);

                    if (jsonData.length === 0) throw new Error("El archivo está vacío.");

                    // Get user once
                    const { data: { user } } = await supabase.auth.getUser();
                    const userId = user?.id;

                    // Map keys loosely (users often have different headers)
                    // We try to match common column names
                    const mappedData = jsonData.map((row: any) => ({
                        referencia: row['Referencia'] || row['REFERENCIA'] || row['Ref'] || '',
                        pedimento: row['Pedimento'] || row['PEDIMENTO'] || row['Ped'] || '',
                        aduana: row['Aduana'] || row['ADUANA'] || '',
                        cliente: row['Cliente'] || row['CLIENTE'] || '',
                        fecha_pago: row['Fecha Pago'] || row['FECHA'] || row['Fecha'] || '',
                        clave: row['Cve. Doc.'] || row['Clave'] || '',
                        bultos: row['Bultos'] || '',
                        transporte: row['Transporte'] || '',
                        guias: row['Guias'] || row['Guías'] || '',
                        uploaded_by: userId
                    }));

                    // Batch insert (chunks of 100)
                    const chunkSize = 100;
                    for (let i = 0; i < mappedData.length; i += chunkSize) {
                        const chunk = mappedData.slice(i, i + chunkSize);
                        const { error } = await supabase.from('pedimentos_historicos').insert(chunk);
                        if (error) throw error;
                    }

                    setSuccessMsg(`Se importaron ${mappedData.length} registros exitosamente.`);
                    fetchData(); // Refresh

                } catch (err: any) {
                    console.error("Error parsing/uploading:", err);
                    setErrorMsg(err.message || "Error al procesar el archivo.");
                } finally {
                    setUploading(false);
                    // Reset input
                    e.target.value = '';
                }
            };
            reader.readAsBinaryString(file);

        } catch (err) {
            setUploading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const canUpload = ['admin', 'director', 'gerente', 'coordinador'].includes(userRole);

    return (
        <div className="min-h-screen pl-64 bg-[#f8fafc]">
            <Sidebar userRole={userRole} />

            <header className="h-24 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
                <div>
                    <h2 className="text-2xl font-bold text-[#244635] tracking-tight">EXCEL HISTÓRICO</h2>
                    <p className="text-xs font-bold text-[#D1BD85] uppercase tracking-widest mt-1">Consulta de Archivo Muerto</p>
                </div>
                {canUpload && (
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="excel-upload"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                        <label
                            htmlFor="excel-upload"
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all cursor-pointer ${uploading ? 'bg-slate-400' : 'bg-[#244635] hover:bg-[#1a3326] shadow-lg shadow-[#244635]/20'}`}
                        >
                            {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                            {uploading ? 'Importando...' : 'Importar Excel'}
                        </label>
                    </div>
                )}
            </header>

            <div className="p-8">
                {/* Mensajes */}
                {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
                        <AlertTriangle size={20} />
                        <span className="font-bold">{errorMsg}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-green-100">
                        <CheckCircle size={20} />
                        <span className="font-bold">{successMsg}</span>
                    </div>
                )}

                {/* Search */}
                <form onSubmit={handleSearch} className="mb-8 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar en histórico..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#244635]/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="bg-[#244635] text-white px-6 py-3 rounded-xl font-bold">
                        Buscar
                    </button>
                    <button type="button" onClick={() => { setSearchTerm(''); fetchData(); }} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold">
                        Ver Todos
                    </button>
                </form>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Referencia</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Pedimento</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Cliente</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Aduana</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Docs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="animate-spin" size={20} />
                                                Cargando...
                                            </div>
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            No hay registros históricos encontrados.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-bold text-[#244635]">{row.referencia}</td>
                                            <td className="px-6 py-4 font-mono font-medium text-slate-600">{row.pedimento}</td>
                                            <td className="px-6 py-4 text-slate-600">{row.cliente}</td>
                                            <td className="px-6 py-4 text-slate-500">{row.aduana}</td>
                                            <td className="px-6 py-4 text-slate-500">{row.fecha_pago}</td>
                                            <td className="px-6 py-4 text-slate-500">
                                                <FileSpreadsheet size={16} className="text-green-600" />
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
