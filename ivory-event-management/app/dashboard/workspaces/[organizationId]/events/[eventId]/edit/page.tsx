import Link from "next/link";
import { eventAccess } from "@/lib/events/access";
import EventForm from "../../../event-form";

export default async function EditEvent({ params }: { params: { organizationId: string; eventId: string } }) {
  const { event, organization, canManage } = await eventAccess(params.organizationId, params.eventId);
  return <main className="mx-auto max-w-3xl p-5 sm:py-10">
    <Link href={`/dashboard/workspaces/${organization.id}/events/${event.id}`} className="text-sm underline">← Event details</Link>
    <h1 className="mb-6 mt-6 text-3xl font-semibold">Edit event</h1>
    {!canManage ? <p>You do not have permission to edit this event.</p> : event.archived_at ? <p>Restore this event from its details page before editing it.</p> : <EventForm organizationId={organization.id} event={event} />}
  </main>;
}
