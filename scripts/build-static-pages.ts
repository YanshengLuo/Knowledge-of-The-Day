import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_PAGES } from '../config/site';
import { configuredSiteOrigin, injectSeoTags, metadataForRoute, routeOutputPath } from './lib/static-site';
import { ensureDir, projectRoot } from './lib/utils';

const distDir = path.join(projectRoot, 'dist');
const indexPath = path.join(distDir, 'index.html');
const baseHtml = await readFile(indexPath, 'utf8');
const origin = configuredSiteOrigin();

for (const page of SITE_PAGES) {
  const outputPath = path.join(distDir, routeOutputPath(page.path));
  const html = injectSeoTags(baseHtml, metadataForRoute(page.path, origin));

  await ensureDir(path.dirname(outputPath));
  await writeFile(outputPath, html, 'utf8');
}
