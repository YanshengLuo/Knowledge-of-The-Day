import type { Article } from './types';

export function articleShareUrl(article: Pick<Article, 'canonicalUrl' | 'url'>): string {
  return article.canonicalUrl || article.url;
}

export async function copyArticleLink(article: Pick<Article, 'canonicalUrl' | 'url'>): Promise<boolean> {
  return copyText(articleShareUrl(article));
}

export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}
