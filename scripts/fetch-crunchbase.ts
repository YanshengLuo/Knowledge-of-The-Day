import { SOURCES } from '../config/sources';
import { parsePublicListingPage } from './lib/listing-parser';
import { runSourceAdapter } from './lib/source-runner';

const source = SOURCES.find((item) => item.id === 'crunchbase');
if (!source) {
  throw new Error('Crunchbase source configuration is missing');
}

await runSourceAdapter('crunchbase', async (fetchedAt) => {
  const pages = source.urls ?? [];
  const pageItems = await Promise.all(
    pages.map((url) =>
      parsePublicListingPage({
        source: 'crunchbase',
        url,
        baseUrl: source.homepage,
        fetchedAt,
        defaultTags: source.defaultTags,
        maxItems: 24,
        includeUrl: (candidateUrl) => {
          if (
            !candidateUrl.includes('news.crunchbase.com') ||
            candidateUrl.includes('/sections/') ||
            candidateUrl.includes('/author/') ||
            candidateUrl.includes('/tag/') ||
            candidateUrl.includes('/methodology') ||
            candidateUrl === source.homepage ||
            candidateUrl === `${source.homepage}/`
          ) {
            return false;
          }

          const pathname = new URL(candidateUrl).pathname;
          return ['/venture/', '/health/', '/biotech/', '/ai/', '/robotics/', '/fintech/', '/ma/'].some((segment) =>
            pathname.includes(segment)
          );
        }
      })
    )
  );

  return pageItems.flat();
});
