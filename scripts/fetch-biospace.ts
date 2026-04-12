import Parser from 'rss-parser';
import { SOURCES } from '../config/sources';
import type { RawFetchedItem } from './lib/types';
import { runSourceAdapter } from './lib/source-runner';
import { canonicalizeUrl, truncate, uniqueStrings } from './lib/utils';

const source = SOURCES.find((item) => item.id === 'biospace');
if (!source) {
  throw new Error('BioSpace source configuration is missing');
}

const parser = new Parser({
  headers: {
    'user-agent': 'BioTrendDaily/0.1 metadata-only RSS reader'
  }
});

await runSourceAdapter('biospace', async (fetchedAt) => {
  const feedUrls = source.urls?.filter((url) => url.endsWith('.rss')) ?? [];
  const items: RawFetchedItem[] = [];

  for (const feedUrl of feedUrls) {
    const feed = await parser.parseURL(feedUrl);
    for (const entry of feed.items.slice(0, 30)) {
      if (!entry.title || !entry.link) {
        continue;
      }

      const canonicalUrl = canonicalizeUrl(entry.link, source.homepage);
      items.push({
        title: entry.title,
        url: canonicalUrl,
        canonicalUrl,
        source: 'biospace',
        publishedAt: entry.isoDate ?? entry.pubDate ?? fetchedAt,
        fetchedAt,
        snippet: truncate(entry.contentSnippet || entry.summary || entry.content || ''),
        tags: uniqueStrings([...source.defaultTags, ...(entry.categories ?? [])]),
        topicBuckets: []
      });
    }
  }

  return items;
});
