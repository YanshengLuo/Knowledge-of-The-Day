import path from 'node:path';
import type { SourceStatus } from '../src/lib/types';
import { dataDir, readJson } from './lib/utils';

const statuses = await readJson<SourceStatus[]>(path.join(dataDir, 'source_status.json'), []);
const failed = statuses.filter((status) => !status.success);

if (failed.length > 0) {
  console.error(`Sources with fetch failures: ${failed.map((status) => status.source).join(', ')}`);
  process.exit(1);
}
