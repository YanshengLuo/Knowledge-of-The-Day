import path from 'node:path';
import type { SourceRun } from './lib/types';
import type { Article } from '../src/lib/types';
import {
  canonicalizeUrl,
  hashId,
  isPublishedToday,
  normalizeTopicBuckets,
  parseDateToIso,
  readJsonFiles,
  sourceRunsDir,
  stripHtml,
  truncate,
  uniqueStrings,
  normalizedDir,
  writeJson
} from './lib/utils';

const runs = await readJsonFiles<SourceRun>(sourceRunsDir);
const articles: Article[] = [];
const runStartedAt = new Date().toISOString();

for (const run of runs) {
  for (const rawItem of run.items) {
    const title = stripHtml(rawItem.title);
    if (!title || !rawItem.url) {
      continue;
    }

    const canonicalUrl = canonicalizeUrl(rawItem.canonicalUrl || rawItem.url);
    const publishedAt = parseDateToIso(rawItem.publishedAt, rawItem.fetchedAt || runStartedAt);
    const snippet = truncate(rawItem.snippet || '', 360);
    const tags = uniqueStrings(rawItem.tags ?? []);
    const topicBuckets = normalizeTopicBuckets(rawItem.topicBuckets, `${title} ${snippet} ${tags.join(' ')}`);

    articles.push({
      id: hashId(`${rawItem.source}:${canonicalUrl}`),
      title,
      url: canonicalUrl,
      canonicalUrl,
      source: rawItem.source,
      publishedAt,
      fetchedAt: rawItem.fetchedAt || run.fetchedAt,
      snippet,
      tags,
      topicBuckets,
      isNewToday: isPublishedToday(publishedAt, runStartedAt)
    });
  }
}

await writeJson(path.join(normalizedDir, 'articles.normalized.json'), articles);
