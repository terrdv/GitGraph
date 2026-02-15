export type Repository = {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  href: string;
  thumbnailSrc: string;
};

export const repositories: Repository[] = [
  {
    id: "atlas-core",
    name: "atlas/core",
    description:
      "AI-generated insight pipeline for commit graph summarization and dependency-aware release notes.",
    lastUpdated: "Updated 3 hours ago",
    href: "/repositories/atlas-core",
    thumbnailSrc: "/repo-graph-1.svg",
  },
  {
    id: "beacon-ui",
    name: "beacon/ui",
    description:
      "Design-system workspace with automated visual diffs and component health signals from pull requests.",
    lastUpdated: "Updated yesterday",
    href: "/repositories/beacon-ui",
    thumbnailSrc: "/repo-graph-2.svg",
  },
  {
    id: "delta-agent",
    name: "delta/agent",
    description:
      "Agent runtime orchestration for multi-step codebase analysis and safe autonomous refactor workflows.",
    lastUpdated: "Updated 2 days ago",
    href: "/repositories/delta-agent",
    thumbnailSrc: "/repo-graph-3.svg",
  },
  {
    id: "kernel-api",
    name: "kernel/api",
    description:
      "Typed API platform with schema drift detection, synthetic traffic replay, and contract scorecards.",
    lastUpdated: "Updated 5 days ago",
    href: "/repositories/kernel-api",
    thumbnailSrc: "/repo-graph-1.svg",
  },
  {
    id: "nova-infra",
    name: "nova/infra",
    description:
      "Infrastructure-as-code monorepo with AI-assisted incident timelines and rollout anomaly clustering.",
    lastUpdated: "Updated 1 week ago",
    href: "/repositories/nova-infra",
    thumbnailSrc: "/repo-graph-2.svg",
  },
  {
    id: "quartz-mobile",
    name: "quartz/mobile",
    description:
      "Cross-platform mobile client optimized for offline sync, edge caching, and telemetry compression.",
    lastUpdated: "Updated 2 weeks ago",
    href: "/repositories/quartz-mobile",
    thumbnailSrc: "/repo-graph-3.svg",
  },
];
