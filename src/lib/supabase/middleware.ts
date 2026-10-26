import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";
import { evaluateRouteAccess } from "../auth/admin";

/**
 * Updates session cookies and enforces server-side route authorization in Next.js Middleware.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseConfig();
  const pathname = request.nextUrl.pathname;

  // If Supabase credentials are missing or placeholders
  if (!isConfigured) {
    const evaluation = evaluateRouteAccess(pathname, null, false);
    if (evaluation.shouldRedirect && evaluation.redirectTo) {
      const url = request.nextUrl.clone();
      const [redirectPath, query] = evaluation.redirectTo.split("?");
      url.pathname = redirectPath;
      if (query) {
        const searchParams = new URLSearchParams(query);
        searchParams.forEach((val, key) => url.searchParams.set(key, val));
      }
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do NOT use supabase.auth.getSession() in server code as it is insecure.
  // Always use supabase.auth.getUser() to validate the token against Supabase Auth.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const evaluation = evaluateRouteAccess(pathname, user, true);

  if (evaluation.shouldRedirect && evaluation.redirectTo) {
    const url = request.nextUrl.clone();
    const [redirectPath, query] = evaluation.redirectTo.split("?");
    url.pathname = redirectPath;
    if (query) {
      const searchParams = new URLSearchParams(query);
      searchParams.forEach((val, key) => url.searchParams.set(key, val));
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
