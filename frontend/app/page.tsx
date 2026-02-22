"use client";

import type { GitHubRepository } from "./data/repositories";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Github, Link2, Clock, Star, GitFork, Eye, Search } from "lucide-react";

const RECENT_REPOS_KEY = "gitgraph_recent_repos";

export default function Home() {
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [recentRepoKeys, setRecentRepoKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    const raw = localStorage.getItem(RECENT_REPOS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setRecentRepoKeys(
          parsed.filter((item): item is string => typeof item === "string").slice(0, 6),
        );
      }
    } catch {
      // Ignore malformed storage.
    }
  }, []);

  function toRepoKey(repo: GitHubRepository): string {
    return `${repo.owner.login}/${repo.name}`;
  }

  function onSelectRepo(repo: GitHubRepository) {
    const repoKey = toRepoKey(repo);
    setRecentRepoKeys((prev) => {
      const next = [repoKey, ...prev.filter((item) => item !== repoKey)].slice(0, 6);
      localStorage.setItem(RECENT_REPOS_KEY, JSON.stringify(next));
      return next;
    });
    router.push(`/repositories/${repo.owner.login}/${repo.name}`);
  }

  function handleUrlSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUrlError(null);

    const value = urlInput.trim();
    if (!value) return;

    try {
      const parsed = new URL(value);
      if (!/^(www\.)?github\.com$/i.test(parsed.hostname)) {
        setUrlError("Please enter a valid GitHub repository URL.");
        return;
      }

      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments.length < 2) {
        setUrlError("Repository URL must look like github.com/owner/repository.");
        return;
      }

      const owner = segments[0];
      const repoName = segments[1].replace(/\.git$/, "");
      setUrlInput("");
      router.push(`/repositories/${owner}/${repoName}`);
    } catch {
      setUrlError("Please enter a valid URL.");
    }
  }

  const filteredRepos = repos.filter((repo) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      repo.name.toLowerCase().includes(query) ||
      (repo.description ?? "").toLowerCase().includes(query)
    );
  });

  const recentRepos = recentRepoKeys
    .map((key) => repos.find((repo) => toRepoKey(repo) === key))
    .filter((repo): repo is GitHubRepository => Boolean(repo));

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="sticky top-0 z-10 border-b border-gray-700 bg-[#161b22]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-100">GitGraph</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-700 bg-[#0d1117] text-xs font-semibold text-gray-300">
              {(username ?? "GG").slice(0, 2).toUpperCase()}
            </span>
            <span className="text-sm text-gray-300">{username ?? "GitHub User"}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-gray-700 bg-[#0d1117] px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-[#1c2128]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-100">
            <Link2 className="h-5 w-5 text-blue-400" />
            Import Repository by URL
          </h2>
          <form onSubmit={handleUrlSubmit} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="flex-1 rounded-lg border border-gray-700 bg-[#161b22] px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#238636] px-6 py-3 font-medium text-white transition-colors hover:bg-[#2ea043]"
            >
              Import
            </button>
          </form>
          {urlError && <p className="mt-3 text-sm text-red-300">{urlError}</p>}
        </section>

        {recentRepos.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-100">
              <Clock className="h-5 w-5 text-purple-400" />
              Recently Viewed
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentRepos.map((repo) => (
                <RepoButtonCard key={repo.id} repo={repo} onClick={() => onSelectRepo(repo)} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100">
              <Github className="h-5 w-5 text-green-400" />
              Your Repositories
              <span className="ml-1 text-sm font-normal text-gray-500">({repos.length})</span>
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repositories..."
                className="w-full rounded-lg border border-gray-700 bg-[#161b22] py-2 pl-10 pr-4 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
              />
            </div>
          </div>

          {(isCheckingSession || isLoading) && (
            <p className="py-8 text-sm text-gray-400">
              {isCheckingSession ? "Checking session..." : "Loading repositories..."}
            </p>
          )}

          {error && <p className="py-2 text-sm text-red-300">{error}</p>}

          {!isCheckingSession && !isLoading && !error && filteredRepos.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <Github className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>No repositories found matching &quot;{searchQuery}&quot;</p>
            </div>
          )}

          {!isCheckingSession && !isLoading && !error && filteredRepos.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRepos.map((repo) => (
                <RepoButtonCard key={repo.id} repo={repo} onClick={() => onSelectRepo(repo)} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function RepoButtonCard({ repo, onClick }: { repo: GitHubRepository; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-lg border border-gray-700 bg-[#161b22] p-5 text-left transition-all hover:border-gray-600 hover:bg-[#1c2128]"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate font-semibold text-blue-400 group-hover:text-blue-300">
            {repo.name}
          </h3>
          <p className="text-xs text-gray-500">{repo.owner.login}</p>
        </div>
        <div className="ml-3 flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 stroke-yellow-400" />
            {repo.stargazers_count}
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {repo.forks_count}
          </div>
        </div>
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-gray-400">
        {repo.description ?? "No description provided."}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
          <span className="text-xs text-gray-500">{repo.language ?? "Unknown"}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Eye className="h-3 w-3" />
          {repo.watchers_count ?? repo.stargazers_count}
        </div>
      </div>
    </button>
  );
}
