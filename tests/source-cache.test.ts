import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SourceId } from '../config/sources';
import type { RawFetchedItem } from '../scripts/lib/types';
import { parsePubMedRecordsXml, parsePubMedSearchIds } from '../scripts/lib/pubmed-parser';
import { runSourceAdapter, SourceAdapterError } from '../scripts/lib/source-runner';
import { readSourceCache, writeSourceCache } from '../scripts/lib/source-cache';

const touchedFiles = [
  'data/cache/pubmed.json',
  'data/cache/mckinsey.json',
  'data/raw/mckinsey.json',
  'data/source-runs/mckinsey.json'
];

let backups = new Map<string, string | null>();

beforeEach(async () => {
  backups = new Map();
  for (const file of touchedFiles) {
    backups.set(file, await readOptional(file));
  }
});

afterEach(async () => {
  for (const [file, content] of backups) {
    if (content === null) {
      await rm(projectPath(file), { force: true });
    } else {
      await mkdir(path.dirname(projectPath(file)), { recursive: true });
      await writeFile(projectPath(file), content, 'utf8');
    }
  }
});

describe('source cache helpers', () => {
  it('writes and reads validated source cache payloads', async () => {
    const item = rawItem('pubmed');
    await writeSourceCache('pubmed', [item], '2026-04-12T12:00:00.000Z');

    const cache = await readSourceCache('pubmed');

    expect(cache).toMatchObject({
      source: 'pubmed',
      cachedAt: '2026-04-12T12:00:00.000Z',
      itemCount: 1
    });
    expect(cache?.items[0].title).toBe(item.title);
  });

  it('returns null for invalid cache JSON', async () => {
    await mkdir(projectPath('data/cache'), { recursive: true });
    await writeFile(projectPath('data/cache/pubmed.json'), '{not valid json', 'utf8');

    await expect(readSourceCache('pubmed')).resolves.toBeNull();
  });

  it('uses fallback cache when an adapter fails', async () => {
    const item = rawItem('mckinsey');
    await writeSourceCache('mckinsey', [item], '2026-04-12T12:00:00.000Z');

    await runSourceAdapter('mckinsey', async () => {
      throw new SourceAdapterError('timeout', 'simulated timeout');
    });

    const run = JSON.parse(await readFile(projectPath('data/source-runs/mckinsey.json'), 'utf8')) as {
      success: boolean;
      usedFallback: boolean;
      fallbackReason?: string;
      cacheTimestamp?: string;
      itemCount: number;
    };

    expect(run.success).toBe(false);
    expect(run.usedFallback).toBe(true);
    expect(run.fallbackReason).toBe('timeout');
    expect(run.cacheTimestamp).toBe('2026-04-12T12:00:00.000Z');
    expect(run.itemCount).toBe(1);
  });
});

describe('PubMed parse safety', () => {
  it('handles invalid PubMed JSON without throwing', () => {
    expect(parsePubMedSearchIds('{not valid json')).toEqual({ value: [], errorReason: 'parse error' });
  });

  it('handles invalid PubMed XML without throwing', () => {
    expect(parsePubMedRecordsXml('<PubmedArticleSet><PubmedArticle></PubmedArticleSet>')).toEqual({
      value: [],
      errorReason: 'parse error'
    });
  });
});

function rawItem(source: SourceId): RawFetchedItem {
  return {
    title: `${source} cached item`,
    url: `https://example.com/${source}`,
    canonicalUrl: `https://example.com/${source}`,
    source,
    publishedAt: '2026-04-12T00:00:00.000Z',
    fetchedAt: '2026-04-12T12:00:00.000Z',
    snippet: 'Cached metadata only.',
    tags: ['cache-test'],
    topicBuckets: ['biotech']
  };
}

async function readOptional(file: string): Promise<string | null> {
  try {
    return await readFile(projectPath(file), 'utf8');
  } catch {
    return null;
  }
}

function projectPath(file: string): string {
  return path.join(process.cwd(), file);
}
