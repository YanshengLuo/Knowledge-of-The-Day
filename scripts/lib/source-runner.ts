import path from 'node:path';
import type { SourceId } from '../../config/sources';
import type { FallbackReason, RawFetchedItem, SourceRun } from './types';
import { readSourceCache, writeSourceCache } from './source-cache';
import { appendLog, cacheDir, ensureDir, rawDir, sourceRunsDir, writeJson } from './utils';

type FetchSourceItems = (fetchedAt: string) => Promise<RawFetchedItem[]>;

export class SourceAdapterError extends Error {
  constructor(
    public readonly fallbackReason: FallbackReason,
    message: string
  ) {
    super(message);
    this.name = 'SourceAdapterError';
  }
}

export async function runSourceAdapter(source: SourceId, fetchItems: FetchSourceItems): Promise<void> {
  await Promise.all([ensureDir(cacheDir), ensureDir(rawDir), ensureDir(sourceRunsDir)]);

  const fetchedAt = new Date().toISOString();
  const rawPath = path.join(rawDir, `${source}.json`);
  const sourceRunPath = path.join(sourceRunsDir, `${source}.json`);

  try {
    await appendLog(source, `Starting fetch for ${source}`);
    const items = await fetchItems(fetchedAt);
    await writeSourceCache(source, items, fetchedAt);
    await writeJson(rawPath, items);
    await writeJson(sourceRunPath, {
      source,
      success: true,
      fetchedAt,
      itemCount: items.length,
      usedFallback: false,
      items
    } satisfies SourceRun);
    await appendLog(source, `Fetch succeeded with ${items.length} items`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fallbackReason = inferFallbackReason(error);
    const cache = await readSourceCache(source);
    const cachedItems = cache?.items ?? [];
    await writeJson(rawPath, cachedItems);
    await writeJson(sourceRunPath, {
      source,
      success: false,
      fetchedAt,
      itemCount: cachedItems.length,
      errorMessage,
      usedFallback: Boolean(cache),
      fallbackReason,
      cacheTimestamp: cache?.cachedAt,
      items: cachedItems
    } satisfies SourceRun);
    await appendLog(source, `Fetch failed: ${errorMessage}`);
    if (cache) {
      await appendLog(source, `Using fallback cache from ${cache.cachedAt} with ${cachedItems.length} items`);
    } else {
      await appendLog(source, `No fallback cache available; using 0 items`);
    }
  }
}

function inferFallbackReason(error: unknown): FallbackReason {
  if (error instanceof SourceAdapterError) {
    return error.fallbackReason;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes('timeout') || message.includes('aborted')) {
    return 'timeout';
  }
  if (message.includes('parse') || message.includes('json') || message.includes('xml')) {
    return 'parse error';
  }
  return 'request failure';
}
