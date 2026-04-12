import type { SourceId } from '../../config/sources';
import type { TopicKey } from '../../config/topics';

export type Article = {
  id: string;
  title: string;
  url: string;
  canonicalUrl: string;
  source: SourceId;
  publishedAt: string;
  fetchedAt: string;
  snippet: string;
  tags: string[];
  topicBuckets: TopicKey[];
  isNewToday: boolean;
};

export type SourceStatus = {
  source: SourceId;
  success: boolean;
  fetchedAt: string;
  itemCount: number;
  usedFallback: boolean;
  fallbackReason?: 'timeout' | 'parse error' | 'request failure';
  cacheTimestamp?: string;
  errorMessage?: string;
};

export type ArchiveIndexEntry = {
  date: string;
  count: number;
  file: string;
};
