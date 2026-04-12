import path from 'node:path';
import { SOURCE_IDS } from '../config/sources';
import type { SourceStatus } from '../src/lib/types';
import type { SourceRun } from './lib/types';
import { dataDir, readJsonFiles, sourceRunsDir, writeJson } from './lib/utils';

const runs = await readJsonFiles<SourceRun>(sourceRunsDir);
const bySource = new Map(runs.map((run) => [run.source, run]));
const now = new Date().toISOString();

const statuses: SourceStatus[] = SOURCE_IDS.map((source) => {
  const run = bySource.get(source);
  return run
    ? {
        source: run.source,
        success: run.success,
        fetchedAt: run.fetchedAt,
        itemCount: run.itemCount,
        usedFallback: run.usedFallback ?? false,
        fallbackReason: run.fallbackReason,
        cacheTimestamp: run.cacheTimestamp,
        errorMessage: run.errorMessage
      }
    : {
        source,
        success: false,
        fetchedAt: now,
        itemCount: 0,
        usedFallback: false,
        errorMessage: 'Source has not been fetched yet.'
      };
});

await writeJson(path.join(dataDir, 'source_status.json'), statuses);
