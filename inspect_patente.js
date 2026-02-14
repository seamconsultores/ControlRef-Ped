
const XLSX = require('xlsx');
const fs = require('fs');

// Path to the file
const filePath = 'c:\\Users\\eamad\\Documents\\Antigravity Proyectos\\Control de Pedimentos y Referencias\\CONTROL_PATENTE 3834.xlsx';

try {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log('--- Resumen del Archivo Excel ---');
    console.log(`Nombre del archivo: CONTROL_PATENTE 3834.xlsx`);
    console.log(`Hojas encontradas: ${sheetNames.join(', ')}`);
    console.log('-----------------------------------');

    sheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to JSON to see headers and first row
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length > 0) {
            console.log(`\nHoja: "${sheetName}"`);
            console.log(`Filas totales (aprox): ${jsonData.length}`);

            // Get headers (first row usually)
            const headers = jsonData[0];
            console.log('Encabezados detectados:', headers);

            // Show first 3 data rows
            console.log('Primeras 3 filas de datos:');
            for (let i = 1; i < Math.min(jsonData.length, 4); i++) {
                console.log(`Fila ${i}:`, jsonData[i]);
            }
        } else {
            console.log(`\nHoja: "${sheetName}" est está vacía.`);
        }
    });

} catch (error) {
    console.error('Error leyendo el archivo Excel:', error.message);
}
