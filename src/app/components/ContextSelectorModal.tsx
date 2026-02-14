"use client";

import React from 'react';
import { Building2, ArrowRight } from 'lucide-react';

const ADUANA_NAMES: Record<string, string> = {
    '240': 'NUEVO LAREDO',
    '800': 'COLOMBIA',
    '300': 'REYNOSA',
    '430': 'VERACRUZ',
    '280': 'MATAMOROS',
    '160': 'MONTERREY',
    '810': 'ALTAMIRA'
};

interface ContextSelectorModalProps {
    availableContext: { aduanas: string[], patentes: string[] };
    onSelect: (aduana: string, patente: string) => void;
}

export default function ContextSelectorModal({ availableContext, onSelect }: ContextSelectorModalProps) {
    // If only one patente, we just list aduanas and imply that patente. 
    // If multiple patentes, we might need a 2-step or combined selection. 
    // For simplicity, we assume 1 patente per aduana OR user picks aduana and we pick the first available patente for now (or improve logic if complex mapping exists).
    // In many brokerages, patente is tied to the user/branch globally, but let's allow picking the pair.

    // Grouping strategy: Display each Aduana as a card. If multiple patentes available, maybe show dropdown inside card?
    // Let's stick to simple: Select Aduana. We auto-select the first patent (or the only one).

    const handleAduanaSelect = (aduana: string) => {
        // Default to first patent for now
        const defaultPatente = availableContext.patentes[0] || '----';
        onSelect(aduana, defaultPatente);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden">
                <div className="bg-[#244635] p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
                        <Building2 size={32} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Bienvenido al Sistema</h2>
                    <p className="text-emerald-100 font-medium">Por favor, selecciona la aduana operativa para esta sesión.</p>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    {availableContext.aduanas.map((aduana) => (
                        <button
                            key={aduana}
                            onClick={() => handleAduanaSelect(aduana)}
                            className="group relative flex flex-col items-start p-6 rounded-2xl border border-slate-200 hover:border-[#244635] hover:bg-emerald-50/30 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1"
                        >
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#244635] group-hover:text-white transition-colors mb-4">
                                <span className="font-bold text-lg">{aduana.substring(0, 2)}</span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-1">
                                {aduana}
                            </h3>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                {ADUANA_NAMES[aduana] || 'Aduana'}
                            </p>

                            <div className="mt-auto flex items-center gap-2 text-[#244635] font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                                Iniciar Sesión <ArrowRight size={16} />
                            </div>

                            {/* Decorative Indicator */}
                            <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-slate-200 group-hover:bg-[#244635] transition-colors"></div>
                        </button>
                    ))}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                        Podrás cambiar de aduana en cualquier momento desde el menú superior.
                    </p>
                </div>
            </div>
        </div>
    );
}
