"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Github, GitBranch, Code2, Network } from "lucide-react";

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

      const res = await fetch("/api/auth/github/login-url");
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
    <main className="min-h-screen bg-[#0d1117] p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center">
        <div className="w-full">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-100">
              GitGraph
            </h1>
            <p className="text-gray-400">
              Explore and visualize your GitHub repositories with AI-powered insights
            </p>
          </div>

          <section className="rounded-xl border border-gray-700 bg-[#161b22] p-8 shadow-xl">
            <h2 className="mb-6 text-center text-xl font-semibold text-gray-100">
              Sign in to get started
            </h2>

            <button
              type="button"
              onClick={startOAuth}
              disabled={loading}
              className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg bg-[#238636] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Github className="h-5 w-5" />
              {loading ? "Redirecting to GitHub..." : "Sign in with GitHub"}
            </button>

            {error && (
              <p className="mb-4 rounded-md border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#161b22] px-2 text-gray-500">
                  What you&apos;ll get
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-gray-300">
                <GitBranch className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                <span>Access to all your GitHub repositories</span>
              </div>
              <div className="flex items-start gap-3 text-gray-300">
                <Network className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
                <span>Interactive project structure visualization</span>
              </div>
              <div className="flex items-start gap-3 text-gray-300">
                <Code2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                <span>AI-generated explanations for files and folders</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
