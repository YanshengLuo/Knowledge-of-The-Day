import { describe, expect, it } from 'vitest';
import { discoverCandidatesFromHtml } from '../scripts/lib/mckinsey/discover';
import { isAllowedMcKinseyUrl, isMcKinseyArticleCandidate, normalizeMcKinseyUrl } from '../scripts/lib/mckinsey/filters';
import { parseMcKinseyPage, toMcKinseyRawItem } from '../scripts/lib/mckinsey/parser';

describe('McKinsey URL filters', () => {
  it('normalizes McKinsey URLs and removes query strings and fragments', () => {
    expect(normalizeMcKinseyUrl('/industries/life-sciences/our-insights/example-article?cid=x#section')).toBe(
      'https://www.mckinsey.com/industries/life-sciences/our-insights/example-article'
    );
  });

  it('allows insight URLs and blocks obvious non-article URLs', () => {
    expect(isAllowedMcKinseyUrl('https://www.mckinsey.com/industries/life-sciences/our-insights/example-article')).toBe(true);
    expect(isAllowedMcKinseyUrl('https://www.mckinsey.com/careers/search-jobs')).toBe(false);
    expect(isAllowedMcKinseyUrl('https://www.example.com/industries/life-sciences/our-insights/example-article')).toBe(false);
  });

  it('distinguishes article candidates from listing pages', () => {
    expect(isMcKinseyArticleCandidate('https://www.mckinsey.com/industries/life-sciences/our-insights')).toBe(false);
    expect(isMcKinseyArticleCandidate('https://www.mckinsey.com/featured-insights/mckinsey-explainers')).toBe(false);
    expect(isMcKinseyArticleCandidate('https://www.mckinsey.com/featured-insights/artificial-intelligence/example-ai-article')).toBe(true);
  });
});

describe('McKinsey discovery and parser', () => {
  it('discovers article-like links from seed HTML', () => {
    const candidates = discoverCandidatesFromHtml(
      `
        <a href="/industries/life-sciences/our-insights/what-biotech-leaders-need-next">Good article</a>
        <a href="/careers/search-jobs">Jobs</a>
        <a href="https://www.example.com/industries/life-sciences/our-insights/not-mckinsey">External</a>
      `,
      'https://www.mckinsey.com/industries/life-sciences/our-insights'
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0].url).toBe('https://www.mckinsey.com/industries/life-sciences/our-insights/what-biotech-leaders-need-next');
  });

  it('parses structured metadata first', () => {
    const parsed = parseMcKinseyPage(
      `
        <html>
          <head>
            <link rel="canonical" href="https://www.mckinsey.com/industries/life-sciences/our-insights/sample-report" />
            <script type="application/ld+json">
              {
                "@type": "Article",
                "headline": "Biotech strategy in a new market cycle",
                "description": "A concise overview of market shifts for biotech leaders.",
                "datePublished": "2026-04-12",
                "author": [{"name": "Jane Doe"}]
              }
            </script>
          </head>
          <body><h1>Fallback title</h1></body>
        </html>
      `,
      'https://www.mckinsey.com/industries/life-sciences/our-insights/sample-report',
      '2026-04-12T12:00:00.000Z'
    );

    expect(parsed?.title).toBe('Biotech strategy in a new market cycle');
    expect(parsed?.summary).toBe('A concise overview of market shifts for biotech leaders.');
    expect(parsed?.authors).toEqual(['Jane Doe']);
    expect(parsed?.publishedAt).toBe('2026-04-12T00:00:00.000Z');
  });

  it('falls back to meta tags and semantic text', () => {
    const parsed = parseMcKinseyPage(
      `
        <html>
          <head>
            <meta property="og:title" content="AI in healthcare operations | McKinsey" />
            <meta name="description" content="How healthcare organizations can use AI while managing operational risk." />
            <meta property="article:published_time" content="2026-04-10T00:00:00.000Z" />
          </head>
          <body>
            <main>
              <h1>AI in healthcare operations</h1>
              <p>How healthcare organizations can use AI while managing operational risk.</p>
            </main>
          </body>
        </html>
      `,
      'https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/ai-in-healthcare-operations',
      '2026-04-12T12:00:00.000Z'
    );

    expect(parsed?.title).toBe('AI in healthcare operations');
    expect(parsed?.summary).toContain('healthcare organizations');

    const raw = parsed ? toMcKinseyRawItem(parsed, '2026-04-12T12:00:00.000Z', ['strategy']) : null;
    expect(raw).toMatchObject({
      source: 'mckinsey',
      title: 'AI in healthcare operations',
      tags: expect.arrayContaining(['strategy', 'mckinsey digital'])
    });
  });
});
