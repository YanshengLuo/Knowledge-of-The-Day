import { SOURCES } from '../config/sources';
import { parsePublicListingPage } from './lib/listing-parser';
import { runSourceAdapter } from './lib/source-runner';

const source = SOURCES.find((item) => item.id === 'mckinsey');
if (!source) {
  throw new Error('McKinsey source configuration is missing');
}

await runSourceAdapter('mckinsey', async (fetchedAt) => {
  const pages = source.urls ?? [];
  const pageItems = await Promise.all(
    pages.map((url) =>
      parsePublicListingPage({
        source: 'mckinsey',
        url,
        baseUrl: source.homepage,
        fetchedAt,
        defaultTags: source.defaultTags,
        maxItems: 18,
        includeUrl: (candidateUrl) =>
          candidateUrl.includes('mckinsey.com') &&
          candidateUrl.includes('/our-insights/') &&
          candidateUrl !== url
      })
    )
  );

  return pageItems.flat();
});
