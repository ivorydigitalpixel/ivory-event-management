import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";

export function createClient() {
  const store = cookies();
  const { url, key } = supabaseConfig();
  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a page; middleware refreshes */ }
        },
      },
    }
  );
}
