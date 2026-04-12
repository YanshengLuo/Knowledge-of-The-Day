import * as cheerio from 'cheerio';
import type { McKinseyCandidate, McKinseyDiscoveryResult } from './types';
import { isMcKinseyArticleCandidate, normalizeMcKinseyUrl } from './filters';
import { fetchText, sleep } from '../utils';

export const MCKINSEY_BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache'
};

export async function discoverMcKinseyCandidates(seedUrls: string[], maxCandidates = 30): Promise<McKinseyDiscoveryResult> {
  const byUrl = new Map<string, McKinseyCandidate>();
  const errors: string[] = [];

  for (const seedUrl of seedUrls) {
    const normalizedSeed = normalizeMcKinseyUrl(seedUrl);
    if (!normalizedSeed) {
      errors.push(`Invalid McKinsey seed URL: ${seedUrl}`);
      continue;
    }

    if (isMcKinseyArticleCandidate(normalizedSeed)) {
      byUrl.set(normalizedSeed, {
        url: normalizedSeed,
        sourceUrl: normalizedSeed,
        discoveryMethod: 'seed-url'
      });
    }

    try {
      const html = await fetchText(normalizedSeed, 20000, 1, MCKINSEY_BROWSER_HEADERS);
      for (const candidate of discoverCandidatesFromHtml(html, normalizedSeed)) {
        byUrl.set(candidate.url, candidate);
        if (byUrl.size >= maxCandidates) {
          break;
        }
      }
    } catch (error) {
      errors.push(`Failed to discover from ${normalizedSeed}: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (byUrl.size >= maxCandidates) {
      break;
    }

    await sleep(750);
  }

  return {
    candidates: [...byUrl.values()].slice(0, maxCandidates),
    errors
  };
}

export function discoverCandidatesFromHtml(html: string, sourceUrl: string): McKinseyCandidate[] {
  const $ = cheerio.load(html);
  const candidates = new Map<string, McKinseyCandidate>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) {
      return;
    }

    const url = normalizeMcKinseyUrl(href, sourceUrl);
    if (!url || !isMcKinseyArticleCandidate(url)) {
      return;
    }

    candidates.set(url, {
      url,
      sourceUrl,
      discoveryMethod: 'seed-page'
    });
  });

  return [...candidates.values()];
}
