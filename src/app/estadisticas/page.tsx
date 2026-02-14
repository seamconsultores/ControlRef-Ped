"use client";

import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    AlertTriangle,
    TrendingUp,
    Users,
    FileCheck,
    Package,
    Clock,
    Calendar
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';

// --- MOCK DATA FOR DEMONSTRATION (If DB is empty) ---
const MOCK_DAILY_DATA = [
    { name: 'Lun', solicitudes: 12 },
    { name: 'Mar', solicitudes: 19 },
    { name: 'Mie', solicitudes: 15 },
    { name: 'Jue', solicitudes: 22 },
    { name: 'Vie', solicitudes: 28 },
    { name: 'Sab', solicitudes: 8 },
    { name: 'Dom', solicitudes: 2 },
];

const MOCK_CLIENT_DATA = [
    { name: 'Samsung Electronics', value: 45 },
    { name: 'Toyota Motors', value: 32 },
    { name: 'LG Display', value: 28 },
    { name: 'General Electric', value: 24 },
    { name: 'Foxconn', value: 18 },
];

const MOCK_CLAVE_DATA = [
    { name: 'A1 - Importación Definitiva', value: 65, color: '#244635' },
    { name: 'IN - Importación Temporal', value: 25, color: '#D1BD85' },
    { name: 'RT - Retorno', value: 10, color: '#64748b' },
];

const MOCK_INBOND_ALERTS = [
    { id: 'PD-2024-001', referencia: 'DAL-482910', cliente: 'Samsung Electronics', dias: 8, created_at: '2025-01-30' },
    { id: 'PD-2024-005', referencia: 'DAL-482945', cliente: 'LG Display', dias: 7, created_at: '2025-01-31' },
    { id: 'PD-2024-012', referencia: 'DAL-483012', cliente: 'Toyota Motors', dias: 9, created_at: '2025-01-29' },
];

