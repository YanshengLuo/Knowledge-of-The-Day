import path from 'node:path';
import type { SourceStatus } from '../src/lib/types';
import { configuredSiteOrigin, renderSitemap, sitemapEntries } from './lib/static-site';
import { dataDir, projectRoot, readJson, writeFileText } from './lib/utils';

const statuses = await readJson<SourceStatus[]>(path.join(dataDir, 'source_status.json'), []);
const lastmod = latestFetchedAt(statuses);
const sitemap = renderSitemap(sitemapEntries(lastmod), configuredSiteOrigin());

await writeFileText(path.join(projectRoot, 'public', 'sitemap.xml'), sitemap);

function latestFetchedAt(statuses: SourceStatus[]): string | undefined {
  const timestamps = statuses.map((status) => Date.parse(status.fetchedAt)).filter((value) => !Number.isNaN(value));
  if (timestamps.length === 0) {
    return undefined;
  }
  return new Date(Math.max(...timestamps)).toISOString();
}
