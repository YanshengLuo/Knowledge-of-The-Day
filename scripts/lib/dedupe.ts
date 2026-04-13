import type { Article } from '../../src/lib/types';
import { canonicalizeUrl, normalizeTitle, pickBestDuplicate, titleSimilarity, uniqueStrings } from './utils';

export function dedupeArticles(articles: Article[], nearDuplicateThreshold = 0.9): Article[] {
  const canonicalMap = new Map<string, Article>();

  for (const originalArticle of articles) {
    const article = normalizeArticleUrls(originalArticle);
    const existing = canonicalMap.get(article.canonicalUrl);
    canonicalMap.set(article.canonicalUrl, existing ? mergeArticle(existing, article) : article);
  }

  const titleMap = new Map<string, Article>();
  const exactTitleDeduped: Article[] = [];
  for (const article of canonicalMap.values()) {
    const key = normalizeTitle(article.title);
    if (!key) {
      exactTitleDeduped.push(article);
      continue;
    }

    const existing = titleMap.get(key);
    if (existing && canDedupeByTitle(existing, article)) {
      const merged = mergeArticle(existing, article);
      titleMap.set(key, merged);
      replaceArticle(exactTitleDeduped, existing, merged);
    } else {
      titleMap.set(key, article);
      exactTitleDeduped.push(article);
    }
  }

  const finalArticles: Article[] = [];
  for (const article of exactTitleDeduped) {
    const duplicate = finalArticles.find(
      (candidate) =>
        canDedupeByTitle(candidate, article) &&
        titleSimilarity(candidate.title, article.title) >= nearDuplicateThreshold
    );

    if (duplicate) {
      replaceArticle(finalArticles, duplicate, mergeArticle(duplicate, article));
    } else {
      finalArticles.push(article);
    }
  }

  return finalArticles;
}

function normalizeArticleUrls(article: Article): Article {
  const canonicalUrl = normalizeDedupeUrl(article.canonicalUrl || article.url);
  return {
    ...article,
    url: normalizeDedupeUrl(article.url || canonicalUrl),
    canonicalUrl
  };
}

function normalizeDedupeUrl(url: string): string {
  try {
    return canonicalizeUrl(url);
  } catch {
    return url.trim();
  }
}

function canDedupeByTitle(left: Article, right: Article): boolean {
  const pubmedMixedWithNews = (left.source === 'pubmed' && right.source !== 'pubmed') || (left.source !== 'pubmed' && right.source === 'pubmed');
  return !pubmedMixedWithNews;
}

function replaceArticle(articles: Article[], original: Article, replacement: Article): void {
  const index = articles.indexOf(original);
  if (index >= 0) {
    articles[index] = replacement;
  }
}

function mergeArticle(left: Article, right: Article): Article {
  const best = pickBestDuplicate(left, right);
  return {
    ...best,
    tags: uniqueStrings([...left.tags, ...right.tags]),
    topicBuckets: uniqueStrings([...left.topicBuckets, ...right.topicBuckets]) as Article['topicBuckets'],
    imageUrl: best.imageUrl || left.imageUrl || right.imageUrl,
    journalName: best.journalName || left.journalName || right.journalName,
    publicationName: best.publicationName || left.publicationName || right.publicationName,
    importanceSignals: uniqueStrings([...(left.importanceSignals ?? []), ...(right.importanceSignals ?? [])]),
    importanceScore: Math.max(left.importanceScore ?? 0, right.importanceScore ?? 0) || undefined,
    isNewToday: left.isNewToday || right.isNewToday
  };
}
