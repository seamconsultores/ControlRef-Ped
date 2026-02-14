
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars. Make sure .env.local contains SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProfiles() {
    console.log("Connecting to Supabase...");
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, role, aduana_access, patente_access')
        .limit(5);

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);
    console.log("Profiles Data Inspection:");
    profiles.forEach(p => {
        console.log(`User: ${p.email} (${p.role})`);
        console.log(`- Aduana Access Type: ${typeof p.aduana_access}`);
        console.log(`- Aduana Access Value:`, p.aduana_access);
        console.log(`- Patente Access Type: ${typeof p.patente_access}`);
        console.log(`- Patente Access Value:`, p.patente_access);
        console.log("---------------------------------------------------");
    });
}

inspectProfiles();
