"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import { 
    Cpu, Database, ShieldAlert, GitBranch, Code, Server,
    Layers, Lock, Workflow, HardDrive, Terminal, GitBranch as GitIcon
} from 'lucide-react';

export default function TechnicalManualPage() {
    const supabase = createClient();
    const [userRole, setUserRole] = useState('user');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             if (session) {
                 const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                 if (profile) setUserRole(profile.role.toLowerCase());
             }
             setLoading(false);
        };
        fetchUser();
    }, []);

    if (loading) return null;

    if (userRole !== 'admin') {
        return (
            <div className="flex h-screen bg-slate-50 items-center justify-center pl-64">
                <Sidebar userRole={userRole} />
                <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <ShieldAlert className="w-16 h-16 text-red-400 mx-auto" />
                    <h2 className="text-xl font-bold text-slate-800">Acceso No Autorizado</h2>
                    <p className="text-slate-500">Este manual contiene información de infraestructura técnica y arquitectura propietaria. Solo administradores pueden visualizar esta documentación.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pl-64 bg-[#f8fafc]">
            <Sidebar userRole={userRole} />

            <header className="h-24 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-800 p-3 rounded-2xl text-white shadow-sm">
                        <Cpu size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase tracking-widest">Manual Técnico de Arquitectura</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Documentación de Infraestructura y Desarrollo SEAM - GARBER
                        </p>
                    </div>
                </div>
            </header>

            <div className="p-8 animate-in fade-in duration-500">
                <div className="max-w-5xl mx-auto space-y-12 pb-24">
                    
                    {/* Intro Card */}
                    <div className="bg-[#244635] rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Code size={200} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">v1.0 Stack Modern</span>
                            <h3 className="text-4xl font-black">Infraestructura Serverless Next-Gen</h3>
                            <p className="max-w-xl text-white/70 font-medium">Este manual detalla los componentes, lenguajes de programación e integraciones de base de datos que sostienen la plataforma operativa.</p>
                        </div>
                    </div>

                    {/* Three Columns Architecture */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600">
                                <Layers size={24} />
                            </div>
                            <h4 className="font-black text-slate-800 uppercase tracking-tight">Capa de Frontend</h4>
                            <p className="text-sm text-slate-500 font-medium">Uso de Next.js 15+ con App Router. Lógica en TypeScript y renderizado híbrido para máxima velocidad en consultas operativas.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600">
                                <Database size={24} />
                            </div>
                            <h4 className="font-black text-slate-800 uppercase tracking-tight">Capa de Datos</h4>
                            <p className="text-sm text-slate-500 font-medium">Bóveda relacional Supabase Cloud. Motor PostgreSQL con políticas de seguridad RLS binarias a nivel de fila.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                            <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600">
                                <Lock size={24} />
                            </div>
                            <h4 className="font-black text-slate-800 uppercase tracking-tight">Capa de Seguridad</h4>
                            <p className="text-sm text-slate-500 font-medium">Autenticación JWT y Role Based Access Control (RBAC). Aislamiento estricto de contexto de Aduana/Patente por sesión.</p>
                        </div>
                    </div>

                    {/* Detailed Technical Content */}
                    <div className="space-y-12">
                        
                        <section className="space-y-4">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest border-b pb-2">
                                <Workflow className="text-[#D1BD85]" size={22}/> 1. Flujos de Integración
                            </h3>
                            <p className="text-slate-600 font-medium">Las transacciones fluyen desde el formulario de react vía Server Actions hasta la base de datos PostgreSQL, garantizando integridad referencial en tiempo real.</p>
                            <div className="bg-slate-900 rounded-2xl p-6 text-emerald-400 font-mono text-sm leading-relaxed overflow-x-auto shadow-inner">
                                <p className="text-slate-500 mb-2">// Esquema de validación lógica</p>
                                <p>const {`{`} data, error {`}`} = await supabase</p>
                                <p className="pl-4">.from('pedimentos')</p>
                                <p className="pl-4">.insert({`{`} referencia, aduana, patente {`}`})</p>
                                <p className="pl-4">.single();</p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest border-b pb-2">
                                <GitIcon className="text-[#D1BD85]" size={22}/> 2. Gestión de Código e Implantes
                            </h3>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-slate-600 font-medium">El control de versiones reside en **GitHub**. No se permiten despliegues directos a producción sin pasar por el flujo de validación de ramas.</p>
                                    <ul className="space-y-2 text-sm text-slate-500 font-bold uppercase tracking-wider">
                                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-slate-400 rounded-full"></div> Main Repo: seamconsultores</li>
                                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-slate-400 rounded-full"></div> Branch: main / production</li>
                                    </ul>
                                </div>
                                <div className="bg-white border rounded-2xl p-6 space-y-4">
                                    <h5 className="font-black text-xs uppercase text-[#244635] tracking-widest">Stack Integrado:</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {['Next.js 15', 'Tailwind CSS', 'Lucide Icons', 'Zod', 'Supabase JS', 'Recharts'].map(tech => (
                                            <span key={tech} className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-200">{tech}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest border-b pb-2">
                                <HardDrive className="text-[#D1BD85]" size={22}/> 3. Almacenamiento y Respaldos
                            </h3>
                            <p className="text-slate-600 font-medium">El sistema utiliza **Supabase Persistent Storage** para el alojamiento de archivos y metadatos de usuario.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
                                    <Terminal className="text-blue-600" size={20} />
                                    <div className="text-xs font-bold text-blue-900 uppercase tracking-widest">Respaldos Diarios Automáticos</div>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-4">
                                    <Server className="text-emerald-600" size={20} />
                                    <div className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Alta Disponibilidad 99.9% SLI</div>
                                </div>
                            </div>
                        </section>

                    </div>

                    <div className="pt-12 text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest">
                        — PROPIEDAD INTELECTUAL DE SEAM CONSULTORES — <br/>
                        SOPORTE TÉCNICO: tech-lead@antigravity
                    </div>
                </div>
            </div>
        </div>
    );
}
