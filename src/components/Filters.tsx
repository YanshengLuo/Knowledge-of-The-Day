import { Search } from 'lucide-react';
import { TOPICS } from '../../config/topics';
import { SOURCES, type SourceId } from '../../config/sources';
import type { TopicKey } from '../../config/topics';
import { initialArticleFilters, type ArticleFilters, type DateFilter } from '../lib/filtering';

export type FiltersState = ArticleFilters;

type FiltersProps = {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  availableTopics: string[];
  availableTags: string[];
};

export function Filters({ filters, onChange, availableTopics, availableTags }: FiltersProps) {
  const topicOptions = TOPICS.map((topic) => topic.id).filter((topic) => availableTopics.includes(topic));

  return (
    <aside className="rounded-lg border border-line bg-white p-4 shadow-card lg:sticky lg:top-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-normal text-neutral-600">Filters</h2>
          <button
            type="button"
            onClick={() => onChange(initialArticleFilters)}
            className="rounded-md border border-line px-3 py-2 text-xs font-semibold text-ink hover:border-signal"
          >
            Reset
          </button>
        </div>

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

        <CheckboxGroup
          label="Sources"
          values={SOURCES.map((source) => source.id)}
          selected={filters.sources}
          getLabel={(value) => SOURCES.find((source) => source.id === value)?.label ?? value}
          onToggle={(value) => onChange({ ...filters, sources: toggleValue(filters.sources, value as SourceId) })}
        />

        <CheckboxGroup
          label="Topic buckets"
          values={topicOptions}
          selected={filters.topics}
          getLabel={(value) => value}
          onToggle={(value) => onChange({ ...filters, topics: toggleValue(filters.topics, value as TopicKey) })}
        />

        <CheckboxGroup
          label="Tags"
          values={availableTags}
          selected={filters.tags}
          getLabel={(value) => value}
          onToggle={(value) => onChange({ ...filters, tags: toggleValue(filters.tags, value) })}
          helper="Matches any selected tag"
        />

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

type CheckboxGroupProps<T extends string> = {
  label: string;
  values: T[];
  selected: T[];
  getLabel: (value: T) => string;
  onToggle: (value: T) => void;
  helper?: string;
};

function CheckboxGroup<T extends string>({ label, values, selected, getLabel, onToggle, helper }: CheckboxGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">{label}</legend>
      {helper ? <p className="mb-2 text-xs text-neutral-600">{helper}</p> : null}
      <div className="max-h-44 space-y-2 overflow-auto rounded-md border border-line bg-panel p-3">
        {values.length > 0 ? (
          values.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={selected.includes(value)}
                onChange={() => onToggle(value)}
                className="h-4 w-4 accent-signal"
              />
              <span>{getLabel(value)}</span>
            </label>
          ))
        ) : (
          <p className="text-sm text-neutral-600">No options yet</p>
        )}
      </div>
    </fieldset>
  );
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
