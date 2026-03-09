"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    BarChart3,
    Users,
    Settings,
    LogOut,
    PlusCircle,
    Building2,
    ShieldCheck,
    BookOpen
} from 'lucide-react';
import ConnectionStatus from './ConnectionStatus';
import { createClient } from '@/lib/supabase/client';

const ADUANA_NAMES: Record<string, string> = {
    '240': 'NUEVO LAREDO',
    '800': 'COLOMBIA',
    '300': 'REYNOSA',
    '430': 'VERACRUZ',
    '280': 'MATAMOROS',
    '160': 'MONTERREY',
    '810': 'ALTAMIRA'
};

const Sidebar = ({ userRole = 'user', onLogout }: { userRole?: string, onLogout?: () => void }) => {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    // Context Switcher State
    const [contexts, setContexts] = React.useState<string[]>([]);
    const [currentContext, setCurrentContext] = React.useState<{ aduana: string, patente: string } | null>(null);
    const [showContexts, setShowContexts] = React.useState(false);
    const isAdmin = ['admin', 'director', 'gerente', 'coordinador'].includes(userRole);

    React.useEffect(() => {
        if (isAdmin) {
            fetchContexts();
        }
        // Load current context
        const stored = localStorage.getItem('sessionContext');
        if (stored) setCurrentContext(JSON.parse(stored));
    }, [userRole]);

    const fetchContexts = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('access_aduanas')
            .eq('id', user.id)
            .single();

        if (profile?.access_aduanas) {
            let aduanas: string[] = [];
            if (Array.isArray(profile.access_aduanas)) {
                aduanas = profile.access_aduanas;
            } else if (typeof profile.access_aduanas === 'string') {
                try { aduanas = JSON.parse(profile.access_aduanas); } catch (e) { }
            }
            setContexts(aduanas);
        }
    };

    const handleSwitchContext = (aduana: string) => {
        // Simple switch: Keep same user, just change aduana in local storage and reload
        // For patente, we default to the first available or keep current if valid? 
        // For simplicity, we just set Aduana and let the page logic resolve/validate Patente or use default.
        // Ideally we should know the patentes too. But let's verify if `page.tsx` handles "partial" context?
        // `page.tsx` logic: "invalid context -> default". 
        // We really should set a valid patente. 
        // Let's assume for now the user has access to at least 1 patent there.
        // We'll just update Aduana and empty Patente to force re-selection or auto-selection if only 1 exists.

        const newContext = { aduana, patente: '' };
        // Wait! If we set empty patente, `page.tsx` might prompt modal again if multiple patentes exist.
        // That's actually GOOD. It forces choosing the correct patent for the new aduana.

        localStorage.setItem('sessionContext', JSON.stringify(newContext));
        window.location.href = '/'; // Go to dashboard to re-initialize or trigger re-render
    };

    const handleInternalLogout = async () => {
        if (onLogout) {
            onLogout();
            return;
        }
        await supabase.auth.signOut();
        localStorage.removeItem('sessionContext');
        router.push('/login');
        router.refresh();
    };

    const allMenuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['admin', 'user', 'operativo', 'gerente', 'director', 'coordinador'] },
        { icon: FileText, label: 'Historial', href: '/pedimentos/historial', roles: ['admin', 'user', 'operativo', 'gerente', 'director', 'coordinador'] },
        { icon: FileText, label: 'Excel Historico', href: '/pedimentos/historico', roles: ['admin', 'director', 'gerente', 'coordinador'] },
        { icon: ShieldCheck, label: 'Control de Sellos', href: '/sellos', roles: ['admin', 'director', 'gerente', 'coordinador', 'operativo'] },
        { icon: FileText, label: 'Hist. de Sellos', href: '/sellos/historial', roles: ['admin', 'director', 'gerente', 'coordinador', 'operativo'] },
        { icon: BarChart3, label: 'Generador de Reportes', href: '/reportes', roles: ['admin', 'director', 'gerente'] },
        { icon: BarChart3, label: 'Estadísticas', href: '/estadisticas', roles: ['admin', 'director', 'gerente'] },
        { icon: Building2, label: 'Aduanas/Patentes', href: '/configuracion/aduanas', roles: ['admin', 'director'] },
        { icon: ShieldCheck, label: 'Series (Sociedades)', href: '/configuracion/series', roles: ['admin', 'director', 'gerente', 'coordinador'] },
        { icon: Users, label: 'Catálogo de Clientes', href: '/configuracion/clientes', roles: ['admin', 'director', 'gerente', 'coordinador'] },
        { icon: Users, label: 'Usuarios', href: '/admin/users', roles: ['admin', 'director'] },
        { icon: BookOpen, label: 'Manual Corporativo', href: '/admin/manual', roles: ['admin'] },
    ];

    const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

    const isActive = (href: string) => {
        if (!pathname) return false;
        if (href === '/' && pathname !== '/') return false;
        return pathname.startsWith(href);
    };

    const handleMainBoard = () => {
        router.push('/');
    };

    return (
        <div className="w-64 h-screen bg-[#244635] flex flex-col fixed left-0 top-0 z-50 shadow-2xl overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 h-20 px-6 bg-[#1a3326] shrink-0 sticky top-0 z-10">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#244635] font-bold text-lg">
                    G
                </div>
                <div>
                    <h1 className="font-bold text-white leading-none tracking-wide">GARBER S.C.</h1>
                    <p className="text-[10px] text-[#D1BD85] font-medium tracking-wider mt-0.5">CONTROL DE PEDIMENTOS</p>
                </div>
            </div>

            {/* Context Switcher for Admins */}
            {isAdmin && contexts.length > 1 && (
                <div className="px-4 py-4 border-b border-white/5 bg-[#1f3d2e]">
                    <button
                        onClick={() => setShowContexts(!showContexts)}
                        className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-all border border-white/5 hover:border-white/20 group"
                    >
                        <div className="text-left overflow-hidden">
                            <p className="text-[10px] font-bold text-[#D1BD85] uppercase tracking-widest mb-0.5">Aduana Activa</p>
                            <p className="text-sm font-bold text-white truncate">
                                {currentContext?.aduana ? `${currentContext.aduana} - ${ADUANA_NAMES[currentContext.aduana]?.substring(0, 10) || ''}...` : 'Seleccionar'}
                            </p>
                        </div>
                        <Building2 size={16} className={`text-white/50 transition-transform duration-300 ${showContexts ? 'rotate-180 text-white' : ''}`} />
                    </button>

                    {showContexts && (
                        <div className="mt-2 space-y-1 animate-in slide-in-from-top-2">
                            {contexts.map(ctx => (
                                <button
                                    key={ctx}
                                    onClick={() => handleSwitchContext(ctx)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2
                                        ${currentContext?.aduana === ctx
                                            ? 'bg-[#D1BD85] text-[#244635]'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${currentContext?.aduana === ctx ? 'bg-[#244635]' : 'bg-slate-500'}`} />
                                    {ctx} - {ADUANA_NAMES[ctx] || ctx}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 py-6 space-y-1">
                <div className="px-6 mb-2">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Menu Principal</p>
                </div>
                {menuItems.map((item, index) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={index}
                            href={item.href}
                            className={`w-full flex items-center gap-3 px-6 py-3.5 transition-all duration-200 border-l-4 ${active
                                ? 'bg-[#D1BD85] border-[#D1BD85] text-[#244635] font-bold shadow-lg shadow-black/10'
                                : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white font-medium'
                                }`}
                        >
                            <item.icon size={20} className={active ? 'stroke-[2.5px]' : 'stroke-2'} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            <ConnectionStatus />

            <div className="bg-[#1a3326] p-4 pb-8 space-y-1">
                <div className="px-4 mb-2">
                    <p className="text-[10px] text-white/40 font-bold uppercase">Portal Corporativo</p>
                </div>
                <button
                    onClick={handleMainBoard}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                    <Building2 size={16} />
                    <span>Volver al MainBoard</span>
                </button>
                <div className="h-px bg-white/10 my-2 mx-4"></div>
                <button
                    onClick={handleInternalLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-all text-sm font-medium"
                >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
