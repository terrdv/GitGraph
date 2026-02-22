export type GraphNode = {
  id: string;
  name: string;
  path: string;
  file_type: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  type?: string;
  label?: string | null;
};

export type GraphPayload = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type DetailChild = {
  id: string;
  name: string;
  type: "folder" | "file";
};

export type DetailNode = {
  id: string;
  name: string;
  path: string;
  type: "folder" | "file";
  aiExplanation: string;
  children: DetailChild[];
};
