"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWorkspace(formData: FormData) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const name = String(formData.get("name") || "").trim();
  if (!name || name.length > 120) redirect("/dashboard?error=name");
  const { error } = await supabase.rpc("create_organization", { org_name: name });
  if (error) redirect("/dashboard?error=workspace");
  redirect("/dashboard");
}
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect("/dashboard?error=signout");
  redirect("/login");
}
