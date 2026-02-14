"use client";
import React, { useState } from 'react';
import {
    PlusCircle,
    Search,
    RefreshCcw,
    ExternalLink,
    Info,
    Calendar,
    DollarSign,
    Briefcase,
    History,
    CheckCircle2,
    Building,
    ArrowRight,
    ChevronRight,
    ChevronLeft, // Importado
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import PedimentoForm from '@/components/pedimentos/PedimentoForm';

const ADUANA_NAMES: Record<string, string> = {
    '240': 'NUEVO LAREDO',
    '800': 'COLOMBIA',
    '300': 'REYNOSA',
    '430': 'VERACRUZ',
    '280': 'MATAMOROS',
    '160': 'MONTERREY',
    '810': 'ALTAMIRA'
};

// --- TIPOS DE NOTICIAS ---
interface NewsItem {
    id: string;
    source: string;
    title: string;
    date_str?: string;
    link?: string;
    category: string;
    color_class?: string;
    active: boolean;
}

const UserDashboard = ({ sessionContext }: { sessionContext?: { aduana: string, patente: string } }) => {
    const supabase = createClient();
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);

    // 1. Fetch News from Supabase
    React.useEffect(() => {
        const fetchNews = async () => {
            try {
                const { data, error } = await supabase
                    .from('noticias')
                    .select('*')
                    .eq('active', true)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error loading news:', error);
                    // Fallback visual
                    setNewsItems([{
                        id: 'fallback-1',
                        source: 'Sistema',
                        title: 'Bienvenido al Dashboard Operativo',
                        date_str: 'Hoy',
                        category: 'system',
                        color_class: 'bg-slate-800',
                        active: true
                    }]);
                } else if (data && data.length > 0) {
                    setNewsItems(data);
                } else {
                    setNewsItems([{
                        id: 'empty-1',
                        source: 'Sistema',
                        title: 'No hay novedades recientes',
                        date_str: 'Hoy',
                        category: 'system',
                        color_class: 'bg-slate-500',
                        active: true
                    }]);
                }
            } catch (err) {
                console.error('Critical error fetching news:', err);
                setNewsItems([{
                    id: 'error-1',
                    source: 'Sistema',
                    title: 'Bienvenido al Dashboard Operativo',
                    date_str: 'Hoy',
                    category: 'system',
                    color_class: 'bg-slate-800',
                    active: true
                }]);
            } finally {
                setLoadingNews(false);
            }
        };

        fetchNews();
    }, []);

    // 2. Auto-rotate news (only if we have items)
    React.useEffect(() => {
        if (newsItems.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % newsItems.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [newsItems]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % newsItems.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + newsItems.length) % newsItems.length);
    };

    const aduanaCode = sessionContext?.aduana || '';
    const aduanaLabel = ADUANA_NAMES[aduanaCode]
        ? `${aduanaCode} - ${ADUANA_NAMES[aduanaCode]}`
        : aduanaCode || 'Aduana General';

    const quickLinks = [
        { label: 'Mat. Sesión CRECE', url: 'https://www.aaanld.org/capacitacion-actualizacion' },
        { label: 'DOF - Diario Oficial', url: 'https://dof.gob.mx/' },
        { label: 'Circulares CAAAREM', url: 'https://www.caaarem.mx/' },
        { label: 'VUCEM - Aduana', url: 'https://www.ventanillaunica.gob.mx/vucem/Ingreso.html' },
        { label: 'SNICE - Consultas', url: 'https://www.snice.gob.mx/' },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Portal Operativo</h2>
                    <p className="text-slate-500 mt-1 font-medium">
                        Operando en <span className="text-[#244635] font-bold">{aduanaLabel}</span> con Patente <span className="text-[#244635] font-bold">{sessionContext?.patente || '----'}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-600">
                    <Calendar size={18} className="text-[#244635]" />
                    {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* NEWS SLIDER - Lógica de comportamiento diario */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative">
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                    {/* Controles de Navegación Manual */}
                    {newsItems.length > 1 && (
                        <div className="flex items-center gap-1 mr-2 bg-black/20 rounded-full p-1 backdrop-blur-md">
                            <button
                                onClick={prevSlide}
                                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                                title="Anterior"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                                title="Siguiente"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={async () => {
                            setLoadingNews(true);
                            try {
                                await fetch('/api/news/update');
                                // Re-fetch news after update
                                const { data } = await supabase
                                    .from('noticias')
                                    .select('*')
                                    .eq('active', true)
                                    .order('created_at', { ascending: false });
                                if (data) setNewsItems(data);
                            } catch (e) {
                                console.error("Error refreshing news", e);
                            } finally {
                                setLoadingNews(false);
                            }
                        }}
                        className="bg-black/20 hover:bg-black/40 text-white p-1.5 rounded-full backdrop-blur-md transition-colors"
                        title="Actualizar Noticias (DOF)"
                    >
                        <RefreshCcw size={12} />
                    </button>
                    <div className="bg-black/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                        Novedades
                    </div>
                </div>

                <div className="relative h-56 md:h-64">
                    {loadingNews ? (
                        <div className="absolute inset-0 flex items-center justify-center p-8 bg-slate-800/50 animate-pulse rounded-lg">
                            <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                        </div>
                    ) : (
                        newsItems.map((news, index) => (
                            <div
                                key={news.id}
                                className={`absolute inset-0 transition-all duration-700 ease-in-out px-6 py-6 md:px-8 md:py-8 flex flex-col justify-center rounded-lg
                                    ${index === currentSlide ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-10 pointer-events-none z-0'}
                                    ${news.color_class || 'bg-slate-700'}
                                `}
                            >
                                <div className="flex items-center gap-2 text-white/80 text-[10px] md:text-xs font-bold mb-2 uppercase tracking-wider">
                                    <span>{news.source}</span>
                                    <span>•</span>
                                    <span>{news.date_str}</span>
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-white max-w-4xl leading-snug line-clamp-4 md:line-clamp-3 mb-4">
                                    {news.title}
                                </h3>

                                {news.link && (
                                    <a
                                        href={news.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors w-fit border border-white/10"
                                    >
                                        Leer nota completa →
                                    </a>
                                )}
                            </div>
                        ))
                    )}
                </div>
                {/* Botón para ver más (Feature futuro) */}
                <button className="absolute bottom-0 left-0 w-full h-1 bg-slate-100/10 hover:bg-slate-100/30 transition-colors" />
            </div>

            {/* Main Action Area - Formulario Directo o Acceso */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">

                    {/* Botón Expansible de Solicitud (Si el usuario prefiere no verlo siempre abierto) */}
                    {!showForm ? (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full group bg-[#244635] hover:bg-[#1a3326] p-8 rounded-[2.5rem] shadow-xl shadow-[#244635]/20 transition-all transform hover:-translate-y-1 active:scale-95 text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                <PlusCircle size={150} className="text-white" />
                            </div>
                            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 backdrop-blur-md">
                                <PlusCircle size={40} />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">GENERAR NUEVO PEDIMENTO Y REFERENCIA</h3>
                            <p className="text-emerald-100 text-lg font-medium pr-10">
                                ADUANA {aduanaLabel} - Patente {sessionContext?.patente}
                            </p>
                            <div className="mt-8 flex items-center gap-3 text-white font-bold text-base">
                                Iniciar Solicitud <ArrowRight size={20} className="text-[#D1BD85]" />
                            </div>
                        </button>
                    ) : (
                        <div className="bg-slate-50 p-1 rounded-[2.5rem] border border-slate-200 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex justify-between items-center px-6 py-4">
                                <h3 className="text-lg font-bold text-slate-700">Solicitud en Proceso</h3>
                                <button onClick={() => setShowForm(false)} className="text-sm font-bold text-red-500 hover:text-red-700">Cancelar / Cerrar</button>
                            </div>
                            <PedimentoForm
                                initialAduana={sessionContext?.aduana}
                                initialPatente={sessionContext?.patente}
                            />
                        </div>
                    )}

                    {/* Búsqueda Histórica Simplificada */}
                    <div
                        onClick={() => window.location.href = '/pedimentos/historial'}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-shadow cursor-pointer select-none"
                    >
                        <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-[#244635]/10 group-hover:text-[#244635] transition-colors">
                            <Search size={32} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-800">Consultar Historial</h3>
                            <p className="text-slate-500 text-sm">Buscar referencias anteriores de esta aduana.</p>
                        </div>
                        <ArrowRight size={24} className="text-slate-300 group-hover:text-[#244635]" />
                    </div>

                </div>

                {/* Sidebar Informativo */}
                <div className="space-y-6">
                    <div className="bg-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform">
                            <ExternalLink size={120} />
                        </div>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <ExternalLink size={20} className="text-amber-400" /> Accesos Rápidos
                        </h3>
                        <div className="space-y-3 relative z-10">
                            {quickLinks.map((link, i) => (
                                <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group/link"
                                >
                                    <span className="text-sm font-semibold group-hover/link:translate-x-1 transition-transform">{link.label}</span>
                                    <ChevronRight size={16} className="text-white/30 group-hover/link:translate-x-1 transition-transform" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem]">
                        <h3 className="text-amber-800 font-bold mb-3 flex items-center gap-2">
                            <Info size={18} /> Nota Importante
                        </h3>
                        <p className="text-amber-700/80 text-xs leading-relaxed font-medium">
                            Estás trabajando en el entorno de <strong>{sessionContext?.aduana}</strong>.
                            Todas las referencias generadas se asignarán automáticamente a la patente <strong>{sessionContext?.patente}</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
