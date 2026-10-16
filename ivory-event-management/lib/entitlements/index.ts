import { createClient } from "@/lib/supabase/server";

/** Server-side check: has this organization bought AND is the module released? */
export async function hasModule(organizationId: string, slug: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("has_module", { org: organizationId, module: slug });
  return !error && data === true;
}
