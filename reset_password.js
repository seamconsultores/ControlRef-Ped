require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
    try {
        console.log('Verificando conexión maestra con Supabase...');
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        
        if (error) {
            console.error('Error FATAL - Base de datos no responde (Probablemente Pausada):', error.message);
            return;
        }
        
        console.log(`Base de datos activa. Buscando a eamador@garbersc.com entre los ${users.length} usuarios...`);
        const myUser = users.find(u => u.email === 'eamador@garbersc.com');
        
        if (myUser) {
            console.log('Usuario encontrado. Forzando nueva contraseña temporal: Garber2026!');
            const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                myUser.id,
                { password: 'Garber2026!' }
            );
            
            if (updateError) {
                console.error('Error cambiando contraseña:', updateError.message);
            } else {
                console.log('\n======================================================');
                console.log('✅ ÉXITO. TU PASSWORD FUE RESETEADO A: Garber2026!');
                console.log('======================================================\n');
            }
        } else {
            console.log('No pudimos encontrar el correo registrado en la base de datos.');
        }
    } catch (err) {
        console.error('Fallo de Red:', err.message);
    }
})();
