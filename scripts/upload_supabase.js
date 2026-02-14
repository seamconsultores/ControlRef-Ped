
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Falta configuración en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadData() {
    const jsonPath = path.join(__dirname, '..', 'data_import_3834.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ No encuentro el archivo data_import_3834.json');
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`📦 Cargando datos: ${rawData.referencias.length} referencias base, ${rawData.pedimentos.length} pedimentos detallados.`);

    // 1. Unificar Datos (Merge)
    // Usamos la Referencia como clave única
    const registrosMap = new Map();

    // A. Cargar Referencias Base (Hoja CONTROL DE REFERENCIAS)
    rawData.referencias.forEach(ref => {
        registrosMap.set(ref.referencia, {
            referencia: ref.referencia,
            cliente: ref.cliente || 'SIN CLIENTE',
            fecha_creacion: ref.fecha_creacion || new Date().toISOString(),
            aduana: '240', // Default para referencias si no se especifica, se corregirá con pedimentos
            patente: '3834',
            estado: 'HISTORICO',
            origen_importacion: 'EXCEL_HISTORICO'
        });
    });

    // B. Mezclar Pedimentos (Hojas GARBER) -> Estos tienen prioridad y más detalles
    rawData.pedimentos.forEach(ped => {
        const existing = registrosMap.get(ped.referencia) || {};
        registrosMap.set(ped.referencia, {
            ...existing,
            referencia: ped.referencia, // Asegurar
            aduana: ped.aduana,
            patente: ped.patente,
            numero_pedimento: ped.numero_pedimento,
            cliente: ped.cliente || existing.cliente,
            fecha_creacion: ped.fecha_creacion || existing.fecha_creacion,
            origen_importacion: 'EXCEL_DETALLE'
        });
    });

    const finalArray = Array.from(registrosMap.values());
    console.log(`✨ Total registros únicos a insertar: ${finalArray.length}`);

    // 2. Insertar en Lotes (Batches) de 100 para no saturar
    const BATCH_SIZE = 100;
    let insertedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < finalArray.length; i += BATCH_SIZE) {
        const batch = finalArray.slice(i, i + BATCH_SIZE);

        const { error } = await supabase
            .from('pedimentos')
            .upsert(batch, { onConflict: 'referencia' });

        if (error) {
            console.error(`❌ Error en lote ${i}:`, error.message);
            errorCount += batch.length;
        } else {
            insertedCount += batch.length;
            process.stdout.write(`\r✅ Progreso: ${insertedCount} / ${finalArray.length} subidos...`);
        }
    }

    console.log('\n\n🏁 IMPORTACIÓN FINALIZADA');
    console.log(`✅ Exitosos: ${insertedCount}`);
    console.log(`❌ Fallidos: ${errorCount}`);
}

uploadData();
