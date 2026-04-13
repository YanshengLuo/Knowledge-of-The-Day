import path from 'node:path';
import { configuredSiteOrigin, renderRobots } from './lib/static-site';
import { projectRoot, writeFileText } from './lib/utils';

await writeFileText(path.join(projectRoot, 'public', 'robots.txt'), renderRobots(configuredSiteOrigin()));
