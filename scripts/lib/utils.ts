import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SourceId } from '../../config/sources';
import { DEFAULT_TOPIC_BUCKETS, TOPICS, type TopicKey } from '../../config/topics';

export const projectRoot = process.cwd();
export const dataDir = path.join(projectRoot, 'data');
export const cacheDir = path.join(dataDir, 'cache');
export const rawDir = path.join(dataDir, 'raw');
export const normalizedDir = path.join(dataDir, 'normalized');
export const sourceRunsDir = path.join(dataDir, 'source-runs');
export const archiveDir = path.join(dataDir, 'archive');
export const logsDir = path.join(projectRoot, 'logs');

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function readJsonFiles<T>(dir: string): Promise<T[]> {
  try {
    const files = (await readdir(dir)).filter((file) => file.endsWith('.json'));
    const values: T[] = [];
    for (const file of files) {
      const value = await readJson<T | null>(path.join(dir, file), null);
      if (value !== null) {
        values.push(value);
      }
    }
    return values;
  } catch {
    return [];
  }
}

export async function appendLog(source: any, message: string): Promise<void> {
  await ensureDir(logsDir);
  const line = `[${new Date().toISOString()}] ${message}\n`;
  await writeFile(path.join(logsDir, `${source}.log`), line, {
    flag: 'a',
    encoding: 'utf8'
  });
}

export async function fetchText(
  url: string,
  timeoutMs = 20000,
  retries = 2,
  headers: Record<string, string> = {}
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const fetchPromise = fetch(url, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          accept:
            'text/html,application/xhtml+xml,application/xml,text/xml,application/rss+xml;q=0.9,*/*;q=0.8',
          ...headers
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response || !(response instanceof Response)) {
        throw new Error('Invalid response');
      }

      if (!response.ok) {
        if (![408, 429, 500, 502, 503, 504].includes(response.status) || attempt === retries) {
          throw new Error(`HTTP ${response.status} while fetching ${url}`);
        }
        lastError = new Error(`HTTP ${response.status}`);
      } else {
        return await response.text();
      }
    } catch (error) {
      lastError = error;

      if (attempt === retries) break;

      console.warn(`Retrying fetch (${attempt + 1}/${retries}) for ${url}`);
      await sleep(1000 * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to fetch ${url}`);
}

function redactUrlForLog(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.search = url.search ? '?...' : '';
    return url.toString();
  } catch {
    return rawUrl.split('?')[0];
  }
}

export function stripHtml(input = ''): string {
  return decodeEntities(input.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

export function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function truncate(input = '', maxLength = 320): string {
  const text = stripHtml(input);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

export function canonicalizeUrl(rawUrl: string, base?: string): string {
  const url = new URL(rawUrl.trim(), base);
  url.hash = '';
  url.hostname = url.hostname.toLowerCase();

  const trackingPrefixes = ['utm_', 'vero_'];
  const trackingParams = new Set(['fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'ref_src', 'cmpid']);
  for (const key of [...url.searchParams.keys()]) {
    if (trackingParams.has(key.toLowerCase()) || trackingPrefixes.some((prefix) => key.toLowerCase().startsWith(prefix))) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();

  let normalized = url.toString();
  normalized = normalized.replace(/\/\?/, '?');
  if (url.pathname !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

export function normalizeTitle(title: string): string {
  return stripHtml(title)
    .toLowerCase()
    .replace(/['"\u2018\u2019\u201c\u201d]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashId(input: string): string {
  return createHash('sha1').update(input).digest('hex').slice(0, 16);
}

export function parseDateToIso(value: string | undefined, fallbackIso: string): string {
  if (!value) {
    return fallbackIso;
  }

  const cleaned = stripHtml(value).replace(/\b(updated|published|posted|on)\b:?/gi, '').trim();
  const dateOnly = parseDateOnlyToUtc(cleaned);
  if (dateOnly) {
    return dateOnly;
  }

  const parsed = Date.parse(cleaned);
  if (Number.isNaN(parsed)) {
    return fallbackIso;
  }

  return new Date(parsed).toISOString();
}

function parseDateOnlyToUtc(value: string): string | undefined {
  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    return new Date(Date.UTC(Number(isoDateMatch[1]), Number(isoDateMatch[2]) - 1, Number(isoDateMatch[3]))).toISOString();
  }

  const monthDateMatch = value.match(
    /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2}),?\s+(\d{4})$/i
  );
  if (!monthDateMatch) {
    return undefined;
  }

  const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(
    monthDateMatch[1].slice(0, 3).toLowerCase()
  );
  return new Date(Date.UTC(Number(monthDateMatch[3]), month, Number(monthDateMatch[2]))).toISOString();
}

export function isoDate(value: string): string {
  return value.slice(0, 10);
}

export function isPublishedToday(publishedAt: string, referenceIso = new Date().toISOString()): boolean {
  return isoDate(publishedAt) === isoDate(referenceIso);
}

export function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)).map((value) => value.trim()).filter(Boolean))];
}

export function inferTopicBuckets(text: string, seedBuckets: TopicKey[] = []): TopicKey[] {
  const haystack = normalizeTitle(text);
  const matches = TOPICS.filter((topic) =>
    topic.keywords.some((keyword) => haystack.includes(normalizeTitle(keyword)))
  ).map((topic) => topic.id);

  return uniqueStrings([...seedBuckets, ...matches]) as TopicKey[];
}

export function normalizeTopicBuckets(seedBuckets: TopicKey[] | undefined, text: string): TopicKey[] {
  const inferred = inferTopicBuckets(text, seedBuckets);
  return inferred.length > 0 ? inferred : DEFAULT_TOPIC_BUCKETS;
}

export function titleSimilarity(leftTitle: string, rightTitle: string): number {
  const left = new Set(normalizeTitle(leftTitle).split(' ').filter((token) => token.length > 2));
  const right = new Set(normalizeTitle(rightTitle).split(' ').filter((token) => token.length > 2));
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return intersection / union;
}

export function pickBestDuplicate<T extends { snippet: string; fetchedAt: string; publishedAt: string }>(left: T, right: T): T {
  if (right.snippet.length > left.snippet.length + 40) {
    return right;
  }

  if (Date.parse(right.publishedAt) > Date.parse(left.publishedAt)) {
    return right;
  }

  if (Date.parse(right.fetchedAt) > Date.parse(left.fetchedAt)) {
    return right;
  }

  return left;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
