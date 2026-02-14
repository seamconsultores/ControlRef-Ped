'use server';

import { createClient } from '@/lib/supabase/server';
import { generateReference } from '@/lib/utils/reference';
import type { PedimentoFormData } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function createPedimento(formData: PedimentoFormData, userId: string = '00000000-0000-0000-0000-000000000000') {
    const supabase = await createClient();
    try {
        const year = new Date().getFullYear().toString().slice(-2);

        // 1. Obtener Consecutivo de REFERENCIA (Por Aduana, indistintamente de Patente)
        // Usaremos una "patente virtual" llamada 'REF' para agrupar el consecutivo de la aduana
        let consecutivoRef: number;
        let consecutivoPed: number;
        let isSimulation = false;

        try {
            // A. Consecutivo Referencia (Por Aduana)
            const { data: dataRef, error: errRef } = await supabase.rpc('obtener_siguiente_consecutivo', {
                p_anio: year,
                p_aduana: formData.aduana,
                p_patente: 'REF' // Virtual patent for references
            });
            if (errRef) throw errRef;

            // B. Consecutivo Pedimento (Por Patente)
            const { data: dataPed, error: errPed } = await supabase.rpc('obtener_siguiente_consecutivo', {
                p_anio: year,
                p_aduana: formData.aduana,
                p_patente: formData.patente
            });
            if (errPed) throw errPed;

            if (dataRef === null || dataPed === null) throw new Error('Consecutivos nulos');

            consecutivoRef = dataRef;
            consecutivoPed = dataPed;

        } catch (err: any) {
            console.warn("⚠️ Error conectando a Supabase. Activando MODO CONTINGENCIA LOCAL.", err.message);
            isSimulation = true;
            // MODO CONTINGENCIA: Usamos timestamp para minimizar duplicados localmente
            // Esto permite trabajar sin conexión, aunque no sincroniza con otros usuarios.
            const now = Date.now();
            consecutivoRef = Math.floor(now % 1000000); // Últimos 6 dígitos del tiempo
            consecutivoPed = Math.floor((now / 100) % 1000000); // Desplazamiento para variar
        }

        // 2. Generar Referencia
        // Prefijos Dinámicos: DAL/EXL (Laredo), DAC/EXC (Colombia), IBR (Reynosa)
        const referencia = generateReference(year, formData.aduana, formData.patente, consecutivoRef, formData.tipo_operacion);

        // 3. Generar numero_pedimento oficial (Por Patente)
        // Formato solicitado: AA-AAA-PPPP-NNNNNNN
        // Donde NNNNNNN (7 dígitos) inicia con el último dígito del año (A) + 6 dígitos consecutivos

        const lastDigitYear = year.slice(-1);
        const consecutivoPedStr = consecutivoPed.toString().padStart(6, '0'); // 6 dígitos del contador
        const bloqueConsecutivo = `${lastDigitYear}${consecutivoPedStr}`; // Total 7 dígitos (ej: 6000123)

        const numero_pedimento = `${year}-${formData.aduana}-${formData.patente}-${bloqueConsecutivo}`;

        // 4. Insertar Pedimento (o simular)
        if (!isSimulation) {
            const { error: insertError } = await supabase
                .from('pedimentos')
                .insert({
                    referencia,
                    aduana: formData.aduana,
                    patente: formData.patente,
                    numero_pedimento,
                    cliente: formData.cliente,
                    proveedor: formData.proveedor,
                    tipo_operacion: formData.tipo_operacion,
                    clave_pedimento: formData.clave_pedimento,
                    caja: formData.caja,
                    placas: formData.placas,
                    es_inbond: formData.es_inbond,
                    usuario_id: userId,
                    estado: 'BORRADOR'
                });

            if (insertError) throw new Error(`Error insertando pedimento: ${insertError.message}`);
        }

        revalidatePath('/pedimentos/historial');
        revalidatePath('/');

        return {
            success: true,
            data: { referencia, numero_pedimento },
            message: isSimulation
                ? `(MODO LOCAL) Generado: Ref ${referencia} / Ped ${numero_pedimento}`
                : `Pedimento generado exitosamente.`
        };

    } catch (error: any) {
        console.error('SERVER ACTION ERROR:', error);
        return {
            success: false,
            message: error.message || 'Error desconocido al crear pedimento'
        };
    }
}
