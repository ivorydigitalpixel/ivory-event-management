"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { setEventArchive } from "./actions";

function Submit({ archived }: { archived: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-lg border border-stone-400 px-4 py-2 disabled:opacity-50">{pending ? "Saving…" : archived ? "Restore event" : "Confirm archive"}</button>;
}
export default function ArchiveControl({ organizationId, eventId, archived }: { organizationId: string; eventId: string; archived: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action] = useFormState(setEventArchive.bind(null, organizationId, eventId), { error: "" });
  if (!archived && !confirming) return <button type="button" onClick={() => setConfirming(true)} className="rounded-lg border border-stone-300 px-4 py-2">Archive event</button>;
  return <form action={action} className="space-y-3 rounded-lg bg-stone-50 p-4">
    <input type="hidden" name="operation" value={archived ? "restore" : "archive"} />
    <p>{archived ? "Restore this event to your active event list." : "Archive this event? It will move to Archived events. You can restore it later."}</p>
    {state.error && <p role="alert" className="text-red-800">{state.error}</p>}
    <div className="flex flex-wrap gap-3"><Submit archived={archived} />{!archived && <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-4 py-2 underline">Cancel</button>}</div>
  </form>;
}
