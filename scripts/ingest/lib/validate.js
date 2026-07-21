// Shared validation contract for the ingest pipeline.
//
// Every produced entry is validated with the EXACT same code the running app
// uses to load data (src/lib/loader.js). We only import from the app here — we
// never modify it — so an entry that ingest emits is guaranteed to also survive
// the app's runtime loader. That means:
//   1. schema conformance against public/data/schema.json, and
//   2. the app's own policy gates: an approved source host and an English
//      Wikipedia rabbit-hole URL.
// Anything the app would drop, ingest drops first.

import { readFile } from "node:fs/promises";

import {
  hasApprovedSource,
  hasWikipediaRabbitHole,
  validateQuestion,
} from "../../../src/lib/loader.js";

const schemaUrl = new URL("../../../public/data/schema.json", import.meta.url);

let cachedSchema;

export async function loadSchema() {
  if (!cachedSchema) {
    cachedSchema = JSON.parse(await readFile(schemaUrl, "utf8"));
  }

  return cachedSchema;
}

// Validate a single entry the way the app's loader does. Returns the same
// { valid, errors } shape as validateQuestion so callers can log a reason.
export function validateEntry(entry, schema) {
  const { valid, errors } = validateQuestion(entry, schema);
  const allErrors = [...errors];

  // Only apply the host policy once the shape is known-good; otherwise the
  // schema errors already explain what is missing.
  if (valid) {
    if (!hasApprovedSource(entry.source.url)) {
      allErrors.push("source.url is not from an approved host");
    }

    if (!hasWikipediaRabbitHole(entry.rabbitHole.url)) {
      allErrors.push("rabbitHole.url is not an English Wikipedia article");
    }
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}
