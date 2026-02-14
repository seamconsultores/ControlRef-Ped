/**
 * Generates the full reference string for a pedimento.
 * Format: AA-AAA-PPPP-CNNNNNN
 * 
 * @param year - The 2-digit year (e.g., '24')
 * @param aduana - The 3-digit custom house code (e.g., '240')
 * @param patente - The 4-digit patent number (e.g., '3510')
 * @param consecutivo - The sequential number (e.g., 1234)
 * @returns The formatted reference string (e.g., '24-240-3510-0001234')
 */
const ADUANA_PREFIXES: Record<string, string> = {
    '240': 'DAL', // Nuevo Laredo
    '800': 'DAC', // Colombia
    '300': 'IBR', // Reynosa
    // Fallback logic handled in function
};

export function generateReference(
    year: string,
    aduana: string,
    patente: string, // Kept for interface compatibility but might not be used in prefix
    consecutivo: number,
    tipoOperacion: string = 'IMP'
): string {
    let prefix = ADUANA_PREFIXES[aduana] || `REF-${aduana}`;

    // Lógica especial para EXPORTACIÓN
    if (tipoOperacion === 'EXP') {
        if (aduana === '240') prefix = 'EXL'; // Nuevo Laredo Exportación
        if (aduana === '800') prefix = 'EXC'; // Colombia Exportación
        // Las demás aduanas se quedan pendientes o usan el default
    }

    const paddedConsecutivo = consecutivo.toString().padStart(6, '0');

    // Formato solicitado: PREFIJO-XXXXXX (ej DAL-123456)
    return `${prefix}-${paddedConsecutivo}`;
}

export function isValidReferenceFormat(reference: string): boolean {
    const regex = /^[A-Z]{3}-\d{6}$/;
    return regex.test(reference);
}
