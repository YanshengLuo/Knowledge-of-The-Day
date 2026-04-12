import { XMLParser, XMLValidator } from 'fast-xml-parser';

export type PubMedParseResult<T> = {
  value: T;
  errorReason?: 'parse error';
};

const parser = new XMLParser({
  ignoreAttributes: false,
  textNodeName: 'text',
  attributeNamePrefix: '@_'
});

export function parsePubMedSearchIds(text: string): PubMedParseResult<string[]> {
  try {
    const payload = JSON.parse(text) as { esearchresult?: { idlist?: unknown } };
    const ids = Array.isArray(payload.esearchresult?.idlist)
      ? payload.esearchresult.idlist.filter((id): id is string => typeof id === 'string')
      : [];
    return { value: ids };
  } catch {
    return { value: [], errorReason: 'parse error' };
  }
}

export function parsePubMedRecordsXml(xml: string): PubMedParseResult<Record<string, unknown>[]> {
  try {
    if (XMLValidator.validate(xml) !== true) {
      return { value: [], errorReason: 'parse error' };
    }

    const parsed = parser.parse(xml) as { PubmedArticleSet?: { PubmedArticle?: unknown } };
    return { value: asArray<Record<string, unknown>>(parsed.PubmedArticleSet?.PubmedArticle) };
  } catch {
    return { value: [], errorReason: 'parse error' };
  }
}

function asArray<T>(value: unknown): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? (value as T[]) : [value as T];
}
