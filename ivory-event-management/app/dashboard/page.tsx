import { createWorkspace, signOut } from "./actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold text-navy">Your workspaces</h1>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm">{user.email}</p>
        <form action={signOut}><button className="rounded border px-3 py-2">Sign out</button></form>
      </div>
      {(error || searchParams.error) && <p role="alert" className="mb-4 text-sm">{searchParams.error === "name" ? "Enter a workspace name between 1 and 120 characters." : searchParams.error === "signout" ? "Unable to sign out. Please try again." : "Unable to load or save your workspace. Please try again."}</p>}
      <ul className="mb-6 space-y-2">
        {(memberships ?? []).filter((m: any) => m.organizations).map((m: any) => (
          <li key={m.organizations.id} className="rounded border bg-white p-3">
            <Link href={`/dashboard/workspaces/${m.organizations.id}`} className="block hover:underline">{m.organizations.name} <span className="text-sm text-gold">({m.role})</span><span className="mt-2 block text-sm">Open workspace →</span></Link>
          </li>
        ))}
        {!error && (memberships ?? []).length === 0 && <li>No workspace yet. Create your first one below.</li>}
      </ul>
      <form action={createWorkspace} className="flex gap-2">
        <input required maxLength={120} aria-label="Company name" name="name" placeholder="Company name" className="flex-1 rounded border p-2" />
        <button className="rounded bg-navy px-4 text-ivory">Create</button>
      </form>
    </main>
  );
}
