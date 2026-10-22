"use client";
export default function WorkspaceError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-2xl p-6"><h1 className="text-2xl font-semibold">Unable to load this page</h1><p className="my-4">Please try again. Your saved events are still available when the connection returns.</p><button onClick={reset} className="rounded bg-navy px-4 py-2 text-white">Try again</button></main>;
}
