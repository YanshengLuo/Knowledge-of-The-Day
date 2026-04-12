export type SourceId = 'biospace' | 'pubmed' | 'mckinsey' | 'a16z' | 'crunchbase';

export type SourceDefinition = {
  id: SourceId;
  label: string;
  homepage: string;
  defaultTags: string[];
  urls?: string[];
};

export const SOURCES: SourceDefinition[] = [
  {
    id: 'biospace',
    label: 'BioSpace',
    homepage: 'https://www.biospace.com',
    defaultTags: ['biotech', 'industry'],
    urls: [
      'https://www.biospace.com/all-news.rss',
      'https://www.biospace.com/news.rss',
      'https://www.biospace.com/rss-feeds'
    ]
  },
  {
    id: 'pubmed',
    label: 'PubMed',
    homepage: 'https://pubmed.ncbi.nlm.nih.gov',
    defaultTags: ['research', 'pubmed']
  },
  {
    id: 'mckinsey',
    label: 'McKinsey',
    homepage: 'https://www.mckinsey.com',
    defaultTags: ['strategy', 'industry'],
    urls: [
      'https://www.mckinsey.com/featured-insights',
	  'https://www.mckinsey.com/us/our-insights',
	  'https://www.mckinsey.com/mhi/our-insights'

    ]
  },
  {
    id: 'a16z',
    label: 'a16z',
    homepage: 'https://a16z.com',
    defaultTags: ['venture', 'technology'],
    urls: ['https://a16z.com/category/bio-health/', 'https://a16z.com/category/ai/']
  },
  {
    id: 'crunchbase',
    label: 'Crunchbase News',
    homepage: 'https://news.crunchbase.com',
    defaultTags: ['funding', 'startups'],
    urls: [
      'https://news.crunchbase.com/sections/health-wellness-biotech/',
      'https://news.crunchbase.com/sections/venture/'
    ]
  }
];

export const SOURCE_IDS = SOURCES.map((source) => source.id);
