from dataclasses import asdict, dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class CollectionMetadata:
    """Metadata attached to a repo-scoped embedding collection."""

    repo_id: str
    last_updated: str
    ingestion_version: str = "v1"

    @classmethod
    def create(cls, repo_id: str, ingestion_version: str = "v1") -> "CollectionMetadata":
        return cls(
            repo_id=repo_id,
            last_updated=datetime.now(timezone.utc).isoformat(),
            ingestion_version=ingestion_version,
        )

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class NodeMetadata:
    """Metadata attached to each embedded chunk."""

    repo_id: str
    node_uuid: str
    node_path: str
    file_type: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)
