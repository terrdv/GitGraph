CREATE TABLE IF NOT EXISTS repos (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY,
    name TEXT,
    path TEXT,
    file_type TEXT,
    repo_id BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS edges (
    from_node UUID REFERENCES nodes(id) ON DELETE CASCADE,
    to_node UUID REFERENCES nodes(id) ON DELETE CASCADE,
    relationship TEXT,
    repo_id BIGINT REFERENCES repos(id) ON DELETE CASCADE,
    PRIMARY KEY(to_node, from_node)
);
