import { SOURCES } from '../config/sources';
import type { FallbackReason, RawFetchedItem } from './lib/types';
import { parsePublicListingPage } from './lib/listing-parser';
import { runSourceAdapter, SourceAdapterError } from './lib/source-runner';
import { sleep } from './lib/utils';

const source = SOURCES.find((item) => item.id === 'mckinsey');
if (!source) {
  throw new Error('McKinsey source configuration is missing');
}

await runSourceAdapter('mckinsey', async (fetchedAt) => {
  const pages = source.urls ?? [];
  const items: RawFetchedItem[] = [];
  let failureReason: FallbackReason | undefined;

  for (const url of pages) {
    try {
      const pageItems = await parsePublicListingPage({
        source: 'mckinsey',
        url,
        baseUrl: source.homepage,
        fetchedAt,
        defaultTags: source.defaultTags,
        maxItems: 18,
        timeoutMs: 20000,
        retries: 1,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        },
        includeUrl: (candidateUrl) =>
          candidateUrl.includes('mckinsey.com') &&
          candidateUrl.includes('/our-insights/') &&
          candidateUrl !== url
      });

      items.push(...pageItems);
    } catch (error) {
      failureReason = failureReason ?? classifyMcKinseyFailure(error);
      console.warn(
        `McKinsey page failed: ${url}`,
        error instanceof Error ? error.message : String(error)
      );
    }

    await sleep(750);
  }

  if (items.length === 0) {
    throw new SourceAdapterError(
      failureReason ?? 'parse error',
      'McKinsey produced no listing items; using fallback cache if available'
    );
  }

  if (failureReason) {
    console.warn(
      'One or more McKinsey listing pages failed, but partial results were collected. Returning partial fresh data.'
    );
  }

  return items;
});

function classifyMcKinseyFailure(error: unknown): FallbackReason {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return message.includes('timeout') || message.includes('aborted')
    ? 'timeout'
    : 'request failure';
}