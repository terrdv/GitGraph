import Image from "next/image";
import Link from "next/link";
import type { Repository } from "../data/repositories";

type RepoCardProps = {
  repo: Repository;
};

export function RepoCard({ repo }: RepoCardProps) {
  return (
    <Link
      href={repo.href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
    >
      <div className="relative h-40 w-full border-b border-zinc-200 bg-zinc-100 sm:h-44">
        <Image
          src={repo.thumbnailSrc}
          alt={`${repo.name} repository graph preview`}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 95vw"
          className="object-cover"
          priority={false}
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
            {repo.name}
          </h2>
          <p className="line-clamp-2 text-sm leading-6 text-zinc-600">
            {repo.description}
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {repo.lastUpdated}
          </p>
        </div>

        <span className="mt-auto inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 group-hover:bg-zinc-800">
          Open Repository
        </span>
      </div>
    </Link>
  );
}
