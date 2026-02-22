import RepositoryVisualizerPage from "./RepositoryVisualizerPage";

type RepositoryPageProps = {
  params: Promise<{ owner: string, repoName: string }>;
};

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { owner, repoName } = await params;

  return <RepositoryVisualizerPage owner={owner} repoName={repoName} />;
}
