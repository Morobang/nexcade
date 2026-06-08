import { serverSupabase } from "@/lib/supabase-server";

async function getSupabaseStatus() {
  const { data, error } = await serverSupabase.auth.getSession();

  if (error) {
    return {
      status: "Error connecting to Supabase",
      message: error.message,
      session: null,
    };
  }

  return {
    status: "Connected to Supabase",
    message: data.session ? "User session detected." : "No active session.",
    session: data.session,
  };
}

export default async function Home() {
  const connection = await getSupabaseStatus();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">NexCade</h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-300">
          Supabase connection test page for Issue #1. This confirms the Next.js app can reach Supabase from the server.
        </p>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/95 p-8 shadow-2xl shadow-black/40">
          <h2 className="text-2xl font-semibold text-white">Supabase Status</h2>
          <p className="mt-4 text-zinc-200">{connection.status}</p>
          <p className="mt-2 text-sm text-zinc-400">{connection.message}</p>
          {connection.session ? (
            <pre className="mt-6 text-left text-xs text-zinc-300">
              {JSON.stringify({ user: connection.session.user.email, expires_at: connection.session.expires_at }, null, 2)}
            </pre>
          ) : null}
        </div>
      </main>
    </div>
  );
}
