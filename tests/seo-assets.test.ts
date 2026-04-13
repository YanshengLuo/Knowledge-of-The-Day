import { describe, expect, it } from 'vitest';
import { DEFAULT_SITE_URL, absoluteSiteUrl, normalizeSiteOrigin, pageMetadata } from '../config/site';
import { injectSeoTags, renderRobots, renderSitemap, routeOutputPath, sitemapEntries } from '../scripts/lib/static-site';

describe('canonical site URL helpers', () => {
  it('normalizes custom domains and avoids vercel.app canonical origins', () => {
    expect(normalizeSiteOrigin('https://www.biotrenddaily.com/')).toBe('https://www.biotrenddaily.com');
    expect(normalizeSiteOrigin('https://biotrend-daily.vercel.app')).toBe(DEFAULT_SITE_URL);
  });

  it('builds absolute canonical URLs from the configured origin', () => {
    expect(absoluteSiteUrl('/archive', 'https://www.biotrenddaily.com')).toBe('https://www.biotrenddaily.com/archive');
    expect(pageMetadata('/tools', 'https://www.biotrenddaily.com').canonicalUrl).toBe('https://www.biotrenddaily.com/tools');
  });
});

describe('static discovery assets', () => {
  it('renders sitemap entries with absolute URLs and lastmod dates', () => {
    const sitemap = renderSitemap(sitemapEntries('2026-04-12T12:00:00.000Z').slice(0, 2), 'https://www.biotrenddaily.com');

    expect(sitemap).toContain('<loc>https://www.biotrenddaily.com/</loc>');
    expect(sitemap).toContain('<loc>https://www.biotrenddaily.com/archive</loc>');
    expect(sitemap).toContain('<lastmod>2026-04-12</lastmod>');
  });

  it('renders simple robots.txt pointing at the sitemap', () => {
    expect(renderRobots('https://www.biotrenddaily.com')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://www.biotrenddaily.com/sitemap.xml\n'
    );
  });

  it('injects route-specific metadata into generated static HTML', () => {
    const html = injectSeoTags('<html><head></head><body></body></html>', pageMetadata('/about', 'https://www.biotrenddaily.com'));

    expect(html).toContain('<title>About | BioTrend Daily</title>');
    expect(html).toContain('<link rel="canonical" href="https://www.biotrenddaily.com/about" />');
    expect(routeOutputPath('/sources')).toBe('sources/index.html');
  });
});
