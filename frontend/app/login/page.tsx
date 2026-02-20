"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (res.ok && data.authenticated) {
          router.replace("/");
        }
      } catch {
        // Ignore and stay on login page.
      }
    }

    checkSession();
  }, [router]);

  async function startOAuth() {
    try {
      setLoading(true);
      setError(null);

      const state = crypto.randomUUID();
      sessionStorage.setItem("github_oauth_state", state);

      const res = await fetch(
        `/api/auth/github/login-url?state=${encodeURIComponent(state)}&scope=${encodeURIComponent("repo read:user")}`,
      );
      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data?.detail || data?.error || "Failed to get GitHub login URL.");
        return;
      }

      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      setError("Failed to start GitHub OAuth.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-start justify-center gap-4 px-6 py-10">
      <h1 className="text-3xl font-semibold text-zinc-950">Login</h1>
      <p className="text-sm text-zinc-600">Sign in with GitHub to load your repositories.</p>
      <button
        type="button"
        onClick={startOAuth}
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Redirecting..." : "Sign in with GitHub"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </main>
  );
}
