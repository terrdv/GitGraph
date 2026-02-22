"use client";

import { useRouter } from "next/navigation";
import type { GitHubRepository } from "../data/repositories";

type RepoCardProps = {
  repo: GitHubRepository;
};

export function RepoCard({ repo }: RepoCardProps) {
  const router = useRouter();
  const updatedDate = new Date(repo.updated_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <button
      type="button"
      onClick={() => router.push(`/repositories/${repo.owner.login}/${repo.name}`)}
      className="group flex h-full w-full cursor-pointer appearance-none flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-6 py-4">
        <p className="text-sm font-medium text-zinc-700">{repo.owner.login}</p>
        <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-semibold text-white">
          {repo.private ? "Private" : "Public"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
            {repo.full_name}
          </h2>
          <p className="line-clamp-2 text-sm leading-6 text-zinc-600">
            {repo.description ?? "No description provided."}
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Updated {updatedDate}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-4 text-xs font-medium text-zinc-500">
          <span>Stars {repo.stargazers_count}</span>
          <span>Forks {repo.forks_count}</span>
          <span>{repo.language ?? "Unknown language"}</span>
        </div>

        <span className="mt-auto inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 group-hover:bg-zinc-800">
          Open Repository
        </span>
      </div>
    </button>
  );
}
