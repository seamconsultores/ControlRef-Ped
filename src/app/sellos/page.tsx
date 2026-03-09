"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import { Loader2, ShieldCheck, Plus, Search, UserCheck, Package, AlertTriangle } from 'lucide-react';

export default function SellosPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('operativo');
    const [seals, setSeals] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'inventario' | 'solicitud'>('solicitud');

    // Estado para "Solicitar Sello"
    const [requesting, setRequesting] = useState(false);
    const [assignedSeal, setAssignedSeal] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Campos del Formulario de Solicitud
    const [formData, setFormData] = useState({
        patente: '',
        cliente: '',
        pedimento: '', // Ahora será textarea
        aduana: '',
        caja: '',
        placas: '', // New field
        referencia: '' // Added for Referencias Report
    });



    // Estado para "Alta de Sellos" (Coordinador)
    const [newSealStart, setNewSealStart] = useState('');
    const [newSealEnd, setNewSealEnd] = useState('');
    const [newSealPatente, setNewSealPatente] = useState(''); // Patente a la que pertenece el lote
    const [newSealAduana, setNewSealAduana] = useState('240'); // Default Nuevo Laredo
    const [newSealSociedad, setNewSealSociedad] = useState(''); // e.g. G&B
    const [newSealUbicacion, setNewSealUbicacion] = useState('Bodega'); // Default Bodega
    const [adding, setAdding] = useState(false);

    const [clientesList, setClientesList] = useState<string[]>([]);

    useEffect(() => {
        const fetchClientes = async () => {
            const { data } = await supabase.from('clientes').select('nombre_razon_social').order('nombre_razon_social');
            if (data) {
                setClientesList(data.map((c: any) => c.nombre_razon_social));
            }
        };
        fetchClientes();
    }, []);

    useEffect(() => {
        fetchUserAndSeals();
    }, []);

    const fetchUserAndSeals = async () => {
        setLoading(true);
        try {
            // 1. Get User Profile
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserRole(profile.role);
                // Si es admin/coordinador/gerente, mostrar inventario por defecto
                if (['admin', 'director', 'gerente', 'coordinador'].includes(profile.role)) {
                    setActiveTab('inventario');
                }
            }

            // 2. Fetch Seals (Available or Assigned to me)
            fetchSeals();

        } catch (err) {
            console.error("Error loading data:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSeals = async () => {
        const { data, error } = await supabase
            .from('sellos_fiscales')
            .select('*')
            .order('numero_serie', { ascending: true })
            .limit(100); // Pagination needed for prod

        if (data) setSeals(data);
    };

    const handleRequestSeal = async (e: React.FormEvent) => {
        e.preventDefault();
        setRequesting(true);
        setErrorMsg('');
        setAssignedSeal(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No sesión");

            // Validate fields
            if (!formData.patente || !formData.cliente || !formData.pedimento || !formData.aduana || !formData.caja || !formData.placas) {
                throw new Error("Todos los campos (Patente, Cliente, Pedimentos, Aduana, Caja, Placas) son obligatorios.");
            }

            // Parse Pedimentos (Split by newline, comma, space)
            const pedimentoRefs = formData.pedimento.split(/[\n, ]+/).map(p => p.trim()).filter(p => p.length > 0);

            if (pedimentoRefs.length === 0) {
                throw new Error("Debe ingresar al menos un pedimento.");
            }

            const mainPedimento = pedimentoRefs[0];

            // 1. Client-Side Retry Logic (since we cannot easily apply migrations for RPC)
            let attempts = 0;
            const maxAttempts = 5;
            let assignedSealData = null;

            while (attempts < maxAttempts && !assignedSealData) {
                attempts++;
                try {
                    // A. Find ANY available seal
                    // We use `maybeSingle` and random offset or just verify availability
                    // To reduce collision, we can try to pick not just the first one, but for now strict order is preferred.
                    const { data: availableSeal, error: findError } = await supabase
                        .from('sellos_fiscales')
                        .select('id, numero_serie')
                        .eq('estado', 'disponible')
                        .eq('patente', formData.patente)
                        .order('numero_serie', { ascending: true })
                        .limit(1)
                        .maybeSingle();

                    if (findError) throw findError;
                    if (!availableSeal) {
                        if (attempts === 1) {
                            throw new Error(`No hay sellos disponibles para la patente ${formData.patente}. Contacte al coordinador.`);
                        }
                        // If we are retrying and run out of seals
                        break;
                    }

                    // B. Try to Assign it (Optimistic Locking)
                    const { data: updatedSeal, error: updateError } = await supabase
                        .from('sellos_fiscales')
                        .update({
                            estado: 'asignado',
                            asignado_a: user.id,
                            fecha_asignacion: new Date().toISOString(),
                            cliente: formData.cliente,
                            pedimento: mainPedimento,
                            aduana: formData.aduana,
                            caja: formData.caja,
                            placas: formData.placas,
                            referencia: formData.referencia,
                            pedimento_refs: pedimentoRefs
                        })
                        .eq('id', availableSeal.id)
                        .eq('estado', 'disponible') // Critical: Ensure it's still available
                        .select()
                        .maybeSingle();

                    if (!updateError && updatedSeal) {
                        assignedSealData = updatedSeal;
                        
                        // Upsert client into catalogue automatically
                        const clienteStand = formData.cliente.trim().toUpperCase();
                        await supabase.from('clientes').insert({
                            nombre_razon_social: clienteStand,
                            created_by: user.id
                        }); // Fallará silenciosamente si ya existe, logrando el ON CONFLICT DO NOTHING
                        
                    } else {
                        // Collision occurred, wait a bit and retry
                        await new Promise(res => setTimeout(res, Math.random() * 200 + 100)); // 100-300ms delay
                    }
                } catch (err) {
                    // Propagate critical errors immediately
                    if ((err as Error).message.includes('No hay sellos')) throw err;
                    console.warn(`Attempt ${attempts} failed`, err);
                }
            }

            if (!assignedSealData) {
                throw new Error("El sistema está saturado o los sellos se agotaron. Por favor intente de nuevo.");
            }

            const updatedSeal = assignedSealData as any;

            setAssignedSeal(updatedSeal);
            // Reset form
            setFormData({ ...formData, pedimento: '', caja: '', cliente: '', placas: '' }); // Reset fields
            fetchSeals(); // Refresh list

        } catch (err: any) {
            console.error("Error requesting seal:", err);
            setErrorMsg(err.message || "Error al solicitar sello");
        } finally {
            setRequesting(false);
        }
    };

    const handleAddSeals = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        setErrorMsg('');

        try {
            if (!newSealPatente) throw new Error("Debe asignar una patente al nuevo lote de sellos.");
            if (!newSealStart) throw new Error("Debe indicar el inicio de la serie.");

            const sealsToInsert = [];

            if (!newSealEnd) {
                // Single seal
                sealsToInsert.push({
                    numero_serie: newSealStart,
                    estado: 'disponible',
                    ubicacion: 'Bodega',
                    patente: newSealPatente,
                    aduana_id: newSealAduana,
                    sociedad: newSealSociedad,
                    asignado_a_ubicacion: newSealUbicacion
                });
            } else {
                // Range generation
                // 1. Detect numeric part at the end
                const matchStart = newSealStart.match(/^(.*?)(\d+)$/);
                const matchEnd = newSealEnd.match(/^(.*?)(\d+)$/);

                if (!matchStart) throw new Error("El sello inicial debe terminar en número para crear un rango.");

                // If end is provided, it must match pattern
                if (matchEnd) {
                    const prefixStart = matchStart[1];
                    const numStart = parseInt(matchStart[2], 10);
                    const lengthStart = matchStart[2].length;

                    const prefixEnd = matchEnd[1];
                    const numEnd = parseInt(matchEnd[2], 10);

                    if (prefixStart !== prefixEnd) throw new Error("Los prefijos de inicio y fin no coinciden.");
                    if (numEnd < numStart) throw new Error("El número final debe ser mayor al inicial.");
                    if ((numEnd - numStart) > 1000) throw new Error("Máximo 1000 sellos por carga masiva.");

                    for (let i = numStart; i <= numEnd; i++) {
                        // Pad with leading zeros to match original length
                        const paddedNum = i.toString().padStart(lengthStart, '0');
                        sealsToInsert.push({
                            numero_serie: `${prefixStart}${paddedNum}`,
                            estado: 'disponible',
                            ubicacion: 'Bodega', // Legacy field, kept for now
                            patente: newSealPatente,
                            aduana_id: newSealAduana,
                            sociedad: newSealSociedad,
                            asignado_a_ubicacion: newSealUbicacion
                        });
                    }
                } else {
                    throw new Error("El sello final debe tener el mismo formato que el inicial y terminar en número.");
                }
            }

            // Batch Insert
            const { error } = await supabase.from('sellos_fiscales').insert(sealsToInsert);

            if (error) {
                if (error.code === '23505') throw new Error("Algunos de los sellos del rango ya existen.");
                throw error;
            }

            setNewSealStart('');
            setNewSealEnd(''); // Clear end
            fetchSeals();
            alert(`${sealsToInsert.length} Sello(s) agregados correctamente`);

        } catch (err: any) {
            console.error("Error adding seal:", err);
            setErrorMsg(err.message || "Error al agregar sello");
        } finally {
            setAdding(false);
        }
    };

    const isCoord = ['admin', 'director', 'gerente', 'coordinador'].includes(userRole);

    return (
        <div className="min-h-screen pl-64 bg-[#f8fafc]">
            <Sidebar userRole={userRole} />

            {/* Header */}
            <header className="h-24 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
                <div>
                    <h2 className="text-2xl font-bold text-[#244635] tracking-tight">CONTROL DE SELLOS FISCALES</h2>
                    <p className="text-xs font-bold text-[#D1BD85] uppercase tracking-widest mt-1">Gestión de Inventario y Asignaciones</p>
                </div>
            </header>

            <div className="p-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    {isCoord && (
                        <button
                            onClick={() => setActiveTab('inventario')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'inventario' ? 'bg-[#244635] text-white shadow-lg shadow-[#244635]/20' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Package size={20} />
                            Inventario / Bodega
                        </button>
                    )}
                    <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1 mb-8 w-fit">
                        <button
                            onClick={() => setActiveTab('solicitud')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'solicitud' ? 'bg-[#244635] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Solicitar Sello
                        </button>
                        {['admin', 'director', 'gerente', 'coordinador'].includes(userRole) && (
                            <button
                                onClick={() => setActiveTab('inventario')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inventario' ? 'bg-[#244635] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Alta de Sellos
                            </button>
                        )}
                    </div>
                </div> {/* Close 291 */}

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-2 animate-pulse">
                        <AlertTriangle size={20} />
                        <span className="font-medium">{errorMsg}</span>
                    </div>
                )}


                {/* CONTENT */}
                {activeTab === 'inventario' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Creation Form */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
                            <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                                <Plus size={20} className="text-[#244635]" />
                                Alta de Lote (Bodega)
                            </h3>
                            <form onSubmit={handleAddSeals} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Inicio Serie</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#244635]/20 font-mono"
                                            placeholder="000100"
                                            value={newSealStart}
                                            onChange={(e) => setNewSealStart(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Fin Serie</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#244635]/20 font-mono"
                                            placeholder="000200"
                                            value={newSealEnd}
                                            onChange={(e) => setNewSealEnd(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Aduana Compra</label>
                                        <select
                                            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#244635]/20"
                                            value={newSealAduana}
                                            onChange={(e) => setNewSealAduana(e.target.value)}
                                        >
                                            <option value="240">240 - N. LAREDO</option>
                                            <option value="800">800 - COLOMBIA</option>
                                            <option value="300">300 - REYNOSA</option>
                                            <option value="160">160 - MONTERREY</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Patente</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#244635]/20"
                                            placeholder="3834"
                                            value={newSealPatente}
                                            onChange={(e) => setNewSealPatente(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Sociedad / Dueño</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#244635]/20"
                                            placeholder="Ej. G&B, Cliente X"
                                            value={newSealSociedad}
                                            onChange={(e) => setNewSealSociedad(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Asignado A (Ubicación)</label>
                                        <select
                                            className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#244635]/20"
                                            value={newSealUbicacion}
                                            onChange={(e) => setNewSealUbicacion(e.target.value)}
                                        >
                                            <option value="Bodega">Bodega</option>
                                            <option value="Stock Oficina">Stock Oficina</option>
                                            <option value="Socio Comercial">Socio Comercial</option>
                                            <option value="Transportista">Transportista</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="w-full bg-[#244635] text-white font-bold py-3 rounded-lg hover:bg-[#1a3326] transition-colors"
                                >
                                    {adding ? 'Guardando...' : 'Registrar Sello en Bodega'}
                                </button>
                            </form>
                        </div>

                        {/* List - RESTORED */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-700">Inventario General</h3>
                                <div className="text-xs font-bold text-slate-400 uppercase">
                                    Total: {seals.length} | Disponibles: {seals.filter(s => s.estado === 'disponible').length}
                                </div>
                            </div>
                            <div className="max-h-[600px] overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Serie</th>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Patente / Aduana</th>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Sociedad / Ubicación</th>
                                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {seals.map(seal => (
                                            <tr key={seal.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-3 font-mono font-bold text-slate-700">{seal.numero_serie}</td>
                                                <td className="px-6 py-3">
                                                    <div className="text-xs font-bold text-slate-700">{seal.patente}</div>
                                                    <div className="text-[10px] text-slate-400">{seal.aduana_id || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="text-xs font-bold text-slate-700">{seal.sociedad || 'Sin Dueño'}</div>
                                                    <div className="text-[10px] text-slate-400">{seal.asignado_a_ubicacion || seal.ubicacion}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase
                                                                            ${seal.estado === 'disponible' ? 'bg-green-100 text-green-700' :
                                                            seal.estado === 'asignado' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {seal.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {/* Solicitud Form */}
                {activeTab === 'solicitud' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center md:text-left">
                            <h3 className="text-2xl font-bold text-[#244635] mb-2">Solicitar Sello Fiscal</h3>
                            <p className="text-slate-500 mb-8">El sistema asignará automáticamente el siguiente sello disponible.</p>

                            {assignedSeal ? (
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-in zoom-in duration-300">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <h4 className="text-lg font-bold text-green-800 mb-2">¡Sello Asignado Exitosamente!</h4>
                                    <p className="text-sm text-green-600 mb-6">Por favor coloque este sello en la unidad correspondiente.</p>

                                    <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm mb-6">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Número de Serie</p>
                                        <p className="text-4xl font-mono font-bold text-[#244635] tracking-tight">{assignedSeal.numero_serie}</p>
                                    </div>

                                    <button
                                        onClick={() => setAssignedSeal(null)}
                                        className="bg-[#244635] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#1a3326] transition-colors"
                                    >
                                        Solicitar Otro Sello
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleRequestSeal} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">Patente (Obligatorio)</label>
                                            <select
                                                required
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#244635]/20 font-medium"
                                                value={formData.patente}
                                                onChange={(e) => setFormData({ ...formData, patente: e.target.value })}
                                            >
                                                <option value="">Seleccione Patente...</option>
                                                <option value="3834">3834</option>
                                                <option value="3835">3835</option>
                                                <option value="3589">3589</option>
                                                {/* Add more as needed or fetch dynamically */}
                                            </select>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">Cliente</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#244635]/20"
                                                placeholder="Nombre del Cliente"
                                                value={formData.cliente}
                                                list="clientes_list_sellos"
                                                autoComplete="off"
                                                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                                            />
                                            <datalist id="clientes_list_sellos">
                                                {clientesList.map((c, i) => (
                                                    <option key={i} value={c} />
                                                ))}
                                            </datalist>
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">Placas / Unidades</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#244635]/20 uppercase"
                                                placeholder="Ej. BBC-123, 53421..."
                                                value={formData.placas}
                                                onChange={(e) => setFormData({ ...formData, placas: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">Referencia</label>
                                            <input
                                                type="text"
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#244635]/20"
                                                placeholder="Ej. ET-24-001"
                                                value={formData.referencia}
                                                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">Caja / Contenedor</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#244635]/20"
                                                placeholder="Ej. CAJU1234567"
                                                value={formData.caja}
                                                onChange={(e) => setFormData({ ...formData, caja: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">Pedimentos (Uno o Varios)</label>
                                            <textarea
                                                required
                                                rows={3}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#244635]/20 font-mono text-sm"
                                                placeholder="Ej. 5001234&#10;5001235&#10;5001236"
                                                value={formData.pedimento}
                                                onChange={(e) => setFormData({ ...formData, pedimento: e.target.value })}
                                            />
                                            <p className="text-xs text-slate-400 mt-1">Separe múltiples pedimentos con enter, coma o espacio.</p>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-sm font-bold text-slate-700 mb-2 block">Aduana</label>
                                            <select
                                                required
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#244635]/20"
                                                value={formData.aduana}
                                                onChange={(e) => setFormData({ ...formData, aduana: e.target.value })}
                                            >
                                                <option value="">Seleccione Aduana...</option>
                                                <option value="240 - NUEVO LAREDO">240 - NUEVO LAREDO</option>
                                                <option value="800 - COLOMBIA">800 - COLOMBIA</option>
                                                <option value="300 - REYNOSA">300 - REYNOSA</option>
                                                <option value="280 - MATAMOROS">280 - MATAMOROS</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={requesting}
                                        className="w-full bg-[#244635] text-white font-bold py-4 rounded-xl hover:bg-[#1a3326] transition-all shadow-lg hover:shadow-[#244635]/25 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2 text-lg"
                                    >
                                        {requesting ? (
                                            <>
                                                <Loader2 className="animate-spin" />
                                                Asignando...
                                            </>
                                        ) : (
                                            'Confirmar y Obtener Sello'
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
