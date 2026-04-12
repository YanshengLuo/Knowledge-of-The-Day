export function formatDate(value: string): string {
  if (!value || value.startsWith('1970-')) {
    return 'Not fetched yet';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  if (!value || value.startsWith('1970-')) {
    return 'Not fetched yet';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export function daysAgoFilter(value: string, days: number): boolean {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }
  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
}

export function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    biospace: 'BioSpace',
    pubmed: 'PubMed',
    mckinsey: 'McKinsey',
    a16z: 'a16z',
    crunchbase: 'Crunchbase News'
  };

  return labels[source] ?? source;
}
