import type { SourceId } from '../../config/sources';
import type { TopicKey } from '../../config/topics';
import type { Article, SourceStatus } from '../../src/lib/types';

export type RawFetchedItem = {
  title: string;
  url: string;
  canonicalUrl?: string;
  source: SourceId;
  publishedAt?: string;
  fetchedAt: string;
  snippet?: string;
  tags?: string[];
  topicBuckets?: TopicKey[];
};

export type SourceRun = SourceStatus & {
  items: RawFetchedItem[];
};

export type NormalizedArticle = Article;
