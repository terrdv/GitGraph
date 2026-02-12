from __future__ import annotations

class Node:
    def __init__(self, name: str, file_type: str, children: list[Node] | None = None):
        self.name = name
        self.file_type = file_type
        self.children = [] if children is None else children

    def add_child(self, node: Node) -> None:
        self.children.append(node)
    
    
