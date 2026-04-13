import { sourceLabel } from './format';
import type { Article } from './types';

export type ArticleImage = {
  src?: string;
  alt: string;
  placeholderLabel: string;
};

export function getArticleImage(article: Article): ArticleImage {
  return {
    src: cleanImageUrl(article.imageUrl),
    alt: `${article.title} image`,
    placeholderLabel: sourceLabel(article.source)
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
