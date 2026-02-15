import { RepoCard } from "./components/RepoCard";
import { repositories } from "./data/repositories";

const sidebarItems = [
  "Overview",
  "Repositories",
  "Pull Requests",
  "Issues",
  "Deployments",
  "Settings",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-b border-zinc-200 bg-zinc-50 px-6 py-8 md:border-b-0 md:border-r md:px-6 md:py-10">
          <div className="mb-10 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
              GG
            </span>
            <span className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              GitGraph
            </span>
          </div>

          <nav aria-label="Sidebar" className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = item === "Repositories";

              return (
                <a
                  key={item}
                  href="#"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950"
                  }`}
                >
                  {item}
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="flex h-20 items-center border-b border-zinc-200 bg-zinc-50 px-6 md:px-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Dashboard
            </h1>
          </header>

          <main className="flex-1 px-6 py-8 md:px-8 md:py-10">
            <section
              aria-label="Repository grid"
              className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {repositories.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

