'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/app/components/Sidebar';
import { Loader2, UserPlus, Users, ShieldAlert, CheckCircle, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
// We need to import the server actions.
// Since this is a client component, we'll invoke them directly.
// But first, let's just use fetch or client-side logic if possible?
// No, for creation we MUST use the server action because of the Service Role key.
// We can't import server actions directly into client components in all Next.js versions cleanly without 'use server' at top of file or separate file.
// We have `src/app/actions/admin-users.ts` marked with 'use server', so it's safe.
import { createUser, getUsers, updateUser } from '@/app/actions/admin-users';

export default function AdminUsers() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'operativo',
        aduanas: [] as string[],
        patentes: [] as string[]
    });
    // Edit Mode State
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Temporary state for Patente input
    const [patenteInput, setPatenteInput] = useState('');

    const [createLoading, setCreateLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const ADUANA_OPTIONS = [
        { value: '240', label: '240 - NUEVO LAREDO' },
        { value: '800', label: '800 - COLOMBIA' },
        { value: '300', label: '300 - REYNOSA' },
        { value: '280', label: '280 - MATAMOROS' },
        { value: '160', label: '160 - MONTERREY' },
        { value: '810', label: '810 - ALTAMIRA' },
    ];

    useEffect(() => {
        checkAdminAndFetchUsers();
    }, []);

    const checkAdminAndFetchUsers = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (!profile || profile.role !== 'admin') {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            setIsAdmin(true);
            await fetchUsers();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setUsers(data);
    };

    const handleEditClick = (user: any) => {
        setEditingUserId(user.id);
        setFormData({
            email: user.email,
            password: '', // Password empty by default on edit
            fullName: user.full_name || '',
            role: user.role,
            aduanas: user.access_aduanas || [],
            patentes: user.access_patentes || []
        });
        setMessage(null);
        // Scroll to top or form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setFormData({
            email: '',
            password: '',
            fullName: '',
            role: 'operativo',
            aduanas: [],
            patentes: []
        });
        setMessage(null);
    };

    const handleAddPatente = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = patenteInput.trim();
            if (val && !formData.patentes.includes(val)) {
                setFormData(prev => ({ ...prev, patentes: [...prev.patentes, val] }));
                setPatenteInput('');
            }
        }
    };

    const removePatente = (patente: string) => {
        setFormData(prev => ({ ...prev, patentes: prev.patentes.filter(p => p !== patente) }));
    };

    const toggleAduana = (value: string) => {
        setFormData(prev => {
            const exists = prev.aduanas.includes(value);
            return {
                ...prev,
                aduanas: exists
                    ? prev.aduanas.filter(a => a !== value)
                    : [...prev.aduanas, value]
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        setMessage(null);

        const form = new FormData();
        form.append('email', formData.email);
        form.append('password', formData.password);
        form.append('fullName', formData.fullName);
        form.append('role', formData.role);
        // Send arrays as JSON strings
        form.append('aduana', JSON.stringify(formData.aduanas));
        form.append('patente', JSON.stringify(formData.patentes));

        try {
            let result;
            if (editingUserId) {
                // Update Mode
                form.append('userId', editingUserId);
                result = await updateUser(form);
            } else {
                // Create Mode
                result = await createUser(form);
            }

            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                setEditingUserId(null);
                setFormData({ email: '', password: '', fullName: '', role: 'operativo', aduanas: [], patentes: [] });
                fetchUsers(); // Refresh list
            } else {
                setMessage({ type: 'error', text: result.message || 'Error.' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Error de conexión.' });
        } finally {
            setCreateLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-[#f8fafc] text-white items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex h-screen bg-[#111827] text-white items-center justify-center flex-col gap-4">
                <ShieldAlert className="w-16 h-16 text-red-500" />
                <h1 className="text-2xl font-bold">Acceso Denegado</h1>
                <p className="text-gray-400">Esta sección es exclusiva para Administradores.</p>
                <button onClick={() => router.push('/')} className="px-4 py-2 bg-[#D4AF37] text-black rounded hover:bg-[#B5952F]">
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            <Sidebar />

            <main className="flex-1 ml-64 overflow-y-auto p-8 relative">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#244635] flex items-center gap-3">
                            <Users className="w-8 h-8" />
                            Administración de Usuarios
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">Crea y gestiona el acceso al sistema.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-[#D1BD85] uppercase tracking-widest">Portal Corporativo</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create/Edit User Form */}
                    <div className="lg:col-span-1">
                        <div className={`p-6 rounded-2xl border shadow-xl transition-all duration-300 ${editingUserId ? 'bg-amber-50 border-amber-200 shadow-amber-100' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className={`text-xl font-bold flex items-center gap-2 ${editingUserId ? 'text-amber-800' : 'text-[#244635]'}`}>
                                    {editingUserId ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5 text-[#D1BD85]" />}
                                    {editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}
                                </h2>
                                {editingUserId && (
                                    <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#244635]/20 focus:outline-none transition-all"
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        disabled={!!editingUserId} // Disable email edit safely for now
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full border rounded-xl px-4 py-3 font-medium transition-all ${editingUserId ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-[#244635]/20'}`}
                                        placeholder="usuario@empresa.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        {editingUserId ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}
                                    </label>
                                    <input
                                        type="password"
                                        required={!editingUserId} // Required only on creation
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-[#244635]/20 focus:outline-none transition-all"
                                        placeholder={editingUserId ? "Dejar en blanco para mantener actual" : ""}
                                    />
                                </div>

                                {/* MULTI-SELECT ADUANAS */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Aduanas de Acceso</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allValues = ADUANA_OPTIONS.map(o => o.value);
                                                const allSelected = allValues.every(v => formData.aduanas.includes(v));
                                                setFormData(prev => ({
                                                    ...prev,
                                                    aduanas: allSelected ? [] : allValues
                                                }));
                                            }}
                                            className="text-[10px] font-bold text-[#244635] hover:text-[#1a3326] underline"
                                        >
                                            {ADUANA_OPTIONS.every(o => formData.aduanas.includes(o.value)) ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 max-h-40 overflow-y-auto">
                                        <div className="space-y-1">
                                            {ADUANA_OPTIONS.map(opt => (
                                                <label key={opt.value} className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.aduanas.includes(opt.value)}
                                                        onChange={() => toggleAduana(opt.value)}
                                                        className="w-4 h-4 text-[#244635] rounded border-gray-300 focus:ring-[#244635]"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {formData.aduanas.map(val => (
                                            <span key={val} className="px-2 py-0.5 bg-[#244635]/10 text-[#244635] text-[10px] font-bold rounded-full border border-[#244635]/20">
                                                {val}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* TAG INPUT PATENTES */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patentes Autorizadas</label>
                                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-[#244635]/20 transition-all">
                                        {formData.patentes.map(p => (
                                            <span key={p} className="flex items-center gap-1 bg-[#D1BD85]/20 text-slate-800 text-xs font-bold px-2 py-1 rounded-lg border border-[#D1BD85]/30">
                                                {p}
                                                <button
                                                    type="button"
                                                    onClick={() => removePatente(p)}
                                                    className="hover:text-red-500 text-slate-500"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={patenteInput}
                                            onChange={(e) => setPatenteInput(e.target.value)}
                                            onKeyDown={handleAddPatente}
                                            className="bg-transparent border-none outline-none text-sm min-w-[80px] flex-1 text-slate-700 placeholder:text-slate-400"
                                            placeholder="Escribe y Enter..."
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 pl-1">Presiona Enter para agregar.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol Asignado</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['admin', 'director', 'gerente', 'coordinador', 'operativo', 'socio_comercial', 'cliente'].map(role => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, role })}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all
                                                    ${formData.role === role
                                                        ? 'bg-[#244635] text-white shadow-md shadow-[#244635]/20'
                                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                            >
                                                {role.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {message && (
                                    <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                        {message.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4
                                        ${editingUserId
                                            ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-amber-500/20'
                                            : 'bg-[#244635] text-white hover:bg-[#1a3326] hover:shadow-[#244635]/20'}`}
                                >
                                    {createLoading
                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                        : editingUserId ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />
                                    }
                                    {editingUserId ? 'Actualizar Usuario' : 'Crear Usuario'}
                                </button>

                                {editingUserId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="w-full text-slate-400 font-bold py-2 rounded-xl hover:bg-slate-50 transition-colors text-sm"
                                    >
                                        Cancelar Edición
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* User List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-700">Usuarios Registrados</h3>
                                <div className="bg-white px-3 py-1 rounded-full border border-slate-100 text-xs font-bold text-slate-400">
                                    Total: {users.length}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Aduanas</th>
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patentes</th>
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {users.map((user) => (
                                            <tr key={user.id} className={`hover:bg-slate-50 transition-colors group ${editingUserId === user.id ? 'bg-amber-50/50' : ''}`}>
                                                <td className="px-8 py-4">
                                                    <div className="font-bold text-slate-700">{user.full_name || 'Sin nombre'}</div>
                                                    <div className="text-[10px] text-slate-400">{user.email}</div>
                                                </td>

                                                {/* ADUANAS LIST */}
                                                <td className="px-8 py-4">
                                                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                        {user.access_aduanas && Array.isArray(user.access_aduanas) && user.access_aduanas.length > 0
                                                            ? user.access_aduanas.map((ad: string) => (
                                                                <span key={ad} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">
                                                                    {ad}
                                                                </span>
                                                            ))
                                                            : <span className="text-slate-300 text-xs">---</span>
                                                        }
                                                    </div>
                                                </td>

                                                {/* PATENTES LIST */}
                                                <td className="px-8 py-4">
                                                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                        {user.access_patentes && Array.isArray(user.access_patentes) && user.access_patentes.length > 0
                                                            ? user.access_patentes.map((pat: string) => (
                                                                <span key={pat} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-100">
                                                                    {pat}
                                                                </span>
                                                            ))
                                                            : <span className="text-slate-300 text-xs">---</span>
                                                        }
                                                    </div>
                                                </td>

                                                <td className="px-8 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border
                                                        ${user.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' :
                                                            user.role === 'coordinador' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                user.role === 'operativo' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                    'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>

                                                <td className="px-8 py-4">
                                                    <button
                                                        onClick={() => handleEditClick(user)}
                                                        className="p-2 text-slate-400 hover:text-[#244635] hover:bg-[#244635]/10 rounded-lg transition-all"
                                                        title="Editar Usuario"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">
                                                    No hay usuarios registrados aparte de ti.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
