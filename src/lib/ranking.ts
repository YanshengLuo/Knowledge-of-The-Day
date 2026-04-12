import type { SourceId } from '../../config/sources';
import type { Article } from './types';

export const RANKING_WEIGHTS = {
  recencyFresh: 24,
  recencyRecent: 14,
  recencyMonth: 7,
  highPriorityTopic: 10,
  sourcePriority: 8,
  richSnippet: 6,
  richMetadata: 4,
  featuredSourceSignal: 16
} as const;

const HIGH_PRIORITY_TOPICS = new Set(['oncology', 'gene therapy', 'ai', 'computational biology', 'translational medicine']);
const SOURCE_PRIORITY: Record<SourceId, number> = {
  pubmed: 8,
  biospace: 6,
  mckinsey: 7,
  a16z: 5,
  crunchbase: 4
};

export function rankArticleImportance(article: Article, referenceDate = new Date()): { score: number; signals: string[] } {
  let score = 20;
  const signals: string[] = [];
  const ageDays = ageInDays(article.publishedAt, referenceDate);

  if (typeof article.importanceScore === 'number' && article.importanceScore > 0) {
    score += Math.min(20, article.importanceScore / 5);
    signals.push('explicit source metric');
  }

  if (ageDays <= 2) {
    score += RANKING_WEIGHTS.recencyFresh;
    signals.push('very recent');
  } else if (ageDays <= 7) {
    score += RANKING_WEIGHTS.recencyRecent;
    signals.push('recent');
  } else if (ageDays <= 30) {
    score += RANKING_WEIGHTS.recencyMonth;
    signals.push('published this month');
  }

  const priorityTopicMatches = article.topicBuckets.filter((topic) => HIGH_PRIORITY_TOPICS.has(topic));
  if (priorityTopicMatches.length > 0) {
    score += Math.min(priorityTopicMatches.length, 3) * RANKING_WEIGHTS.highPriorityTopic;
    signals.push(`priority topic: ${priorityTopicMatches.slice(0, 2).join(', ')}`);
  }

  const sourceBoost = SOURCE_PRIORITY[article.source] ?? 3;
  score += sourceBoost;
  if (sourceBoost >= RANKING_WEIGHTS.sourcePriority) {
    signals.push('high-signal source');
  }

  if (article.snippet.length >= 180) {
    score += RANKING_WEIGHTS.richSnippet;
    signals.push('rich summary');
  }

  if (article.journalName || article.publicationName || article.tags.length >= 4) {
    score += RANKING_WEIGHTS.richMetadata;
    signals.push('rich metadata');
  }

  if (hasFeaturedSourceSignal(article)) {
    score += RANKING_WEIGHTS.featuredSourceSignal;
    signals.push('featured placement signal');
  }

  return {
    score: Math.min(100, Math.round(score)),
    signals: [...new Set(signals)]
  };
}

export function applyArticleRanking(articles: Article[], maxPerGroup = 2, referenceDate = new Date()): Article[] {
  const ranked = articles.map((article) => {
    const rankedArticle = rankArticleImportance(article, referenceDate);
    return {
      ...article,
      importanceScore: rankedArticle.score,
      importanceSignals: rankedArticle.signals,
      isFeatured: false
    };
  });

  const featuredIds = new Set(groupTopArticlesByPublication(ranked, maxPerGroup).map((article) => article.id));
  return ranked.map((article) => ({
    ...article,
    isFeatured: featuredIds.has(article.id)
  }));
}

export function groupTopArticlesByPublication(articles: Article[], maxPerGroup = 2): Article[] {
  const groups = new Map<string, Article[]>();
  for (const article of articles) {
    const key = publicationBucket(article);
    groups.set(key, [...(groups.get(key) ?? []), article]);
  }

  return [...groups.values()]
    .flatMap((groupArticles) => [...groupArticles].sort(compareByImportance).slice(0, maxPerGroup))
    .sort(compareByImportance);
}

export function publicationBucket(article: Article): string {
  return (article.journalName || article.publicationName || article.source).trim().toLowerCase();
}

export function compareByImportance(left: Article, right: Article): number {
  const scoreDelta = (right.importanceScore ?? 0) - (left.importanceScore ?? 0);
  if (scoreDelta !== 0) {
    return scoreDelta;
  }

  const dateDelta = Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
  if (dateDelta !== 0) {
    return dateDelta;
  }

  return left.id.localeCompare(right.id);
}

function ageInDays(publishedAt: string, referenceDate: Date): number {
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, (referenceDate.getTime() - published) / (24 * 60 * 60 * 1000));
}

function hasFeaturedSourceSignal(article: Article): boolean {
  const haystack = `${article.url} ${article.tags.join(' ')}`.toLowerCase();
  return haystack.includes('/featured-insights/') || haystack.includes('featured') || haystack.includes('top');
}
