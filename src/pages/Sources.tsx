import { SOURCES } from '../../config/sources';
import type { SourceStatus } from '../lib/types';
import { formatDateTime, sourceLabel } from '../lib/format';

type SourcesPageProps = {
  statuses: SourceStatus[];
};

export function SourcesPage({ statuses }: SourcesPageProps) {
  const bySource = new Map(statuses.map((status) => [status.source, status]));

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-neutral-600">Sources</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Adapters and fetch health</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-700">
          Each adapter runs at build time in GitHub Actions. The deployed site reads only these local JSON files.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SOURCES.map((source) => {
          const status = bySource.get(source.id);
          return (
            <article key={source.id} className="rounded-lg border border-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink">{sourceLabel(source.id)}</h2>
                  <a href={source.homepage} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-signal">
                    {source.homepage}
                  </a>
                </div>
                <span className={status?.success ? 'rounded-md bg-emerald-100 px-2 py-1 text-sm font-semibold text-emerald-800' : 'rounded-md bg-red-50 px-2 py-1 text-sm font-semibold text-accent'}>
                  {status?.success ? 'OK' : 'Cached'}
                </span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm text-neutral-700">
                <div className="flex justify-between gap-4">
                  <dt>Fetched</dt>
                  <dd className="text-right">{status ? formatDateTime(status.fetchedAt) : 'Not fetched yet'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Items</dt>
                  <dd>{status?.itemCount ?? 0}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Default tags</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {source.defaultTags.map((tag) => (
                      <span key={tag} className="rounded-md border border-line px-2 py-1 text-xs">
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
              {status?.errorMessage ? <p className="mt-4 text-sm text-accent">{status.errorMessage}</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
