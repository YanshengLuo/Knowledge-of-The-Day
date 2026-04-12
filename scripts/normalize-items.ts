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
      publicationName: rawItem.publicationName || sourcePublicationName(rawItem.source),
      journalName: rawItem.journalName,
      publishedAt,
      fetchedAt: rawItem.fetchedAt || run.fetchedAt,
      snippet,
      tags,
      topicBuckets,
      isNewToday: isPublishedToday(publishedAt, runStartedAt),
      importanceScore: rawItem.importanceScore,
      importanceSignals: rawItem.importanceSignals,
      isFeatured: rawItem.isFeatured
    });
  }
}

await writeJson(path.join(normalizedDir, 'articles.normalized.json'), articles);

function sourcePublicationName(source: Article['source']): string {
  const names: Record<Article['source'], string> = {
    biospace: 'BioSpace',
    pubmed: 'PubMed',
    mckinsey: 'McKinsey',
    a16z: 'a16z',
    crunchbase: 'Crunchbase News'
  };
  return names[source];
}
