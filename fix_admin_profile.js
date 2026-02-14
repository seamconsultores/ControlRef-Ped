
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdmin() {
    console.log("Fixing Admin Profile...");

    const adminEmail = 'eamador@garbersc.com';

    // The clean arrays we want
    const cleanAduanas = ['240', '800', '300', '280', '160', '810'];
    const cleanPatentes = ['1637', '3441', '3834', '3471'];

    // Update
    const { data, error } = await supabase
        .from('profiles')
        .update({
            aduana_access: cleanAduanas, // Supabase client should handle array to JSONB/array conversion
            patente_access: cleanPatentes
        })
        .eq('email', adminEmail)
        .select();

    if (error) {
        console.error("Error updating profile:", error);
    } else {
        console.log("Success! Updated profile:", data);
    }
}

fixAdmin();
