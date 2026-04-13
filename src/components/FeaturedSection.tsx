import type { Article } from '../lib/types';
import { ArticleCard } from './ArticleCard';

type FeaturedSectionProps = {
  articles: Article[];
};

export function FeaturedSection({ articles }: FeaturedSectionProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-neutral-600">Top picks by source</p>
          <h2 className="text-2xl font-semibold text-ink">Featured articles</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-neutral-700">
          Ranked with freshness, topic relevance, source prominence, and metadata quality.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={`featured-${article.id}`} article={article} variant="featured" />
        ))}
      </div>
    </section>
  );
}
