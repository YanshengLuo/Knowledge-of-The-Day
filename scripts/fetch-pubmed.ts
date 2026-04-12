import { XMLParser } from 'fast-xml-parser';
import { PUBMED_QUERIES } from '../config/pubmed-queries';
import { SOURCES } from '../config/sources';
import type { RawFetchedItem } from './lib/types';
import { runSourceAdapter } from './lib/source-runner';
import { canonicalizeUrl, fetchText, sleep, stripHtml, truncate, uniqueStrings } from './lib/utils';

const source = SOURCES.find((item) => item.id === 'pubmed');
if (!source) {
  throw new Error('PubMed source configuration is missing');
}

const parser = new XMLParser({
  ignoreAttributes: false,
  textNodeName: 'text',
  attributeNamePrefix: '@_'
});

await runSourceAdapter('pubmed', async (fetchedAt) => {
  const items: RawFetchedItem[] = [];

  for (const queryConfig of PUBMED_QUERIES) {
    const ids = await searchPubMed(queryConfig.query, queryConfig.maxResults);
    if (ids.length === 0) {
      continue;
    }

    await sleep(400);
    const records = await fetchPubMedRecords(ids);
    for (const record of records) {
      const citation = record.MedlineCitation as
        | {
            Article?: {
              ArticleTitle?: unknown;
              Abstract?: unknown;
              Journal?: { JournalIssue?: { PubDate?: unknown } };
            };
          }
        | undefined;
      const pmid = getPmid(record);
      const title = stripHtml(asText(citation?.Article?.ArticleTitle));
      if (!pmid || !title) {
        continue;
      }

      const url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
      const publishedAt = parsePubMedDate(citation?.Article?.Journal?.JournalIssue?.PubDate, fetchedAt);
      const abstractText = getAbstract(citation?.Article?.Abstract);

      items.push({
        title,
        url,
        canonicalUrl: canonicalizeUrl(url),
        source: 'pubmed',
        publishedAt,
        fetchedAt,
        snippet: truncate(abstractText, 360),
        tags: uniqueStrings([...source.defaultTags, queryConfig.label, ...queryConfig.tags, ...keywordTags(title)]),
        topicBuckets: queryConfig.topicBuckets
      });
    }

    await sleep(400);
  }

  return items;
});

async function searchPubMed(term: string, retmax: number): Promise<string[]> {
  const params = new URLSearchParams({
    db: 'pubmed',
    term,
    retmode: 'json',
    sort: 'pub+date',
    datetype: 'pdat',
    reldate: '30',
    retmax: String(retmax),
    tool: 'biotrend_daily'
  });

  if (process.env.NCBI_EMAIL) {
    params.set('email', process.env.NCBI_EMAIL);
  }
  if (process.env.NCBI_API_KEY) {
    params.set('api_key', process.env.NCBI_API_KEY);
  }

  const payload = JSON.parse(await fetchText(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params}`)) as {
    esearchresult?: { idlist?: string[] };
  };

  return payload.esearchresult?.idlist ?? [];
}

async function fetchPubMedRecords(ids: string[]): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams({
    db: 'pubmed',
    id: ids.join(','),
    retmode: 'xml',
    rettype: 'abstract',
    tool: 'biotrend_daily'
  });

  if (process.env.NCBI_EMAIL) {
    params.set('email', process.env.NCBI_EMAIL);
  }
  if (process.env.NCBI_API_KEY) {
    params.set('api_key', process.env.NCBI_API_KEY);
  }

  const xml = await fetchText(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${params}`);
  const parsed = parser.parse(xml) as { PubmedArticleSet?: { PubmedArticle?: unknown } };
  return asArray<Record<string, unknown>>(parsed.PubmedArticleSet?.PubmedArticle);
}

function getPmid(record: Record<string, unknown>): string {
  const pmid = (record.MedlineCitation as { PMID?: unknown } | undefined)?.PMID;
  if (typeof pmid === 'object' && pmid && 'text' in pmid) {
    return String((pmid as { text: unknown }).text);
  }
  return asText(pmid);
}

function getAbstract(abstract: unknown): string {
  const abstractTexts = (abstract as { AbstractText?: unknown } | undefined)?.AbstractText;
  return asArray<unknown>(abstractTexts).map((part) => asText(part)).join(' ');
}

function parsePubMedDate(pubDate: unknown, fallbackIso: string): string {
  const value = pubDate as { Year?: unknown; Month?: unknown; Day?: unknown; MedlineDate?: unknown } | undefined;
  if (!value) {
    return fallbackIso;
  }

  if (value.Year) {
    const month = monthToNumber(asText(value.Month)) ?? 1;
    const day = Number(asText(value.Day)) || 1;
    return new Date(Date.UTC(Number(asText(value.Year)), month - 1, day)).toISOString();
  }

  const medlineDate = asText(value.MedlineDate);
  const year = medlineDate.match(/\d{4}/)?.[0];
  return year ? new Date(Date.UTC(Number(year), 0, 1)).toISOString() : fallbackIso;
}

function monthToNumber(value: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const month = value.slice(0, 3).toLowerCase();
  return ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(month) + 1 || undefined;
}

function asArray<T>(value: unknown): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? (value as T[]) : [value as T];
}

function asText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => asText(item)).join(' ');
  }
  if (typeof value === 'object' && value) {
    const object = value as Record<string, unknown>;
    return asText(object.text ?? object['#text']);
  }
  return '';
}

function keywordTags(title: string): string[] {
  const lower = title.toLowerCase();
  return ['biomarker', 'single-cell', 'spatial', 'crispr', 'immunotherapy', 'machine learning'].filter((keyword) =>
    lower.includes(keyword)
  );
}
