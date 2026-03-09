'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
    try {
        const supabase = await createClient();

        // 1. Check if current user is admin
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            return { success: false, message: 'No sesión activa. Recarga la página.' };
        }

        // Double check role in DB
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile || profile.role !== 'admin') {
            return { success: false, message: 'No autorizado. Se requiere rol de Administrador.' };
        }

        // 2. Extract data
        const email = formData.get('email') as string;
        const password = formData.get('password') as string; // From form
        const fullName = formData.get('fullName') as string;
        const role = formData.get('role') as string;

        // Extract arrays (we expect JSON strings or multiple values, let's treat them as JSON strings for simplicity in transport from client)
        const aduanaRaw = formData.get('aduana') as string;
        const patenteRaw = formData.get('patente') as string;

        let aduanaArray: string[] = [];
        let patenteArray: string[] = [];

        try {
            if (aduanaRaw) aduanaArray = JSON.parse(aduanaRaw);
            if (patenteRaw) patenteArray = JSON.parse(patenteRaw);
        } catch (e) {
            console.error("Error parsing arrays:", e);
        }

        if (!email || !password || !fullName || !role) {
            return { success: false, message: 'Todos los campos básicos son obligatorios.' };
        }

        // 3. Create user using Admin Client
        // Ensure env var exists
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return { success: false, message: 'Falta configuración del servidor (SERVICE_ROLE_KEY).' };
        }

        const supabaseAdmin = createAdminClient();

        // 1. Create User (Minimal Metadata)
        // We will NOT rely on the trigger. We will insert the profile manually.
        // This avoids all PL/PGSQL JSON parsing issues.
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: role
            }
        });

        if (createError) {
            console.error('Error creating user/auth:', createError);
            return {
                success: false,
                message: `Error Auth: ${createError.message} (Code: ${createError.status || 'N/A'})`
            };
        }

        if (userData.user) {
            // 2. Insert Profile Manually (The "Nuclear Option")
            // This replaces the need for the trigger.
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: userData.user.id,
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                    role: role,
                    access_aduanas: aduanaArray,
                    access_patentes: patenteArray
                });

            if (profileError) {
                console.error('Error inserting profile:', profileError);
                // Try to rollback auth user if profile creation fails?
                // For now, just return error. Admin can delete user manually or retry update.
                return { success: false, message: 'Usuario creado en Auth, pero error al crear perfil: ' + profileError.message };
            }
        }

        revalidatePath('/admin/users');
        return { success: true, message: 'Usuario creado exitosamente.' };
    } catch (globalError: any) {
        console.error("CRASH creating user:", globalError);
        return {
            success: false,
            message: `Error Inesperado del Servidor: ${globalError.message || 'Desconocido'}`
        };
    }
}

export async function updateUser(formData: FormData) {
    const supabase = createClient();

    // 1. Check permissions
    const { data: { session } } = await (await supabase).auth.getSession();
    if (!session) return { success: false, message: 'No sesión.' };

    const { data: adminProfile } = await (await supabase)
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (!adminProfile || adminProfile.role !== 'admin') {
        return { success: false, message: 'No tienes permisos de administrador.' };
    }

    // 2. Extract Data
    const userId = formData.get('userId') as string;
    const fullName = formData.get('fullName') as string;
    const role = formData.get('role') as string;
    const password = formData.get('password') as string; // Optional

    const aduanaRaw = formData.get('aduana') as string;
    const patenteRaw = formData.get('patente') as string;

    let aduanaArray: string[] = [];
    let patenteArray: string[] = [];
    try {
        if (aduanaRaw) aduanaArray = JSON.parse(aduanaRaw);
        if (patenteRaw) patenteArray = JSON.parse(patenteRaw);
    } catch (e) { }

    if (!userId || !fullName || !role) {
        return { success: false, message: 'Faltan datos obligatorios.' };
    }

    const supabaseAdmin = createAdminClient();

    // 3. Update Auth Metadata (Best practice to keep sync, and update password if needed)
    const updateData: any = {
        user_metadata: {
            full_name: fullName,
            role: role,
            access_aduanas: aduanaArray,
            access_patentes: patenteArray
        }
    };
    if (password && password.trim().length > 0) {
        updateData.password = password;
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);

    if (authError) {
        console.error('Error updating auth:', authError);
        return { success: false, message: 'Error actualizando credenciales: ' + authError.message };
    }

    // 4. Update Profiles Table (The app source of truth)
    // Although triggers might handle this, explicit update helps ensure consistency if triggers fail or are for INSERT only.
    // Our handle_new_user is for INSERT. We need to update existing.
    // We can do this via RLS if policies allow, but since we are in server action with admin client or authenticated admin...
    // Let's use standard client with RLS (Role 'admin' can update).

    // NOTE: Arrays in FormData might need clearer handling, but here we have them parsed.
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const { error: dbError } = await supabaseAdmin
        .from('profiles')
        .update({
            first_name: firstName,
            last_name: lastName,
            role: role,
            access_aduanas: aduanaArray,
            access_patentes: patenteArray,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (dbError) {
        console.error('Error updating profile:', dbError);
        return { success: false, message: 'Error actualizando perfil: ' + dbError.message };
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuario actualizado correctamente.' };
}

export async function getUsers() {
    const supabase = createClient();
    const { data: profiles, error } = await (await supabase)
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }
    return profiles;
}
