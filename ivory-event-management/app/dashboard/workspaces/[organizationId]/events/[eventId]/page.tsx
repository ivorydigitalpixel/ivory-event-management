import Link from "next/link";
import { notFound } from "next/navigation";
import { workspaceAccess } from "@/lib/events/access";
import { isUuid } from "@/lib/events/input";

export const dynamic = "force-dynamic";
export default async function EventPage({ params }: { params: { organizationId: string; eventId: string } }) {
  const { supabase, organization } = await workspaceAccess(params.organizationId);
  if (!isUuid(params.eventId)) notFound();
  const { data: event, error } = await supabase.from("events").select("id, name, event_type, status, venue, starts_at, ends_at, time_zone, notes").eq("organization_id", organization.id).eq("id", params.eventId).is("archived_at", null).maybeSingle();
  if (error) throw new Error("Unable to load event. Please try again.");
  if (!event) notFound();
  const time = (value: string | null) => value ? new Intl.DateTimeFormat("en-GB", { timeZone: event.time_zone, dateStyle: "full", timeStyle: "short" }).format(new Date(value)) : "To be confirmed";
  return <main className="mx-auto max-w-4xl p-5 sm:py-10">
    <Link href={`/dashboard/workspaces/${organization.id}`} className="text-sm underline">← {organization.name}</Link>
    <p className="mt-8 text-sm uppercase tracking-widest text-stone-600">{event.event_type}</p><h1 className="mt-2 text-3xl font-semibold">{event.name}</h1>
    <p className="my-4 inline-block rounded-full bg-amber-50 px-4 py-1 capitalize text-amber-900">{event.status}</p>
    <dl className="grid gap-6 rounded-xl border border-stone-200 bg-white p-6 sm:grid-cols-2">
      <div><dt className="text-sm text-stone-600">Venue</dt><dd className="mt-1">{event.venue || "To be confirmed"}</dd></div>
      <div><dt className="text-sm text-stone-600">Time zone</dt><dd className="mt-1">{event.time_zone}</dd></div>
      <div><dt className="text-sm text-stone-600">Start</dt><dd className="mt-1">{time(event.starts_at)}</dd></div>
      <div><dt className="text-sm text-stone-600">End</dt><dd className="mt-1">{time(event.ends_at)}</dd></div>
      {event.notes && <div className="sm:col-span-2"><dt className="text-sm text-stone-600">Notes</dt><dd className="mt-1 whitespace-pre-wrap break-words">{event.notes}</dd></div>}
    </dl>
    <div className="mt-6 rounded-xl border border-stone-200 p-6"><h2 className="text-lg font-semibold">Next: plan the event</h2><p className="mt-2 text-stone-600">Task planning and the wedding-day run sheet are coming in a later update.</p></div>
  </main>;
}
