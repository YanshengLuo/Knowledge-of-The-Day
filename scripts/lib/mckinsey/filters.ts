import { canonicalizeUrl } from '../utils';

const MCKINSEY_HOSTS = new Set(['mckinsey.com', 'www.mckinsey.com']);
const BLOCKED_PATH_PARTS = [
  '/about-us/',
  '/careers/',
  '/contact-us/',
  '/locations/',
  '/sitecore/',
  '/search',
  '/quarterly/',
  '/user-registration/',
  '/subscriptions/',
  '/privacy-policy',
  '/terms-of-use'
];
const BLOCKED_EXTENSIONS = /\.(?:pdf|jpg|jpeg|png|gif|webp|svg|zip|mp4|mp3)$/i;
const FEATURED_LANDING_SLUGS = new Set([
  'leading-off',
  'mckinsey-explainers',
  'mckinsey-live',
  'mckinsey-on-books',
  'mckinsey-on-lives-and-legacies',
  'mckinsey-podcast',
  'monthly-highlights',
  'the-ceo-shortlist',
  'the-weekend-read',
  'week-in-charts'
]);

export function normalizeMcKinseyUrl(rawUrl: string, baseUrl = 'https://www.mckinsey.com'): string | null {
  if (!rawUrl || /^(?:mailto|tel|javascript):/i.test(rawUrl.trim())) {
    return null;
  }

  try {
    const normalized = canonicalizeUrl(rawUrl, baseUrl);
    const url = new URL(normalized);
    if (!MCKINSEY_HOSTS.has(url.hostname.toLowerCase())) {
      return null;
    }
    url.hostname = 'www.mckinsey.com';
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function isAllowedMcKinseyUrl(rawUrl: string): boolean {
  const normalized = normalizeMcKinseyUrl(rawUrl);
  if (!normalized) {
    return false;
  }

  const path = new URL(normalized).pathname.toLowerCase();
  if (BLOCKED_EXTENSIONS.test(path)) {
    return false;
  }
  if (BLOCKED_PATH_PARTS.some((blocked) => path.includes(blocked))) {
    return false;
  }

  return path.includes('/our-insights/') || path.includes('/featured-insights/');
}

export function isMcKinseyArticleCandidate(rawUrl: string): boolean {
  const normalized = normalizeMcKinseyUrl(rawUrl);
  if (!normalized || !isAllowedMcKinseyUrl(normalized)) {
    return false;
  }

  const path = new URL(normalized).pathname.toLowerCase();
  if (path.endsWith('/our-insights') || path.endsWith('/featured-insights')) {
    return false;
  }

  const insightIndex = path.includes('/our-insights/')
    ? path.indexOf('/our-insights/') + '/our-insights/'.length
    : path.indexOf('/featured-insights/') + '/featured-insights/'.length;
  const slug = path.slice(insightIndex).replace(/^\/+|\/+$/g, '');
  if (path.includes('/featured-insights/') && FEATURED_LANDING_SLUGS.has(slug)) {
    return false;
  }

  return slug.split('/').filter(Boolean).length >= 1 && slug.length >= 8;
}
