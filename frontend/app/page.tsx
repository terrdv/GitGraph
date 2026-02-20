"use client";

import { RepoCard } from "./components/RepoCard";
import type { GitHubRepository } from "./data/repositories";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const sidebarItems = [
  "Overview",
  "Repositories",
  "Pull Requests",
  "Issues",
  "Deployments",
  "Settings",
];

export default function Home() {
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function loadSessionAndRepos() {
      try {
        setIsCheckingSession(true);
        setError(null);

        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (!sessionRes.ok || !sessionData.authenticated) {
          router.replace("/login");
          return;
        }

        setUsername(typeof sessionData.username === "string" ? sessionData.username : null);
        setIsCheckingSession(false);
        setIsLoading(true);

        const res = await fetch("/api/repo");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (!res.ok) {
          setError(`Failed to fetch repositories: ${res.status} ${res.statusText}`);
          return;
        }

        const data = await res.json();
        setRepos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching repositories:", error);
        setError("Error fetching repositories.");
      } finally {
        setIsCheckingSession(false);
        setIsLoading(false);
      }
    }

    loadSessionAndRepos();
  }, [router]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-b border-zinc-200 bg-zinc-50 px-6 py-8 md:border-b-0 md:border-r md:px-6 md:py-10">
          <div className="mb-10 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
              GG
            </span>
            <span className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              GitGraph
            </span>
          </div>

          <nav aria-label="Sidebar" className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = item === "Repositories";

              return (
                <a
                  key={item}
                  href="#"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950"
                  }`}
                >
                  {item}
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="flex h-20 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 md:px-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Dashboard
            </h1>
            <div className="flex items-center gap-3">
              {username && <p className="text-sm text-zinc-600">{username}</p>}
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Log out
              </button>
            </div>
          </header>

          <main className="flex-1 px-6 py-8 md:px-8 md:py-10">
            <section
              aria-label="Repository grid"
              className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {isCheckingSession && (
                <p className="text-sm font-medium text-zinc-500">Checking session...</p>
              )}

              {isLoading && (
                <p className="text-sm font-medium text-zinc-500">Loading repositories...</p>
              )}

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              {!isLoading && !error && repos.length === 0 && (
                <p className="text-sm font-medium text-zinc-500">No repositories found.</p>
              )}

              {!isLoading &&
                !error &&
                repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
                ))}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
