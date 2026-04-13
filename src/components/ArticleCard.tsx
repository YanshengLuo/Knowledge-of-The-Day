import { useEffect, useRef, useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import type { Article } from '../lib/types';
import { formatDate, sourceLabel } from '../lib/format';
import { copyArticleLink } from '../lib/share';

type ArticleCardVariant = 'standard' | 'featured' | 'compact';

type ArticleCardProps = {
  article: Article;
  compact?: boolean;
  variant?: ArticleCardVariant;
};

export function ArticleCard({ article, compact = false, variant }: ArticleCardProps) {
  const cardVariant = variant ?? (compact ? 'compact' : 'standard');
  const badges = importanceBadges(article).slice(0, 2);
  const [copied, setCopied] = useState(false);
  const copyResetTimer = useRef<number | undefined>();
  const isFeatured = cardVariant === 'featured';
  const isCompact = cardVariant === 'compact';
  const visibleTags = [...new Set([...article.topicBuckets, ...article.tags])].slice(0, isFeatured ? 6 : 4);

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) {
        window.clearTimeout(copyResetTimer.current);
      }
    };
  }, []);

  async function handleCopyLink() {
    const didCopy = await copyArticleLink(article);
    if (!didCopy) {
      return;
    }
    setCopied(true);
    if (copyResetTimer.current) {
      window.clearTimeout(copyResetTimer.current);
    }
    copyResetTimer.current = window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article
      className={`group relative flex h-full flex-col rounded-lg border border-line bg-white p-5 shadow-card transition duration-150 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-signal hover:shadow-lg ${
        isFeatured ? 'min-h-[300px]' : 'min-h-[260px]'
      }`}
    >
      <a href={article.url} target="_blank" rel="noreferrer" className="absolute inset-0 z-10" aria-label={`Open ${article.title}`}>
        <span className="sr-only">Open article</span>
      </a>

      <div className="pointer-events-none relative z-20 flex flex-1 flex-col">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal text-neutral-600">
          <span className="rounded-md border border-line bg-panel px-2 py-1 text-ink">{sourceLabel(article.source)}</span>
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          {article.isNewToday ? <span className="rounded-md bg-accent px-2 py-1 text-white">New today</span> : null}
          {badges.map((badge) => (
            <span key={badge} className="rounded-md bg-signal px-2 py-1 text-white">
              {badge}
            </span>
          ))}
        </div>

        {article.journalName ? <p className="mb-2 line-clamp-1 text-xs font-semibold text-neutral-600">{article.journalName}</p> : null}

        <h2 className={`${isFeatured ? 'text-xl' : 'text-lg'} line-clamp-2 font-semibold leading-snug text-ink group-hover:text-signal`}>
          {article.title}
        </h2>

        {!isCompact ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-700">{article.snippet || 'Metadata-only record. Open the source article for full context.'}</p> : null}

        {article.importanceSignals && article.importanceSignals.length > 0 && !isCompact ? (
          <p className="mt-3 line-clamp-1 text-xs text-neutral-600">Signals: {article.importanceSignals.slice(0, 2).join('; ')}</p>
        ) : null}

        <div className="mt-auto pt-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <span key={tag} className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-neutral-700">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:border-signal"
            >
              {copied ? 'Copied' : 'Copy link'}
              {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
            </button>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-signal px-3 text-sm font-semibold text-signal group-hover:bg-signal group-hover:text-white">
              Open
              <ExternalLink aria-hidden="true" size={16} />
            </span>
          </div>
        </div>
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
