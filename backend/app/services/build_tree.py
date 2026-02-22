from app.schemas.node import Edge
from app.schemas.node import GraphPayload
from app.schemas.node import Node

IGNORED_DIRS = {
    ".git",
    ".github",
    ".vscode",
    ".idea",
    "node_modules",
    "dist",
    "build",
    "coverage",
    "__pycache__",
    "public",
    "assets",
}

IGNORED_EXTENSIONS = {
    ".md",
    ".markdown",
    ".json",
    ".yaml",
    ".yml",
    ".mjs",
    ".cjs",
}

IGNORED_FILENAMES = {
    "readme",
    "license",
    "changelog",
    "contributing",
    "code_of_conduct",
    "next.config",
    "vite.config",
    "webpack.config",
    "rollup.config",
    "postcss.config",
    "tailwind.config",
    "eslint.config",
    "babel.config",
    "jest.config",
    "vitest.config",
    "tsconfig",
    "jsconfig",
}


def should_include_path(path: str) -> bool:
    parts = [part for part in path.split("/") if part]
    if not parts:
        return False

    lowered_parts = [part.lower() for part in parts]
    if any(part in IGNORED_DIRS for part in lowered_parts):
        return False

    basename = lowered_parts[-1]

    # Ignore dotfiles (.gitignore, .env, etc.)
    if basename.startswith("."):
        return False

    # Ignore known non-code files such as README, LICENSE, etc.
    stem = basename.split(".", 1)[0]
    if stem in IGNORED_FILENAMES:
        return False

    if ".config." in basename:
        return False

    extension = ""
    if "." in basename:
        extension = "." + basename.rsplit(".", 1)[1]
    if extension in IGNORED_EXTENSIONS:
        return False

    return True


def build_tree(tree_data: list[dict]) -> GraphPayload:
    nodes_by_path: dict[str, Node] = {}
    edges: list[Edge] = []
    edge_keys: set[tuple[str, str]] = set()

    # Root node for graph consumers that need a single entry point.
    root = Node(id="root", name="root", path="", file_type="tree")
    nodes_by_path[""] = root

    def ensure_node(path: str, file_type: str) -> Node:
        existing = nodes_by_path.get(path)
        if existing:
            # Preserve directories if we first discovered path as "tree".
            if existing.file_type != "tree" and file_type == "tree":
                nodes_by_path[path] = Node(
                    id=existing.id,
                    name=existing.name,
                    path=existing.path,
                    file_type="tree",
                )
            return nodes_by_path[path]

        name = "root" if path == "" else path.split("/")[-1]
        node = Node(id=path or "root", name=name, path=path, file_type=file_type)
        nodes_by_path[path] = node
        return node

    def add_edge(parent: Node, child: Node) -> None:
        key = (parent.id, child.id)
        if key in edge_keys:
            return
        edge_keys.add(key)
        edges.append(Edge(source=parent.id, target=child.id))

    for item in tree_data:
        path = item.get("path", "")
        if not path:
            continue
        if not should_include_path(path):
            continue

        leaf_type = item.get("type", "blob")
        parts = path.split("/")

        parent_node = root
        for idx in range(len(parts)):
            current_path = "/".join(parts[: idx + 1])
            is_leaf = idx == len(parts) - 1
            current_type = leaf_type if is_leaf else "tree"

            child_node = ensure_node(current_path, current_type)
            add_edge(parent_node, child_node)
            parent_node = child_node

    return GraphPayload(nodes=list(nodes_by_path.values()), edges=edges)
