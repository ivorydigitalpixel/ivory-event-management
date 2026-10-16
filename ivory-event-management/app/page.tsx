import Link from "next/link";
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold text-navy">Ivory Event Management</h1>
      <p className="text-gold">Plan Every Event. Manage Every Detail.</p>
      <Link href="/login" className="rounded bg-navy px-6 py-3 text-ivory">Sign in</Link>
    </main>
  );
}
