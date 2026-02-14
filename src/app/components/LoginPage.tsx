"use client";
import React, { useState, useEffect } from 'react';
import { Mail, Lock, ShieldCheck, ArrowRight, Building2, Map } from 'lucide-react';

// Estructura de datos con Códigos Aduaneros (SAT) y Patentes asociadas
const ADUANAS_DATA: Record<string, { code: string, patentes: string[] }> = {
    'Nuevo Laredo': { code: '240', patentes: ['3834', '1637', 'Consecutivos Socios'] },
    'Colombia': { code: '800', patentes: ['3834', 'XXXX', 'Consecutivos Socios'] },
    'Reynosa': { code: '300', patentes: ['3834', 'XXXX', 'Consecutivos Socios'] },
    'Matamoros': { code: '280', patentes: ['3834', '1637', '3441', 'Consecutivos Socios'] },
    'Monterrey': { code: '160', patentes: ['3834', '1637', 'Consecutivos Socios'] },
    'Altamira': { code: '810', patentes: ['3834', 'Socios'] }
};

interface LoginPageProps {
    onLogin: (role: string, context: { aduana: string, patente: string }) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // selectedAduanaName guarda el NOMBRE (ej: 'Matamoros')
    // para mostrar las opciones correctas
    const [selectedAduanaName, setSelectedAduanaName] = useState('');
    const [selectedPatente, setSelectedPatente] = useState('');
    const [availablePatentes, setAvailablePatentes] = useState<string[]>([]);

    useEffect(() => {
        if (selectedAduanaName) {
            setAvailablePatentes(ADUANAS_DATA[selectedAduanaName]?.patentes || []);
            setSelectedPatente('');
        } else {
            setAvailablePatentes([]);
            setSelectedPatente('');
        }
    }, [selectedAduanaName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAduanaName || !selectedPatente) {
            alert('Por favor selecciona una Aduana y una Patente válidas.');
            return;
        }

        // Recuperamos el CÓDIGO (ej: '280') para enviarlo al sistema
        const aduanaCode = ADUANAS_DATA[selectedAduanaName].code;

        // Simulación simple para desarrollo
        if (email.includes('admin')) {
            onLogin('admin', { aduana: aduanaCode, patente: selectedPatente });
        } else {
            onLogin('user', { aduana: aduanaCode, patente: selectedPatente });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#244635] rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#D1BD85] rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-md w-full p-8 bg-white rounded-3xl shadow-2xl relative z-10 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#244635] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-[#244635]/20">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#244635]">GARBER S.C.</h1>
                    <p className="text-[#D1BD85] font-bold">CONTROL DE PEDIMENTOS Y REFERENCIAS</p>
                    <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest leading-loose">SISTEMA INTEGRAL</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Selectores de Contexto */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 col-span-2">
                            <label className="text-xs font-bold text-[#244635] ml-1 uppercase tracking-wide">Aduana de Acceso</label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#244635]" size={18} />
                                <select
                                    value={selectedAduanaName}
                                    onChange={(e) => setSelectedAduanaName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#244635]/20 focus:border-[#244635] transition-all text-slate-700 font-medium appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {Object.keys(ADUANAS_DATA).map(aduanaName => (
                                        <option key={aduanaName} value={aduanaName}>{aduanaName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1 col-span-2">
                            <label className="text-xs font-bold text-[#244635] ml-1 uppercase tracking-wide">Patente Autorizada</label>
                            <div className="relative group">
                                <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#244635]" size={18} />
                                <select
                                    value={selectedPatente}
                                    onChange={(e) => setSelectedPatente(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#244635]/20 focus:border-[#244635] transition-all text-slate-700 font-medium appearance-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                                    required
                                    disabled={!selectedAduanaName}
                                >
                                    <option value="">{selectedAduanaName ? 'Seleccionar Patente...' : 'Primero elija Aduana'}</option>
                                    {availablePatentes.map(patente => (
                                        <option key={patente} value={patente}>{patente}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 my-2"></div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700 ml-1">Correo Electrónico</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#244635] transition-colors" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ejemplo@garber.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#244635]/20 focus:border-[#244635] transition-all text-slate-800 placeholder:text-slate-400"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700 ml-1">Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#244635] transition-colors" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#244635]/20 focus:border-[#244635] transition-all text-slate-800 placeholder:text-slate-400"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#244635] focus:ring-[#244635]" />
                            <span className="text-xs text-slate-500 group-hover:text-[#244635] transition-colors font-medium">Recordar selección</span>
                        </label>
                        <button type="button" className="text-xs font-bold text-[#D1BD85] hover:text-[#244635] transition-colors">¿Olvidaste tu contraseña?</button>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#244635] hover:bg-[#1a3326] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#244635]/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 group mt-4"
                    >
                        Ingresar al Sistema
                        <ArrowRight size={20} className="text-[#D1BD85] group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-8 text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500">¿Problemas con el acceso?</p>
                    <a href="#" className="text-xs font-bold text-slate-800 hover:underline">Contactar a Soporte Técnico IT</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
