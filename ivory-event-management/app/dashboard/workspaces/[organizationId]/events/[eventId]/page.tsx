import Link from "next/link";
import { eventAccess } from "@/lib/events/access";
import ArchiveControl from "../../archive-control";

export const dynamic = "force-dynamic";
export default async function EventPage({ params, searchParams }: { params: { organizationId: string; eventId: string }; searchParams: { saved?: string; restored?: string } }) {
  const { event, organization, canManage } = await eventAccess(params.organizationId, params.eventId);
  const time = (value: string | null) => value ? new Intl.DateTimeFormat("en-GB", { timeZone: event.time_zone, dateStyle: "full", timeStyle: "short" }).format(new Date(value)) : "To be confirmed";
  return <main className="mx-auto max-w-4xl p-5 sm:py-10">
    <Link href={`/dashboard/workspaces/${organization.id}`} className="text-sm underline">← {organization.name}</Link>
    {searchParams.saved === "1" && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-green-900">Event changes saved.</p>}
    {searchParams.restored === "1" && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-green-900">Event restored.</p>}
    {event.archived_at && <p className="mt-4 rounded-lg bg-stone-100 p-3">This event is archived.</p>}
    <p className="mt-8 text-sm uppercase tracking-widest text-stone-600">{event.event_type}</p><h1 className="mt-2 text-3xl font-semibold">{event.name}</h1>
    <p className="my-4 inline-block rounded-full bg-amber-50 px-4 py-1 capitalize text-amber-900">{event.status}</p>
    {canManage && <div className="mb-5 flex flex-wrap items-start gap-3">{!event.archived_at && <Link href={`/dashboard/workspaces/${organization.id}/events/${event.id}/edit`} className="rounded-lg bg-navy px-4 py-2 text-white">Edit event</Link>}<ArchiveControl organizationId={organization.id} eventId={event.id} archived={Boolean(event.archived_at)} /></div>}
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
