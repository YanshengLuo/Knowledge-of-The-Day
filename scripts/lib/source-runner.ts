import path from 'node:path';
import type { SourceId } from '../../config/sources';
import type { RawFetchedItem, SourceRun } from './types';
import { appendLog, cacheDir, ensureDir, rawDir, sourceRunsDir, writeJson, readJson } from './utils';

type FetchSourceItems = (fetchedAt: string) => Promise<RawFetchedItem[]>;

export async function runSourceAdapter(source: SourceId, fetchItems: FetchSourceItems): Promise<void> {
  await Promise.all([ensureDir(cacheDir), ensureDir(rawDir), ensureDir(sourceRunsDir)]);

  const fetchedAt = new Date().toISOString();
  const cachePath = path.join(cacheDir, `${source}.json`);
  const rawPath = path.join(rawDir, `${source}.json`);
  const sourceRunPath = path.join(sourceRunsDir, `${source}.json`);

  try {
    await appendLog(source, `Starting fetch for ${source}`);
    const items = await fetchItems(fetchedAt);
    await writeJson(cachePath, items);
    await writeJson(rawPath, items);
    await writeJson(sourceRunPath, {
      source,
      success: true,
      fetchedAt,
      itemCount: items.length,
      items
    } satisfies SourceRun);
    await appendLog(source, `Fetch succeeded with ${items.length} items`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const cachedItems = await readJson<RawFetchedItem[]>(cachePath, []);
    await writeJson(rawPath, cachedItems);
    await writeJson(sourceRunPath, {
      source,
      success: false,
      fetchedAt,
      itemCount: cachedItems.length,
      errorMessage,
      items: cachedItems
    } satisfies SourceRun);
    await appendLog(source, `Fetch failed: ${errorMessage}`);
    await appendLog(source, `Using ${cachedItems.length} cached items`);
  }
}
