"use client";
import { useFormState, useFormStatus } from "react-dom";
import { createEvent } from "./actions";
import { eventTypes, timeZones } from "@/lib/events/input";

function Submit() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-lg bg-navy px-5 py-3 text-white disabled:opacity-50">{pending ? "Saving…" : "Create event"}</button>;
}
export default function EventForm({ organizationId }: { organizationId: string }) {
  const [state, action] = useFormState(createEvent.bind(null, organizationId), { error: "" });
  const input = "mt-2 block w-full rounded-lg border border-stone-300 bg-white p-3";
  return <form action={action} className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 sm:p-8">
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{state.error}</p>}
    <label className="block">Event name <input name="name" required maxLength={120} placeholder="e.g. Emma & James’s Wedding" className={input} /></label>
    <label className="block">Event type <select name="event_type" defaultValue="wedding" className={input}>{eventTypes.map(type => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select></label>
    <label className="block">Venue <input name="venue" maxLength={240} placeholder="Venue or location" className={input} /></label>
    <label className="block">Time zone <select name="time_zone" defaultValue="Asia/Bangkok" className={input}>{timeZones.map(zone => <option key={zone}>{zone}</option>)}</select></label>
    <p className="text-sm text-stone-600">Enter all times in the event’s time zone.</p>
    <div className="grid gap-5 sm:grid-cols-2">
      <label>Start date and time <input type="datetime-local" name="starts_at" required className={input} /></label>
      <label>End date and time (optional) <input type="datetime-local" name="ends_at" className={input} /></label>
    </div>
    <label className="block">Notes (optional) <textarea name="notes" maxLength={4000} rows={4} className={input} /></label>
    <Submit />
  </form>;
}
