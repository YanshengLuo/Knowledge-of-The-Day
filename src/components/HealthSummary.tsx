import type { SourceStatus } from '../lib/types';
import { formatDateTime, sourceLabel } from '../lib/format';

type HealthSummaryProps = {
  statuses: SourceStatus[];
};

export function HealthSummary({ statuses }: HealthSummaryProps) {
  const failures = statuses.filter((status) => !status.success);
  const totalItems = statuses.reduce((sum, status) => sum + status.itemCount, 0);

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-neutral-600">Source health</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {failures.length === 0 ? 'All sources fetched' : `${failures.length} source${failures.length > 1 ? 's' : ''} using cache`}
          </p>
        </div>
        <p className="text-sm text-neutral-700">{totalItems} metadata items available before dedupe</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statuses.map((status) => (
          <div key={status.source} className="rounded-md border border-line bg-panel p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-ink">{sourceLabel(status.source)}</span>
              <span className={status.success ? 'text-sm font-semibold text-emerald-700' : 'text-sm font-semibold text-accent'}>
                {status.success ? 'OK' : 'Cached'}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-700">{status.itemCount} items</p>
            <p className="mt-1 text-xs text-neutral-600">{formatDateTime(status.fetchedAt)}</p>
            {!status.success && status.errorMessage ? <p className="mt-2 text-xs text-accent">{status.errorMessage}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
