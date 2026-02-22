"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge as FlowEdge,
  type Node as FlowNode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { File, Folder } from "lucide-react";
import type { GraphEdge, GraphNode } from "./types";

type ProjectGraphProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (nodeId: string) => void;
};

type CustomData = {
  label: string;
  kind: "folder" | "file";
  hasChildren: boolean;
  collapsed: boolean;
  onToggle: () => void;
};

function CustomNode({ data }: { data: CustomData }) {
  return (
    <div
      className={`cursor-pointer rounded-lg border-2 px-4 py-3 shadow-sm transition-all hover:shadow-md ${
        data.kind === "folder"
          ? "border-blue-600 bg-[#161b22] hover:border-blue-500"
          : "border-purple-600 bg-[#161b22] hover:border-purple-500"
      }`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        {data.kind === "folder" ? (
          <Folder className="h-4 w-4 text-blue-400" />
        ) : (
          <File className="h-4 w-4 text-purple-400" />
        )}
        <span className="text-sm font-medium text-gray-100">{data.label}</span>
        {data.kind === "folder" && data.hasChildren && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              data.onToggle();
            }}
            className="ml-1 rounded bg-blue-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-blue-200 hover:bg-blue-800/50"
            aria-label={data.collapsed ? "Expand folder" : "Collapse folder"}
            title={data.collapsed ? "Expand folder" : "Collapse folder"}
          >
            {data.collapsed ? "+" : "-"}
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

function rankByDepth(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
  const childrenBySource = new Map<string, string[]>();
  for (const edge of edges) {
    const list = childrenBySource.get(edge.source) ?? [];
    list.push(edge.target);
    childrenBySource.set(edge.source, list);
  }

  const depth = new Map<string, number>();
  depth.set("root", 0);
  const queue = ["root"];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = depth.get(current) ?? 0;
    const children = childrenBySource.get(current) ?? [];
    for (const child of children) {
      if (!depth.has(child)) {
        depth.set(child, currentDepth + 1);
        queue.push(child);
      }
    }
  }

  for (const node of nodes) {
    if (!depth.has(node.id)) {
      depth.set(node.id, 1);
    }
  }

  return depth;
}

export function ProjectGraph({ nodes, edges, onNodeClick }: ProjectGraphProps) {
  const childrenBySource = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const edge of edges) {
      const list = map.get(edge.source) ?? [];
      list.push(edge.target);
      map.set(edge.source, list);
    }
    return map;
  }, [edges]);

  const hasChildren = useCallback(
    (nodeId: string): boolean => (childrenBySource.get(nodeId) ?? []).length > 0,
    [childrenBySource],
  );

  const depthByNodeId = useMemo(() => rankByDepth(nodes, edges), [nodes, edges]);

  const initialCollapsedNodeIds = useMemo(() => {
    const collapsed = new Set<string>();
    for (const node of nodes) {
      if (node.id === "root") continue;
      const isFolder = node.file_type === "tree";
      const isTopLevel = (depthByNodeId.get(node.id) ?? 1) === 1;
      if (isFolder && hasChildren(node.id) && !isTopLevel) {
        collapsed.add(node.id);
      }
    }
    return collapsed;
  }, [nodes, hasChildren, depthByNodeId]);

  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(
    () => new Set(initialCollapsedNodeIds),
  );

  const toggleCollapsed = useCallback((nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const initialFlowNodes = useMemo<FlowNode<CustomData>[]>(() => {
    const depth = rankByDepth(nodes, edges);
    const spacingX = 140;
    const spacingY = 280;

    const layers = new Map<number, GraphNode[]>();
    for (const node of nodes) {
      if (node.id === "root") continue;
      const d = depth.get(node.id) ?? 1;
      const list = layers.get(d) ?? [];
      list.push(node);
      layers.set(d, list);
    }

    const result: FlowNode<CustomData>[] = [];
    const sortedDepths = [...layers.keys()].sort((a, b) => a - b);

    for (const d of sortedDepths) {
      const layer = (layers.get(d) ?? []).sort((a, b) => a.path.localeCompare(b.path));
      const width = (layer.length - 1) * spacingX;
      layer.forEach((node, idx) => {
        result.push({
          id: node.id,
          type: "custom",
          position: {
            x: idx * spacingX - width / 2,
            y: (d - 1) * spacingY,
          },
          data: {
            label: node.name,
            kind: node.file_type === "tree" ? "folder" : "file",
            hasChildren: hasChildren(node.id),
            collapsed: false,
            onToggle: () => toggleCollapsed(node.id),
          },
        });
      });
    }

    return result;
  }, [nodes, edges, hasChildren, toggleCollapsed]);

  const initialFlowEdges = useMemo<FlowEdge[]>(
    () =>
      edges
        .filter((edge) => edge.source !== "root")
        .map((edge, idx) => ({
          id: `${edge.source}-${edge.target}-${idx}`,
          source: edge.source,
          target: edge.target,
          style: { stroke: "#58a6ff", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#58a6ff",
          },
        })),
    [edges],
  );

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode<CustomData>>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  useEffect(() => {
    setFlowNodes(initialFlowNodes);
  }, [initialFlowNodes, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(initialFlowEdges);
  }, [initialFlowEdges, setFlowEdges]);

  const visibleNodeIds = useMemo(() => {
    const visible = new Set<string>();
    const queue = [...(childrenBySource.get("root") ?? [])];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visible.has(current)) continue;
      visible.add(current);

      if (collapsedNodeIds.has(current)) {
        continue;
      }

      const children = childrenBySource.get(current) ?? [];
      queue.push(...children);
    }

    return visible;
  }, [childrenBySource, collapsedNodeIds]);

  useEffect(() => {
    setFlowNodes((current) =>
      current.map((node) => ({
        ...node,
        hidden: !visibleNodeIds.has(node.id),
        data: {
          ...node.data,
          collapsed: collapsedNodeIds.has(node.id),
        },
      })),
    );
    setFlowEdges((current) =>
      current.map((edge) => ({
        ...edge,
        hidden: !visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target),
      })),
    );
  }, [collapsedNodeIds, visibleNodeIds, setFlowNodes, setFlowEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode<CustomData>) => {
      onNodeClick(node.id);
    },
    [onNodeClick],
  );

  if (flowNodes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#0d1117]">
        <div className="text-center text-gray-500">
          <Folder className="mx-auto mb-4 h-16 w-16 opacity-50" />
          <p className="text-lg">No graph nodes found for this repository</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0d1117]">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.7}
        nodesDraggable
        onNodeClick={handleNodeClick}
      >
        <Background color="#30363d" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => ((node.data as CustomData).kind === "folder" ? "#2563eb" : "#9333ea")}
          maskColor="rgba(0, 0, 0, 0.3)"
          className="border border-gray-700 bg-[#161b22]"
        />
      </ReactFlow>
    </div>
  );
}
