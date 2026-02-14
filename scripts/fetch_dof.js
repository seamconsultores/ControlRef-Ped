// Desactivar validación SSL para DOF (certificado intermedio faltante o autofirmado)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Palabras clave para filtrar noticias relevantes
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

async function fetchAndProcessNews() {
    console.log(`📡 Conectando al DOF: ${TARGET_URL}...`);

    try {
        const response = await axios.get(TARGET_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive'
            }
        });
        const html = response.data;
        const $ = cheerio.load(html);

        console.log('✅ Página descargada. Analizando contenido...');

        let newCount = 0;
        let skipCount = 0;
        const items = [];

        // Buscar enlaces a notas de detalle
        // La estructura típica del DOF tiene enlaces como: nota_detalle.php?codigo=...
        $('a[href*="nota_detalle.php"]').each((i, el) => {
            const link = $(el);
            const title = link.text().trim();
            let href = link.attr('href'); // url relativa o absoluta

            // Validar que tenga título y sea una nota real
            if (title && title.length > 20) {
                // Si es relativa y no empieza con http, agregar dominio
                if (href && !href.startsWith('http')) {
                    href = `https://dof.gob.mx/${href}`;
                }

                items.push({
                    title: title,
                    link: href
                });
            }
        });

        console.log(`📝 Total de notas encontradas en portada: ${items.length}`);

        for (const item of items) {
            // 1. Filtrado por palabras clave
            const textToSearch = item.title.toLowerCase();
            const isRelevant = KEYWORDS.some(keyword => textToSearch.includes(keyword));

            if (!isRelevant) {
                continue;
            }

            // 2. Formateo de datos
            const newsData = {
                source: 'DOF',
                title: item.title,
                date_str: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }), // Fecha de hoy (portada)
                category: textToSearch.includes('fiscal') ? 'fiscal' : 'operativo',
                color_class: textToSearch.includes('fiscal') ? 'bg-emerald-700' : 'bg-blue-600',
                active: true,
                link: item.link
            };

            // 3. Deduplicación (verificar si ya existe por título)
            const { data: existing } = await supabase
                .from('noticias')
                .select('id')
                .eq('title', newsData.title)
                .single();

            if (existing) {
                // Si existe, intentamos actualizar el link por si acaso estaba vacío
                if (item.link) {
                    const { error: updateError } = await supabase
                        .from('noticias')
                        .update({ link: item.link })
                        .eq('id', existing.id);

                    if (!updateError) {
                        console.log(`🔄 Link actualizado: ${item.title.substring(0, 30)}...`);
                    }
                } else {
                    console.log(`🔁 Ya existe: ${item.title.substring(0, 50)}...`);
                }
                skipCount++;
                continue;
            }

            // 4. Inserción
            const { error: insertError } = await supabase
                .from('noticias')
                .insert([newsData]);

            if (insertError) {
                console.error(`❌ Error al insertar "${newsData.title}":`, insertError.message);
            } else {
                console.log(`💾 Guardada: ${newsData.title.substring(0, 40)}...`);
                newCount++;
            }
        }

        console.log('------------------------------------------------');
        console.log(`📊 Resumen:`);
        console.log(`   Nuevas guardadas: ${newCount}`);
        console.log(`   Duplicados omitidos: ${skipCount}`);
        console.log('------------------------------------------------');

    } catch (error) {
        console.error('❌ Error crítico en el script:', error);
    }
}

// Ejecutar
fetchAndProcessNews();
