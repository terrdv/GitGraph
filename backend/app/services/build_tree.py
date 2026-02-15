
from app.schemas.node import Node

def build_tree(tree_data):
    root = Node(name="root", file_type="tree", children=[])

    for item in tree_data:

        path = item["path"]
        path_parts = path.split("/")
        current_node = root
        for part in path_parts:
            # Check if the part already exists as a child
            existing_child = next((child for child in current_node.children if child.name == part), None)

            if existing_child is None:
                # If it doesn't exist, create a new node
                new_node = Node(name=part, file_type=item["type"], children=[])
                current_node.add_child(new_node)
                current_node = new_node
            else:
                # If it exists, move to that node
                current_node = existing_child
    
    return root

