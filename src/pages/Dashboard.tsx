import { useMemo, useState } from 'react';
import type { Article, SourceStatus } from '../lib/types';
import { daysAgoFilter, formatDateTime } from '../lib/format';
import { ArticleCard } from '../components/ArticleCard';
import { Filters, type FiltersState } from '../components/Filters';
import { HealthSummary } from '../components/HealthSummary';

const initialFilters: FiltersState = {
  query: '',
  source: 'all',
  topic: 'all',
  dateMode: 'all',
  date: '',
  newToday: false
};

type DashboardProps = {
  articles: Article[];
  statuses: SourceStatus[];
};

export function Dashboard({ articles, statuses }: DashboardProps) {
  const [filters, setFilters] = useState(initialFilters);
  const lastUpdated = useMemo(() => latestTimestamp(statuses), [statuses]);
  const availableTopics = useMemo(() => [...new Set(articles.flatMap((article) => article.topicBuckets))].sort(), [articles]);

  const filteredArticles = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return articles.filter((article) => {
      if (filters.source !== 'all' && article.source !== filters.source) {
        return false;
      }
      if (filters.topic !== 'all' && !article.topicBuckets.includes(filters.topic as Article['topicBuckets'][number])) {
        return false;
      }
      if (filters.newToday && !article.isNewToday) {
        return false;
      }
      if (filters.dateMode === '7d' && !daysAgoFilter(article.publishedAt, 7)) {
        return false;
      }
      if (filters.dateMode === '30d' && !daysAgoFilter(article.publishedAt, 30)) {
        return false;
      }
      if (filters.dateMode === 'date' && filters.date && !article.publishedAt.startsWith(filters.date)) {
        return false;
      }
      if (query) {
        const haystack = `${article.title} ${article.snippet}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [articles, filters]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-neutral-600">Last updated</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">{formatDateTime(lastUpdated)}</h1>
        </div>
        <p className="max-w-xl text-sm leading-6 text-neutral-700">
          Showing {filteredArticles.length} of {articles.length} stored metadata records. Links open at the original publisher.
        </p>
      </section>

      <HealthSummary statuses={statuses} />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Filters filters={filters} onChange={setFilters} availableTopics={availableTopics} />
        <section className="space-y-4">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => <ArticleCard key={article.id} article={article} />)
          ) : (
            <div className="rounded-lg border border-line bg-white p-8 text-center shadow-card">
              <h2 className="text-xl font-semibold text-ink">No records match these filters.</h2>
              <p className="mt-2 text-sm text-neutral-700">Clear search, broaden the date range, or run the daily update.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function latestTimestamp(statuses: SourceStatus[]): string {
  const timestamps = statuses.map((status) => Date.parse(status.fetchedAt)).filter((timestamp) => !Number.isNaN(timestamp));
  if (timestamps.length === 0) {
    return '1970-01-01T00:00:00.000Z';
  }
  return new Date(Math.max(...timestamps)).toISOString();
}
