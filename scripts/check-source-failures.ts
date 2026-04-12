import path from 'node:path';
import type { SourceStatus } from '../src/lib/types';
import { dataDir, readJson } from './lib/utils';

// HAS TO WORK
const CRITICAL_SOURCES = new Set([
  'pubmed',
  'biospace',
  'a16z',
  'crunchbase'
]);

const statuses = await readJson<SourceStatus[]>(
  path.join(dataDir, 'source_status.json'),
  []
);

// 只检查 critical sources
const failedCritical = statuses.filter(
  (status) => !status.success && CRITICAL_SOURCES.has(status.source)
);

// optional source（比如 mckinsey）单独 warning
const failedOptional = statuses.filter(
  (status) => !status.success && !CRITICAL_SOURCES.has(status.source)
);

if (failedOptional.length > 0) {
  console.warn(
    `Optional sources failed: ${failedOptional.map((s) => s.source).join(', ')}`
  );
}

if (failedCritical.length > 0) {
  console.error(
    `Critical sources failed: ${failedCritical.map((s) => s.source).join(', ')}`
  );
  process.exit(1);
}