import type { ArchiveIndexEntry } from '../lib/types';

type ArchiveProps = {
  archive: ArchiveIndexEntry[];
  onNavigate: (path: string) => void;
};

export function Archive({ archive, onNavigate }: ArchiveProps) {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-neutral-600">Archive</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Daily snapshots</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
          The build creates date-grouped JSON files under <code>data/archive</code> for lightweight browsing and long-term retention.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
        {archive.length > 0 ? (
          <ul className="divide-y divide-line">
            {archive.map((entry) => (
              <li key={entry.date} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">{entry.date}</p>
                  <p className="text-sm text-neutral-700">{entry.count} records</p>
                </div>
                <a
                  href={`./data/archive/${entry.file}`}
                  className="rounded-md border border-signal px-3 py-2 text-sm font-semibold text-signal hover:bg-signal hover:text-white"
                >
                  Open JSON
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-ink">No archive entries yet.</h2>
            <p className="mt-2 text-sm text-neutral-700">Run the daily update to generate date-grouped archive files.</p>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="mt-4 rounded-md bg-signal px-4 py-2 text-sm font-semibold text-white"
            >
              Back to dashboard
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
