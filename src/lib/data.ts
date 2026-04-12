import type { ArchiveIndexEntry, Article, SourceStatus } from './types';

const baseUrl = import.meta.env.BASE_URL || '/';

export function dataUrl(file: string): string {
  return `${baseUrl}${file}`.replace(/\/{2,}/g, '/');
}

export async function loadArticles(): Promise<Article[]> {
  return loadJson<Article[]>('data/articles.json', []);
}

export async function loadSourceStatus(): Promise<SourceStatus[]> {
  return loadJson<SourceStatus[]>('data/source_status.json', []);
}

export async function loadArchiveIndex(): Promise<ArchiveIndexEntry[]> {
  return loadJson<ArchiveIndexEntry[]>('data/archive/index.json', []);
}

async function loadJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(dataUrl(file), { cache: 'no-cache' });
    if (!response.ok) {
      return fallback;
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}
