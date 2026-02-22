"use client";

import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { NodeDetails } from "./NodeDetails";
import { ProjectGraph } from "./ProjectGraph";
import type { DetailChild, DetailNode, GraphPayload } from "./types";

type VisualizerViewProps = {
  owner: string;
  repoName: string;
  graph: GraphPayload;
  onBack: () => void;
};

function asDetailType(fileType: string): "folder" | "file" {
  return fileType === "tree" ? "folder" : "file";
}

export function VisualizerView({ owner, repoName, graph, onBack }: VisualizerViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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

  return (
    <div className="flex h-screen flex-col bg-[#0d1117]">
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
    </div>
  );
}
