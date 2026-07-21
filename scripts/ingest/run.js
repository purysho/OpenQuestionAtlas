#!/usr/bin/env node
// Path B ingest orchestrator.
//
// Build-time only. This script is NEVER part of the app bundle and never runs
// at deploy time — it is run by hand (`npm run ingest`) or by a scheduled
// action, and it only ever writes static files under public/data/.
//
// Flow per run:
//   1. Run each enabled adapter (fetch external data -> normalize -> Question[]).
//   2. Validate every entry against the shared contract (schema + app policy);
//      drop-and-log invalid ones with a reason.
//   3. Dedupe by id, within and across datasets.
//   4. Write each dataset to public/data/<file>, stably sorted (deterministic).
//   5. Upsert its line in public/data/index.json with the real count.
//   6. Refresh its block in LICENSES.md.
//   7. Print a per-source summary: fetched / valid / dropped / written.
//
// CLI:
//   npm run ingest                 run every enabled adapter
//   npm run ingest -- --only erdos run a single adapter
//   npm run ingest -- --dry        do everything except write files

import { mkdir, readFile, writeFile } from "node:fs/promises";

import { loadSchema, validateEntry } from "./lib/validate.js";

const ROOT = new URL("../../", import.meta.url);
const DATA_DIR = new URL("public/data/", ROOT);
const INDEX_FILE = new URL("index.json", DATA_DIR);
const LICENSES_FILE = new URL("LICENSES.md", ROOT);
const CACHE_DIR = new URL("scripts/ingest/sources/", ROOT);

// Adapter registry. Each adapter declares how it is written out and exposes a
// `run({ cacheDir })` returning a Question[]. Adding a source is: write one
// adapter file, import it, and add one entry here. Nothing else changes.
const ADAPTERS = [
  // Registered in Task 3: erdos.
];

function parseArgs(argv) {
  const args = { only: null, dry: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--dry" || arg === "--dry-run") {
      args.dry = true;
    } else if (arg === "--only") {
      args.only = argv[i + 1] ?? null;
      i += 1;
    } else if (arg.startsWith("--only=")) {
      args.only = arg.slice("--only=".length);
    }
  }

  return args;
}

// Deterministic ordering: sort by id so the same input always yields the same
// bytes on disk, keeping git diffs meaningful across re-runs.
function sortById(entries) {
  return [...entries].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function serialize(entries) {
  return JSON.stringify(entries, null, 2) + "\n";
}

// Upsert an adapter-managed dataset into index.json without disturbing any
// dataset this pipeline does not own (e.g. the hand-curated `curated`).
async function upsertIndex(entriesById) {
  const index = JSON.parse(await readFile(INDEX_FILE, "utf8"));
  const datasets = Array.isArray(index.datasets) ? index.datasets : [];

  for (const { id, file, name, count } of entriesById) {
    const existing = datasets.find((dataset) => dataset.id === id);

    if (existing) {
      existing.file = file;
      existing.name = name;
      existing.count = count;
    } else {
      datasets.push({ id, file, name, count });
    }
  }

  index.datasets = datasets;
  return JSON.stringify(index, null, 2) + "\n";
}

// Replace (or append) a per-source block in LICENSES.md, delimited by stable
// HTML comment markers so re-runs rewrite exactly their own block.
function upsertLicenseBlock(markdown, adapter, count) {
  const begin = `<!-- ingest:${adapter.id}:begin -->`;
  const end = `<!-- ingest:${adapter.id}:end -->`;
  const block = [
    begin,
    `## ${adapter.name}`,
    "",
    `Imported by \`npm run ingest -- --only ${adapter.id}\` into ` +
      `\`public/data/${adapter.file}\` (${count} ${count === 1 ? "entry" : "entries"}).`,
    "",
    adapter.attribution,
    end,
  ].join("\n");

  const pattern = new RegExp(
    `${begin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  );

  if (pattern.test(markdown)) {
    return markdown.replace(pattern, block);
  }

  return markdown.replace(/\s*$/, "\n") + "\n" + block + "\n";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const schema = await loadSchema();
  await mkdir(CACHE_DIR, { recursive: true });

  const enabled = ADAPTERS.filter(
    (adapter) => !args.only || adapter.id === args.only,
  );

  if (args.only && enabled.length === 0) {
    console.error(`No adapter named "${args.only}".`);
    process.exitCode = 1;
    return;
  }

  const seenIds = new Set();
  const written = [];

  for (const adapter of enabled) {
    const raw = await adapter.run({ cacheDir: CACHE_DIR });
    let dropped = 0;
    let duplicates = 0;
    const valid = [];

    for (const entry of raw) {
      const result = validateEntry(entry, schema);

      if (!result.valid) {
        dropped += 1;
        console.warn(
          `[ingest:${adapter.id}] dropped ${entry?.id ?? "entry without id"}: ` +
            result.errors.join("; "),
        );
        continue;
      }

      if (seenIds.has(entry.id)) {
        duplicates += 1;
        console.warn(`[ingest:${adapter.id}] duplicate id skipped: ${entry.id}`);
        continue;
      }

      seenIds.add(entry.id);
      valid.push(entry);
    }

    const sorted = sortById(valid);

    if (!args.dry) {
      await writeFile(new URL(adapter.file, DATA_DIR), serialize(sorted));
    }

    written.push({
      id: adapter.id,
      file: adapter.file,
      name: adapter.name,
      count: sorted.length,
      adapter,
    });

    console.log(
      `[ingest:${adapter.id}] fetched ${raw.length} · valid ${sorted.length} · ` +
        `dropped ${dropped} · duplicates ${duplicates}` +
        (args.dry ? " · (dry run, not written)" : ` · wrote ${adapter.file}`),
    );
  }

  if (written.length > 0 && !args.dry) {
    await writeFile(INDEX_FILE, await upsertIndex(written));

    let licenses = await readFile(LICENSES_FILE, "utf8");
    for (const dataset of written) {
      licenses = upsertLicenseBlock(licenses, dataset.adapter, dataset.count);
    }
    await writeFile(LICENSES_FILE, licenses);
  }

  if (enabled.length === 0) {
    console.log("[ingest] no adapters enabled — nothing to do.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
