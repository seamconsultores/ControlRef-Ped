import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Force dynamic to avoid caching this route
export const dynamic = 'force-dynamic';

const KEYWORDS = [
    'aduana',
    'comercio exterior',
    'importación',
    'exportación',
    'anexo',
    'reglas generales',
    'sat',
    'hacienda',
    'decreto',
    'resolución',
    'fiscal',
    'impuesto',
    'miscelánea'
];

const TARGET_URL = 'https://dof.gob.mx/index.php';

export async function GET() {
    console.log('📡 Iniciando actualización de noticias DOF...');

    try {
        // Usar permisos de Administrador para que el Servidor pueda registrar las noticias sin bloqueo RLS.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch HTML
        const https = require('https');
        const agent = new https.Agent({  
          rejectUnauthorized: false
        });

        const response = await axios.get(TARGET_URL, {
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        const items: any[] = [];

        // 2. Parse Links
        $('a[href*="nota_detalle.php"]').each((i: number, el: any) => {
            const link = $(el);
            const title = link.text().trim();
            let href = link.attr('href');

            if (title && title.length > 20) {
                if (href && !href.startsWith('http')) {
                    href = `https://dof.gob.mx/${href}`;
                }
                items.push({ title, link: href });
            }
        });

        let newCount = 0;
        let skipCount = 0;

        // 3. Process Items
        for (const item of items) {
            const textToSearch = item.title.toLowerCase();
            const isRelevant = KEYWORDS.some(keyword => textToSearch.includes(keyword));

            if (!isRelevant) continue;

            const newsData = {
                source: 'DOF',
                fuente: 'DOF',        // Para la tabla antigua
                title: item.title,
                titulo: item.title,   // Para evitar el constraint NOT NULL
                date_str: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
                category: textToSearch.includes('fiscal') ? 'fiscal' : 'operativo',
                color_class: textToSearch.includes('fiscal') ? 'bg-emerald-700' : 'bg-blue-600',
                active: true,
                link: item.link
            };

            // Check duplicate
            const { data: existing } = await supabaseAdmin
                .from('noticias')
                .select('id')
                .eq('title', newsData.title)
                .single();

            if (existing) {
                // Update link if needed
                if (item.link) {
                    await supabaseAdmin.from('noticias').update({ link: item.link }).eq('id', existing.id);
                }
                skipCount++;
            } else {
                // Insert
                await supabaseAdmin.from('noticias').insert([newsData]);
                newCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Actualización completada. Nuevas: ${newCount}, Omitidas: ${skipCount}`,
            stats: { newCount, skipCount }
        });

    } catch (error: any) {
        console.error('❌ Error updating news:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
