import type { SourceId } from '../../config/sources';
import type { TopicKey } from '../../config/topics';
import { daysAgoFilter } from './format';
import type { Article } from './types';

export type DateFilter = 'all' | '7d' | '30d' | 'date';

export type ArticleFilters = {
  query: string;
  sources: SourceId[];
  topics: TopicKey[];
  tags: string[];
  dateMode: DateFilter;
  date: string;
  newToday: boolean;
};

export const initialArticleFilters: ArticleFilters = {
  query: '',
  sources: [],
  topics: [],
  tags: [],
  dateMode: 'all',
  date: '',
  newToday: false
};

export function filterArticles(articles: Article[], filters: ArticleFilters): Article[] {
  const query = filters.query.trim().toLowerCase();

  return articles.filter((article) => {
    if (filters.sources.length > 0 && !filters.sources.includes(article.source)) {
      return false;
    }
    if (filters.topics.length > 0 && !filters.topics.some((topic) => article.topicBuckets.includes(topic))) {
      return false;
    }
    if (filters.tags.length > 0 && !filters.tags.some((tag) => article.tags.includes(tag))) {
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
}
