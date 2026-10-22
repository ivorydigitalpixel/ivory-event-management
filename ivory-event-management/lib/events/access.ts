import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "./input";

export async function workspaceAccess(organizationId: string) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  if (!isUuid(organizationId)) notFound();
  const { data: member, error: memberError } = await supabase.from("organization_members")
    .select("role").eq("organization_id", organizationId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (memberError) throw new Error("Unable to load workspace. Please try again.");
  if (!member) notFound();
  const { data: organization, error: orgError } = await supabase.from("organizations").select("id, name, status").eq("id", organizationId).maybeSingle();
  if (orgError) throw new Error("Unable to load workspace. Please try again.");
  if (!organization || organization.status !== "active") notFound();
  return { supabase, user, organization, canCreate: member.role === "owner" || member.role === "admin" };
}
