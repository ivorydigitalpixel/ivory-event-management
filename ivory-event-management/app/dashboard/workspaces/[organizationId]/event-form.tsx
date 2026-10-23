"use client";
import { useFormState, useFormStatus } from "react-dom";
import { createEvent, updateEvent } from "./actions";
import { eventTypes, eventStatuses, timeZones, localDateTime } from "@/lib/events/input";

function Submit({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-lg bg-navy px-5 py-3 text-white disabled:opacity-50">{pending ? "Saving…" : editing ? "Save changes" : "Create event"}</button>;
}
type InitialEvent = { id: string; name: string; event_type: string; status: string; venue: string | null; time_zone: string; starts_at: string | null; ends_at: string | null; notes: string | null };
export default function EventForm({ organizationId, event }: { organizationId: string; event?: InitialEvent }) {
  const [state, action] = useFormState(event ? updateEvent.bind(null, organizationId, event.id) : createEvent.bind(null, organizationId), { error: "" });
  const input = "mt-2 block w-full rounded-lg border border-stone-300 bg-white p-3";
  return <form action={action} className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 sm:p-8">
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{state.error}</p>}
    <label className="block">Event name <input name="name" required maxLength={120} defaultValue={event?.name} placeholder="e.g. Emma & James’s Wedding" className={input} /></label>
    <label className="block">Event type <select name="event_type" defaultValue={event?.event_type ?? "wedding"} className={input}>{eventTypes.map(type => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select></label>
    {event && <label className="block">Status <select name="status" defaultValue={event.status} className={input}>{eventStatuses.map(status => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label>}
    <label className="block">Venue <input name="venue" maxLength={240} defaultValue={event?.venue ?? ""} placeholder="Venue or location" className={input} /></label>
    <label className="block">Time zone <select name="time_zone" defaultValue={event?.time_zone ?? "Asia/Bangkok"} className={input}>{timeZones.map(zone => <option key={zone}>{zone}</option>)}</select></label>
    <p className="text-sm text-stone-600">Enter all times in the event’s time zone.</p>
    {event && <p className="text-sm text-stone-600">Changing the time zone keeps the clock times entered below. Check them before saving.</p>}
    <div className="grid gap-5 sm:grid-cols-2">
      <label>Start date and time <input type="datetime-local" name="starts_at" required defaultValue={event ? localDateTime(event.starts_at, event.time_zone) : ""} className={input} /></label>
      <label>End date and time (optional) <input type="datetime-local" name="ends_at" defaultValue={event ? localDateTime(event.ends_at, event.time_zone) : ""} className={input} /></label>
    </div>
    <label className="block">Notes (optional) <textarea name="notes" maxLength={4000} rows={4} defaultValue={event?.notes ?? ""} className={input} /></label>
    <Submit editing={Boolean(event)} />
  </form>;
}
