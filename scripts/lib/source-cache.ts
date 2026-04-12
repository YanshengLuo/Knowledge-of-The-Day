import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SourceId } from '../../config/sources';
import type { RawFetchedItem } from './types';
import { cacheDir, ensureDir } from './utils';

export type SourceCachePayload = {
  source: SourceId;
  cachedAt: string;
  itemCount: number;
  items: RawFetchedItem[];
};

export async function readSourceCache(source: SourceId): Promise<SourceCachePayload | null> {
  const cachePath = path.join(cacheDir, `${source}.json`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(cachePath, 'utf8'));
  } catch {
    return null;
  }

  return normalizeCachePayload(source, parsed);
}

export async function writeSourceCache(source: SourceId, items: RawFetchedItem[], cachedAt = new Date().toISOString()): Promise<void> {
  const payload: SourceCachePayload = {
    source,
    cachedAt,
    itemCount: items.length,
    items
  };

  await ensureDir(cacheDir);
  await writeFile(path.join(cacheDir, `${source}.json`), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function normalizeCachePayload(source: SourceId, value: unknown): SourceCachePayload | null {
  if (Array.isArray(value)) {
    const items = value.filter(isRawFetchedItem);
    return {
      source,
      cachedAt: newestFetchedAt(items) ?? new Date(0).toISOString(),
      itemCount: items.length,
      items
    };
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const object = value as Partial<SourceCachePayload>;
  if (object.source !== source || !Array.isArray(object.items)) {
    return null;
  }

  const items = object.items.filter(isRawFetchedItem);
  return {
    source,
    cachedAt: typeof object.cachedAt === 'string' ? object.cachedAt : newestFetchedAt(items) ?? new Date(0).toISOString(),
    itemCount: items.length,
    items
  };
}

function isRawFetchedItem(value: unknown): value is RawFetchedItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<RawFetchedItem>;
  return typeof item.title === 'string' && typeof item.url === 'string' && typeof item.source === 'string' && typeof item.fetchedAt === 'string';
}

function newestFetchedAt(items: RawFetchedItem[]): string | undefined {
  const timestamps = items.map((item) => Date.parse(item.fetchedAt)).filter((timestamp) => !Number.isNaN(timestamp));
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : undefined;
}
