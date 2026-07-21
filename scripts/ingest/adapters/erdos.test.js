import { readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import ingestErdos, { buildEntries, parseProblems } from "./erdos.js";
import { fieldForErdos, normalizeTag } from "../lib/fields.js";
import { loadSchema, validateEntry } from "../lib/validate.js";

const seedUrl = new URL("../fixtures/erdos.seed.json", import.meta.url);
const yamlUrl = new URL("../fixtures/erdos.problems.seed-sample.yaml", import.meta.url);

async function fixtures() {
  const [seedText, yamlText, schema] = await Promise.all([
    readFile(seedUrl, "utf8"),
    readFile(yamlUrl, "utf8"),
    loadSchema(),
  ]);
  return { seed: JSON.parse(seedText), yamlText, schema };
}

// Mirror the orchestrator's deterministic write path so the bytes we assert on
// are exactly what would land in public/data/erdos.json.
function serialize(entries) {
  const sorted = [...entries].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return JSON.stringify(sorted, null, 2) + "\n";
}

describe("erdos adapter", () => {
  it("maps the fixture to a full set of schema-valid, traceable questions", async () => {
    const { seed, yamlText, schema } = await fixtures();
    const entries = await ingestErdos({ yamlText, seed });

    expect(entries).toHaveLength(seed.length);

    const failures = entries.flatMap((entry) => {
      const result = validateEntry(entry, schema);
      return result.valid ? [] : [`${entry.id}: ${result.errors.join("; ")}`];
    });
    expect(failures).toEqual([]);

    // Every entry is mathematics, links to the approved source host, and carries
    // a Wikipedia rabbit hole.
    for (const entry of entries) {
      expect(entry.field).toBe("mathematics");
      expect(entry.id).toMatch(/^erdos-\d{4}$/);
      expect(entry.source.url).toBe(
        "https://github.com/teorth/erdosproblems/blob/main/data/problems.yaml",
      );
      expect(entry.rabbitHole.url.startsWith("https://en.wikipedia.org/wiki/")).toBe(true);
      expect(["famous", "known"]).toContain(entry.notoriety);
    }
  });

  it("derives notoriety from the real prize metadata", async () => {
    const { seed, yamlText } = await fixtures();
    const entries = await ingestErdos({ yamlText, seed });
    const byId = new Map(entries.map((entry) => [entry.id, entry]));

    // #1135 Collatz carries a $500 prize -> famous; #242 Erdős–Straus has none.
    expect(byId.get("erdos-1135").notoriety).toBe("famous");
    expect(byId.get("erdos-0242").notoriety).toBe("known");
  });

  it("drops and logs a seed problem missing from the source YAML", async () => {
    const { seed, yamlText } = await fixtures();
    const logger = { warn: vi.fn() };
    const withGhost = [
      ...seed,
      {
        number: 999999,
        question: "Does this fabricated problem exist in the database?",
        description: "It does not, so the adapter must drop it rather than emit it.",
        wikipedia: { name: "Wikipedia — Nonexistent", url: "https://en.wikipedia.org/wiki/Nonexistent" },
      },
    ];

    const entries = buildEntries(withGhost, parseProblems(yamlText), logger);

    expect(entries.map((entry) => entry.id)).not.toContain("erdos-999999");
    expect(entries).toHaveLength(seed.length);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("#999999"));
  });

  it("drops entries the pipeline gate would reject (non-Wikipedia rabbit hole)", async () => {
    const { seed, yamlText, schema } = await fixtures();
    const [entry] = await ingestErdos({ yamlText, seed });

    const broken = { ...entry, rabbitHole: { name: "Elsewhere", url: "https://example.com/x" } };
    expect(validateEntry(broken, schema).valid).toBe(false);
  });

  it("is deterministic: same fixture in, identical bytes out", async () => {
    const { seed, yamlText } = await fixtures();
    const first = await ingestErdos({ yamlText, seed });
    const second = await ingestErdos({ yamlText, seed });

    expect(serialize(second)).toBe(serialize(first));
  });

  it("maps source tags into the controlled vocabulary without inventing fields", async () => {
    const { seed, yamlText } = await fixtures();
    const entries = await ingestErdos({ yamlText, seed });
    const collatz = entries.find((entry) => entry.id === "erdos-1135");

    // "number theory" -> "number-theory"; every field stays "mathematics".
    expect(collatz.tags).toContain("number-theory");
    expect(fieldForErdos()).toBe("mathematics");
    expect(normalizeTag("Additive Combinatorics")).toBe("additive-combinatorics");
    expect(normalizeTag("   ")).toBeNull();
  });
});
