import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    let session = null;
    try {
        const {
            data: { session: existingSession },
        } = await supabase.auth.getSession();
        session = existingSession;
    } catch (error) {
        // If the session is invalid (e.g. refresh token not found), we treat it as no session.
        // This prevents the application from crashing.
        console.error("Middleware Session Error:", error);
        session = null;
    }

    // Rutas protegidas
    const protectedPaths = ['/dashboard', '/pedimentos', '/admin', '/sellos'];
    const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

    if (isProtected && !session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        // Match all protected routes and login
        '/dashboard/:path*',
        '/pedimentos/:path*',
        '/admin/:path*',
        '/sellos/:path*',
        '/login',
        // Exclude static files, images, etc.
        // '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
