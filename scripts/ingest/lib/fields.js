// Canonical field vocabulary + source-category mapping.
//
// `field` on every emitted question must be one of the Atlas's controlled
// values (mirrors public/data/schema.json). Source categories are mapped into
// that vocabulary here; anything unmapped is logged and the entry is dropped
// rather than invented into an unknown field.

export const FIELD_VOCABULARY = Object.freeze([
  "biology",
  "cosmology",
  "physics",
  "neuroscience",
  "mathematics",
  "computer-science",
  "climate-earth",
  "chemistry",
  "philosophy",
  "medicine",
  "economics",
  "ai",
]);

const FIELD_SET = new Set(FIELD_VOCABULARY);

export function isKnownField(field) {
  return FIELD_SET.has(field);
}

// Every Erdős problem is a mathematics problem — its YAML `tags` are all maths
// subfields (number theory, combinatorics, geometry, …). We map them to the
// single controlled field "mathematics"; if the controlled value itself were
// ever removed from the vocabulary this returns null so the caller can log and
// drop rather than emit an unknown field.
export function fieldForErdos() {
  return isKnownField("mathematics") ? "mathematics" : null;
}

// Normalize a free-text source tag ("number theory") into the schema's
// kebab-case tag format ("number-theory"). Returns null for tags that cannot
// be expressed as a valid tag so the caller can skip them.
export function normalizeTag(tag) {
  const normalized = String(tag)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) ? normalized : null;
}
