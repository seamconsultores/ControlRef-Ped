
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const inputFilePath = 'c:\\Users\\eamad\\Documents\\Antigravity Proyectos\\Control de Pedimentos y Referencias\\CONTROL_PATENTE 3834.xlsx';
const outputFilePath = 'c:\\Users\\eamad\\Documents\\Antigravity Proyectos\\Control de Pedimentos y Referencias\\control-pedimentos\\data_import_3834.json';

// Helper to convert Excel date to ISO string
function excelDateToJSDate(serial) {
    if (!serial || isNaN(serial)) return null;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString();
}

try {
    const workbook = XLSX.readFile(inputFilePath);
    const result = {
        pedimentos: [],
        referencias: [],
        asignaciones: []
    };

    // --- PROCESAR PEDIMENTOS (HOJAS GARBER) ---
    const pedimentoSheets = [
        { name: 'GARBER NLD- 240', aduana: '240', year: '26' },
        { name: 'GARBER COL- 800', aduana: '800', year: '26' }
    ];

    pedimentoSheets.forEach(config => {
        const sheet = workbook.Sheets[config.name];
        if (!sheet) return;

        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        // Buscar encabezado real (aprox fila 3 o 4)
        let startIndex = -1;
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const row = data[i];
            if (row && (row.includes('PEDIMENTO') || row.includes('REFERENCIA'))) {
                startIndex = i + 1;
                break;
            }
        }

        if (startIndex !== -1) {
            for (let i = startIndex; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                // Estructura probable: [PEDIMENTO, FECHA, REFERENCIA, CLIENTE]
                // Ajustar índices según observación previa
                // 'GARBER COL- 800': [ 6000001, 46024, 'DAL-182959', 'MOLDES Y PLASTICOS' ]

                const pedimentoSeq = row[0];
                const fechaSerial = row[1];
                const referencia = row[2];
                const cliente = row[3];

                if (referencia && String(referencia).includes('-')) {
                    // Validar pedimento
                    let numero_pedimento = null;
                    if (pedimentoSeq) {
                        // Construir formato AA-AAA-PPPP-NNNNNNN
                        // Asumimos que pedimentoSeq son los 7 dígitos (ej: 6000001)
                        // Si no, lo construimos: digito año + 6 digitos seq
                        // En este caso parece que YA trae el digito del año (6xxxxxx para 2026?)
                        // Ojo: 2026 -> ultimo digito 6. Si es 6000001, coincide.
                        const seqStr = String(pedimentoSeq);
                        numero_pedimento = `${config.year}-${config.aduana}-3834-${seqStr}`;
                    }

                    result.pedimentos.push({
                        referencia: String(referencia).trim(),
                        numero_pedimento: numero_pedimento,
                        aduana: config.aduana,
                        patente: '3834',
                        cliente: cliente ? String(cliente).trim() : 'SIN CLIENTE',
                        fecha_creacion: excelDateToJSDate(fechaSerial),
                        origen: config.name
                    });
                }
            }
        }
    });

    // --- PROCESAR REFERENCIAS GENERALES ---
    const refSheetName = 'CONTROL DE REFERENCIAS 2026';
    const refSheet = workbook.Sheets[refSheetName];
    if (refSheet) {
        const data = XLSX.utils.sheet_to_json(refSheet, { header: 1 });
        let startIndex = -1;
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const row = data[i];
            if (row && row.includes('REFERENCIA')) {
                startIndex = i + 1;
                break;
            }
        }

        if (startIndex !== -1) {
            for (let i = startIndex; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                // [REFERENCIA, FECHA, CLIENTE, PEDIMENTO, NOTAS]
                const referencia = row[0];
                const fechaSerial = row[1];
                const cliente = row[2];

                if (referencia) {
                    result.referencias.push({
                        referencia: String(referencia).trim(),
                        cliente: cliente ? String(cliente).trim() : null,
                        fecha_creacion: excelDateToJSDate(fechaSerial)
                    });
                }
            }
        }
    }

    // --- PROCESAR ASIGNACIONES / SEGMENTOS ---
    const assignSheets = ['ASIGNA 240 OFICINAS', 'ASIGNA 800 OFICINAS'];
    assignSheets.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;

        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let startIndex = -1;
        // Search header
        for (let i = 0; i < Math.min(data.length, 20); i++) {
            const row = data[i];
            if (row && row.includes('OFICINA') && row.includes('SERIE')) {
                startIndex = i + 1;
                break;
            }
        }

        if (startIndex !== -1) {
            for (let i = startIndex; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                // [OFICINA, SERIE, empty, NOTA]
                const oficina = row[0];
                const serie = row[1];
                const nota = row[3] || row[4]; // Sometimes logic varies

                if (oficina && serie) {
                    result.asignaciones.push({
                        aduana: sheetName.includes('240') ? '240' : '800',
                        oficina: String(oficina).trim(),
                        serie_rango: String(serie).trim(),
                        nota: nota ? String(nota).trim() : null
                    });
                }
            }
        }
    });

    fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));
    console.log(`Extracción completada con Asignaciones. Datos guardados en: ${outputFilePath}`);
    console.log(`Pedimentos: ${result.pedimentos.length}`);
    console.log(`Referencias: ${result.referencias.length}`);
    console.log(`Asignaciones: ${result.asignaciones.length}`);

} catch (error) {
    console.error('Error procesando archivo:', error);
}
