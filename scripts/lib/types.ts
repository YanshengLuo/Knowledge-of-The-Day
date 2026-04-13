import type { SourceId } from '../../config/sources';
import type { TopicKey } from '../../config/topics';
import type { Article, SourceStatus } from '../../src/lib/types';

export type ImageSource = 'og' | 'twitter' | 'hero' | 'pmc' | 'publisher' | 'fallback';

export type RawFetchedItem = {
  title: string;
  url: string;
  canonicalUrl?: string;
  imageUrl?: string;
  imageSource?: ImageSource;
  source: SourceId;
  publicationName?: string;
  journalName?: string;
  publishedAt?: string;
  fetchedAt: string;
  snippet?: string;
  tags?: string[];
  topicBuckets?: TopicKey[];
  importanceScore?: number;
  importanceSignals?: string[];
  isFeatured?: boolean;
};

export type SourceRun = SourceStatus & {
  items: RawFetchedItem[];
};

export type FallbackReason = 'timeout' | 'parse error' | 'request failure';

export type NormalizedArticle = Article;
