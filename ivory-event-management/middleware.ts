import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { safeNext } from "@/lib/auth/redirect";

const publicPaths = new Set(["/", "/login", "/auth/callback", "/auth/confirm"]);
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  // Verify with Auth; never authorize using an unverified getSession() result.
  const { data: { user }, error } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname.replace(/\/$/, "") || "/";
  let destination: NextResponse | undefined;
  if ((!user || error) && !publicPaths.has(pathname)) {
    if (pathname.startsWith("/api/")) {
      destination = NextResponse.json({ error: "Authentication required" }, { status: 401 });
    } else {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", safeNext(request.nextUrl.pathname + request.nextUrl.search));
      destination = NextResponse.redirect(login);
    }
  } else if (user && !error && pathname === "/login") {
    destination = NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url));
  }
  if (destination) {
    // Keep session refresh and deletion cookies when changing the response.
    response.cookies.getAll().forEach((cookie) => destination!.cookies.set(cookie));
    response = destination;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
