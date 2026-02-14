"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ContextSelectorModal from './components/ContextSelectorModal';
import UserDashboard from './components/UserDashboard';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  TrendingUp,
  FileCheck,
  Clock,
  ArrowUpRight,
  Bell,
  Search
} from 'lucide-react';

const ADUANA_NAMES: Record<string, string> = {
  '240': 'NUEVO LAREDO',
  '800': 'COLOMBIA',
  '300': 'REYNOSA',
  '280': 'MATAMOROS',
  '160': 'MONTERREY',
  '810': 'ALTAMIRA'
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('');
  const [sessionContext, setSessionContext] = useState({ aduana: '', patente: '' });
  const [availableContext, setAvailableContext] = useState<{ aduanas: string[], patentes: string[] }>({ aduanas: [], patentes: [] });
  const [showContextModal, setShowContextModal] = useState(false);
  const supabase = createClient();
  const router = useRouter();


  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      // Obtener perfil para el rol, nombre, y accesos
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, aduana_access, patente_access')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
        setUserName(profile.full_name || session.user.email || 'Usuario');

        // Parsear accesos (pueden venir como string JSON o array directo dependiendo de la BD)
        let aduanas: string[] = [];
        let patentes: string[] = [];

        if (Array.isArray(profile.aduana_access)) {
          aduanas = profile.aduana_access;
        } else if (typeof profile.aduana_access === 'string') {
          try { aduanas = JSON.parse(profile.aduana_access); } catch (e) { }
        }

        if (Array.isArray(profile.patente_access)) {
          patentes = profile.patente_access;
        } else if (typeof profile.patente_access === 'string') {
          try { patentes = JSON.parse(profile.patente_access); } catch (e) { }
        }

        setAvailableContext({ aduanas, patentes });

        // Recuperar contexto de sesión si existe
        const storedContext = localStorage.getItem('sessionContext');
        let currentContext = storedContext ? JSON.parse(storedContext) : null;

        // Si no hay contexto o el contexto guardado no es válido (ej. aduana ya no asignada), usar defaults
        const isAduanaValid = currentContext?.aduana && aduanas.includes(currentContext.aduana);
        const isPatenteValid = currentContext?.patente && patentes.includes(currentContext.patente);

        if (!currentContext || !isAduanaValid || !isPatenteValid) {
          // LÓGICA DE SELECCIÓN OBLIGATORIA
          if (aduanas.length > 1) {
            // Si tiene múltiples, MOSTRAR MODAL (No setear default)
            setShowContextModal(true);
            currentContext = { aduana: '', patente: '' }; // Estado vacío temporal
          } else {
            // Si solo tiene una, Auto-Select
            const defaultAduana = aduanas.length > 0 ? aduanas[0] : '';
            const defaultPatente = patentes.length > 0 ? patentes[0] : '';

            currentContext = { aduana: defaultAduana, patente: defaultPatente };
            if (defaultAduana) localStorage.setItem('sessionContext', JSON.stringify(currentContext));
          }
        }

        setSessionContext(currentContext);
      }

    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sessionContext');
    router.push('/login');
    router.refresh();
  };

  // Función para cambiar el contexto manual
  const handleModalSelect = (aduana: string, patente: string) => {
    const newContext = { aduana, patente };
    setSessionContext(newContext);
    localStorage.setItem('sessionContext', JSON.stringify(newContext));
    setShowContextModal(false);
  };

  const handleContextChange = (type: 'aduana' | 'patente', value: string) => {
    const newContext = { ...sessionContext, [type]: value };
    setSessionContext(newContext);
    localStorage.setItem('sessionContext', JSON.stringify(newContext));
    // Opcional: Recargar si es crítico, pero por ahora reactivo
    window.location.reload();
  };

  const formattedAduana = sessionContext.aduana && ADUANA_NAMES[sessionContext.aduana]
    ? `${sessionContext.aduana} - ${ADUANA_NAMES[sessionContext.aduana]}`
    : sessionContext.aduana || 'Aduana Desconocida';

  // Mostrar iniciales del nombre
  const userInitials = userName
    ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#244635]" />
      </div>
    );
  }

  // Si es Administrador/Director, mostramos el Panel de Métricas global
  // Si es Usuario Operativo, mostramos el Panel de Solicitudes
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {showContextModal && (
        <ContextSelectorModal
          availableContext={availableContext}
          onSelect={handleModalSelect}
        />
      )}

      <Sidebar userRole={userRole} onLogout={handleLogout} />

      <main className="flex-1 ml-64 transition-all duration-300">
        {/* Header Universal */}
        <header className="h-24 bg-white px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm/50">
          <div>
            <h2 className="text-2xl font-bold text-[#244635] tracking-tight">DASHBOARD</h2>
            <p className="text-xs font-bold text-[#D1BD85] uppercase tracking-widest mt-1">SISTEMA INTEGRAL</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right hidden md:block group relative">
              {/* Selector de Aduana */}
              {availableContext.aduanas.length > 1 ? (
                <div className="flex items-center justify-end gap-2 group-hover:bg-slate-50 p-1 rounded transition-colors cursor-pointer">
                  <select
                    value={sessionContext.aduana}
                    onChange={(e) => handleContextChange('aduana', e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5 text-right outline-none appearance-none cursor-pointer"
                  >
                    {availableContext.aduanas.map(a => (
                      <option key={a} value={a}>
                        {a && ADUANA_NAMES[a] ? `${a} - ${ADUANA_NAMES[a]}` : a}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                  {formattedAduana}
                </p>
              )}

              {/* Selector de Patente */}
              {availableContext.patentes.length > 1 ? (
                <div className="flex items-center justify-end">
                  <span className="text-[#244635] font-black text-xl mr-2">PATENTE</span>
                  <select
                    value={sessionContext.patente}
                    onChange={(e) => handleContextChange('patente', e.target.value)}
                    className="bg-transparent font-black text-[#244635] text-xl leading-none tracking-tight outline-none appearance-none cursor-pointer border-b-2 border-dashed border-[#244635]/20 hover:border-[#244635]"
                  >
                    {availableContext.patentes.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <h3 className="font-black text-[#244635] text-xl leading-none tracking-tight">
                  PATENTE {sessionContext.patente || '----'}
                </h3>
              )}
            </div>

            <div className="flex items-center gap-3 pl-8 border-l border-slate-100">
              <div className="text-right mr-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hola,</p>
                <p className="text-sm font-bold text-[#244635] leading-none">{userName}</p>
              </div>
              <div className="w-10 h-10 bg-[#244635] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#244635]/20 ring-4 ring-slate-50">
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        {userRole === 'operativo' || userRole === 'user' ? (
          <UserDashboard sessionContext={sessionContext} />
        ) : (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}

// Subcomponente para el Dashboard Administrativo (El que ya teníamos)
const AdminDashboard = () => {
  const stats = [
    { label: 'Total Pedimentos', value: '1,280', change: '+12%', color: 'blue' },
    { label: 'Referencias Hoy', value: '45', change: '+5%', color: 'amber' },
    { label: 'Usuarios Activos', value: '12', change: '0%', color: 'emerald' },
    { label: 'Eficiencia', value: '98.5%', change: '+2%', color: 'purple' },
  ];

  const recentRequests = [
    { id: '24-240-3510-0001234', client: 'Samsung Electronics', user: 'Juan Perez', time: 'hace 5 min' },
    { id: '24-240-3510-0001233', client: 'Toyota Motors', user: 'Maria Garcia', time: 'hace 12 min' },
    { id: '24-800-3920-0000567', client: 'General Electric', user: 'Roberto Diaz', time: 'hace 25 min' },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          // Asignar colores específicos según índice para simular el diseño
          const borderColors = ['border-[#D1BD85]', 'border-red-400', 'border-[#C2C3C9]', 'border-[#244635]'];
          const iconBgColors = ['bg-[#fdfaf2]', 'bg-red-50', 'bg-slate-50', 'bg-emerald-50'];
          const iconColors = ['text-[#D1BD85]', 'text-red-400', 'text-slate-400', 'text-[#244635]'];

          return (
            <div key={i} className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group border-t-4 ${borderColors[i % 4]}`}>
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBgColors[i % 4]} ${iconColors[i % 4]} mb-2`}>
                  {/* Icon placeholder logic */}
                  {i === 0 && <TrendingUp size={24} />}
                  {i === 1 && <Clock size={24} />}
                  {i === 2 && <FileCheck size={24} />}
                  {i === 3 && <ArrowUpRight size={24} />}
                </div>

                <div>
                  <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stat.value}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-800">Operaciones por Mes</h3>
            <select className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 px-4 py-2 outline-none">
              <option>Anual 2024</option>
              <option>Mensual</option>
            </select>
          </div>
          <div className="flex items-center justify-center h-[300px] bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold tracking-tight">Gráfico en construcción...</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-lg font-bold text-slate-800">Últimas Solicitudes</h3>
            <button className="text-xs font-bold text-[#D1BD85] hover:text-[#244635] hover:underline transition-colors">Ver todo</button>
          </div>
          <div className="space-y-4">
            {recentRequests.map((req, i) => (
              <div key={i} className="p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#244635]/5 flex items-center justify-center text-[#244635] group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
                    <FileCheck size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{req.id}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{req.client}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[10px] font-extrabold bg-white border border-slate-100 text-slate-600 px-2 py-0.5 rounded-lg uppercase shadow-sm">
                        {req.user}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock size={10} /> {req.time}
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-[#C2C3C9] group-hover:text-[#D1BD85] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
