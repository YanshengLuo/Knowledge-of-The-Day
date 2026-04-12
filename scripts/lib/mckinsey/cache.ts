import type { RawFetchedItem } from '../types';
import { readSourceCache, writeSourceCache } from '../source-cache';

export async function readMcKinseyCache() {
  return readSourceCache('mckinsey');
}

export async function writeMcKinseyCache(items: RawFetchedItem[], cachedAt?: string): Promise<void> {
  await writeSourceCache('mckinsey', items, cachedAt);
}
