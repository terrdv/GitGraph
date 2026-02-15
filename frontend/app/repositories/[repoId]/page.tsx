import Link from "next/link";
import { repositories } from "../../data/repositories";

type RepositoryPageProps = {
  params: Promise<{ repoId: string }>;
};

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { repoId } = await params;
  const repo = repositories.find((item) => item.id === repoId);

  if (!repo) {
    return (
      <main className="flex min-h-screen w-full flex-col items-start justify-center gap-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Repository not found
        </h1>
        <Link href="/" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col gap-6 px-6 py-12">
      <Link href="/" className="w-fit rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800">
        Back to Dashboard
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {repo.name}
      </h1>
      <p className="max-w-3xl text-base leading-7 text-zinc-600">{repo.description}</p>
      <p className="text-sm font-medium text-zinc-500">{repo.lastUpdated}</p>
    </main>
  );
}

