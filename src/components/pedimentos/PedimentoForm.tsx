"use client";

import React, { useState } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { generateReference } from '@/lib/utils/reference';
import type { PedimentoFormData } from '@/lib/types';
import { createPedimento } from '@/app/actions/pedimentos';

// Definir prop types
export default function PedimentoForm({ initialAduana, initialPatente }: { initialAduana?: string, initialPatente?: string }) {
    const [formData, setFormData] = useState<PedimentoFormData>({
        aduana: initialAduana || '240',
        patente: initialPatente || '3510',
        cliente: '',
        proveedor: '',
        tipo_operacion: 'IMP',
        clave_pedimento: 'A1',
        caja: '',
        placas: '',
        es_inbond: false
    });

    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState<{ referencia: string, numero_pedimento: string } | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Sync state with props if they change (e.g. context switch in header)
    React.useEffect(() => {
        setFormData(prev => ({
            ...prev,
            aduana: initialAduana || prev.aduana,
            patente: initialPatente || prev.patente
        }));
    }, [initialAduana, initialPatente]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setSuccessData(null);

        try {
            const result = await createPedimento(formData);

            if (result.success && result.data) {
                setSuccessData({
                    referencia: result.data.referencia,
                    numero_pedimento: result.data.numero_pedimento
                });
                setMessage({ type: 'success', text: result.message || 'Pedimento generado correctamente' });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error al registrar el pedimento' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSuccessData(null);
        setMessage(null);
        setFormData(prev => ({
            ...prev,
            cliente: '',
            proveedor: '',
            caja: '',
            placas: '',
            es_inbond: false
        }));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto relative">

            {/* Success Modal Overlay */}
            {successData && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 rounded-2xl flex items-center justify-center p-8 animate-in fade-in duration-300">
                    <div className="max-w-md w-full text-center space-y-8">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                            <CheckCircle2 size={48} />
                        </div>

                        <div>
                            <h3 className="text-3xl font-extrabold text-[#244635] mb-2">¡Pedimento Generado!</h3>
                            <p className="text-slate-500">Los consecutivos han sido asignados correctamente.</p>
                        </div>

                        <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Referencia Operativa</p>
                                <p className="text-3xl font-black text-slate-800 tracking-tight font-mono">{successData.referencia}</p>
                            </div>
                            <div className="w-full h-px bg-slate-200"></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Número de Pedimento</p>
                                <p className="text-2xl font-bold text-[#244635] font-mono">{successData.numero_pedimento}</p>
                            </div>
                        </div>

                        <button
                            onClick={resetForm}
                            className="w-full py-4 bg-[#244635] text-white font-bold rounded-xl hover:bg-[#1a3326] transition-colors shadow-lg shadow-[#244635]/20 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={20} />
                            Generar Nuevo Pedimento
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Nuevo Pedimento</h2>
                    <p className="text-slate-500">Complete los datos para generar la referencia</p>
                </div>
                {/* Status Indicator removed as logic changed */}
            </div>

            {message && !successData && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <p className="font-medium">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Aduana</label>
                        {initialAduana ? (
                            <input
                                type="text"
                                name="aduana"
                                value={formData.aduana}
                                readOnly
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-medium text-slate-500 cursor-not-allowed"
                            />
                        ) : (
                            <select
                                name="aduana"
                                value={formData.aduana}
                                onChange={handleInputChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#244635]/20 focus:border-[#244635] transition-all font-medium text-slate-700"
                            >
                                <option value="240">240 - Nuevo Laredo</option>
                                <option value="430">430 - Veracruz</option>
                                <option value="800">800 - Colombia</option>
                            </select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Patente</label>
                        <input
                            type="text"
                            name="patente"
                            value={formData.patente}
                            onChange={handleInputChange}
                            className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#244635]/20 focus:border-[#244635] transition-all font-medium text-slate-700 ${initialPatente ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                            readOnly={!!initialPatente}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Tipo Operación</label>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, tipo_operacion: 'IMP' }))}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${formData.tipo_operacion === 'IMP' ? 'bg-[#244635] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                IMP
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, tipo_operacion: 'EXP' }))}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${formData.tipo_operacion === 'EXP' ? 'bg-[#244635] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                EXP
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Cliente</label>
                        <input
                            type="text"
                            name="cliente"
                            required
                            placeholder="Razón Social del Cliente"
                            value={formData.cliente}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 placeholder:text-slate-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Proveedor</label>
                        <input
                            type="text"
                            name="proveedor"
                            required
                            placeholder="Nombre del Proveedor"
                            value={formData.proveedor}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Clave Pedimento</label>
                        <input
                            type="text"
                            name="clave_pedimento"
                            required
                            maxLength={2}
                            placeholder="A1"
                            value={formData.clave_pedimento}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 uppercase"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Caja / Contenedor</label>
                        <input
                            type="text"
                            name="caja"
                            placeholder="Número de caja"
                            value={formData.caja}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Placas</label>
                        <input
                            type="text"
                            name="placas"
                            placeholder="Placas tracto"
                            value={formData.placas}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 py-2">
                    <input
                        type="checkbox"
                        id="es_inbond"
                        name="es_inbond"
                        checked={formData.es_inbond}
                        onChange={handleCheckboxChange}
                        className="w-5 h-5 rounded border-slate-300 text-[#244635] focus:ring-[#244635]"
                    />
                    <label htmlFor="es_inbond" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
                        Es operación In-Bond (Transbordo)
                    </label>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        type="button"
                        className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-[#244635] text-white font-bold hover:bg-[#1a3326] transition-all shadow-lg shadow-[#244635]/20 hover:shadow-emerald-900/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                GENERAR PEDIMENTO
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
