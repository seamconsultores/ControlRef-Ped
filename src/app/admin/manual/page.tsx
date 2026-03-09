"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import { 
    Printer, AlertCircle, BookOpen, GitMerge, ShieldAlert, CheckCircle2, UserCog,
    LayoutDashboard, FileText, Stamp, Play, Users, GitBranch, Key, XCircle, FileStack
} from 'lucide-react';

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
                            Versión Interactiva para Impresión
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
                    @page { margin: 15mm; size: A4; }
                    body { background: white; -webkit-print-color-adjust: exact; color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    .print\\:break-before { page-break-before: always; }
                    .print\\:shadow-none { box-shadow: none !important; border: none !important; }
                    .print\\:text-black { color: black !important; }
                    .print\\:p-0 { padding: 0 !important; }
                }
            `}</style>

            <div className="p-8 print:p-0 animate-in fade-in duration-500 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 print:shadow-none print:p-0 text-slate-800 space-y-12">
                    
                    {/* Header Principal */}
                    <div className="text-center border-b-[3px] border-[#244635] pb-8 mb-8" style={{ pageBreakAfter: 'avoid' }}>
                        <div className="inline-flex items-center justify-center p-4 bg-[#244635] rounded-full mb-6 print:bg-transparent print:text-[#244635]">
                            <BookOpen size={48} className="text-[#D1BD85]" />
                        </div>
                        <h1 className="text-4xl font-black text-[#244635] tracking-tight uppercase">MANUAL INSTITUCIONAL DE OPERACIONES</h1>
                        <h2 className="text-xl font-bold text-[#D1BD85] mt-4 tracking-widest uppercase">Plataforma de Control de Pedimentos y Referencias</h2>
                        <h3 className="text-sm font-bold text-slate-500 tracking-widest mt-2 uppercase">SEAM - GARBER</h3>
                    </div>

                    {/* ---------- SECCIÓN 1: DIAGRAMA DE FLUJO ---------- */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                            <GitMerge className="text-[#244635]" size={28} />
                            <h2 className="text-2xl font-black text-[#244635] tracking-tight uppercase">1. Diagrama de Flujo General</h2>
                        </div>
                        <p className="font-medium text-slate-600 leading-relaxed mb-6">
                            El siguiente esquema ilustra el flujo operativo y de seguridad algorítmica del sistema, desde el inicio de sesión hasta la diversificación de tareas de acuerdo a las capacidades por rol asignado.
                        </p>

                        {/* Visual Tailwind Flowchart Box-based */}
                        <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 shadow-inner overflow-hidden">
                            <div className="flex flex-col items-center space-y-4 text-sm font-bold w-full max-w-2xl mx-auto">
                                
                                {/* Start */}
                                <div className="bg-[#244635] text-white px-6 py-3 rounded-full shadow border-2 border-[#1a3528]">A. Inicio de Sesión</div>
                                <div className="h-6 w-0.5 bg-slate-300"></div>
                                
                                {/* Decision Credenciales */}
                                <div className="bg-white border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl shadow-sm rotate-0 relative">
                                    <div className="absolute -left-16 top-3 text-xs text-red-500">Incorrectas</div>
                                    B. ¿Validación de Credenciales?
                                    <div className="absolute -right-16 top-3 text-xs text-green-600">Correctas</div>
                                </div>
                                <div className="flex w-full justify-center gap-12 sm:gap-32 relative">
                                    {/* Linea Incorrecto */}
                                    <div className="w-1/2 h-8 border-t-2 border-l-2 border-red-200 rounded-tl-xl mt-[-1rem] bg-transparent translate-y-4 translate-x-12"></div>
                                    {/* Linea Correcto */}
                                    <div className="w-1/2 h-8 border-t-2 border-r-2 border-[#244635]/30 rounded-tr-xl mt-[-1rem] bg-transparent translate-y-4 -translate-x-12"></div>
                                </div>

                                <div className="flex w-full justify-center gap-10 sm:gap-24">
                                    {/* Destino Incorrecto */}
                                    <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-3 rounded-xl shadow-sm flex items-center gap-2">
                                        <XCircle size={16}/> C. Bloqueo Acceso
                                    </div>
                                    
                                    {/* Destino Correcto */}
                                    <div className="flex flex-col items-center">
                                        <div className="bg-[#D1BD85] text-[#244635] px-6 py-3 rounded-xl shadow border-2 border-[#b5a371]">
                                            D. Selección Entorno
                                        </div>
                                        <div className="h-6 w-0.5 bg-slate-300"></div>
                                        <div className="bg-white border text-slate-700 px-6 py-2 rounded-lg mb-2 shadow-sm">E. Patente</div>
                                        <div className="h-6 w-0.5 bg-slate-300"></div>
                                        <div className="bg-white border text-slate-700 px-6 py-2 rounded-lg mb-4 shadow-sm">F. Aduana</div>
                                        
                                        <div className="h-6 w-0.5 bg-[#244635]"></div>
                                        <div className="bg-[#244635] text-white px-8 py-3 rounded-xl shadow mb-2 font-black tracking-widest border-2 border-[#244635]">G. VERIFICACIÓN DE ROL</div>
                                    </div>
                                </div>

                                {/* Bifurcación de Roles */}
                                <div className="flex w-full shrink-0 justify-center h-8 relative mx-auto" style={{maxWidth: '400px'}}>
                                    <div className="absolute top-0 w-full h-1/2 border-x-2 border-t-2 border-slate-300 rounded-t-xl z-0"></div>
                                </div>

                                <div className="flex w-full shrink-0 justify-between gap-4 max-w-3xl">
                                    {/* Lado Operativo */}
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded w-full text-center mb-2">OPERATIVO / CLIENTE</div>
                                        <div className="bg-white border-2 border-green-200 text-slate-700 p-4 rounded-xl shadow-sm w-full space-y-2">
                                            <div className="flex items-center gap-2 text-xs border-b pb-2"><LayoutDashboard size={14}/> H. Interfaz Operativa</div>
                                            <div className="flex items-center gap-2 text-xs"><Play size={14}/> I. Hacer Pedimentos</div>
                                            <div className="flex items-center gap-2 text-xs"><Stamp size={14}/> J. Solicitar Sellos</div>
                                            <div className="flex items-center gap-2 text-xs"><FileText size={14}/> K. Ver Historial Local</div>
                                        </div>
                                    </div>
                                    
                                    {/* Lado Admin */}
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded w-full text-center mb-2">ADMIN / GERENCIA</div>
                                        <div className="bg-white border-2 border-red-200 text-slate-700 p-4 rounded-xl shadow-sm w-full space-y-2">
                                            <div className="flex items-center gap-2 text-xs border-b pb-2"><ShieldAlert size={14}/> L. Interfaz Admin</div>
                                            <div className="flex items-center gap-2 text-xs"><LayoutDashboard size={14}/> M. Dashboard Métricas</div>
                                            <div className="flex items-center gap-2 text-xs"><Users size={14}/> N. Catálogo Clientes</div>
                                            <div className="flex items-center gap-2 text-xs"><GitBranch size={14}/> O. Asignar Series</div>
                                            <div className="flex items-center gap-2 text-xs"><Stamp size={14}/> P. Auditoría Sellos</div>
                                            <div className="flex items-center gap-2 text-xs"><UserCog size={14}/> Q. Gestor Usuarios</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="print:break-before"></div>

                    {/* ---------- SECCIÓN 2: SOP ---------- */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                            <ShieldAlert className="text-[#244635]" size={28} />
                            <h2 className="text-2xl font-black text-[#244635] tracking-tight uppercase">2. SOP (Procedimiento Operativo)</h2>
                        </div>
                        
                        <div className="bg-[#fcfaf5] p-5 rounded-xl border border-[#D1BD85]/40 mb-6">
                            <p className="font-medium text-slate-700 leading-relaxed mb-3">
                                <strong>🎯 Propósito:</strong> Establecer los lineamientos y reglas de navegación dentro de la plataforma para asegurar la integridad, seguridad y estandarización de los datos (pedimentos, clientes, sellos y series) emitidos bajo las distintas patentes y aduanas.
                            </p>
                            <p className="font-medium text-slate-700 leading-relaxed">
                                <strong>🧭 Alcance:</strong> Aplica a todo el personal operativo, de coordinación, gerencial y directivo involucrado en el despacho aduanero y uso de referenciación.
                            </p>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mt-6 mb-4 flex items-center gap-2">
                            <UserCog className="text-[#D1BD85]" size={20} /> 2.1 Responsabilidades por Rol
                        </h3>
                        
                        <div className="grid gap-4">
                            <div className="p-4 bg-white rounded-xl border-l-4 border-red-800 shadow-sm flex flex-col md:flex-row gap-4">
                                <div className="min-w-fit">
                                    <span className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded text-sm tracking-widest uppercase">ADMIN / DIRECTOR</span>
                                </div>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed">Responsable máximo del sistema. Tiene facultades de alta, baja y modificación irrestricta de usuarios, configuración global de aduanas, asignación de remesas maestras y catálogos.</p>
                            </div>
                            
                            <div className="p-4 bg-white rounded-xl border-l-4 border-orange-500 shadow-sm flex flex-col md:flex-row gap-4">
                                <div className="min-w-fit">
                                    <span className="bg-orange-100 text-orange-800 font-bold px-3 py-1 rounded text-sm tracking-widest uppercase">GERENTE / COORD.</span>
                                </div>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed">Facultado para auditar la información operativa. Puede visualizar métricas, consultar el historial profundo de auditoría y gestionar el catálogo de clientes operacionales para mantener la estandarización.</p>
                            </div>

                            <div className="p-4 bg-white rounded-xl border-l-4 border-[#244635] shadow-sm flex flex-col md:flex-row gap-4">
                                <div className="min-w-fit">
                                    <span className="bg-[#e9f2ee] text-[#244635] font-bold px-3 py-1 rounded text-sm tracking-widest uppercase">OPERATIVO ELEGIDO</span>
                                </div>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed">Encargado directo de la captura en piso. Su visibilidad está estrictamente limitada a generar solicitudes, usar clientes autorizados e ingresar información diaria sin alterar configuraciones estructurales.</p>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
                            <ShieldAlert className="text-red-600" size={20} /> 2.2 Procedimientos Críticos (Reglas)
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="bg-[#244635] text-white rounded-full p-1"><CheckCircle2 size={16}/></div>
                                <div>
                                    <strong className="text-slate-800 uppercase block mb-1">1. Regla de Integridad de Sesión</strong>
                                    <p className="text-sm text-slate-600 font-medium">Toda operación (lectura/escritura) está ligada algorítmicamente a la Patente y Aduana seleccionada al ingresar. El operador debe validar visualmente (arriba a la izquierda) que se encuentre trabajando en la plaza correcta.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="bg-[#244635] text-white rounded-full p-1"><CheckCircle2 size={16}/></div>
                                <div>
                                    <strong className="text-slate-800 uppercase block mb-1">2. Prevención de Duplicidad</strong>
                                    <p className="text-sm text-slate-600 font-medium">El registro de pedimentos, sellos o series validará automáticamente que no exista el registro antes de inyectarse a la DB.</p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="bg-[#244635] text-white rounded-full p-1"><CheckCircle2 size={16}/></div>
                                <div>
                                    <strong className="text-slate-800 uppercase block mb-1">3. Auditoría Estricta Cero-Borrados</strong>
                                    <p className="text-sm text-slate-600 font-medium">Los pedimentos e historiales no sufren borrado completo (Hard Delete). Si el operativo comete un error, el administrador coordinará el ajuste para no dañar el rastro de auditoría.</p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <div className="print:break-before"></div>

                    {/* ---------- SECCIÓN 3: INSTRUCTIVO PASO A PASO ---------- */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                            <FileStack className="text-[#244635]" size={28} />
                            <h2 className="text-2xl font-black text-[#244635] tracking-tight uppercase">3. Instructivo de Funcionamiento</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            
                            {/* Modulo I */}
                            <div className="border border-[#D1BD85]/50 rounded-2xl p-6 bg-white shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-[#D1BD85]"></div>
                                <h4 className="font-bold text-[#244635] text-lg flex items-center gap-2 mb-3">
                                    <Key size={18} /> I. Ingreso e Inicialización
                                </h4>
                                <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2 font-medium">
                                    <li>Ingresa al enlace web corporativo.</li>
                                    <li>Introduce e-mail institucional y contraseña.</li>
                                    <li><strong>Ventana de Contexto:</strong> Selecciona en qué Aduana y Patente "Entrarás a Trabajar" (si tienes múltiples asignadas).</li>
                                </ol>
                            </div>

                            {/* Modulo II */}
                            <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-[#244635]"></div>
                                <h4 className="font-bold text-[#244635] text-lg flex items-center gap-2 mb-3">
                                    <LayoutDashboard size={18} /> II. Tablero (Dashboard)
                                </h4>
                                <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2 font-medium">
                                    <li>Observa las <strong>Métricas en Tiempo Real</strong>.</li>
                                    <li>Supervisa la <strong>Productividad Diaria</strong> calculada mediante IA.</li>
                                    <li>A la derecha consultarás las últimas transacciones generadas en piso para extrema vigilancia.</li>
                                </ol>
                            </div>

                            {/* Modulo III */}
                            <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm relative overflow-hidden text-slate-800">
                                <div className="absolute top-0 left-0 w-2 h-full bg-[#244635]"></div>
                                <h4 className="font-bold text-[#244635] text-lg flex items-center gap-2 mb-3">
                                    <FileText size={18} /> III. Pedimentos
                                </h4>
                                <ul className="space-y-3 text-sm font-medium">
                                    <li><strong className="text-slate-800">Para Capturar:</strong> Ve a "Generar Pedimento". El sistema sugerirá opciones inteligentes y prohibirá duplicados.</li>
                                    <li><strong className="text-slate-800">Para Consultar:</strong> Entra a "Historial de Pedimentos" para visualizar la sábana tabular de transacciones bajo tu patente activa.</li>
                                </ul>
                            </div>

                            {/* Modulo IV */}
                            <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm relative overflow-hidden text-slate-800">
                                <div className="absolute top-0 left-0 w-2 h-full bg-[#244635]"></div>
                                <h4 className="font-bold text-[#244635] text-lg flex items-center gap-2 mb-3">
                                    <Stamp size={18} /> IV. Sellos Fiscales
                                </h4>
                                <ul className="space-y-3 text-sm font-medium">
                                    <li><strong className="text-slate-800">Asignación:</strong> En "Solicitar Sello", ingresa el candado alfanumérico y alineas a qué cliente/transportista sale despachado.</li>
                                    <li><strong className="text-slate-800">Auditoría:</strong> (Admin) Entra a "Historial" anidado en sellos para rastrear qué usuario entregó qué número y fecha de candado.</li>
                                </ul>
                            </div>

                        </div>

                        {/* Modulo V Control Central - Full width */}
                        <div className="border border-[#244635] rounded-2xl p-6 bg-[#fcfefd] shadow-sm relative mt-6">
                            <h4 className="font-black text-[#244635] text-xl flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
                                <ShieldAlert size={22} className="text-red-700" /> V. CONTROL MAESTRO (Dirección)
                            </h4>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <strong className="text-[#244635] flex items-center gap-2 mb-2"><Users size={16}/> Catálogo Clientes</strong>
                                    <p className="text-sm font-medium text-slate-600">Alta y edita información de prospectos y RFCs para normalizar la escritura a nivel piso. Previene que Operativos metan basura a la Base.</p>
                                </div>
                                <div>
                                    <strong className="text-[#244635] flex items-center gap-2 mb-2"><GitBranch size={16}/> Series (Sociedades)</strong>
                                    <p className="text-sm font-medium text-slate-600">Réplica digital robusta de bloques de folios (Serie Inicial y Serie Final) asignados a Filiales, encriptado contra operadores.</p>
                                </div>
                                <div>
                                    <strong className="text-[#244635] flex items-center gap-2 mb-2"><UserCog size={16}/> Gestor de Usuarios</strong>
                                    <p className="text-sm font-medium text-slate-600">Lápiz Azul ✏️ de poder supremo. Da de alta y retira permisos específicos por aduana o cambia rangos (de Ope a Gerente) de inmediato.</p>
                                </div>
                            </div>
                        </div>

                    </section>

                    {/* Footer Oficial */}
                    <div className="pt-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest border-t-2 border-slate-100">
                        — SEAM Consultores - INFORMACIÓN ESTRICTAMENTE CONFIDENCIAL — <br/>
                        {new Date().getFullYear()} © Todos los derechos de infraestructura técnica y lógica reservados.
                    </div>
                </div>
            </div>
        </div>
    );
}
