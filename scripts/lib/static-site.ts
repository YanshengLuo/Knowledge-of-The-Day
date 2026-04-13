import { SITE_PAGES, absoluteSiteUrl, pageMetadata, siteOriginFromEnv, type PageMetadata, type SitePage } from '../../config/site';

export type SitemapEntry = Pick<SitePage, 'path' | 'changeFrequency' | 'priority'> & {
  lastmod?: string;
};

const SEO_START = '<!-- biotrend-seo:start -->';
const SEO_END = '<!-- biotrend-seo:end -->';

export function configuredSiteOrigin(env: Record<string, string | undefined> = process.env): string {
  return siteOriginFromEnv(env);
}

export function sitemapEntries(lastmod?: string): SitemapEntry[] {
  return SITE_PAGES.map((page) => ({
    path: page.path,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    lastmod
  }));
}

export function renderSitemap(entries: SitemapEntry[], origin: string): string {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `\n    <lastmod>${escapeXml(toDateOnly(entry.lastmod))}</lastmod>` : '';
      return [
        '  <url>',
        `    <loc>${escapeXml(absoluteSiteUrl(entry.path, origin))}</loc>${lastmod}`,
        `    <changefreq>${entry.changeFrequency}</changefreq>`,
        `    <priority>${entry.priority.toFixed(1)}</priority>`,
        '  </url>'
      ].join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderRobots(origin: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${absoluteSiteUrl('/sitemap.xml', origin)}`,
    ''
  ].join('\n');
}

export function renderSeoTags(metadata: PageMetadata): string {
  return [
    SEO_START,
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(metadata.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.ogDescription)}" />`,
    `<meta property="og:url" content="${escapeHtml(metadata.ogUrl)}" />`,
    `<meta property="og:type" content="${metadata.ogType}" />`,
    `<meta property="og:image" content="${escapeHtml(metadata.imageUrl)}" />`,
    `<meta name="twitter:card" content="${metadata.twitterCard}" />`,
    `<meta name="twitter:title" content="${escapeHtml(metadata.twitterTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.twitterDescription)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(metadata.imageUrl)}" />`,
    SEO_END
  ].join('\n    ');
}

export function injectSeoTags(html: string, metadata: PageMetadata): string {
  const tags = renderSeoTags(metadata);
  const markerPattern = new RegExp(`${escapeRegExp(SEO_START)}[\\s\\S]*?${escapeRegExp(SEO_END)}`);

  if (markerPattern.test(html)) {
    return html.replace(markerPattern, tags);
  }

  return html.replace('</head>', `    ${tags}\n  </head>`);
}

export function routeOutputPath(routePath: string): string {
  return routePath === '/' ? 'index.html' : `${routePath.replace(/^\//, '')}/index.html`;
}

export function metadataForRoute(routePath: string, origin: string): PageMetadata {
  return pageMetadata(routePath, origin);
}

function toDateOnly(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value.slice(0, 10);
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
