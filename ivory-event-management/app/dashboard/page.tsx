import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function createWorkspace(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const supabase = createClient();
  await supabase.rpc("create_organization", { org_name: name });
  redirect("/dashboard");
}

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name)")
    .eq("user_id", user.id);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold text-navy">Your workspaces</h1>
      <ul className="mb-6 space-y-2">
        {(memberships ?? []).map((m: any) => (
          <li key={m.organizations.id} className="rounded border bg-white p-3">
            {m.organizations.name} <span className="text-sm text-gold">({m.role})</span>
          </li>
        ))}
        {(memberships ?? []).length === 0 && <li>No workspace yet. Create your first one below.</li>}
      </ul>
      <form action={createWorkspace} className="flex gap-2">
        <input name="name" placeholder="Company name" className="flex-1 rounded border p-2" />
        <button className="rounded bg-navy px-4 text-ivory">Create</button>
      </form>
    </main>
  );
}
