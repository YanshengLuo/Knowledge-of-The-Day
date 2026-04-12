import { Search } from 'lucide-react';
import { TOPICS } from '../../config/topics';
import { SOURCES } from '../../config/sources';

export type DateFilter = 'all' | '7d' | '30d' | 'date';

export type FiltersState = {
  query: string;
  source: string;
  topic: string;
  dateMode: DateFilter;
  date: string;
  newToday: boolean;
};

type FiltersProps = {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  availableTopics: string[];
};

export function Filters({ filters, onChange, availableTopics }: FiltersProps) {
  const topicOptions = TOPICS.map((topic) => topic.id).filter((topic) => availableTopics.includes(topic));

  return (
    <aside className="rounded-lg border border-line bg-white p-4 shadow-card lg:sticky lg:top-4">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-ink">Search</span>
          <span className="flex items-center gap-2 rounded-md border border-line bg-panel px-3">
            <Search aria-hidden="true" size={18} className="text-neutral-500" />
            <input
              value={filters.query}
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
              placeholder="Title or snippet"
              className="min-h-11 w-full bg-transparent text-sm outline-none"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-ink">Source</span>
          <select
            value={filters.source}
            onChange={(event) => onChange({ ...filters, source: event.target.value })}
            className="min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm"
          >
            <option value="all">All sources</option>
            {SOURCES.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-ink">Topic</span>
          <select
            value={filters.topic}
            onChange={(event) => onChange({ ...filters, topic: event.target.value })}
            className="min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm"
          >
            <option value="all">All topics</option>
            {topicOptions.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-ink">Date</span>
          <select
            value={filters.dateMode}
            onChange={(event) => onChange({ ...filters, dateMode: event.target.value as DateFilter })}
            className="min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm"
          >
            <option value="all">Any date</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="date">Exact date</option>
          </select>
        </label>

        {filters.dateMode === 'date' ? (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">Published on</span>
            <input
              type="date"
              value={filters.date}
              onChange={(event) => onChange({ ...filters, date: event.target.value })}
              className="min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm"
            />
          </label>
        ) : null}

        <label className="flex items-center gap-3 rounded-md border border-line bg-panel p-3 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={filters.newToday}
            onChange={(event) => onChange({ ...filters, newToday: event.target.checked })}
            className="h-4 w-4 accent-signal"
          />
          New today only
        </label>
      </div>
    </aside>
  );
}
