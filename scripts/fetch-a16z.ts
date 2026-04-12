import { SOURCES } from '../config/sources';
import { parsePublicListingPage } from './lib/listing-parser';
import { runSourceAdapter } from './lib/source-runner';

const source = SOURCES.find((item) => item.id === 'a16z');
if (!source) {
  throw new Error('a16z source configuration is missing');
}

await runSourceAdapter('a16z', async (fetchedAt) => {
  const pages = source.urls ?? [];
  const pageItems = await Promise.all(
    pages.map((url) =>
      parsePublicListingPage({
        source: 'a16z',
        url,
        baseUrl: source.homepage,
        fetchedAt,
        defaultTags: source.defaultTags,
        maxItems: 24,
        includeUrl: (candidateUrl) =>
          candidateUrl.includes('a16z.com') &&
          !candidateUrl.includes('/category/') &&
          !candidateUrl.includes('/tag/') &&
          !candidateUrl.includes('/author/')
      })
    )
  );

  return pageItems.flat();
});
