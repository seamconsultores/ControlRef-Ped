
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('🔍 Verificando datos en Supabase...');

    const { data, error } = await supabase
        .from('pedimentos')
        .select('*')
        .limit(5);

    if (error) {
        console.error('❌ Error query:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.warn('⚠️ La tabla está vacía.');
        return;
    }

    console.log('✅ Mostrando 5 registros de muestra:');
    data.forEach((p, i) => {
        console.log(`[${i}] Ref: ${p.referencia} | Cliente: ${p.cliente} | FechaCreacion: ${p.fecha_creacion} | CreatedAt: ${p.created_at}`);
    });
}

checkData();
