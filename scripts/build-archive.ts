import path from 'node:path';
import type { ArchiveIndexEntry, Article } from '../src/lib/types';
import { archiveDir, dataDir, isoDate, readJson, writeJson } from './lib/utils';

const articles = await readJson<Article[]>(path.join(dataDir, 'articles.json'), []);
const byDate = new Map<string, Article[]>();

for (const article of articles) {
  const date = isoDate(article.publishedAt);
  byDate.set(date, [...(byDate.get(date) ?? []), article]);
}

const index: ArchiveIndexEntry[] = [];
for (const [date, dateArticles] of [...byDate.entries()].sort(([left], [right]) => right.localeCompare(left))) {
  const file = `${date}.json`;
  index.push({ date, count: dateArticles.length, file });
  await writeJson(path.join(archiveDir, file), dateArticles);
}

await writeJson(path.join(archiveDir, 'index.json'), index);
