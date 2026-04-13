import { describe, expect, it } from 'vitest';
import { extractImageFromHtml, extractImageMetadataFromHtml } from '../scripts/lib/extract-image';

describe('HTML image extraction', () => {
  it('prefers og:image over twitter:image', () => {
    const html = `
      <html>
        <head>
          <meta name="twitter:image" content="https://example.com/twitter.jpg" />
          <meta property="og:image" content="https://example.com/og.jpg" />
        </head>
      </html>
    `;

    expect(extractImageFromHtml(html)).toBe('https://example.com/og.jpg');
    expect(extractImageMetadataFromHtml(html)).toEqual({
      url: 'https://example.com/og.jpg',
      source: 'og'
    });
  });

  it('falls back to twitter:image and returns null when no image exists', () => {
    expect(extractImageFromHtml('<meta name="twitter:image" content="https://example.com/twitter.jpg" />')).toBe(
      'https://example.com/twitter.jpg'
    );
    expect(extractImageFromHtml('<html><head></head></html>')).toBeNull();
  });
});
