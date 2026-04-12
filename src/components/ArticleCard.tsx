import { ExternalLink } from 'lucide-react';
import type { Article } from '../lib/types';
import { formatDate, sourceLabel } from '../lib/format';

type ArticleCardProps = {
  article: Article;
  compact?: boolean;
};

export function ArticleCard({ article, compact = false }: ArticleCardProps) {
  const badges = importanceBadges(article);

  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-card">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal text-neutral-600">
        <span className="rounded-md border border-line bg-panel px-2 py-1 text-ink">{sourceLabel(article.source)}</span>
        {article.journalName ? <span className="rounded-md border border-line px-2 py-1 text-neutral-700">{article.journalName}</span> : null}
        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        {article.isNewToday ? <span className="rounded-md bg-accent px-2 py-1 text-white">New today</span> : null}
        {badges.map((badge) => (
          <span key={badge} className="rounded-md bg-signal px-2 py-1 text-white">
            {badge}
          </span>
        ))}
      </div>

      <h2 className={`${compact ? 'text-base' : 'text-lg'} font-semibold leading-snug text-ink`}>
        <a href={article.url} target="_blank" rel="noreferrer" className="hover:text-signal">
          {article.title}
        </a>
      </h2>

      {article.snippet && !compact ? <p className="mt-3 text-sm leading-6 text-neutral-700">{article.snippet}</p> : null}
      {article.importanceSignals && article.importanceSignals.length > 0 ? (
        <p className="mt-2 text-xs text-neutral-600">Signals: {article.importanceSignals.slice(0, 3).join('; ')}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[...new Set([...article.topicBuckets, ...article.tags])].slice(0, 8).map((tag) => (
            <span key={tag} className="rounded-md border border-line px-2 py-1 text-xs text-neutral-700">
              {tag}
            </span>
          ))}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-signal px-3 py-2 text-sm font-semibold text-signal hover:bg-signal hover:text-white"
        >
          Open
          <ExternalLink aria-hidden="true" size={16} />
        </a>
      </div>
    </article>
  );
}

function importanceBadges(article: Article): string[] {
  const badges: string[] = [];
  if (article.isFeatured) {
    badges.push('Featured');
  }
  if ((article.importanceScore ?? 0) >= 75) {
    badges.push(article.source === 'pubmed' ? 'Recent standout' : 'Trending');
  }
  return [...new Set(badges)];
}
