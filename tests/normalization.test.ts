import { describe, expect, it } from 'vitest';
import type { Article } from '../src/lib/types';
import { dedupeArticles } from '../scripts/lib/dedupe';
import { canonicalizeUrl, inferTopicBuckets, normalizeTitle, parseDateToIso } from '../scripts/lib/utils';

describe('normalization helpers', () => {
  it('normalizes titles for stable duplicate checks', () => {
    expect(normalizeTitle('The AI-Driven Biotech Platform: What Changed?')).toBe('ai driven biotech platform what changed');
  });

  it('cleans canonical URLs without tracking parameters', () => {
    expect(canonicalizeUrl('https://Example.com/story/?utm_source=x&gclid=abc&id=7#section')).toBe('https://example.com/story?id=7');
    expect(canonicalizeUrl('https://example.com/story?mc_cid=abc&ref=newsletter&utm_medium=email')).toBe('https://example.com/story');
  });

  it('parses dates into ISO strings with fallback safety', () => {
    expect(parseDateToIso('April 12, 2026', '2026-01-01T00:00:00.000Z')).toBe('2026-04-12T00:00:00.000Z');
    expect(parseDateToIso('not a date', '2026-01-01T00:00:00.000Z')).toBe('2026-01-01T00:00:00.000Z');
  });

  it('infers topic buckets from keywords', () => {
    expect(inferTopicBuckets('Spatial transcriptomics reveals cancer immune niches')).toEqual(
      expect.arrayContaining(['spatial', 'oncology', 'immunology'])
    );
  });
});

describe('dedupe logic', () => {
  it('deduplicates by canonical URL and keeps merged tags', () => {
    const articles = dedupeArticles([
      article({ id: 'a', canonicalUrl: 'https://example.com/a', tags: ['ai'] }),
      article({
        id: 'b',
        canonicalUrl: 'https://example.com/a?utm_source=newsletter&gclid=abc',
        tags: ['oncology'],
        snippet: 'A longer snippet with more useful metadata.'
      })
    ]);

    expect(articles).toHaveLength(1);
    expect(articles[0].canonicalUrl).toBe('https://example.com/a');
    expect(articles[0].tags).toEqual(expect.arrayContaining(['ai', 'oncology']));
  });

  it('deduplicates by normalized exact title while keeping the selected display title', () => {
    const articles = dedupeArticles([
      article({ id: 'a', title: '  AI Platform   Improves Oncology Drug Discovery  ', canonicalUrl: 'https://example.com/a' }),
      article({
        id: 'b',
        title: 'ai platform improves oncology drug discovery',
        canonicalUrl: 'https://example.com/b',
        fetchedAt: '2026-04-12T02:00:00.000Z'
      })
    ]);

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('ai platform improves oncology drug discovery');
  });

  it('deduplicates conservative near-title matches within news sources', () => {
    const articles = dedupeArticles([
      article({ id: 'a', title: 'Biotech Startup Raises Series A for Cancer AI Platform', source: 'biospace' }),
      article({ id: 'b', title: 'Biotech startup raises Series A for cancer AI platform', source: 'crunchbase', canonicalUrl: 'https://example.com/b' })
    ]);

    expect(articles).toHaveLength(1);
  });

  it('does not merge PubMed papers with news based on similar titles', () => {
    const articles = dedupeArticles([
      article({ id: 'a', title: 'Machine learning predicts response to immunotherapy in cancer', source: 'pubmed' }),
      article({
        id: 'b',
        title: 'Machine learning predicts response to immunotherapy in cancer',
        source: 'biospace',
        canonicalUrl: 'https://example.com/news'
      })
    ]);

    expect(articles).toHaveLength(2);
  });
});

function article(overrides: Partial<Article>): Article {
  return {
    id: overrides.id ?? 'id',
    title: overrides.title ?? 'AI Platform Improves Oncology Drug Discovery',
    url: overrides.url ?? overrides.canonicalUrl ?? 'https://example.com/a',
    canonicalUrl: overrides.canonicalUrl ?? 'https://example.com/a',
    source: overrides.source ?? 'biospace',
    publishedAt: overrides.publishedAt ?? '2026-04-12T00:00:00.000Z',
    fetchedAt: overrides.fetchedAt ?? '2026-04-12T01:00:00.000Z',
    snippet: overrides.snippet ?? 'A concise metadata snippet.',
    tags: overrides.tags ?? ['biotech'],
    topicBuckets: overrides.topicBuckets ?? ['biotech'],
    isNewToday: overrides.isNewToday ?? true
  };
}
