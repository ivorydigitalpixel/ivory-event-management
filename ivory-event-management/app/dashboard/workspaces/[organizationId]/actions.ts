"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { workspaceAccess } from "@/lib/events/access";
import { parseEvent } from "@/lib/events/input";

export type EventFormState = { error: string };
export async function createEvent(organizationId: string, _state: EventFormState, form: FormData): Promise<EventFormState> {
  const { supabase, user, canCreate } = await workspaceAccess(organizationId);
  if (!canCreate) return { error: "Only workspace owners and admins can create events in this version." };
  let values;
  try { values = parseEvent(form); }
  catch (error) {
    const code = error instanceof Error ? error.message : "fields";
    return { error: code === "end" ? "End time must be after the start time." : code === "date" ? "Choose a valid date and time. If the clocks change that day, choose a time outside the skipped or repeated hour." : "Check the event name, type, and field lengths." };
  }
  const id = randomUUID();
  // The SELECT policy checks the stored event through can_see_event(). Read it
  // in the next request, after the INSERT transaction is committed.
  const { error } = await supabase.from("events").insert({ ...values, id, organization_id: organizationId, created_by: user.id, status: "draft" });
  if (error) return { error: "Unable to save your event. Please try again." };
  revalidatePath(`/dashboard/workspaces/${organizationId}`);
  redirect(`/dashboard/workspaces/${organizationId}/events/${id}`);
}