export default function EstadisticasPage() {
    const supabase = createClient();
    const [dailyStats, setDailyStats] = useState<any[]>([]);
    const [clientStats, setClientStats] = useState<any[]>([]);
    const [claveStats, setClaveStats] = useState<any[]>([]);
    const [inbondAlerts, setInbondAlerts] = useState<any[]>([]);
    const [kpis, setKpis] = useState({
        total: 0,
        clientes: 0,
        inbond: 0,
        promedio: 'N/A'
    });
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRealData = async () => {
            try {
                setLoading(true);
                setErrorDetails(null);

                // 1. Fetch Raw Data (Simplificado: Traer todo)
                const { data: rawData, error } = await supabase
                    .from('pedimentos')
                    .select('*');

                if (error) throw error;

                if (!rawData || rawData.length === 0) {
                    console.warn("⚠️ No se encontraron datos (tabla vacía?)");
                    setKpis(prev => ({ ...prev, total: 0, promedio: 'Sin Datos' }));
                    return;
                }

                // --- PROCESAMIENTO INTELIGENTE DE FECHAS ---
                const now = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 7);

                // A. Daily Stats (Last 30 Days)
                let finalDaily = [];

                // Generar los últimos 30 días
                for (let i = 29; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(now.getDate() - i);
                    d.setHours(0, 0, 0, 0);

                    // Contar solicitudes para este día
                    const dayCount = rawData.reduce((acc, p) => {
                        const dateStr = p.fecha_creacion || p.created_at;
                        if (dateStr) {
                            const pDate = new Date(dateStr);
                            pDate.setHours(0, 0, 0, 0);
                            if (pDate.getTime() === d.getTime()) {
                                return acc + 1;
                            }
                        }
                        return acc;
                    }, 0);

                    finalDaily.push({
                        name: `${d.getDate()}/${d.getMonth() + 1}`, // Format: DD/MM (ej: 7/2)
                        solicitudes: dayCount
                    });
                }

                // B. Top Clients (Last 3 Months / 90 Days)
                const clientMap: Record<string, number> = {};
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(now.getDate() - 90);

                // Si estamos en modo historico (sin datos recientes), usar todo el dataset
                // Si estamos en modo vivo, filtrar por 90 dias
                // Check casual de actividad reciente para decidir si filtramos
                const hasRecentDataToCheck = rawData.some(p => {
                    const d = new Date(p.fecha_creacion || p.created_at);
                    return d >= ninetyDaysAgo;
                });

                const relevantData = hasRecentDataToCheck
                    ? rawData.filter(p => {
                        const d = new Date(p.fecha_creacion || p.created_at);
                        return d >= ninetyDaysAgo;
                    })
                    : rawData; // Si no hay nada reciente, usamos todo el historial

                relevantData.forEach(p => {
                    if (p.cliente) {
                        // Normalizar nombres si es necesario (trim)
                        const cleanName = p.cliente.trim();
                        clientMap[cleanName] = (clientMap[cleanName] || 0) + 1;
                    }
                });

                const finalClients = Object.entries(clientMap)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10) // Top 10
                    .map(([name, value]) => ({ name, value }));

                // C. Clave Distribution
                const claveMap: Record<string, number> = {};
                rawData.forEach(p => {
                    const clave = p.clave_pedimento || 'N/A';
                    claveMap[clave] = (claveMap[clave] || 0) + 1;
                });

                const COLORS = ['#244635', '#D1BD85', '#64748b', '#0ea5e9', '#f59e0b'];
                const finalClaves = Object.entries(claveMap)
                    .map(([name, value], index) => ({
                        name,
                        value: Math.round((value / rawData.length) * 100),
                        color: COLORS[index % COLORS.length]
                    }));

                // D. Inbond Alerts (Agnóstico de fecha real, solo diff > 5 días)
                const alerts: any[] = [];
                let inbondCount = 0;
                rawData.forEach(p => {
                    if (p.es_inbond) {
                        inbondCount++;
                        const dateStr = p.fecha_creacion || p.created_at;
                        if (dateStr) {
                            const created = new Date(dateStr);
                            const diffTime = Math.abs(now.getTime() - created.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays >= 5) {
                                alerts.push({
                                    id: p.id,
                                    referencia: p.referencia,
                                    cliente: p.cliente,
                                    dias: diffDays,
                                    created_at: p.fecha_creacion
                                });
                            }
                        }
                    }
                });

                setDailyStats(finalDaily);
                setClientStats(finalClients);
                setClaveStats(finalClaves);
                setInbondAlerts(alerts.slice(0, 6));

                setKpis({
                    total: rawData.length,
                    clientes: Object.keys(clientMap).length,
                    inbond: inbondCount,
                    promedio: '24 hrs'
                });

            } catch (error: any) {
                console.error("Critical Error fetching stats:", error);
                setErrorDetails(error.message || String(error));
            } finally {
                setLoading(false);
            }
        };
        fetchRealData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen pl-64 flex items-center justify-center bg-[#f8fafc]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#244635]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pl-64 bg-[#f8fafc]">
            <Sidebar />

            {/* Header */}
            <header className="h-24 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
                <div>
                    <h2 className="text-2xl font-bold text-[#244635] tracking-tight">ESTADÍSTICAS Y KPI</h2>
                    <p className="text-xs font-bold text-[#D1BD85] uppercase tracking-widest mt-1">Análisis Operativo en Tiempo Real</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <Calendar size={18} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-600">Últimos 30 días</span>
                </div>
            </header>

            <div className="p-8 space-y-8 animate-in fade-in duration-500">

                {/* Error Banner */}
                {errorDetails && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-start gap-4 shadow-sm">
                        <AlertTriangle className="text-red-600 shrink-0 mt-1" size={24} />
                        <div>
                            <h3 className="font-bold text-lg">Error de Carga</h3>
                            <p className="text-sm text-red-600 mt-1 font-mono break-all">{errorDetails}</p>
                            <p className="text-xs text-red-500 mt-2">Por favor reporte este código al administrador.</p>
                        </div>
                    </div>
                )}

                {/* 1. Alertas Críticas de INBOND */}
                {inbondAlerts.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertTriangle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-red-800">Alertas de Vencimiento INBOND</h3>
                                <p className="text-sm text-red-600 font-medium">Operaciones próximas a vencer (Límite 10 días)</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inbondAlerts.map((alert, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-red-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400">Referencia</p>
                                        <p className="font-bold text-slate-800">{alert.referencia}</p>
                                        <p className="text-xs text-slate-500 mt-1">{alert.cliente}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-black text-red-500">{alert.dias}</span>
                                        <span className="text-[10px] font-bold text-red-400 uppercase">Días Transcurridos</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-right">
                            <button className="text-xs font-bold text-red-600 hover:text-red-800 underline">Ver todas las alertas Inbond</button>
                        </div>
                    </div>
                )}

                {/* 2. KPIs Generales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard
                        title="Total Histórico"
                        value={kpis.total.toLocaleString()}
                        change="Total"
                        icon={FileCheck}
                        color="emerald"
                    />
                    <KpiCard
                        title="Clientes Únicos"
                        value={kpis.clientes}
                        change="Activos"
                        icon={Users}
                        color="blue"
                    />
                    <KpiCard
                        title="Operaciones Inbond"
                        value={kpis.inbond}
                        change="Abiertos"
                        icon={Package}
                        color="amber"
                    />
                    <KpiCard
                        title="Tiempo Promedio"
                        value={kpis.promedio}
                        change="Est"
                        icon={Clock}
                        color="purple"
                    />
                </div>

                {/* 3. Gráficos Principales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Gráfico de Pedimentos Diarios */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-[#244635]" /> Solicitudes (Últimos 30 días)
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#244635', fontWeight: 'bold' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="solicitudes"
                                        stroke="#244635"
                                        strokeWidth={3}
                                        dot={{ fill: '#244635', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Gráfico de Clientes Frecuentes */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Users size={20} className="text-[#244635]" /> Top 10 Clientes (Últimos 3 Meses)
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={clientStats} margin={{ left: 40, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={120}
                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#D1BD85" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Distribución por Clave */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 lg:col-span-2">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileCheck size={20} className="text-[#244635]" /> Distribución por Clave de Pedimento
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={claveStats}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {claveStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                {claveStats.map((stat, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }}></div>
                                            <span className="text-sm font-bold text-slate-700">{stat.name}</span>
                                        </div>
                                        <span className="font-black text-slate-800">{stat.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, change, icon: Icon, color }: any) {
    const colorClasses: any = {
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
    };
    const colors = colorClasses[color] || colorClasses.emerald;

    return (
        <div className={`p-6 rounded-2xl border ${colors.border} bg-white shadow-sm hover:shadow-md transition-all group`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
                    <Icon size={24} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${colors.bg} ${colors.text}`}>
                    {change}
                </span>
            </div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
        </div>
    );
}
