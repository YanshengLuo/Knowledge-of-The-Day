import { useMemo, useState } from 'react';
import { SOURCES } from '../../config/sources';
import type { Article, SourceStatus } from '../lib/types';
import { formatDateTime } from '../lib/format';
import { ArticleCard } from '../components/ArticleCard';
import { FeaturedSection } from '../components/FeaturedSection';
import { FilterBar } from '../components/FilterBar';
import { HealthSummary } from '../components/HealthSummary';
import { filterArticles, initialArticleFilters } from '../lib/filtering';
import { compareByImportance } from '../lib/ranking';

type DashboardProps = {
  articles: Article[];
  statuses: SourceStatus[];
};

export function Dashboard({ articles, statuses }: DashboardProps) {
  const [filters, setFilters] = useState(initialArticleFilters);
  const lastUpdated = useMemo(() => latestTimestamp(statuses), [statuses]);
  const availableTopics = useMemo(() => [...new Set(articles.flatMap((article) => article.topicBuckets))].sort(), [articles]);
  const availableTags = useMemo(() => topTags(articles), [articles]);
  const topPicks = useMemo(() => topPickBySource(articles), [articles]);
  const filteredArticles = useMemo(() => filterArticles(articles, filters), [articles, filters]);

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

      <FeaturedSection articles={topPicks} />

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <FilterBar filters={filters} onChange={setFilters} availableTopics={availableTopics} availableTags={availableTags} />
        <section className="space-y-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-neutral-600">Latest feed</p>
              <h2 className="text-2xl font-semibold text-ink">Recent records</h2>
            </div>
            <p className="text-sm text-neutral-700">{filteredArticles.length} matching records</p>
          </div>
          {filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
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

function topPickBySource(articles: Article[]): Article[] {
  return SOURCES.flatMap((source) => {
    const topArticle = articles.filter((article) => article.source === source.id).sort(compareByImportance)[0];
    return topArticle ? [topArticle] : [];
  });
}

function topTags(articles: Article[], limit = 36): string[] {
  const counts = new Map<string, number>();
  for (const tag of articles.flatMap((article) => article.tags)) {
    if (tag.startsWith('author:')) {
      continue;
    }
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([leftTag, leftCount], [rightTag, rightCount]) => rightCount - leftCount || leftTag.localeCompare(rightTag))
    .slice(0, limit)
    .map(([tag]) => tag);
}

function latestTimestamp(statuses: SourceStatus[]): string {
  const timestamps = statuses.map((status) => Date.parse(status.fetchedAt)).filter((timestamp) => !Number.isNaN(timestamp));
  if (timestamps.length === 0) {
    return '1970-01-01T00:00:00.000Z';
  }
  return new Date(Math.max(...timestamps)).toISOString();
}
