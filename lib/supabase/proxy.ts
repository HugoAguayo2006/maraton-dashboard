import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

const protectedRoutes = [
  "/dashboard",
  "/plan",
  "/workouts",
  "/progress",
  "/settings",
  "/onboarding",
];

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isSupabaseConfigured()) {
    if (isProtected) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("setup", "required");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseConfig();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  function redirectWithSession(target: URL) {
    const redirectResponse = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (isProtected && !userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return redirectWithSession(loginUrl);
  }

  if (pathname === "/login" && userId) {
    return redirectWithSession(new URL("/dashboard", request.url));
  }

  return response;
}
