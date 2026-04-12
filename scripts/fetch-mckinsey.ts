import { SOURCES } from '../config/sources';
import { discoverMcKinseyCandidates, MCKINSEY_BROWSER_HEADERS } from './lib/mckinsey/discover';
import { parseMcKinseyPage, toMcKinseyRawItem } from './lib/mckinsey/parser';
import type { FallbackReason, RawFetchedItem } from './lib/types';
import { runSourceAdapter, SourceAdapterError } from './lib/source-runner';
import { fetchText, sleep } from './lib/utils';

const source = SOURCES.find((item) => item.id === 'mckinsey');
if (!source) {
  throw new Error('McKinsey source configuration is missing');
}

const MAX_CANDIDATES = 24;

await runSourceAdapter('mckinsey', async (fetchedAt) => {
  const discovery = await discoverMcKinseyCandidates(source.urls ?? [], MAX_CANDIDATES);
  const failures = [...discovery.errors];
  const itemsByUrl = new Map<string, RawFetchedItem>();

  if (discovery.candidates.length === 0) {
    throw new SourceAdapterError(
      classifyFailure(failures),
      `McKinsey discovery produced no article candidates; using fallback cache if available`
    );
  }

  for (const candidate of discovery.candidates) {
    try {
      const html = await fetchText(candidate.url, 20000, 1, MCKINSEY_BROWSER_HEADERS);
      const parsed = parseMcKinseyPage(html, candidate.url, fetchedAt);
      if (!parsed) {
        failures.push(`Could not parse useful metadata from ${candidate.url}`);
        continue;
      }

      const item = toMcKinseyRawItem(parsed, fetchedAt, source.defaultTags);
      itemsByUrl.set(item.canonicalUrl ?? item.url, item);
    } catch (error) {
      failures.push(`Failed to fetch ${candidate.url}: ${error instanceof Error ? error.message : String(error)}`);
    }

    await sleep(650 + Math.floor(Math.random() * 250));
  }

  const items = [...itemsByUrl.values()];
  if (items.length === 0) {
    throw new SourceAdapterError(
      classifyFailure(failures),
      `McKinsey fetch produced no parseable articles; using fallback cache if available`
    );
  }

  return failures.length > 0
    ? {
        items,
        warningMessage: `Partial McKinsey refresh: ${items.length} items parsed, ${failures.length} discovery/fetch/parse issue(s).`
      }
    : items;
});

function classifyFailure(failures: string[]): FallbackReason {
  const text = failures.join(' ').toLowerCase();
  if (text.includes('timeout') || text.includes('aborted')) {
    return 'timeout';
  }
  if (text.includes('parse') || text.includes('metadata')) {
    return 'parse error';
  }
  return 'request failure';
}
