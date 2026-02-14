const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
require('dotenv').config({ path: envPath });

console.log(`Loading env from: ${envPath}`);

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Missing Supabase credentials in .env.local');
    console.error('URL:', SUPABASE_URL);
    console.error('KEY:', SUPABASE_KEY ? '******' : 'MISSING');
    process.exit(1);
}

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FILE_PATH = path.join(__dirname, '..', 'CONTROL DE PEDIMENTOS 2026-PATENTE 3834.xlsx');

async function importData() {
    console.log('--- STARTING IMPORT ---');

    if (!fs.existsSync(FILE_PATH)) {
        console.error(`File not found: ${FILE_PATH}`);
        return;
    }

    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Row 5 (index 5) is header.
    const rawData = XLSX.utils.sheet_to_json(sheet, { range: 5 });

    console.log(`Found ${rawData.length} rows to process.`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of rawData) {
        try {
            const pedimentoSuffix = row['PEDIMENTO'];
            if (!pedimentoSuffix) continue;

            const yearDigit = '6';
            const aduana = '800';
            const patente = '3834';
            const suffix = String(pedimentoSuffix);

            const fullPedimento = `${yearDigit}${aduana}${patente}${suffix}`;

            const dateValue = row['FECHA'];
            let createdAt = new Date().toISOString();
            if (typeof dateValue === 'number') {
                const jsDate = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
                createdAt = jsDate.toISOString();
            }

            const record = {
                referencia: row['REFERENCIA'],
                aduana: aduana,
                patente: patente,
                numero_pedimento: fullPedimento,
                cliente: row['CLIENTE'] || 'UNKNOWN',
                proveedor: 'IMPORTACION EXCEL',
                tipo_operacion: 'IMP',
                clave_pedimento: 'A1',
                estado: 'VALIDADO',
                created_at: createdAt,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase.from('pedimentos').insert(record);

            if (error) {
                // Handle duplicate errors specifically?
                if (error.code === '23505') { // Unique violation
                    console.log(`Skipping duplicate: ${record.referencia}`);
                } else {
                    console.error(`Error inserting ${record.referencia}:`, error.message);
                    errorCount++;
                }
            } else {
                console.log(`Imported: ${record.referencia} -> ${fullPedimento}`);
                successCount++;
            }

        } catch (err) {
            console.error('Row processing error:', err);
            errorCount++;
        }
    }

    console.log('--- IMPORT COMPLETE ---');
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

importData();
