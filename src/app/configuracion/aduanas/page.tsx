"use client";
import React from 'react';
import Sidebar from '@/app/components/Sidebar';
import { Building2, Plus, Info } from 'lucide-react';

const ADUANA_NAMES: Record<string, string> = {
    '240': 'NUEVO LAREDO',
    '800': 'COLOMBIA',
    '300': 'REYNOSA',
    '430': 'VERACRUZ',
    '280': 'MATAMOROS',
    '160': 'MONTERREY',
    '810': 'ALTAMIRA'
};

export default function AduanasConfigPage() {
    const handleAduanaClick = (code: string) => {
        // Switch context logic
        const newContext = { aduana: code, patente: '' }; // Patente empty to force selection/default logic on dashboard
        localStorage.setItem('sessionContext', JSON.stringify(newContext));

        // Redirect to dashboard to see changes or just reload
        // A reload is safer to ensure all components pick up the new local storage
        window.location.href = '/';
    };

    return (
        <div className="flex min-h-screen bg-[#f8fafc]">
            <Sidebar userRole="admin" />
            <main className="flex-1 ml-64 p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-[#244635]">Configuración de Aduanas</h1>
                    <p className="text-slate-500">Seleccione una aduana para operar o gestionar.</p>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Building2 className="text-[#D1BD85]" />
                            Catálogo de Aduanas Activas
                        </h2>
                        {/* Disabled for now as it requires code changes */}
                        <button className="bg-slate-100 text-slate-400 px-4 py-2 rounded-lg font-bold text-sm cursor-not-allowed" title="Contactar a Sistemas" disabled>
                            <Plus size={16} className="inline mr-1" /> Nueva Aduana
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(ADUANA_NAMES).map(([code, name]) => (
                            <button
                                key={code}
                                onClick={() => handleAduanaClick(code)}
                                className="text-left p-4 rounded-xl border border-slate-100 hover:border-[#244635] hover:shadow-md transition-all group bg-slate-50 hover:bg-white w-full"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-2xl font-black text-slate-300 group-hover:text-[#244635] transition-colors">{code}</span>
                                    <span className="px-2 py-1 rounded bg-emerald-100 text-[#244635] text-[10px] font-bold uppercase group-hover:bg-[#244635] group-hover:text-white transition-colors">Activar</span>
                                </div>
                                <h3 className="font-bold text-slate-700">{name}</h3>
                                <p className="text-xs text-slate-400 mt-1 group-hover:text-[#D1BD85]">Clic para operar aquí</p>
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 bg-amber-50 p-4 rounded-xl flex gap-3 text-amber-800 text-sm border border-amber-100">
                        <Info className="shrink-0" />
                        <p>
                            <strong>Nota Técnica:</strong> Actualmente las aduanas están definidas a nivel de sistema (Hardcoded).
                            Para agregar una nueva aduana operativa, por favor contacte al departamento de desarrollo.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
