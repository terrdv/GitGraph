import { File, Folder, Sparkles } from "lucide-react";
import type { DetailNode } from "./types";

type NodeDetailsProps = {
  node: DetailNode | null;
};

export function NodeDetails({ node }: NodeDetailsProps) {
  if (!node) {
    return (
      <div className="flex h-full w-96 items-center justify-center border-r border-gray-700 bg-[#0d1117] p-6">
        <div className="text-center text-gray-500">
          <Sparkles className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>Select a node to view explanation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-96 overflow-y-auto border-r border-gray-700 bg-[#0d1117] p-6">
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          {node.type === "folder" ? (
            <div className="rounded-lg bg-blue-900/30 p-3">
              <Folder className="h-6 w-6 text-blue-400" />
            </div>
          ) : (
            <div className="rounded-lg bg-purple-900/30 p-3">
              <File className="h-6 w-6 text-purple-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-gray-100">{node.name}</div>
            <div className="truncate text-xs text-gray-500">{node.path || "/"}</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-[#161b22] px-2 py-1 text-xs text-gray-400">
          {node.type === "folder" ? "Directory" : "File"}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h3 className="font-semibold text-gray-100">Explanation</h3>
          </div>
          <p className="text-sm leading-relaxed text-gray-300">{node.aiExplanation}</p>
        </div>

        {node.children.length > 0 && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-100">Contains</h4>
            <div className="space-y-1">
              {node.children.map((child) => (
                <div key={child.id} className="flex items-center gap-2 py-1 text-sm text-gray-400">
                  {child.type === "folder" ? (
                    <Folder className="h-4 w-4 text-blue-400" />
                  ) : (
                    <File className="h-4 w-4 text-purple-400" />
                  )}
                  <span className="truncate">{child.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
