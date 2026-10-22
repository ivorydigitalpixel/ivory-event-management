import Link from "next/link";
import { workspaceAccess } from "@/lib/events/access";
import EventForm from "../event-form";

export default async function NewEvent({ params }: { params: { organizationId: string } }) {
  const { organization, canCreate } = await workspaceAccess(params.organizationId);
  return <main className="mx-auto max-w-3xl p-5 sm:py-10">
    <Link href={`/dashboard/workspaces/${organization.id}`} className="text-sm underline">← {organization.name}</Link>
    <h1 className="mt-6 text-3xl font-semibold">Create an event</h1>
    <p className="mb-6 mt-2 text-stone-600">Start with the details. Your event will be saved as a draft.</p>
    {canCreate ? <EventForm organizationId={organization.id} /> : <p>Ask a workspace owner or admin to create your event.</p>}
  </main>;
}
