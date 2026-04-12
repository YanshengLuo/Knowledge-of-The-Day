import { cp } from 'node:fs/promises';
import path from 'node:path';
import { dataDir, ensureDir, projectRoot } from './lib/utils';

const publicDataDir = path.join(projectRoot, 'public', 'data');
const excludedDirectories = new Set(['cache', 'raw', 'source-runs', 'normalized']);

await ensureDir(publicDataDir);
await cp(dataDir, publicDataDir, {
  recursive: true,
  force: true,
  filter: (source) => !path.relative(dataDir, source).split(path.sep).some((part) => excludedDirectories.has(part))
});
