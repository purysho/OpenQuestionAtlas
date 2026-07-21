// Erdős Problems adapter.
//
// The ground-truth data/problems.yaml (teorth/erdosproblems, Apache-2.0) is an
// OEIS-linking METADATA database: it carries no problem statements. So this
// adapter does not synthesize question text from metadata (that would be
// fabrication). Instead it JOINS:
//
//   • a small, human-curated seed (fixtures/erdos.seed.json) — faithful,
//     independently-phrased statements for famous, still-open Erdős problems,
//     each with a real English Wikipedia rabbit hole, and
//   • the live YAML metadata, keyed by the problem `number`, which supplies the
//     prize (-> notoriety) and subject tags and confirms the problem exists.
//
// Every emitted entry therefore has a real, resolving source.url on an approved
// host (the Apache-2.0 database file) and a Wikipedia rabbit hole. A seed entry
// whose number is absent from the live YAML is dropped and logged.

import { readFile, mkdir, writeFile } from "node:fs/promises";

import { erdosId } from "../lib/id.js";
import { fieldForErdos, normalizeTag } from "../lib/fields.js";

const RAW_URL =
  "https://raw.githubusercontent.com/teorth/erdosproblems/main/data/problems.yaml";

// Source link: the app loader only approves github.com/teorth/erdosproblems as
// an Erdős host (not erdosproblems.com), so this points at the canonical
// ground-truth file in that repo.
const SOURCE = Object.freeze({
  name: "Erdős Problems database (teorth/erdosproblems)",
  url: "https://github.com/teorth/erdosproblems/blob/main/data/problems.yaml",
  license: "Apache-2.0",
});

const SEED_URL = new URL("../fixtures/erdos.seed.json", import.meta.url);

// Minimal reader for this file's known, regular shape (2-space indented,
// quoted scalars, single-line arrays). We only read the fields we need, so we
// avoid adding a general YAML dependency.
export function parseProblems(yamlText) {
  const byNumber = new Map();
  const blocks = yamlText.split(/^(?=- number: )/m);

  for (const block of blocks) {
    const numberMatch = block.match(/^- number: "(\d+)"/);
    if (!numberMatch) continue;

    const prizeMatch = block.match(/^ {2}prize: "([^"]*)"/m);
    const statusMatch = block.match(/^ {2}status:[\r\n]+ {4}state: "([^"]*)"/m);
    const tagsMatch = block.match(/^ {2}tags: \[([^\]]*)\]/m);

    const tags = tagsMatch
      ? tagsMatch[1]
          .split(",")
          .map((tag) => tag.trim().replace(/^"|"$/g, ""))
          .filter(Boolean)
      : [];

    byNumber.set(Number(numberMatch[1]), {
      number: Number(numberMatch[1]),
      prize: prizeMatch ? prizeMatch[1] : "no",
      state: statusMatch ? statusMatch[1] : "",
      tags,
    });
  }

  return byNumber;
}

async function fetchYaml(cacheDir, fetchImpl) {
  const cacheFile = new URL("problems.full.yaml", cacheDir);

  try {
    return await readFile(cacheFile, "utf8");
  } catch {
    // Not cached — fetch once and cache for reproducible offline re-runs.
  }

  const response = await fetchImpl(RAW_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Erdős problems.yaml: HTTP ${response.status}`);
  }

  const text = await response.text();
  await mkdir(cacheDir, { recursive: true });
  await writeFile(cacheFile, text);
  return text;
}

// Pure join: seed entries + parsed metadata -> Question[]. Deterministic in the
// seed's order (the orchestrator sorts by id before writing).
export function buildEntries(seed, byNumber, logger = console) {
  const entries = [];

  for (const item of seed) {
    const meta = byNumber.get(Number(item.number));

    if (!meta) {
      logger?.warn?.(
        `[ingest:erdos] seed problem #${item.number} not found in problems.yaml — dropped`,
      );
      continue;
    }

    const field = fieldForErdos();
    if (!field) {
      logger?.warn?.(`[ingest:erdos] no controlled field for #${item.number} — dropped`);
      continue;
    }

    const tags = meta.tags.map(normalizeTag).filter(Boolean);
    const isPrized = Boolean(meta.prize) && meta.prize !== "no";

    const entry = {
      id: erdosId(item.number),
      question: item.question,
      field,
      description: item.description,
      source: { ...SOURCE },
      rabbitHole: { name: item.wikipedia.name, url: item.wikipedia.url },
      notoriety: isPrized ? "famous" : "known",
    };

    if (tags.length > 0) {
      entry.tags = tags;
    }

    entries.push(entry);
  }

  return entries;
}

export default async function ingestErdos({
  cacheDir,
  logger = console,
  // Test seams: inject fixture data to run offline and deterministically.
  yamlText,
  seed,
  fetchImpl = fetch,
} = {}) {
  const seedData = seed ?? JSON.parse(await readFile(SEED_URL, "utf8"));
  const text = yamlText ?? (await fetchYaml(cacheDir, fetchImpl));
  const byNumber = parseProblems(text);

  return buildEntries(seedData, byNumber, logger);
}
