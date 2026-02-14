const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('..', 'CONTROL DE PEDIMENTOS 2026-PATENTE 3834.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get first 10 rows
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null }).slice(0, 10);

    console.log('--- EXCEL ROWS (0-10) ---');
    console.log(JSON.stringify(rows, null, 2));
    console.log('--- END ROWS ---');

} catch (error) {
    console.error('Error reading file:', error.message);
}
