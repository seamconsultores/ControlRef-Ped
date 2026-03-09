
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProfiles() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, role, access_aduanas, access_patentes')
        .limit(5);

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log("Profiles Data Inspection:");
    profiles.forEach(p => {
        console.log(`User: ${p.email} (${p.role})`);
        console.log(`- Aduana Access Type: ${typeof p.access_aduanas}`);
        console.log(`- Aduana Access Value:`, p.access_aduanas);
        console.log(`- Patente Access Type: ${typeof p.access_patentes}`);
        console.log(`- Patente Access Value:`, p.access_patentes);
        console.log("---------------------------------------------------");
    });
}

inspectProfiles();
