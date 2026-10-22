/** Restrict post-login navigation to local dashboard routes. */
export function safeNext(value: string | null | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/dashboard";
  try {
    const url = new URL(value, "https://app.invalid");
    if (url.origin !== "https://app.invalid" || !(url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/"))) return "/dashboard";
    return url.pathname + url.search + url.hash;
  } catch { return "/dashboard"; }
}
