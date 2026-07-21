# Path B — the ingest pipeline

This directory grows the atlas's dataset from external open-problem sources
**at build time**. It is not part of the app. It fetches permitted sources,
reformats them into the existing question schema, and writes static JSON to
`public/data/`. The React app never runs any of this — it only reads the
committed output. Adding a source is the whole job; the app does not change.

```
scripts/ingest/
  run.js                 orchestrator: run adapters, validate, write files, update index.json + LICENSES.md
  lib/
    validate.js          reuses the app loader (schema + policy) so ingest never emits what the app would drop
    id.js                stable, deterministic id generation
    fields.js            controlled field vocabulary + source-tag mapping
  adapters/
    erdos.js             Erdős Problems adapter (worked example)
  fixtures/              checked-in sample inputs for offline, deterministic tests
  sources/              cached raw downloads (gitignored) for reproducible offline re-runs
        │  writes ▼
public/data/<source>.json      +  index.json (manifest)  +  LICENSES.md (per-source terms)
```

## Non-negotiable rules

1. **License gate (hard).** Confirm the source's license permits reuse/
   redistribution **before** ingesting. Record it per entry in `source.license`
   and add a block to `LICENSES.md`. No entry ships without a known-permissive
   license. If the terms are unclear, do not ship it.
2. **No scraping forbidden sources.** **Wikenigma** (`wikenigma.org.uk`) has a
   published policy that disallows scraping and AI reuse — **never fetch or
   ingest it.** Link to it as a kindred project in the README/footer only.
   Respecting this is on-brand, not a limitation.
3. **Never fabricate.** Every entry keeps a real, verifiable `source.url` and a
   faithful `question`/`description`. If a field can't be filled honestly, drop
   the entry and log it. Under-deliver rather than invent.
4. **Schema + loader conformance is enforced.** Every entry must satisfy
   `public/data/schema.json` **and** the app's runtime policy in
   `src/lib/loader.js` — an approved `source.url` host and an
   `en.wikipedia.org/wiki/...` `rabbitHole.url`. `lib/validate.js` applies both,
   so anything the app would drop is dropped here first.
5. **Deterministic output.** Same input → identical bytes (stable ids, stable
   sort). Re-runs must produce clean, empty diffs.
6. **Build-time only.** No network calls ship to the browser. The Pages deploy
   workflow is unchanged and never runs ingest.
7. **Dependencies.** Keep them minimal — a YAML parser and whatever a future
   Wikipedia adapter needs. Ask before adding anything else.

## The adapter contract

An adapter is an async function that returns an array of question objects:

```js
// adapters/<source>.js
export default async function ingest<Source>({ cacheDir }) {
  // 1. fetch raw data (cache it under cacheDir for offline re-runs)
  // 2. normalize into the schema shape below
  // 3. return Question[]   (the orchestrator validates, dedupes, sorts, writes)
}
```

Each returned entry must match `public/data/schema.json`:

```json
{
  "id": "<source>-0001",
  "question": "A faithful, independently-phrased open question.",
  "field": "mathematics",
  "description": "One line on why it remains open. No fabricated claims.",
  "source": { "name": "…", "url": "https://<approved-host>/…", "license": "…" },
  "rabbitHole": { "name": "Wikipedia — …", "url": "https://en.wikipedia.org/wiki/…" },
  "notoriety": "famous",
  "tags": ["kebab-case"]
}
```

Rules baked into the contract:

- **`field`** must be one of the controlled values in `lib/fields.js` (mirrors
  the schema). Map source categories to that vocabulary; **log unmapped
  categories, never invent a field.**
- **`source.url`** must be an **approved host** — see `APPROVED_SOURCE_HOSTS`
  and the `github.com/teorth/erdosproblems` rule in `src/lib/loader.js`. An
  entry with any other source host is dropped by both ingest and the app.
- **`rabbitHole.url`** must be an English Wikipedia article
  (`https://en.wikipedia.org/wiki/...`).
- **`id`** is namespaced and zero-padded (`lib/id.js`) so it sorts naturally and
  never collides with `curated-XXXX`.

## Add a source in four steps

1. **Confirm the license.** Check the source permits reuse. If it forbids
   scraping/AI reuse (e.g. Wikenigma), stop — link to it instead.
2. **Write `adapters/<source>.js`.** Fetch → normalize → return `Question[]`.
   Verify the real field names and per-entry URL format from the source before
   hardcoding either; don't assume. Cache raw downloads under `cacheDir`.
3. **Register it** in the `ADAPTERS` array in `run.js` with `{ id, file, name,
   attribution, run }`.
4. **Run and gate it:**
   ```sh
   npm run ingest -- --only <source> --dry   # inspect fetched/valid/dropped
   npm run ingest -- --only <source>         # write public/data/<source>.json
   npm test && npm run lint                   # all three gates green
   ```
   The orchestrator validates every entry, drops-and-logs invalid ones, dedupes
   by id, writes the dataset stably sorted, upserts the `index.json` manifest
   line with the real count, and refreshes the source's block in `LICENSES.md`.

Add a Vitest suite next to the adapter that proves: fixture → valid `Question[]`,
a broken fixture entry is dropped-and-logged, and re-running yields identical
bytes.

## Commands

```sh
npm run ingest                    # run every enabled adapter
npm run ingest -- --only erdos    # run one adapter
npm run ingest -- --dry           # do everything except write files
```

## Worked example: Erdős Problems

The Erdős ground-truth `data/problems.yaml`
([teorth/erdosproblems](https://github.com/teorth/erdosproblems), Apache-2.0) is
an **OEIS-linking metadata database** — it has no problem statements. Building
`question` text from its metadata alone would be fabrication, so `erdos.js` does
**not** do that. Instead it **joins** two inputs by problem number:

- a small, human-curated seed (`fixtures/erdos.seed.json`) — faithful,
  independently-phrased statements for famous, still-open problems, each with a
  verified Wikipedia rabbit hole; and
- the live YAML metadata — `prize` (→ `notoriety`) and subject `tags`, which
  also confirms the problem exists (a seed number absent from the YAML is
  dropped-and-logged).

`source.url` points at the Apache-2.0 database file on `github.com/teorth/
erdosproblems` — the only Erdős host the app loader approves (not
`erdosproblems.com`). This pattern — curate the honest part, join the machine-
readable part — is the template for any source whose data is real but whose
prose can't be lifted verbatim.
