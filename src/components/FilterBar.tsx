import { Search, X } from 'lucide-react';
import { SOURCES, type SourceId } from '../../config/sources';
import { TOPICS, type TopicKey } from '../../config/topics';
import { initialArticleFilters, type ArticleFilters, type DateFilter } from '../lib/filtering';

export type FilterBarProps = {
  filters: ArticleFilters;
  onChange: (filters: ArticleFilters) => void;
  availableTopics: string[];
  availableTags: string[];
};

export function FilterBar({ filters, onChange, availableTopics, availableTags }: FilterBarProps) {
  const topicOptions = TOPICS.map((topic) => topic.id).filter((topic) => availableTopics.includes(topic));
  const activeFilters = activeFilterLabels(filters);
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-card">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search articles</span>
            <span className="flex min-h-12 items-center gap-2 rounded-md border border-line bg-panel px-3">
              <Search aria-hidden="true" size={18} className="shrink-0 text-neutral-500" />
              <input
                value={filters.query}
                onChange={(event) => onChange({ ...filters, query: event.target.value })}
                placeholder="Search title or snippet"
                className="min-h-11 w-full bg-transparent text-sm outline-none"
              />
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <select
              value={filters.dateMode}
              onChange={(event) => onChange({ ...filters, dateMode: event.target.value as DateFilter })}
              className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
              aria-label="Date filter"
            >
              <option value="all">Any date</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="date">Exact date</option>
            </select>
            {filters.dateMode === 'date' ? (
              <input
                type="date"
                value={filters.date}
                onChange={(event) => onChange({ ...filters, date: event.target.value })}
                className="min-h-11 rounded-md border border-line bg-white px-3 text-sm text-ink"
                aria-label="Published on"
              />
            ) : null}
            <button
              type="button"
              onClick={() => onChange({ ...filters, newToday: !filters.newToday })}
              className={chipClass(filters.newToday)}
            >
              New today
            </button>
            <button
              type="button"
              onClick={() => onChange(initialArticleFilters)}
              disabled={!hasActiveFilters}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-45 hover:border-signal"
            >
              Clear filters
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        </div>

        <ChipGroup
          label="Sources"
          values={SOURCES.map((source) => source.id)}
          selected={filters.sources}
          getLabel={(value) => SOURCES.find((source) => source.id === value)?.label ?? value}
          onToggle={(value) => onChange({ ...filters, sources: toggleValue(filters.sources, value as SourceId) })}
        />

        <ChipGroup
          label="Topics"
          values={topicOptions}
          selected={filters.topics}
          getLabel={(value) => value}
          onToggle={(value) => onChange({ ...filters, topics: toggleValue(filters.topics, value as TopicKey) })}
        />

        <ChipGroup
          label="Tags"
          values={availableTags}
          selected={filters.tags}
          getLabel={(value) => value}
          onToggle={(value) => onChange({ ...filters, tags: toggleValue(filters.tags, value) })}
          helper="Matches any selected tag"
        />

        <div className="rounded-md bg-panel px-3 py-2 text-sm text-neutral-700">
          {hasActiveFilters ? (
            <span>
              Active filters: <span className="font-semibold text-ink">{activeFilters.join(', ')}</span>
            </span>
          ) : (
            <span>No filters selected. Search and chips can be combined.</span>
          )}
        </div>
      </div>
    </section>
  );
}

type ChipGroupProps<T extends string> = {
  label: string;
  values: T[];
  selected: T[];
  getLabel: (value: T) => string;
  onToggle: (value: T) => void;
  helper?: string;
};

function ChipGroup<T extends string>({ label, values, selected, getLabel, onToggle, helper }: ChipGroupProps<T>) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-ink">{label}</h3>
        {helper ? <span className="text-xs text-neutral-600">{helper}</span> : null}
      </div>
      <div className="flex max-h-28 flex-wrap gap-2 overflow-auto pr-1">
        {values.map((value) => (
          <button key={value} type="button" onClick={() => onToggle(value)} className={chipClass(selected.includes(value))}>
            {getLabel(value)}
          </button>
        ))}
      </div>
    </div>
  );
}

function activeFilterLabels(filters: ArticleFilters): string[] {
  const labels = [
    ...filters.sources,
    ...filters.topics,
    ...filters.tags,
    filters.newToday ? 'new today' : undefined,
    filters.query.trim() ? `search: ${filters.query.trim()}` : undefined,
    filters.dateMode !== 'all' ? dateLabel(filters) : undefined
  ];

  return labels.filter((value): value is string => Boolean(value));
}

function dateLabel(filters: ArticleFilters): string {
  if (filters.dateMode === 'date') {
    return filters.date ? `published: ${filters.date}` : 'exact date';
  }
  return filters.dateMode === '7d' ? 'last 7 days' : 'last 30 days';
}

function chipClass(selected: boolean): string {
  return selected
    ? 'inline-flex min-h-10 items-center rounded-md border border-signal bg-signal px-3 text-sm font-semibold text-white shadow-sm'
    : 'inline-flex min-h-10 items-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-neutral-700 hover:border-signal hover:text-signal';
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
