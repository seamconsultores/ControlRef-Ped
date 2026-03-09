require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const KEYWORDS = ['aduana', 'comercio exterior', 'importación', 'exportación', 'anexo', 'reglas generales', 'sat', 'hacienda', 'decreto', 'resolución', 'fiscal', 'impuesto', 'miscelánea'];

(async () => {
    try {
        console.log('Fetching DOF...');
        const agent = new https.Agent({ rejectUnauthorized: false });
        const res = await axios.get('https://dof.gob.mx/index.php', { httpsAgent: agent, timeout: 15000 });
        const $ = cheerio.load(res.data);
        const items = [];
        $('a[href*="nota_detalle.php"]').each((i, el) => {
            const link = $(el);
            const title = link.text().trim();
            if (title && title.length > 20) items.push({ title, link: link.attr('href') });
        });
        
        console.log('Got links:', items.length);
        let count = 0;
        for (const item of items) {
            const textToSearch = item.title.toLowerCase();
            if (KEYWORDS.some(k => textToSearch.includes(k))) {
                const isFiscal = textToSearch.includes('fiscal');
                 await supabaseAdmin.from('noticias').insert([{
                    source: 'DOF', fuente: 'DOF', title: item.title, titulo: item.title,
                    date_str: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
                    category: isFiscal ? 'fiscal' : 'operativo',
                    color_class: isFiscal ? 'bg-emerald-700' : 'bg-blue-600',
                    active: true, link: item.link
                }]);
                count++;
            }
        }
        console.log('Done inserted', count);
    } catch(e) { console.error('Error:', e.message); }
})();
