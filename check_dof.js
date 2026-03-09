const axios = require('axios');
const cheerio = require('cheerio');

const KEYWORDS = ['aduana', 'comercio exterior', 'importación', 'exportación', 'anexo', 'reglas generales', 'sat', 'hacienda', 'decreto', 'resolución', 'fiscal', 'impuesto', 'miscelánea'];

(async () => {
    try {
        const response = await axios.get('https://dof.gob.mx/index.php', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        const $ = cheerio.load(response.data);
        const items = [];
        $('a[href*="nota_detalle.php"]').each((i, el) => {
            const link = $(el);
            const title = link.text().trim();
            items.push(title);
        });
        console.log('Total links found:', items.length);
        const rel = items.filter(title => KEYWORDS.some(k => title.toLowerCase().includes(k)));
        console.log('Relevant:', rel.length, rel);
    } catch(e) { console.error('Error fetching DOF:', e.message); }
})();
