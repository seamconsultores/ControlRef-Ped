require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAdminAccount() {
  console.log("Checking admin profile in database...");
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error("Supabase Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Found profiles:", data);
  }
}

checkAdminAccount();
