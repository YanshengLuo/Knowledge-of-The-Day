const githubRepositoryUrl = import.meta.env.VITE_GITHUB_REPOSITORY_URL || 'https://github.com/';

const tools = [
  {
    label: 'Feedly',
    description: 'Open your curated feeds without importing private reading data into the site.',
    url: 'https://feedly.com/'
  },
  {
    label: 'Google Alerts',
    description: 'Manage alert queries and delivery settings outside the build pipeline.',
    url: 'https://www.google.com/alerts'
  },
  {
    label: 'PubMed',
    description: 'Search the live biomedical literature database directly.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/'
  },
  {
    label: 'GitHub repository',
    description: 'Review configuration, workflows, and data-generation scripts.',
    url: githubRepositoryUrl
  }
];

export function Tools() {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-neutral-600">Tools</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">External workbench</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
          Google Alerts and Feedly are intentionally not ingested. Use these quick links for private reading and manual checks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <a key={tool.label} href={tool.url} target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-white p-5 shadow-card hover:border-signal">
            <h2 className="text-xl font-semibold text-ink">{tool.label}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-700">{tool.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
