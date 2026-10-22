import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/redirect";

// Optional token-hash links for custom confirmation templates.
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  if (token_hash && request.nextUrl.searchParams.get("type") === "email") {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: "email" });
    if (!error) return NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url), { headers: { "Cache-Control": "private, no-store" } });
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", request.url), { headers: { "Cache-Control": "private, no-store" } });
}
