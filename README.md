# BioTrend Daily

BioTrend Daily is a Vercel-friendly static dashboard for tracking biotech, computational biology, AI, and translational medicine signals. It refreshes once per day through GitHub Actions, stores only article and paper metadata as local JSON, and deploys a lightweight Vite + React site with no backend.

## What It Collects

The build-time pipeline aggregates metadata from:

- BioSpace RSS feeds
- PubMed through NCBI E-utilities
- McKinsey public insight listing pages
- a16z public content pages
- Crunchbase News public listing pages

The project does not mirror full article bodies. Stored records include title, URL, canonical URL, source, publish date, fetch date, snippet, tags, topic buckets, and a `new today` flag.

## How The Static Site Works

The deployed site reads local JSON files from `public/data`:

- `data/articles.json`
- `data/source_status.json`
- `data/archive/index.json`
- `data/archive/YYYY-MM-DD.json`

All external network access happens in GitHub Actions before the data files are committed. Vercel then builds and serves static HTML, CSS, JavaScript, and JSON from the repository state.

## Daily Refresh And Vercel Deployment

The workflow at `.github/workflows/update-news.yml` runs every day at 10:15 UTC and can also be started manually from the GitHub Actions tab.

The workflow:

1. Installs dependencies with `npm ci`.
2. Runs each source adapter.
3. Normalizes items into a unified `Article` shape.
4. Merges and deduplicates records.
5. Builds archive and source status JSON.
6. Runs tests.
7. Commits changed files under `data/` and `public/data/` back to the same branch.

Vercel watches the GitHub repository. When the workflow pushes the data refresh commit, Vercel automatically starts a normal frontend deployment from that commit. Vercel does not run `npm run update` by default and should not be responsible for scheduled source fetching.

The workflow uses concurrency so overlapping deploys are canceled cleanly.

## Vercel Setup

Connect this repository to Vercel through the Vercel dashboard and keep the default Vite settings:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm ci` or Vercel's default install command

The `build` script copies already-committed data from `data/` into `public/data/`, type-checks the project, and builds the frontend. It does not fetch BioSpace, PubMed, McKinsey, a16z, or Crunchbase News.

The small `vercel.json` rewrite keeps deep links such as `/archive` and `/sources` working for this single-page Vite app.

## Source Failure Fallback

Each source adapter writes a cache under `data/cache`. If a fetch fails, the adapter records the failure in `data/source-runs`, keeps using the last successful cached data for that source, and allows the build to continue.

`data/source_status.json` summarizes:

- source
- success
- fetchedAt
- itemCount
- errorMessage

The UI surfaces failed sources in the health summary and the Sources page. The workflow uploads logs from `logs/*.log` as an artifact when any source reports a failure.

## McKinsey Source Notes

McKinsey is optional and non-critical. The adapter discovers public insight URLs from the configured seed pages, fetches a small number of candidates sequentially, parses metadata only, and converts successful pages into the normal `RawFetchedItem` format.

McKinsey can appear in source status as:

- fresh success
- partial fresh success, with an `errorMessage` warning
- cached fallback, with `usedFallback` and `cacheTimestamp`
- failed with no cache

To test McKinsey locally:

```bash
npx tsx scripts/fetch-mckinsey.ts
npm run data:normalize
npm run data:merge
npm run data:status
```

If McKinsey changes its layout, start with:

- `scripts/lib/mckinsey/filters.ts` for URL allow/block rules
- `scripts/lib/mckinsey/discover.ts` for seed-page candidate discovery
- `scripts/lib/mckinsey/parser.ts` for structured data, meta tag, and HTML fallback parsing

## PubMed Queries

Tracked PubMed searches live in `config/pubmed-queries.ts`.

To add a query:

```ts
{
  label: 'My topic',
  query: '(my query) AND oncology',
  tags: ['my topic', 'oncology'],
  topicBuckets: ['oncology'],
  maxResults: 12
}
```

PubMed requests use NCBI E-utilities, not page scraping. You can optionally add GitHub repository secrets named `NCBI_EMAIL` and `NCBI_API_KEY` for NCBI identification and higher rate limits. These secrets are used by GitHub Actions during the scheduled refresh, not by Vercel.

## Topic Taxonomy

Topic rules live in `config/topics.ts`. Add keywords to an existing topic or add a new topic key and rule. The normalizer infers buckets from source hints, PubMed query labels, title text, snippets, and tags.

Seeded topics include AI, biotech, computational biology, oncology, single-cell, spatial, gene therapy, funding, hiring, translational medicine, and immunology.

## Adding Or Removing Sources

Source metadata lives in `config/sources.ts`. Source-specific adapters live in `scripts/fetch-*.ts`.

To add a source:

1. Add a source entry in `config/sources.ts`.
2. Create a new adapter in `scripts/fetch-new-source.ts`.
3. Use `runSourceAdapter` from `scripts/lib/source-runner.ts`.
4. Return `RawFetchedItem` objects with metadata only.
5. Add the new fetch script to `package.json` and the workflow if needed.

Prefer official APIs or RSS feeds. Only parse public listing pages when no machine-readable option exists.

## Running Locally

Install dependencies:

```bash
npm install
```

Fetch and build local JSON:

```bash
npm run update
```

Run the development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build the static site:

```bash
npm run build
```

## Manual Updates

In GitHub, open the Actions tab, choose `Update BioTrend Daily`, and select `Run workflow`. The same pipeline runs as the daily scheduled job.

## Project Layout

```text
src/                    React UI
public/data/            JSON copied into the deployed static site
data/                   Generated source snapshots, merged data, and archive files
config/                 PubMed queries, source definitions, topic taxonomy
scripts/                Fetch, normalize, dedupe, archive, and status scripts
tests/                  Lightweight Vitest coverage
.github/workflows/      Daily data refresh and commit workflow
vercel.json             Vercel SPA rewrite for direct route visits
```

BioTrend Daily is designed to be boring in the best way: simple files, explicit adapters, typed records, and a static deployment surface that stays easy to reason about.
