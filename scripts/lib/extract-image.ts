import * as cheerio from 'cheerio';
import type { ImageSource } from './types';
import { stripHtml } from './utils';

export type ExtractedImage = {
  url: string;
  source: Extract<ImageSource, 'og' | 'twitter'>;
};

export function extractImageFromHtml(html: string): string | null {
  return extractImageMetadataFromHtml(html)?.url ?? null;
}

export function extractImageMetadataFromHtml(html: string): ExtractedImage | null {
  try {
    const $ = cheerio.load(html);
    const ogImage = metaContent($, 'meta[property="og:image"], meta[name="og:image"]');
    if (ogImage) {
      return { url: ogImage, source: 'og' };
    }

    const twitterImage = metaContent($, 'meta[name="twitter:image"], meta[property="twitter:image"]');
    if (twitterImage) {
      return { url: twitterImage, source: 'twitter' };
    }

    return null;
  } catch {
    return null;
  }
}

function metaContent($: cheerio.CheerioAPI, selector: string): string | null {
  const value = stripHtml($(selector).first().attr('content') ?? '');
  return value || null;
}
