// Stable, deterministic id generation.
//
// Ids are namespaced by source and zero-padded so they sort naturally and never
// collide with the hand-curated `curated-XXXX` ids. The same input always
// produces the same id, which keeps re-runs and git diffs stable.

export function erdosId(number) {
  const n = Number(number);

  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`erdosId expects a positive integer problem number, got: ${number}`);
  }

  return `erdos-${String(n).padStart(4, "0")}`;
}
