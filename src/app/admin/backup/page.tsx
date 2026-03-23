"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import { 
    Download, Database, Table, FileSpreadsheet, Loader2, 
    CheckCircle2, AlertTriangle, ShieldCheck, History, Users,
    Building2, ClipboardList
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BackupPage() {
    const supabase = createClient();
    const [userRole, setUserRole] = useState('user');
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState('');
    const [lastSync, setLastSync] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             if (session) {
                 const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                 if (profile) setUserRole(profile.role.toLowerCase());
             }
             setLoading(false);
             setLastSync(new Date().toLocaleString());
        };
        fetchUser();
    }, []);

    const handleBackupExport = async () => {
        if (!confirm('¿Deseas generar y descargar el Respaldo Maestro de la Base de Datos? Esta acción extraerá toda la información operativa actual.')) return;
        
        setExporting(true);
        setProgress('Iniciando extracción de datos...');
        
        try {
            // 1. Fetch all main tables
            setProgress('Extrayendo Pedimentos...');
            const { data: pedimentos } = await supabase.from('pedimentos').select('*');
            
            setProgress('Extrayendo Sellos Fiscales...');
            const { data: sellos } = await supabase.from('sellos_fiscales').select('*');
            
            setProgress('Extrayendo Catálogo de Clientes...');
            const { data: clientes } = await supabase.from('clientes').select('*');
            
            setProgress('Extrayendo Configuración de Series...');
            const { data: series } = await supabase.from('series_pedimentos').select('*');
            
            setProgress('Extrayendo Perfiles de Usuarios...');
            const { data: profiles } = await supabase.from('profiles').select('*');

            setProgress('Generando libro de Excel...');
            
            // 2. Create Workbook
            const wb = XLSX.utils.book_new();
            
            // 3. Add Sheets
            if (pedimentos) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pedimentos), "Pedimentos");
            if (sellos) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sellos), "Sellos Fiscales");
            if (clientes) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientes), "Clientes");
            if (series) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(series), "Series y Sociedades");
            if (profiles) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profiles), "Perfiles de Acceso");

            // 4. Download
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `RESPALDO_MAESTRO_SEAM_GARBER_${dateStr}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            setProgress('¡Descarga completada con éxito!');
            setTimeout(() => setProgress(''), 3000);
        } catch (error) {
            console.error('Error in backup:', error);
            alert('Error al generar el respaldo. Verifique su conexión.');
        } finally {
            setExporting(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-[#244635]" size={48} />
        </div>
    );

    if (userRole !== 'admin' && userRole !== 'director') {
        return (
            <div className="flex h-screen bg-slate-50 items-center justify-center pl-64">
                <Sidebar userRole={userRole} />
                <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
                    <h2 className="text-xl font-bold text-slate-800">Acceso Denegado</h2>
                    <p className="text-slate-500">Solo administradores autorizados pueden realizar respaldos maestros de la infraestructura.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pl-64 bg-[#f8fafc]">
            <Sidebar userRole={userRole} />

            <header className="h-24 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
                <div className="flex items-center gap-4">
                    <div className="bg-[#244635] p-3 rounded-2xl text-[#D1BD85] shadow-sm">
                        <Database size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#244635] tracking-tight text-balance uppercase">Centro de Respaldo Maestro</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Gestión de integridad y copias de seguridad de SEAM - GARBER
                        </p>
                    </div>
                </div>
            </header>

            <div className="p-8 animate-in fade-in duration-500">
                <div className="max-w-4xl mx-auto space-y-8">
                    
                    {/* Main Export Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-32 translate-x-32 z-0"></div>
                        
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-[#244635] uppercase">Generar Fotografía de Datos</h3>
                                <p className="text-slate-500 font-medium">Extrae toda la base de datos operativa en un solo libro de Excel multi-pestaña.</p>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-4">
                                <ShieldCheck className="text-blue-600 shrink-0" size={24} />
                                <div className="text-sm">
                                    <p className="font-bold text-blue-900">Seguridad de la información</p>
                                    <p className="text-blue-800/70">Este archivo contiene información sensible de clientes, pedimentos y sellos. Guárdelo en un lugar seguro (ej. Google Drive Corporativo) tras descargarlo.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pt-4">
                                <button 
                                    onClick={handleBackupExport}
                                    disabled={exporting}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-lg hover:shadow-xl active:scale-95
                                        ${exporting ? 'bg-slate-100 text-slate-400' : 'bg-[#D1BD85] text-[#244635] hover:bg-[#c2ad74]'}`}
                                >
                                    {exporting ? (
                                        <Loader2 className="animate-spin" size={24} />
                                    ) : (
                                        <Download size={24} />
                                    )}
                                    {exporting ? 'PROCESANDO...' : 'DESCARGAR RESPALDO .XLSX'}
                                </button>
                                
                                {progress && (
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold animate-pulse">
                                        <CheckCircle2 size={18} />
                                        <span>{progress}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats / Tables Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
                                <Table size={16}/> Esquema Incluido en el Reporte
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <History size={16} className="text-[#244635]"/> Pedimentos
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <FileSpreadsheet size={16} className="text-[#244635]"/> Sellos Fisc.
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <Users size={16} className="text-[#244635]"/> Clientes
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <Building2 size={16} className="text-[#244635]"/> Series
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#244635] p-8 rounded-3xl shadow-lg shadow-[#244635]/20 text-white space-y-4">
                            <h4 className="font-bold text-[#D1BD85] uppercase text-xs tracking-widest flex items-center gap-2">
                                <ClipboardList size={16}/> Estado del Sistema
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Última Sincronización</p>
                                    <p className="text-xl font-bold">{lastSync || '---'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Estado del Almacén</p>
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                                        OPTIMIZADO
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-100/50 p-6 rounded-2xl border border-dashed border-slate-300 text-center">
                        <p className="text-xs text-slate-500 font-medium">
                            Nota: Para programar respaldos automáticos a la nube vía GitHub Actions o API de Google Drive, consulte con soporte técnico.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
