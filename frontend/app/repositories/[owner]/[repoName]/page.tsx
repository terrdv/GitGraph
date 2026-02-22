import Link from "next/link";

type RepositoryPageProps = {
  params: Promise<{ owner: string, repoName: string }>;
};

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { owner, repoName } = await params;

  return (
    <main className="flex min-h-screen w-full flex-col gap-6 px-6 py-12">
      <Link href="/" className="w-fit rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800">
        Back to Dashboard
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {repoName}
      </h1>
      <p className="max-w-3xl text-base leading-7 text-zinc-600">
        Repository detail pages now open on GitHub from the dashboard cards.
      </p>
    </main>
  );
}

