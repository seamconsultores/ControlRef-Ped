
const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'c:\\Users\\eamad\\Documents\\Antigravity Proyectos\\Control de Pedimentos y Referencias\\CONTROL_PATENTE 3834.xlsx';
const workbook = XLSX.readFile(filePath);

const targetSheets = ['GARBER COL- 800', 'GARBER NLD- 240', 'CONTROL DE REFERENCIAS 2026', 'ASIGNA 800 OFICINAS', 'ASIGNA 240 OFICINAS'];

targetSheets.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    console.log(`\n--- Analizando Hoja: ${sheetName} ---`);
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Look for a row that looks like a header
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
        const row = jsonData[i];
        if (row && (
            row.includes('PEDIMENTO') ||
            row.includes('REFERENCIA') ||
            row.includes('CLIENTE') ||
            row.includes('RANGO')
        )) {
            headerRowIndex = i;
            console.log(`Encabezado encontrado en fila ${i}:`, row);
            break;
        }
    }

    if (headerRowIndex !== -1 && jsonData.length > headerRowIndex + 1) {
        console.log('Primera fila de datos:', jsonData[headerRowIndex + 1]);
        console.log('Ultima fila de datos:', jsonData[jsonData.length - 1]);
    } else {
        console.log('No se detectó fila de encabezado clara en las primeras 20 filas.');
        console.log('Primeras 5 filas:', jsonData.slice(0, 5));
    }
});
