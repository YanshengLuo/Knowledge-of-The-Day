import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { SourceId } from '../../config/sources';
import type { RawFetchedItem } from './types';
import { canonicalizeUrl, fetchText, parseDateToIso, stripHtml, truncate, uniqueStrings } from './utils';

export type ListingParseOptions = {
  source: SourceId;
  url: string;
  fetchedAt: string;
  baseUrl: string;
  defaultTags: string[];
  includeUrl: (url: string) => boolean;
  maxItems?: number;
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
};

const DATE_TEXT_PATTERN =
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},?\s+\d{4}\b/i;

export async function parsePublicListingPage(options: ListingParseOptions): Promise<RawFetchedItem[]> {
  const html = await fetchText(options.url, options.timeoutMs ?? 45000, options.retries ?? 1, options.headers);
  const $ = cheerio.load(html);
  $('script, style, noscript, svg').remove();

  const seen = new Set<string>();
  const items: RawFetchedItem[] = [];

  $('a[href]').each((_, element) => {
    if (items.length >= (options.maxItems ?? 30)) {
      return;
    }

    const href = $(element).attr('href');
    if (!href) {
      return;
    }

    let canonicalUrl: string;
    try {
      canonicalUrl = canonicalizeUrl(href, options.baseUrl);
    } catch {
      return;
    }

    if (seen.has(canonicalUrl) || !options.includeUrl(canonicalUrl)) {
      return;
    }

    const title = getTitle($, element);
    if (!looksLikeArticleTitle(title)) {
      return;
    }

    seen.add(canonicalUrl);
    const richContainer = $(element).closest('article, li, section, div');
    const container = richContainer.length > 0 ? richContainer : $(element).parent().parent().parent();
    const publishedAt = findDate($, container, options.fetchedAt);
    const snippet = findSnippet($, container, title);

    items.push({
      title,
      url: canonicalUrl,
      canonicalUrl,
      source: options.source,
      publishedAt,
      fetchedAt: options.fetchedAt,
      snippet,
      tags: uniqueStrings([...options.defaultTags]),
      topicBuckets: []
    });
  });

  return items;
}

function getTitle($: cheerio.CheerioAPI, element: AnyNode): string {
  const anchor = $(element);
  return stripHtml(anchor.attr('aria-label') || anchor.attr('title') || anchor.text());
}

function looksLikeArticleTitle(title: string): boolean {
  const cleaned = title.trim();
  if (cleaned.length < 24 || cleaned.length > 220) {
    return false;
  }

  const lower = cleaned.toLowerCase();
  const noisy = ['sign up', 'subscribe', 'privacy', 'terms', 'cookie', 'contact us', 'advertise', 'read more'];
  if (noisy.some((phrase) => lower.includes(phrase))) {
    return false;
  }

  return cleaned.split(/\s+/).length >= 4;
}

function findDate($: cheerio.CheerioAPI, container: cheerio.Cheerio<AnyNode>, fallbackIso: string): string {
  const timeValue = container.find('time').first().attr('datetime') || container.find('time').first().text();
  if (timeValue) {
    return parseDateToIso(timeValue, fallbackIso);
  }

  const match = stripHtml(container.text()).match(DATE_TEXT_PATTERN);
  return parseDateToIso(match?.[0], fallbackIso);
}

function findSnippet($: cheerio.CheerioAPI, container: cheerio.Cheerio<AnyNode>, title: string): string {
  const candidates = container
    .find('p, .description, .dek, .summary, [class*="description"], [class*="excerpt"]')
    .map((_, node) => stripHtml($(node).text()))
    .get()
    .filter((text) => text.length > 40 && !text.includes(title));

  return truncate(candidates[0] ?? '', 280);
}
