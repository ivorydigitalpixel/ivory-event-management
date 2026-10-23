"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { workspaceAccess, eventAccess } from "@/lib/events/access";
import { eventStatuses, parseEvent } from "@/lib/events/input";

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

export async function updateEvent(organizationId: string, eventId: string, _state: EventFormState, form: FormData): Promise<EventFormState> {
  const { supabase, event, canManage } = await eventAccess(organizationId, eventId);
  if (!canManage) return { error: "You do not have permission to edit this event." };
  if (event.archived_at) return { error: "Restore this event before editing it." };
  let values;
  try { values = parseEvent(form); }
  catch (error) {
    const code = error instanceof Error ? error.message : "fields";
    return { error: code === "end" ? "End time must be after the start time." : code === "date" ? "Choose a valid date and time outside any skipped or repeated daylight-saving hour." : "Check the event name, type, and field lengths." };
  }
  const status = String(form.get("status") ?? "");
  if (!eventStatuses.includes(status)) return { error: "Choose a valid event status." };
  const { data, error } = await supabase.from("events").update({ ...values, status })
    .eq("organization_id", organizationId).eq("id", eventId).is("archived_at", null).select("id").maybeSingle();
  if (error || !data) return { error: "Unable to update this event. Refresh and try again." };
  revalidatePath(`/dashboard/workspaces/${organizationId}`);
  revalidatePath(`/dashboard/workspaces/${organizationId}/events/${eventId}`);
  redirect(`/dashboard/workspaces/${organizationId}/events/${eventId}?saved=1`);
}

export async function setEventArchive(organizationId: string, eventId: string, _state: EventFormState, form: FormData): Promise<EventFormState> {
  const { supabase, event, canManage } = await eventAccess(organizationId, eventId);
  if (!canManage) return { error: "You do not have permission to archive or restore this event." };
  const operation = String(form.get("operation") ?? "");
  if (operation !== "archive" && operation !== "restore") return { error: "Choose archive or restore." };
  if ((operation === "archive") === Boolean(event.archived_at)) return { error: "This event has changed. Refresh and try again." };
  let query = supabase.from("events").update({ archived_at: operation === "archive" ? new Date().toISOString() : null }).eq("organization_id", organizationId).eq("id", eventId);
  query = operation === "archive" ? query.is("archived_at", null) : query.not("archived_at", "is", null);
  const { data, error } = await query.select("id").maybeSingle();
  if (error || !data) return { error: "Unable to save this change. Refresh and try again." };
  revalidatePath(`/dashboard/workspaces/${organizationId}`);
  revalidatePath(`/dashboard/workspaces/${organizationId}/events/${eventId}`);
  redirect(operation === "archive" ? `/dashboard/workspaces/${organizationId}?archived=1` : `/dashboard/workspaces/${organizationId}/events/${eventId}?restored=1`);
}
