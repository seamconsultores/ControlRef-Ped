
"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wifi, WifiOff, Database, Github, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

type Status = 'online' | 'offline' | 'checking';

export default function ConnectionStatus() {
    const supabase = createClient();
    const [supabaseStatus, setSupabaseStatus] = useState<Status>('checking');
    const [githubStatus, setGithubStatus] = useState<Status>('checking'); // Simulado/Network
    const [lastCheck, setLastCheck] = useState<Date>(new Date());

    const checkConnection = async () => {
        setSupabaseStatus('checking');
        setGithubStatus('checking'); // Usaremos esto como "Internet/Red General"

        // 1. Check Network/Github (Simulado con ping a google o github si CORS permite, sino navigator)
        if (navigator.onLine) {
            setGithubStatus('online');
        } else {
            setGithubStatus('offline');
        }

        // 2. Check Supabase
        try {
            const { error, count } = await supabase.from('consecutivos').select('*', { count: 'exact', head: true });
            if (error) throw error;
            setSupabaseStatus('online');
        } catch (err) {
            console.warn("Supabase Check Failed (Offline/Error):", err);
            setSupabaseStatus('offline');
        }

        setLastCheck(new Date());
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        checkConnection();
        const interval = setInterval(checkConnection, 30000); // Check every 30s

        window.addEventListener('online', checkConnection);
        window.addEventListener('offline', checkConnection);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', checkConnection);
            window.removeEventListener('offline', checkConnection);
        };
    }, []);

    // Helper render function
    const renderStatus = (label: string, status: Status, Icon: any) => {
        let colorClass = 'bg-slate-200/5 text-slate-400 border-white/5';
        let statusDot = <div className="w-2 h-2 rounded-full bg-slate-500"></div>;
        let finalStatus = status;

        if (status === 'online') {
            colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            statusDot = <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>;
        } else if (status === 'offline') {
            colorClass = 'bg-red-500/10 text-red-400 border-red-500/20';
            statusDot = <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>;
        } else {
            colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            statusDot = <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"></div>;
        }

        return (
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${colorClass} transition-all duration-300`}>
                <div className="flex items-center gap-2">
                    <Icon size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                </div>
                {statusDot}
            </div>
        );
    };

    if (!mounted) return null; // Prevent hydration mismatch

    return (
        <div className="px-6 py-4 space-y-2 border-t border-white/5 bg-black/20">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Estado del Sistema</p>
                <button
                    onClick={checkConnection}
                    className="text-[9px] text-[#D1BD85] hover:text-white transition-colors cursor-pointer"
                    title="Actualizar estado"
                >
                    {lastCheck.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </button>
            </div>

            {renderStatus("CLOUD DB", supabaseStatus, Database)}
            {renderStatus("GITHUB / RED", githubStatus, Github)}
        </div>
    );
}
