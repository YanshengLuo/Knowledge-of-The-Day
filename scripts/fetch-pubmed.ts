import { PUBMED_QUERIES } from '../config/pubmed-queries';
import { SOURCES } from '../config/sources';
import type { FallbackReason } from './lib/types';
import type { RawFetchedItem } from './lib/types';
import { parsePubMedRecordsXml, parsePubMedSearchIds } from './lib/pubmed-parser';
import { runSourceAdapter, SourceAdapterError } from './lib/source-runner';
import { canonicalizeUrl, fetchText, sleep, stripHtml, truncate, uniqueStrings } from './lib/utils';

const source = SOURCES.find((item) => item.id === 'pubmed');
if (!source) {
  throw new Error('PubMed source configuration is missing');
}

await runSourceAdapter('pubmed', async (fetchedAt) => {
  const items: RawFetchedItem[] = [];
  let failureReason: FallbackReason | undefined;

  for (const queryConfig of PUBMED_QUERIES) {
    const searchResult = await searchPubMed(queryConfig.query, queryConfig.maxResults);
    if (searchResult.errorReason) {
      failureReason = failureReason ?? searchResult.errorReason;
      await sleep(400);
      continue;
    }

    const ids = searchResult.ids;
    if (ids.length === 0) {
      continue;
    }

    await sleep(400);

    const recordResult = await fetchPubMedRecords(ids);
    if (recordResult.errorReason) {
      failureReason = failureReason ?? recordResult.errorReason;
      await sleep(400);
      continue;
    }

    for (const record of recordResult.records) {
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
      const publishedAt = parsePubMedDate(
        citation?.Article?.Journal?.JournalIssue?.PubDate,
        fetchedAt
      );
      const abstractText = getAbstract(citation?.Article?.Abstract);

      items.push({
        title,
        url,
        canonicalUrl: canonicalizeUrl(url),
        source: 'pubmed',
        publishedAt,
        fetchedAt,
        snippet: truncate(abstractText, 360),
        tags: uniqueStrings([
          ...source.defaultTags,
          queryConfig.label,
          ...queryConfig.tags,
          ...keywordTags(title)
        ]),
        topicBuckets: queryConfig.topicBuckets
      });
    }

    await sleep(400);
  }

  if (failureReason) {
    throw new SourceAdapterError(failureReason, `PubMed ${failureReason}; using fallback cache if available`);
  }

  return items;
});


// ----------------------
// FIXED FUNCTIONS BELOW
// ----------------------

async function searchPubMed(term: string, retmax: number): Promise<{ ids: string[]; errorReason?: FallbackReason }> {
  const email = (process.env.NCBI_EMAIL ?? '').trim();
  const apiKey = (process.env.NCBI_API_KEY ?? '').trim();

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

  if (email) params.set('email', email);
  if (apiKey) params.set('api_key', apiKey);

  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params}`;

  let text: string;
  try {
    text = await fetchText(url, 20000, 3);
  } catch {
    console.warn('PubMed search request failed');
    return { ids: [], errorReason: 'request failure' };
  }

  const parsed = parsePubMedSearchIds(text);
  if (parsed.errorReason) {
    console.warn('PubMed search returned invalid JSON');
    return { ids: [], errorReason: parsed.errorReason };
  }

  return { ids: parsed.value };
}

async function fetchPubMedRecords(ids: string[]): Promise<{ records: Record<string, unknown>[]; errorReason?: FallbackReason }> {
  const email = (process.env.NCBI_EMAIL ?? '').trim();
  const apiKey = (process.env.NCBI_API_KEY ?? '').trim();

  const params = new URLSearchParams({
    db: 'pubmed',
    id: ids.join(','),
    retmode: 'xml',
    rettype: 'abstract',
    tool: 'biotrend_daily'
  });

  if (email) params.set('email', email);
  if (apiKey) params.set('api_key', apiKey);

  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${params}`;

  let xml: string;
  try {
    xml = await fetchText(url, 20000, 3);
  } catch {
    console.warn('PubMed fetch request failed');
    return { records: [], errorReason: 'request failure' };
  }

  const parsed = parsePubMedRecordsXml(xml);
  if (parsed.errorReason) {
    console.warn('PubMed XML parse failed');
    return { records: [], errorReason: parsed.errorReason };
  }

  return { records: parsed.value };
}


// ----------------------
// HELPER FUNCTIONS
// ----------------------

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
  const value = pubDate as
    | { Year?: unknown; Month?: unknown; Day?: unknown; MedlineDate?: unknown }
    | undefined;

  if (!value) return fallbackIso;

  if (value.Year) {
    const month = monthToNumber(asText(value.Month)) ?? 1;
    const day = Number(asText(value.Day)) || 1;
    return new Date(
      Date.UTC(Number(asText(value.Year)), month - 1, day)
    ).toISOString();
  }

  const medlineDate = asText(value.MedlineDate);
  const year = medlineDate.match(/\d{4}/)?.[0];

  return year
    ? new Date(Date.UTC(Number(year), 0, 1)).toISOString()
    : fallbackIso;
}

function monthToNumber(value: string): number | undefined {
  if (!value) return undefined;

  const month = value.slice(0, 3).toLowerCase();
  const idx = [
    'jan','feb','mar','apr','may','jun',
    'jul','aug','sep','oct','nov','dec'
  ].indexOf(month);

  return idx >= 0 ? idx + 1 : undefined;
}

function asArray<T>(value: unknown): T[] {
  if (!value) return [];
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
  return [
    'biomarker',
    'single-cell',
    'spatial',
    'crispr',
    'immunotherapy',
    'machine learning'
  ].filter((keyword) => lower.includes(keyword));
}
