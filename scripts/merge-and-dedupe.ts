import path from 'node:path';
import type { Article } from '../src/lib/types';
import { dedupeArticles } from './lib/dedupe';
import { dataDir, normalizedDir, readJson, writeJson } from './lib/utils';

const normalizedPath = path.join(normalizedDir, 'articles.normalized.json');
const normalizedArticles = await readJson<Article[]>(normalizedPath, []);
const dedupedArticles = dedupeArticles(normalizedArticles).sort(
  (left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt)
);

await writeJson(path.join(dataDir, 'articles.json'), dedupedArticles);
