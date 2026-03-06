"use client";

import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { NodeDetails } from "./NodeDetails";
import { ProjectGraph } from "./ProjectGraph";
import type { DetailChild, DetailNode, GraphPayload } from "./types";

type VisualizerViewProps = {
  owner: string;
  repoName: string;
  graph: GraphPayload;
  ingestionStatus: "idle" | "running" | "success" | "error";
  ingestionProgress: number;
  onBack: () => void;
};

function asDetailType(fileType: string): "folder" | "file" {
  return fileType === "tree" ? "folder" : "file";
}

export function VisualizerView({
  owner,
  repoName,
  graph,
  ingestionStatus,
  ingestionProgress,
  onBack,
}: VisualizerViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);

  const nodeById = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes],
  );

  const childrenById = useMemo(() => {
    const map = new Map<string, DetailChild[]>();
    for (const edge of graph.edges) {
      if (edge.source === "root") continue;
      const child = nodeById.get(edge.target);
      if (!child) continue;
      const list = map.get(edge.source) ?? [];
      list.push({ id: child.id, name: child.name, type: asDetailType(child.file_type) });
      map.set(edge.source, list);
    }
    return map;
  }, [graph.edges, nodeById]);

  const selectedNode = useMemo<DetailNode | null>(() => {
    if (!selectedNodeId) return null;
    const node = nodeById.get(selectedNodeId);
    if (!node) return null;
    const kind = asDetailType(node.file_type);
    const children = childrenById.get(node.id) ?? [];

    return {
      id: node.id,
      name: node.name,
      path: node.path,
      type: kind,
      children,
      aiExplanation:
        kind === "folder"
          ? `This directory groups ${children.length} direct item(s) and organizes related source files under ${node.path || "/"} .`
          : `This file appears at ${node.path}. Select it to inspect structure context and run deeper analysis.`,
    };
  }, [selectedNodeId, nodeById, childrenById]);

  const statusLabel =
    ingestionStatus === "running"
      ? "Ingesting"
      : ingestionStatus === "success"
        ? "Ingestion Complete"
        : ingestionStatus === "error"
          ? "Ingestion Failed"
          : "Pending Ingestion";

  const statusColor =
    ingestionStatus === "success"
      ? "bg-emerald-500"
      : ingestionStatus === "error"
        ? "bg-red-500"
        : "bg-blue-500";

  async function submitChatQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query || isAsking) return;

    setIsAsking(true);
    setIsThinking(true);
    setChatMessages((prev) => [...prev, { role: "user", text: query }]);
    setChatInput("");

    try {
      const res = await fetch(
        `/api/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        setChatMessages((prev) => [...prev, { role: "assistant", text: `Error: ${errorText}` }]);
        setIsThinking(false);
        return;
      }

      if (!res.body) {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Error: Empty chat stream response." },
        ]);
        setIsThinking(false);
        return;
      }

      setChatMessages((prev) => [...prev, { role: "assistant", text: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let hasAnyToken = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        if (!hasAnyToken) {
          setIsThinking(false);
          hasAnyToken = true;
        }

        setChatMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (!last || last.role !== "assistant") {
            next.push({ role: "assistant", text: chunk });
            return next;
          }
          next[next.length - 1] = { ...last, text: `${last.text}${chunk}` };
          return next;
        });
      }

      if (!hasAnyToken) {
        setIsThinking(false);
        setChatMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant" && !last.text) {
            next[next.length - 1] = { ...last, text: "No response returned." };
          }
          return next;
        });
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error: Failed to reach chat endpoint." },
      ]);
      setIsThinking(false);
    } finally {
      setIsAsking(false);
      setIsThinking(false);
    }
  }

  return (
    <div className="relative flex h-screen flex-col bg-[#0d1117]">
      <header className="border-b border-gray-700 bg-[#161b22]">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 transition-colors hover:text-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
            <div className="flex flex-1 items-center gap-3">
              <div className="h-6 w-px bg-gray-700" />
              <div>
                <h2 className="text-lg font-semibold text-blue-400">{repoName}</h2>
                <p className="text-xs text-gray-500">{owner}</p>
              </div>
            </div>
            <div className="w-56">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-gray-300">{statusLabel}</span>
                <span className="text-gray-500">{Math.round(ingestionProgress)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-700">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${statusColor} ${
                    ingestionStatus === "running" ? "animate-pulse" : ""
                  }`}
                  style={{ width: `${Math.min(ingestionProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <NodeDetails node={selectedNode} />
        <ProjectGraph
          nodes={graph.nodes}
          edges={graph.edges}
          onNodeClick={(nodeId) => setSelectedNodeId(nodeId)}
        />
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 w-[26rem]">
        <div className="pointer-events-auto rounded-lg border border-gray-700 bg-[#11161d]/95 shadow-xl backdrop-blur">
          <div className="border-b border-gray-700 px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-100">Repo Chat</h3>
          </div>
          <div className="max-h-64 overflow-y-auto px-4 py-3">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-gray-500">Ask about architecture, files, or dependencies.</p>
            ) : (
              <div className="space-y-2">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={`${msg.role}-${idx}`}
                    className={`rounded-md px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "ml-8 bg-blue-500/15 text-blue-100"
                        : "mr-8 bg-gray-800 text-gray-200"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            )}
            {isThinking && (
              <div className="mr-8 mt-2 rounded-md bg-gray-800 px-3 py-2 text-sm text-gray-200">
                <span className="animate-pulse">...</span>
              </div>
            )}
          </div>
          <form onSubmit={submitChatQuestion} className="border-t border-gray-700 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this repository..."
                className="flex-1 rounded-md border border-gray-600 bg-[#0d1117] px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
                disabled={isAsking}
              />
              <button
                type="submit"
                disabled={isAsking || !chatInput.trim()}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAsking ? "..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
