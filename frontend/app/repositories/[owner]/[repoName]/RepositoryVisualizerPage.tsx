"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VisualizerView } from "./VisualizerView";
import type { GraphPayload } from "./types";

type RepositoryVisualizerPageProps = {
  owner: string;
  repoName: string;
};

export default function RepositoryVisualizerPage({
  owner,
  repoName,
}: RepositoryVisualizerPageProps) {
  const router = useRouter();
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ingestionTriggered, setIngestionTriggered] = useState(false);
  const ingestionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setIngestionTriggered(false);
    ingestionKeyRef.current = null;
  }, [owner, repoName]);

  useEffect(() => {
    async function loadRepoGraph() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(
          `/api/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`,
        );

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (!res.ok) {
          setError(`Failed to fetch repository graph: ${res.status} ${res.statusText}`);
          return;
        }

        const data = (await res.json()) as GraphPayload;
        if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
          setError("Invalid graph payload returned by server.");
          return;
        }

        setGraph(data);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Failed to load repository graph.");
      } finally {
        setIsLoading(false);
      }
    }

    loadRepoGraph();
  }, [owner, repoName, router]);

  useEffect(() => {
    if (!graph || ingestionTriggered) {
      return;
    }

    async function triggerIngestion() {
      const ingestionKey = `${owner}/${repoName}`;
      if (ingestionKeyRef.current === ingestionKey) {
        return;
      }
      ingestionKeyRef.current = ingestionKey;

      try {
        const res = await fetch("/api/ingestion/repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner,
            repo: repoName,
            graph,
          }),
        });

        if (!res.ok) {
          console.error(`Failed to trigger ingestion: ${res.status} ${res.statusText}`);
          ingestionKeyRef.current = null;
          return;
        }

        setIngestionTriggered(true);
      } catch (ingestError) {
        console.error("Failed to trigger ingestion:", ingestError);
        ingestionKeyRef.current = null;
      }
    }

    triggerIngestion();
  }, [graph, ingestionTriggered, owner, repoName]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d1117] px-6 text-gray-300">
        Loading repository graph...
      </main>
    );
  }

  if (error || !graph) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0d1117] px-6 text-gray-300">
        <p>{error ?? "Unable to load repository graph."}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-lg border border-gray-700 bg-[#161b22] px-4 py-2 text-sm font-medium text-gray-200 hover:bg-[#1c2128]"
        >
          Back to Dashboard
        </button>
      </main>
    );
  }

  return <VisualizerView owner={owner} repoName={repoName} graph={graph} onBack={() => router.push("/")} />;
}
