export function About() {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-neutral-600">About</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Metadata-only biotech trend tracking</h1>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 text-sm leading-7 text-neutral-700 shadow-card">
        <p>
          BioTrend Daily gathers public metadata from selected sources during a GitHub Actions build. The deployed GitHub Pages
          site has no backend, database, or server-side runtime.
        </p>
        <p className="mt-4">
          The pipeline stores titles, links, canonical URLs, dates, snippets, tags, topic buckets, and source status. It does not
          mirror article bodies. If an adapter fails, the site keeps the last successful cached items for that source and marks the
          source health panel accordingly.
        </p>
        <p className="mt-4">
          Tracked PubMed queries and topic rules live in small TypeScript config files so the dashboard stays easy to change without
          editing the UI.
        </p>
      </div>
    </section>
  );
}
