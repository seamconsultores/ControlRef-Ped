"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import { Printer, AlertCircle, BookOpen } from 'lucide-react';

export default function ManualPage() {
    const supabase = createClient();
    const [userRole, setUserRole] = useState('user');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserContext = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             if (session) {
                 const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
                 if (profile) setUserRole(profile.role.toLowerCase());
             }
             setLoading(false);
        };
        fetchUserContext();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return null;

    if (userRole !== 'admin') {
        return (
            <div className="flex h-screen bg-slate-50 items-center justify-center pl-64">
                <Sidebar userRole={userRole} />
                <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
                    <h2 className="text-xl font-bold text-slate-800">Acceso Restringido</h2>
                    <p className="text-slate-500">Solo el Administrador Principal tiene autorización para visualizar el Manual de Operaciones Corporativo.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pl-64 bg-[#f8fafc]">
            <Sidebar userRole={userRole} />

            <header className="h-24 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="bg-[#244635] p-3 rounded-2xl text-[#fdfaf2] shadow-sm">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#244635] tracking-tight">MANUAL DE OPERACIONES</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            SOP y DiagramA Lógico
                        </p>
                    </div>
                </div>

                <button 
                    onClick={handlePrint}
                    className="bg-[#D1BD85] text-[#244635] px-6 py-2.5 rounded-xl font-bold hover:bg-[#c2ad74] transition-colors shadow-sm flex items-center gap-2"
                >
                    <Printer size={18} /> Imprimir Manual
                </button>
            </header>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 20mm; size: auto; }
                    body { background: white; -webkit-print-color-adjust: exact; color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:shadow-none { box-shadow: none !important; border: none !important; }
                    .print\\:text-black { color: black !important; }
                }
            `}</style>

            <div className="p-8 print:p-0 animate-in fade-in duration-500 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 print:shadow-none print:p-4 text-slate-800 space-y-8">
                    
                    {/* Header */}
                    <div className="text-center border-b-2 border-[#244635] pb-8 mb-8">
                        <h1 className="text-4xl font-black text-[#244635] tracking-tight uppercase">MANUAL INSTITUCIONAL DE OPERACIONES</h1>
                        <h2 className="text-xl font-bold text-[#D1BD85] mt-4 tracking-widest uppercase">Plataforma de Control de Pedimentos y Referencias</h2>
                        <h3 className="text-sm font-bold text-slate-500 tracking-widest mt-2 uppercase">SEAM - GARBER</h3>
                    </div>

                    {/* Section 1 */}
                    <section className="space-y-4 text-justify">
                        <h2 className="text-2xl font-bold text-[#244635] border-l-4 border-[#D1BD85] pl-4 uppercase">1. Propósito y Alcance</h2>
                        <p className="font-medium text-slate-600 leading-relaxed">
                            <strong>Propósito:</strong> Establecer los lineamientos y reglas de navegación dentro de la plataforma digital para asegurar la integridad extrema, seguridad criptográfica y estandarización obligatoria de los datos (pedimentos, clientes, sellos y series) emitidos bajo las distintas patentes y aduanas fronterizas conectadas.
                        </p>
                        <p className="font-medium text-slate-600 leading-relaxed">
                            <strong>Alcance:</strong> Las directrices del presente documento aplican de forma obligatoria a todo el personal operativo de piso, coordinadores, gerentes y mesa directiva vinculada directa e indirectamente en el despacho aduanero y uso de referenciación a nivel administrativo corporativo.
                        </p>
                    </section>
                    
                    {/* Section 2 */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-[#244635] border-l-4 border-[#D1BD85] pl-4 uppercase">2. Modelo de Trazabilidad Lógica</h2>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <ul className="list-disc list-inside space-y-2 font-medium text-slate-700">
                                <li><strong>(A) Inicio de Sesión Blindado</strong> ➔ Confirmación de Credenciales de Identidad en Servidor Múltiple.</li>
                                <li><strong>(B) Inyección de Entorno</strong> ➔ Selección obligatoria e irrevocable de Patente y Aduana al entrar al sistema para trazar operaciones en bitácora transparente.</li>
                                <li><strong>(C) Nivel Operativo</strong> ➔ Generan pedimentos, capturan asignación candados y consumen nombres estrictos del Catálogo en base y sujeción total al entorno inyectado.</li>
                                <li><strong>(D) Nivel Analítico-Administrativo</strong> ➔ Alimentan las matrices de configuración (Series Asignadas, Accesos a Aduanas, Inserte de Clientes Normalizados) para control en cascada auditada.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-[#244635] border-l-4 border-[#D1BD85] pl-4 uppercase">3. Roles y Accesos del Personal</h2>
                        <div className="grid gap-4">
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-4">
                                <div className="min-w-10">
                                    <div className="bg-red-900 font-black text-white px-2 py-1 rounded text-center text-xs">ADM</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-red-900 mb-1">Director y Administrador de Sistema</h3>
                                    <p className="text-red-800/80 text-sm font-medium">Responsable máximo del entorno. Tiene facultades absolutas de alta, baja, suspensión temporal de perfiles y modificación irrestricta de usuarios. Configuración y encendido global de aduanas, asignación de remesas numéricas maestras y modelado de catálogos.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-4">
                                <div className="min-w-10">
                                    <div className="bg-orange-800 font-black text-white px-2 py-1 rounded text-center text-xs">GER</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-orange-900 mb-1">Gerencia, Contraloría y Coordinación</h3>
                                    <p className="text-orange-800/80 text-sm font-medium">Facultado con llaves maestras de lectura pasiva para auditar el ecosistema de información. Visualiza métricas de la mesa de rentabilidad, consulta perfiles y líneas de tiempo profundas, gestionando su respectiva estandarización.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex gap-4">
                                <div className="min-w-10">
                                    <div className="bg-green-800 font-black text-white px-2 py-1 rounded text-center text-xs">OPE</div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-green-900 mb-1">Operadores Fijos</h3>
                                    <p className="text-green-800/80 text-sm font-medium">Elemento técnico en piso. Visibilidad y movilidad estrictamente circunscrita al carril de originación. Utiliza candados activos y emite información modular pero carece de llaves para alterar configuración transversal.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-[#244635] border-l-4 border-[#D1BD85] pl-4 uppercase">4. Procedimientos Críticos Inquebrantables</h2>
                        <ul className="space-y-4">
                            <li className="flex gap-4 items-start">
                                <div className="min-w-8 h-8 rounded-full bg-[#244635] text-white flex items-center justify-center font-bold">I</div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg uppercase">Regla de Integridad Inyectada</h4>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">Toda maniobra digital de información queda impregnada con dos sellos: la Patente y Aduana al instante del *log-in*. El operador debe validar rutinariamente (visualizado en la barra top-header) que está despachando en el escenario correcto.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="min-w-8 h-8 rounded-full bg-[#244635] text-white flex items-center justify-center font-bold">II</div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg uppercase">Prevención Algorítmica de Anomalías</h4>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">El guardián de base de datos repele asíncronamente ingresos de referencias duplicadas o empalme de Series maestras (pedimentos/clientes) cancelando la inserción alertando visualmente, protegiendo contra polución de datos.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="min-w-8 h-8 rounded-full bg-[#244635] text-white flex items-center justify-center font-bold">III</div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg uppercase">Doctrina de Evidencia Permanente (Cero Borrados Físicos)</h4>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">Siguiendo estipulaciones de recolección de evidencia para auditoría de Comercio Exterior, un pedimento o asignación validada **nunca es extirpado** en un "Borrado Duro". Se optará bajo protocolo usar el Historial si hubo errores, y la Mesa Directiva efectuará recargas lógicas sobre los registros o marcará anulaciones blandas si amerita extracción.</p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <div className="pt-12 text-center text-slate-400 font-medium text-xs uppercase tracking-widest border-t border-slate-100">
                        — SEAM Consultores - INFORMACIÓN ESTRICTAMENTE CONFIDENCIAL — <br/>
                        {new Date().getFullYear()} © Todos los derechos de reproducción y distribución reservados.
                    </div>
                </div>
            </div>
        </div>
    );
}
