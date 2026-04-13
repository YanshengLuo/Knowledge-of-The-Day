import type { RawFetchedItem } from '../types';

export type McKinseyDiscoveryMethod = 'seed-page' | 'sitemap' | 'seed-url';

export type McKinseyCandidate = {
  url: string;
  sourceUrl: string;
  discoveryMethod: McKinseyDiscoveryMethod;
};

export type McKinseyDiscoveryResult = {
  candidates: McKinseyCandidate[];
  errors: string[];
};

export type McKinseyParsedPage = {
  url: string;
  finalUrl: string;
  canonicalUrl: string;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publishedAt?: string;
  updatedAt?: string;
  section?: string;
  contentType?: string;
  summary: string;
  bodyText?: string;
  fetchMethod: 'static';
  scrapeStatus: 'success';
};

export type McKinseyFetchSummary = {
  items: RawFetchedItem[];
  failures: string[];
};
