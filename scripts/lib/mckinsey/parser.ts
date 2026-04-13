import * as cheerio from 'cheerio';
import type { RawFetchedItem } from '../types';
import type { McKinseyParsedPage } from './types';
import { normalizeMcKinseyUrl } from './filters';
import { parseDateToIso, stripHtml, truncate, uniqueStrings } from '../utils';

type JsonObject = Record<string, unknown>;

export function parseMcKinseyPage(html: string, pageUrl: string, fetchedAt: string): McKinseyParsedPage | null {
  const $ = cheerio.load(html);
  $('script:not([type="application/ld+json"]), style, noscript, svg').remove();

  const structured = findStructuredArticle($);
  const canonicalUrl = normalizeMcKinseyUrl(
    meta($, 'link[rel="canonical"]', 'href') || structuredString(structured, 'url') || pageUrl,
    pageUrl
  );

  if (!canonicalUrl) {
    return null;
  }

  const title = cleanTitle(
    structuredString(structured, 'headline') ||
      structuredString(structured, 'name') ||
      meta($, 'meta[property="og:title"]', 'content') ||
      meta($, 'meta[name="twitter:title"]', 'content') ||
      $('h1').first().text() ||
      $('title').first().text()
  );

  if (!title) {
    return null;
  }

  const summary = truncate(
    structuredString(structured, 'description') ||
      meta($, 'meta[name="description"]', 'content') ||
      meta($, 'meta[property="og:description"]', 'content') ||
      $('h2, .subtitle, [data-testid*="description"], p').map((_, node) => stripHtml($(node).text())).get().find((text) => text.length > 50) ||
      '',
    320
  );

  return {
    url: pageUrl,
    finalUrl: canonicalUrl,
    canonicalUrl,
    imageUrl: findImageUrl($, structured, canonicalUrl),
    title,
    subtitle: firstNonEmpty([
      meta($, 'meta[property="og:description"]', 'content'),
      $('h2').first().text()
    ]),
    authors: extractAuthors(structured),
    publishedAt: parseDateToIso(
      structuredString(structured, 'datePublished') ||
        meta($, 'meta[property="article:published_time"]', 'content') ||
        meta($, 'meta[name="date"]', 'content') ||
        findDateText($),
      fetchedAt
    ),
    updatedAt: parseDateToIso(
      structuredString(structured, 'dateModified') ||
        meta($, 'meta[property="article:modified_time"]', 'content'),
      fetchedAt
    ),
    section: sectionFromUrl(canonicalUrl),
    contentType: structuredType(structured),
    summary,
    bodyText: truncate($('main, article, body').first().text(), 800),
    fetchMethod: 'static',
    scrapeStatus: 'success'
  };
}

export function toMcKinseyRawItem(parsed: McKinseyParsedPage, fetchedAt: string, defaultTags: string[]): RawFetchedItem {
  return {
    title: parsed.title,
    url: parsed.finalUrl,
    canonicalUrl: parsed.canonicalUrl,
    imageUrl: parsed.imageUrl,
    source: 'mckinsey',
    publicationName: 'McKinsey',
    publishedAt: parsed.publishedAt,
    fetchedAt,
    snippet: parsed.summary,
    tags: uniqueStrings([...defaultTags, parsed.section, parsed.contentType, ...parsed.authors.map((author) => `author:${author}`)]),
    topicBuckets: []
  };
}

function findStructuredArticle($: cheerio.CheerioAPI): JsonObject | null {
  const scripts = $('script[type="application/ld+json"]').map((_, node) => $(node).contents().text()).get();
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script) as unknown;
      const article = findArticleObject(parsed);
      if (article) {
        return article;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function findArticleObject(value: unknown): JsonObject | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findArticleObject(item);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const object = value as JsonObject;
  if (Array.isArray(object['@graph'])) {
    return findArticleObject(object['@graph']);
  }

  const type = object['@type'];
  const types = Array.isArray(type) ? type.map(String) : [String(type ?? '')];
  if (types.some((item) => ['Article', 'NewsArticle', 'Report', 'CreativeWork', 'BlogPosting'].includes(item))) {
    return object;
  }

  return null;
}

function meta($: cheerio.CheerioAPI, selector: string, attribute: string): string {
  return stripHtml($(selector).first().attr(attribute) ?? '');
}

function structuredString(object: JsonObject | null, key: string): string {
  const value = object?.[key];
  if (typeof value === 'string' || typeof value === 'number') {
    return stripHtml(String(value));
  }
  return '';
}

function findImageUrl($: cheerio.CheerioAPI, structured: JsonObject | null, baseUrl: string): string | undefined {
  const structuredImage = structured?.image;
  const candidate =
    structuredImageToString(structuredImage) ||
    meta($, 'meta[property="og:image"]', 'content') ||
    meta($, 'meta[name="twitter:image"]', 'content');

  if (!candidate) {
    return undefined;
  }

  try {
    return normalizeMcKinseyUrl(candidate, baseUrl) ?? undefined;
  } catch {
    return undefined;
  }
}

function structuredImageToString(value: unknown): string {
  if (typeof value === 'string') {
    return stripHtml(value);
  }
  if (Array.isArray(value)) {
    return structuredImageToString(value[0]);
  }
  if (value && typeof value === 'object') {
    const object = value as JsonObject;
    return structuredString(object, 'url') || structuredString(object, 'contentUrl');
  }
  return '';
}

function extractAuthors(object: JsonObject | null): string[] {
  const authorValue = object?.author;
  const authors = Array.isArray(authorValue) ? authorValue : authorValue ? [authorValue] : [];
  return uniqueStrings(authors.map((author) => {
    if (typeof author === 'string') {
      return stripHtml(author);
    }
    if (author && typeof author === 'object' && 'name' in author) {
      return stripHtml(String((author as { name?: unknown }).name ?? ''));
    }
    return '';
  }));
}

function structuredType(object: JsonObject | null): string | undefined {
  const type = object?.['@type'];
  if (Array.isArray(type)) {
    return type.map(String).find(Boolean);
  }
  return typeof type === 'string' ? type : undefined;
}

function cleanTitle(value: string): string {
  return stripHtml(value).replace(/\s+\|\s+McKinsey(?:\s*&\s*Company)?$/i, '').trim();
}

function firstNonEmpty(values: string[]): string | undefined {
  return values.map(stripHtml).find(Boolean);
}

function findDateText($: cheerio.CheerioAPI): string {
  return stripHtml($('time').first().attr('datetime') || $('time').first().text());
}

function sectionFromUrl(url: string): string | undefined {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  const industriesIndex = parts.indexOf('industries');
  if (industriesIndex >= 0 && parts[industriesIndex + 1]) {
    return parts[industriesIndex + 1].replace(/-/g, ' ');
  }
  const capabilitiesIndex = parts.indexOf('capabilities');
  if (capabilitiesIndex >= 0 && parts[capabilitiesIndex + 1]) {
    return parts[capabilitiesIndex + 1].replace(/-/g, ' ');
  }
  return parts[0]?.replace(/-/g, ' ');
}
