export const SITE_NAME = 'BioTrend Daily';

export const SITE_DESCRIPTION =
  'A metadata-only intelligence dashboard tracking biotech, computational biology, AI, and translational medicine trends.';

export const DEFAULT_SITE_URL = 'https://biotrend-daily.com';

export const DEFAULT_OG_IMAGE_PATH = '/og-image.svg';

export type SitePage = {
  path: string;
  title: string;
  description: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
  priority: number;
};

export type PageMetadata = {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogType: 'website';
  twitterCard: 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  imageUrl: string;
};

export const SITE_PAGES: SitePage[] = [
  {
    path: '/',
    title: 'BioTrend Daily | Biotech and AI Trend Dashboard',
    description: SITE_DESCRIPTION,
    changeFrequency: 'daily',
    priority: 1
  },
  {
    path: '/archive',
    title: 'Archive | BioTrend Daily',
    description: 'Browse date-grouped BioTrend Daily metadata snapshots and historical biotech trend records.',
    changeFrequency: 'daily',
    priority: 0.8
  },
  {
    path: '/sources',
    title: 'Sources | BioTrend Daily',
    description: 'Review BioTrend Daily source adapters, fetch health, fallback cache status, and source metadata.',
    changeFrequency: 'daily',
    priority: 0.7
  },
  {
    path: '/tools',
    title: 'Tools | BioTrend Daily',
    description: 'Quick links for PubMed, Feedly, Google Alerts, and the BioTrend Daily repository.',
    changeFrequency: 'monthly',
    priority: 0.5
  },
  {
    path: '/about',
    title: 'About | BioTrend Daily',
    description: 'Learn how BioTrend Daily tracks public metadata without mirroring article bodies or running a backend.',
    changeFrequency: 'monthly',
    priority: 0.6
  }
];

export function siteOriginFromEnv(env: Record<string, string | undefined>): string {
  return normalizeSiteOrigin(env.VITE_SITE_URL || env.SITE_URL || DEFAULT_SITE_URL);
}

export function normalizeSiteOrigin(value: string | undefined): string {
  const candidate = (value || DEFAULT_SITE_URL).trim() || DEFAULT_SITE_URL;

  try {
    const url = new URL(candidate);
    url.hash = '';
    url.search = '';
    url.pathname = '';

    if (url.hostname.endsWith('.vercel.app')) {
      return DEFAULT_SITE_URL;
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function absoluteSiteUrl(pathname: string, origin = DEFAULT_SITE_URL): string {
  const cleanOrigin = normalizeSiteOrigin(origin);
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${cleanOrigin}${path === '/' ? '/' : path}`;
}

export function pageForPath(pathname: string): SitePage {
  const normalizedPath = normalizePagePath(pathname);
  return SITE_PAGES.find((page) => page.path === normalizedPath) ?? SITE_PAGES[0];
}

export function pageMetadata(pathname: string, origin = DEFAULT_SITE_URL): PageMetadata {
  const page = pageForPath(pathname);
  const canonicalUrl = absoluteSiteUrl(page.path, origin);
  const imageUrl = absoluteSiteUrl(DEFAULT_OG_IMAGE_PATH, origin);

  return {
    title: page.title,
    description: page.description,
    canonicalUrl,
    ogTitle: page.title,
    ogDescription: page.description,
    ogUrl: canonicalUrl,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: page.title,
    twitterDescription: page.description,
    imageUrl
  };
}

function normalizePagePath(pathname: string): string {
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '') || '/';
  return SITE_PAGES.some((page) => page.path === cleanPath) ? cleanPath : '/';
}
