require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZXlhd25pdGd6a21jZGNwc212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUwMzU0NCwiZXhwIjoyMDg2MDc5NTQ0fQ.Jx97TDJ5cVgq6BlfrjmTA3dGm0CuoH_8m24SUJI88oY',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function resetAndVerifyAdmin() {
  const email = 'eamador@garbersc.com';
  const newPassword = 'Password123!';
  
  console.log(`Resetting password for ${email}...`);
  
  // 1. Get the user ID from auth schema
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }
  
  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.error(`User ${email} not found in auth.users! Checking profiles...`);
     const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('email', email).single();
     if(profile) {
         console.log("Profile exists but no auth user! We need to recreate the auth user.");
         const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: newPassword,
            email_confirm: true,
            user_metadata: { role: 'admin' }
         });
         if(createError) console.error("Error creating:", createError);
         else {
             console.log("Auth user created successfully!", newUser.user.id);
             // link profile to new user ID
             const {error: updateProfileErr } = await supabaseAdmin.from('profiles').update({id: newUser.user.id}).eq('email', email);
             if(updateProfileErr) console.log("Error updating profile ID", updateProfileErr);
             else console.log("Profile linked to new auth ID.");
         }
         return;
     }

    return;
  }

  // 2. Update password
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (error) {
    console.error("Error updating password:", error);
  } else {
    console.log(`Success! Password for ${email} has been reset to: ${newPassword}`);
    
    // 3. Verify login works
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
      email: email,
      password: newPassword
    });
    
    if (loginError) {
      console.error("Test login failed:", loginError);
    } else {
      console.log("Test login SUCCESSFUL!");
    }
  }
}

resetAndVerifyAdmin();
