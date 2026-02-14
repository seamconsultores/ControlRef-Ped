"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import { createClient } from '@/lib/supabase/client';
import {
    Filter,
    Table as TableIcon,
    FileSpreadsheet,
    FileText,
    RefreshCw,
    Search
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportSource = 'sellos_fiscales' | 'pedimentos' | 'referencias';

interface ColumnConfig {
    id: string;
    label: string;
    checked: boolean;
}

const SOURCE_COLUMNS: Record<ReportSource, ColumnConfig[]> = {
    sellos_fiscales: [
        { id: 'numero_serie', label: 'Serie', checked: true },
        { id: 'estado', label: 'Estado', checked: true },
        { id: 'fecha_asignacion', label: 'Fecha Asignación', checked: true },
        { id: 'patente', label: 'Patente', checked: true },
        { id: 'aduana', label: 'Aduana', checked: true },
        { id: 'sociedad', label: 'Sociedad', checked: false },
        { id: 'cliente', label: 'Cliente', checked: true },
        { id: 'pedimento', label: 'Pedimento', checked: true },
        { id: 'referencia', label: 'Referencia', checked: false },
        { id: 'caja', label: 'Caja', checked: false },
        { id: 'placas', label: 'Placas', checked: false },
        { id: 'full_name', label: 'Usuario Asignado', checked: true },
        { id: 'asignado_a_ubicacion', label: 'Ubicación', checked: false },
    ],
    pedimentos: [
        { id: 'pedimento', label: 'Pedimento', checked: true },
        { id: 'referencia', label: 'Referencia', checked: true },
        { id: 'fecha_asignacion', label: 'Fecha Asignación', checked: true },
        { id: 'full_name', label: 'Usuario', checked: true },
        { id: 'cliente', label: 'Cliente', checked: true },
        { id: 'aduana', label: 'Aduana', checked: true },
        { id: 'patente', label: 'Patente', checked: true },
    ],
    referencias: [
        { id: 'referencia', label: 'Referencia', checked: true },
        { id: 'cliente', label: 'Cliente', checked: true },
        { id: 'pedimento', label: 'Pedimento', checked: true },
        { id: 'fecha_asignacion', label: 'Fecha Asignación', checked: true },
        { id: 'full_name', label: 'Usuario', checked: true },
        { id: 'estado', label: 'Estatus', checked: true },
    ]
};

export default function ReportsPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);

    // Configuration State
    const [source, setSource] = useState<ReportSource>('sellos_fiscales');
    const [columns, setColumns] = useState<ColumnConfig[]>(SOURCE_COLUMNS['sellos_fiscales']);

    // Filters
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [textFilter, setTextFilter] = useState(''); // General search
    const [selectedAduana, setSelectedAduana] = useState('Todas');
    const [limit, setLimit] = useState(100);

    // Initial load of default columns when source changes
    useEffect(() => {
        setColumns(SOURCE_COLUMNS[source]);
        setData([]); // Clear data on source switch
    }, [source]);

    const handleColumnToggle = (id: string) => {
        setColumns(cols => cols.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
    };

    const generateReport = async () => {
        setLoading(true);
        try {
            // Determine actual table to query
            // All 3 report types query 'sellos_fiscales' because that's where the operations live
            const actualTable = 'sellos_fiscales';

            // 1. Fetch MAIN DATA (No Join)
            let query = supabase.from(actualTable).select('*');

            // Apply Filters
            if (dateRange.start) {
                const dateCol = 'fecha_asignacion';
                if (dateCol) query = query.gte(dateCol, dateRange.start);
            }
            if (dateRange.end) {
                const dateCol = 'fecha_asignacion';
                if (dateCol) query = query.lte(dateCol, dateRange.end);
            }

            if (selectedAduana !== 'Todas') {
                const aduanaCol = 'aduana';
                query = query.ilike(aduanaCol, `%${selectedAduana.split(' ')[0]}%`);
            }

            // Text Filter (Global Search on key fields)
            if (textFilter) {
                // Shared search fields
                query = query.or(`numero_serie.ilike.%${textFilter}%,cliente.ilike.%${textFilter}%,pedimento.ilike.%${textFilter}%,referencia.ilike.%${textFilter}%`);
            }

            query = query.limit(limit);

            const { data: result, error } = await query;

            if (error) {
                console.error("Supabase Query Error:", error);
                throw new Error(error.message);
            }

            // 2. MANUAL JOIN: Fetch Profiles for 'asignado_a'
            const userIds = Array.from(new Set((result || []).map((item: any) => item.asignado_a).filter(Boolean)));

            let userMap: Record<string, string> = {};
            if (userIds.length > 0) {
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds);

                if (!profilesError && profiles) {
                    profiles.forEach((p: any) => {
                        userMap[p.id] = p.full_name || 'Sin Nombre';
                    });
                }
            }

            // 3. MERGE DATA
            const flattened = (result || []).map((item: any) => ({
                ...item,
                full_name: userMap[item.asignado_a] || 'Desconocido',
                // Ensure fields exist to avoid null errors in display
                referencia: item.referencia || '-',
                pedimento: item.pedimento || '-',
                cliente: item.cliente || '-',
                aduana: item.aduana || '-',
                patente: item.patente || '-',
                estado: item.estado || '-'
            }));

            setData(flattened);
        } catch (error: any) {
            console.error("Error generating report:", error);
            alert(`Error: ${error.message || "Revisa los filtros y permisos."}`);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (data.length === 0) return;

        // Filter columns
        const activeCols = columns.filter(c => c.checked);
        const exportData = data.map(row => {
            const newRow: any = {};
            activeCols.forEach(col => {
                newRow[col.label] = row[col.id];
            });
            return newRow;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte");
        XLSX.writeFile(wb, `Reporte_Generado_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const exportToPDF = () => {
        if (data.length === 0) return;

        const doc = new jsPDF();
        const activeCols = columns.filter(c => c.checked);

        const tableColumn = activeCols.map(c => c.label);
        const tableRows = data.map(row => {
            return activeCols.map(col => {
                const val = row[col.id];
                // Format dates or nulls if needed
                return val === null || val === undefined ? '' : String(val);
            });
        });

        doc.text(`Reporte de ${source.toUpperCase().replace('_', ' ')}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 22);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [36, 70, 53] } // Brand color
        });

        doc.save(`Reporte_Generado_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] pl-64">
            <Sidebar />

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[#244635]">Generador de Reportes</h1>
                        <p className="text-slate-500 mt-1">Crea reportes personalizados y expórtalos en múltiples formatos.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Configuration Panel */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* 1. Source */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                                Fuente de Datos
                            </h3>
                            <select
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[#244635]/10"
                                value={source}
                                onChange={(e) => setSource(e.target.value as ReportSource)}
                            >
                                <option value="pedimentos">Pedimentos</option>
                                <option value="sellos_fiscales">Sellos Fiscales</option>
                                <option value="referencias">Referencias</option>
                            </select>
                        </div>

                        {/* 2. Filters */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                                Filtros
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Rango de Fechas</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="date" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                            value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                                        <input type="date" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                            value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Aduana</label>
                                    <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                        value={selectedAduana} onChange={e => setSelectedAduana(e.target.value)}>
                                        <option value="Todas">Todas</option>
                                        <option value="240">240 - NUEVO LAREDO</option>
                                        <option value="800">800 - COLOMBIA</option>
                                        <option value="300">300 - REYNOSA</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Búsqueda General</label>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Cliente, Pedimento..."
                                            className="w-full pl-9 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                            value={textFilter}
                                            onChange={e => setTextFilter(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Límite de Resultados</label>
                                    <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                        value={limit} onChange={e => setLimit(Number(e.target.value))}>
                                        <option value="100">100 registros</option>
                                        <option value="500">500 registros</option>
                                        <option value="1000">1000 registros</option>
                                        <option value="5000">5000 registros</option>
                                        <option value="10000">10000 registros</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 3. Columns */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
                                Columnas Visibles
                            </h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {columns.map(col => (
                                    <label key={col.id} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={col.checked}
                                            onChange={() => handleColumnToggle(col.id)}
                                            className="rounded border-slate-300 text-[#244635] focus:ring-[#244635]"
                                        />
                                        {col.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="w-full bg-[#244635] text-white font-bold py-3 rounded-xl hover:bg-[#1a3326] transition-colors shadow-lg hover:shadow-[#244635]/25 flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                            Generar Reporte
                        </button>

                    </div>

                    {/* Results Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <TableIcon size={18} className="text-slate-400" />
                                    Vista Previa
                                    <span className="text-xs font-normal text-slate-400 ml-2">({data.length} resultados)</span>
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={exportToExcel}
                                        disabled={data.length === 0}
                                        className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                    >
                                        <FileSpreadsheet size={16} />
                                        Excel
                                    </button>
                                    <button
                                        onClick={exportToPDF}
                                        disabled={data.length === 0}
                                        className="flex items-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                    >
                                        <FileText size={16} />
                                        PDF
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto overflow-y-auto p-4 custom-scrollbar">
                                {data.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                        <Filter size={48} className="mb-4 text-slate-300" />
                                        <p>Configure los filtros y haga clic en "Generar Reporte"</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr>
                                                {columns.filter(c => c.checked).map(col => (
                                                    <th key={col.id} className="p-3 text-xs font-bold text-slate-500 uppercase bg-slate-50 border-b border-slate-100 whitespace-nowrap">
                                                        {col.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {data.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    {columns.filter(c => c.checked).map(col => (
                                                        <td key={col.id} className="p-3 text-slate-600 whitespace-nowrap">
                                                            {/* Simple formatting */}
                                                            {row[col.id] === null ? '-' : String(row[col.id])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
