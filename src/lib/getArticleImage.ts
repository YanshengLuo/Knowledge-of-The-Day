import { sourceLabel } from './format';
import type { Article } from './types';

export type ArticleImage = {
  src?: string;
  alt: string;
  placeholderLabel: string;
  placeholderClassName: string;
  imageSource: Article['imageSource'];
};

export function getArticleImage(article: Article): ArticleImage {
  const src = cleanImageUrl(article.imageUrl);
  return {
    src,
    alt: `${article.title} image`,
    placeholderLabel: sourceLabel(article.source),
    placeholderClassName: placeholderClassForSource(article.source),
    imageSource: src ? article.imageSource : 'fallback'
  };
}

function cleanImageUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

function placeholderClassForSource(source: Article['source']): string {
  const classes: Record<Article['source'], string> = {
    pubmed: 'bg-gradient-to-br from-sky-100 via-white to-cyan-200',
    a16z: 'bg-gradient-to-br from-violet-100 via-white to-fuchsia-100',
    biospace: 'bg-gradient-to-br from-emerald-100 via-white to-teal-200',
    crunchbase: 'bg-gradient-to-br from-amber-100 via-white to-orange-200',
    mckinsey: 'bg-gradient-to-br from-slate-100 via-white to-zinc-200'
  };

  return classes[source] ?? 'bg-gradient-to-br from-neutral-100 via-white to-neutral-200';
}
