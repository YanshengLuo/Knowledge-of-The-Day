import { describe, expect, it } from 'vitest';
import type { Article } from '../src/lib/types';
import { filterArticles, initialArticleFilters } from '../src/lib/filtering';
import { applyArticleRanking, groupTopArticlesByPublication, rankArticleImportance } from '../src/lib/ranking';

describe('multi-select article filtering', () => {
  const articles = [
    article({ id: 'a', source: 'pubmed', tags: ['oncology'], topicBuckets: ['oncology'], title: 'Cancer biomarker study' }),
    article({ id: 'b', source: 'biospace', tags: ['gene therapy'], topicBuckets: ['gene therapy'], title: 'Gene therapy startup update' }),
    article({ id: 'c', source: 'mckinsey', tags: ['strategy'], topicBuckets: ['ai'], title: 'AI operations insight' })
  ];

  it('matches any selected tag while search continues narrowing results', () => {
    const filtered = filterArticles(articles, {
      ...initialArticleFilters,
      tags: ['oncology', 'gene therapy'],
      query: 'startup'
    });

    expect(filtered.map((item) => item.id)).toEqual(['b']);
  });

  it('supports multi-source and multi-topic filters together', () => {
    const filtered = filterArticles(articles, {
      ...initialArticleFilters,
      sources: ['pubmed', 'mckinsey'],
      topics: ['oncology', 'ai']
    });

    expect(filtered.map((item) => item.id)).toEqual(['a', 'c']);
  });
});

describe('importance ranking', () => {
  const referenceDate = new Date('2026-04-12T12:00:00.000Z');

  it('scores recent high-priority articles above older sparse articles', () => {
    const recent = article({
      id: 'recent',
      source: 'pubmed',
      publishedAt: '2026-04-12T00:00:00.000Z',
      topicBuckets: ['oncology', 'gene therapy'],
      snippet: 'A'.repeat(220),
      journalName: 'Nature Biotechnology'
    });
    const old = article({
      id: 'old',
      source: 'crunchbase',
      publishedAt: '2026-01-01T00:00:00.000Z',
      topicBuckets: ['funding'],
      snippet: ''
    });

    expect(rankArticleImportance(recent, referenceDate).score).toBeGreaterThan(rankArticleImportance(old, referenceDate).score);
  });

  it('selects top one or two per publication bucket', () => {
    const ranked = applyArticleRanking(
      [
        article({ id: 'a', journalName: 'Journal A', importanceScore: 10, publishedAt: '2026-04-12T00:00:00.000Z' }),
        article({ id: 'b', journalName: 'Journal A', importanceScore: 20, publishedAt: '2026-04-11T00:00:00.000Z' }),
        article({ id: 'c', journalName: 'Journal A', importanceScore: 30, publishedAt: '2026-04-10T00:00:00.000Z' }),
        article({ id: 'd', source: 'biospace', publicationName: 'BioSpace', publishedAt: '2026-04-12T00:00:00.000Z' })
      ],
      2,
      referenceDate
    );

    const top = groupTopArticlesByPublication(ranked, 2);
    expect(top.filter((item) => item.journalName === 'Journal A')).toHaveLength(2);
    expect(ranked.filter((item) => item.journalName === 'Journal A' && item.isFeatured)).toHaveLength(2);
  });

  it('sorts ties deterministically by date then id', () => {
    const top = groupTopArticlesByPublication([
      article({ id: 'b', publicationName: 'BioSpace', importanceScore: 50, publishedAt: '2026-04-11T00:00:00.000Z' }),
      article({ id: 'a', publicationName: 'BioSpace', importanceScore: 50, publishedAt: '2026-04-11T00:00:00.000Z' }),
      article({ id: 'c', publicationName: 'BioSpace', importanceScore: 50, publishedAt: '2026-04-12T00:00:00.000Z' })
    ], 2);

    expect(top.map((item) => item.id)).toEqual(['c', 'a']);
  });
});

function article(overrides: Partial<Article>): Article {
  return {
    id: overrides.id ?? 'id',
    title: overrides.title ?? 'AI Platform Improves Oncology Drug Discovery',
    url: overrides.url ?? overrides.canonicalUrl ?? 'https://example.com/a',
    canonicalUrl: overrides.canonicalUrl ?? 'https://example.com/a',
    source: overrides.source ?? 'pubmed',
    publicationName: overrides.publicationName,
    journalName: overrides.journalName,
    publishedAt: overrides.publishedAt ?? '2026-04-12T00:00:00.000Z',
    fetchedAt: overrides.fetchedAt ?? '2026-04-12T01:00:00.000Z',
    snippet: overrides.snippet ?? 'A concise metadata snippet.',
    tags: overrides.tags ?? ['biotech'],
    topicBuckets: overrides.topicBuckets ?? ['biotech'],
    isNewToday: overrides.isNewToday ?? true,
    importanceScore: overrides.importanceScore,
    importanceSignals: overrides.importanceSignals,
    isFeatured: overrides.isFeatured
  };
}
