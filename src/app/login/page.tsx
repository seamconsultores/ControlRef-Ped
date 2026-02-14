"use client";

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            console.log("Login successful:", data);
            router.push('/'); // Redirigir al dashboard tras login exitoso
            router.refresh(); // Asegurar actualización de estado de sesión
        } catch (err: any) {
            console.error("Login error:", err.message);
            setErrorMsg("Credenciales incorrectas o error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden">

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-[#244635] rounded-b-[4rem] shadow-2xl z-0"></div>
            <div className="absolute top-10 right-10 w-64 h-64 bg-[#D1BD85]/10 rounded-full blur-3xl z-0"></div>

            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">

                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-xl mb-4 group hover:scale-105 transition-transform">
                        <ShieldCheck size={40} className="text-[#244635] group-hover:text-[#D1BD85] transition-colors" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Acceso Seguro</h1>
                    <p className="text-white/80 font-medium">Control de Referencias y Pedimentos</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-slate-100">
                    <form onSubmit={handleLogin} className="space-y-6">

                        {errorMsg && (
                            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                                <span className="font-bold">Error:</span> {errorMsg}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#244635]/20 focus:border-[#244635] transition-all font-medium text-slate-700"
                                    placeholder="usuario@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#244635]/20 focus:border-[#244635] transition-all font-medium text-slate-700"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#244635] text-white font-bold py-4 rounded-xl hover:bg-[#1a3326] transition-all shadow-lg hover:shadow-[#244635]/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Accediendo...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>

                    </form>

                    <div className="mt-8 text-center text-sm text-slate-400">
                        <p>© 2026 Sistema Integral de Control</p>
                        <p className="mt-1">Solo personal autorizado</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
