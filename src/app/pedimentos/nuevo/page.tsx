import React from 'react';
import PedimentoForm from '@/components/pedimentos/PedimentoForm';
import Sidebar from '@/app/components/Sidebar'; // Importing existing Sidebar for layout context, though ideally should be in layout

export default function NuevoPedimentoPage() {
    return (
        <main className="min-h-screen pl-64 bg-[#f8fafc]">
            <Sidebar />

            {/* Header */}
            <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 block">
                <h1 className="text-xl font-bold text-slate-800">Alta de Pedimentos</h1>
            </header>

            <div className="p-8">
                <PedimentoForm />
            </div>
        </main>
    );
}
