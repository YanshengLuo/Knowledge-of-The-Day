import { pageMetadata, siteOriginFromEnv, type PageMetadata } from '../../config/site';

export function metadataForPath(pathname: string): PageMetadata {
  return pageMetadata(pathname, siteOriginFromEnv(viteEnv()));
}

export function applyPageMetadata(pathname: string): void {
  const metadata = metadataForPath(pathname);

  document.title = metadata.title;
  upsertMeta('name', 'description', metadata.description);
  upsertCanonical(metadata.canonicalUrl);
  upsertMeta('property', 'og:title', metadata.ogTitle);
  upsertMeta('property', 'og:description', metadata.ogDescription);
  upsertMeta('property', 'og:url', metadata.ogUrl);
  upsertMeta('property', 'og:type', metadata.ogType);
  upsertMeta('property', 'og:image', metadata.imageUrl);
  upsertMeta('name', 'twitter:card', metadata.twitterCard);
  upsertMeta('name', 'twitter:title', metadata.twitterTitle);
  upsertMeta('name', 'twitter:description', metadata.twitterDescription);
  upsertMeta('name', 'twitter:image', metadata.imageUrl);
}

function upsertCanonical(href: string): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.append(link);
  }
  link.href = href;
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

function viteEnv(): Record<string, string | undefined> {
  const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
  return meta.env ?? {};
}
