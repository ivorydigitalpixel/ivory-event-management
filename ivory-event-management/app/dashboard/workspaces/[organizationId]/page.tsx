import Link from "next/link";
import { workspaceAccess } from "@/lib/events/access";

export const dynamic = "force-dynamic";
export default async function Workspace({ params }: { params: { organizationId: string } }) {
  const { supabase, organization, canCreate } = await workspaceAccess(params.organizationId);
  const { data: events, error } = await supabase.from("events").select("id, name, event_type, status, venue, starts_at, time_zone").eq("organization_id", organization.id).is("archived_at", null).order("starts_at", { ascending: true });
  return <main className="mx-auto max-w-5xl p-5 sm:py-10">
    <Link href="/dashboard" className="text-sm underline">← Your workspaces</Link>
    <div className="my-7 flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-stone-600">WORKSPACE</p><h1 className="text-3xl font-semibold">{organization.name}</h1></div>
      {canCreate && <Link href={`/dashboard/workspaces/${organization.id}/new`} className="rounded-lg bg-navy px-5 py-3 text-white">Create event</Link>}
    </div>
    <h2 className="mb-4 text-xl font-semibold">Your events</h2>
    {error ? <p role="alert">Unable to load events. Please refresh and try again.</p> : events?.length ? <ul className="grid gap-4 sm:grid-cols-2">{events.map(event => <li key={event.id}>
      <Link href={`/dashboard/workspaces/${organization.id}/events/${event.id}`} className="block h-full rounded-xl border border-stone-200 bg-white p-5 hover:border-gold focus-visible:outline-gold">
        <div className="mb-3 flex justify-between gap-3 text-sm"><span className="capitalize text-stone-600">{event.event_type}</span><span className="rounded-full bg-amber-50 px-3 py-1 capitalize text-amber-900">{event.status}</span></div>
        <h3 className="text-xl font-semibold">{event.name}</h3><p className="mt-2 text-stone-600">{event.venue || "Venue to be confirmed"}</p>
        <p className="mt-3 text-sm">{event.starts_at ? new Intl.DateTimeFormat("en-GB", { timeZone: event.time_zone, dateStyle: "medium", timeStyle: "short" }).format(new Date(event.starts_at)) : "Date to be confirmed"}</p><p className="text-xs text-stone-500">{event.time_zone}</p>
      </Link></li>)}</ul> : <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center"><h3 className="text-lg font-semibold">Your first event starts here</h3><p className="mt-2 text-stone-600">{canCreate ? "Click Create event to add your wedding or event details." : "You will see events here when your team assigns you."}</p></div>}
  </main>;
}
