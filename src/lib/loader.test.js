import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  hasApprovedSource,
  hasWikipediaRabbitHole,
  loadQuestions,
  validateQuestion,
} from "./loader.js";

const validQuestion = {
  id: "curated-9001",
  question: "What remains unknown here?",
  field: "biology",
  description: "A sufficiently detailed description of the open problem.",
  source: {
    name: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_biology",
    license: "CC BY-SA 4.0",
  },
  rabbitHole: {
    name: "Wikipedia — Origin of life",
    url: "https://en.wikipedia.org/wiki/Origin_of_life",
  },
};

async function readShippedData() {
  const schemaUrl = new URL("../../public/data/schema.json", import.meta.url);
  const datasetUrl = new URL("../../public/data/curated.json", import.meta.url);
  const [schemaText, datasetText] = await Promise.all([
    readFile(schemaUrl, "utf8"),
    readFile(datasetUrl, "utf8"),
  ]);

  return { schema: JSON.parse(schemaText), dataset: JSON.parse(datasetText) };
}

describe("question data integrity", () => {
  it("keeps every shipped entry schema-valid and traceable", async () => {
    const { dataset, schema } = await readShippedData();
    const failures = dataset.flatMap((entry) => {
      const result = validateQuestion(entry, schema);

      if (!result.valid) return [entry.id + ": " + result.errors.join("; ")];
      if (!hasApprovedSource(entry.source.url)) return [entry.id + ": unapproved source"];
      if (!hasWikipediaRabbitHole(entry.rabbitHole.url)) {
        return [entry.id + ": non-Wikipedia rabbit hole"];
      }

      return [];
    });

    expect(dataset).toHaveLength(46);
    expect(failures).toEqual([]);
  });

  it("accepts only approved HTTPS source and rabbit-hole URLs", () => {
    expect(hasApprovedSource(validQuestion.source.url)).toBe(true);
    expect(hasApprovedSource("http://en.wikipedia.org/wiki/Origin_of_life")).toBe(false);
    expect(hasApprovedSource("https://example.com/question")).toBe(false);
    expect(hasWikipediaRabbitHole(validQuestion.rabbitHole.url)).toBe(true);
    expect(hasWikipediaRabbitHole("https://example.com/rabbit-hole")).toBe(false);
  });

  it("validates optional tags as lowercase kebab-case labels", async () => {
    const { schema } = await readShippedData();
    expect(validateQuestion({ ...validQuestion, tags: ["open-problem", "mind"] }, schema).valid).toBe(true);
    expect(validateQuestion({ ...validQuestion, tags: ["Not valid"] }, schema).valid).toBe(false);
  });
});

describe("loadQuestions", () => {
  it("merges datasets, dedupes IDs, and skips invalid, untrusted, or unavailable data", async () => {
    const { schema } = await readShippedData();
    const secondValid = { ...validQuestion, id: "curated-9002", field: "physics" };
    const invalid = {
      ...validQuestion,
      id: "curated-9003",
      source: { name: "Wikipedia", license: "CC BY-SA 4.0" },
    };
    const untrusted = {
      ...validQuestion,
      id: "curated-9004",
      source: { ...validQuestion.source, url: "https://example.com/question" },
    };
    const badRabbitHole = {
      ...validQuestion,
      id: "curated-9005",
      rabbitHole: { name: "Not Wikipedia", url: "https://example.com/rabbit-hole" },
    };
    const payloads = new Map([
      ["/data/schema.json", schema],
      [
        "/data/index.json",
        {
          datasets: [
            { id: "first", file: "first.json" },
            { id: "second", file: "second.json" },
            { id: "missing", file: "missing.json" },
          ],
        },
      ],
      ["/data/first.json", [validQuestion, invalid]],
      ["/data/second.json", [validQuestion, secondValid, untrusted, badRabbitHole]],
    ]);
    const warnings = [];
    const fetchFn = async (url) =>
      payloads.has(url)
        ? { ok: true, status: 200, json: async () => payloads.get(url) }
        : { ok: false, status: 404, json: async () => null };

    const questions = await loadQuestions({
      fetchFn,
      logger: { warn: (message) => warnings.push(message) },
    });

    expect(questions.map(({ id }) => id)).toEqual(["curated-9001", "curated-9002"]);
    expect(warnings.join("\n")).toContain("dropped invalid");
    expect(warnings.join("\n")).toContain("dropped unsourced");
    expect(warnings.join("\n")).toContain("non-Wikipedia rabbit hole");
    expect(warnings.join("\n")).toContain("duplicate id");
    expect(warnings.join("\n")).toContain("could not be loaded");
  });

  it("rejects a malformed manifest", async () => {
    const { schema } = await readShippedData();
    const fetchFn = async (url) => ({
      ok: true,
      status: 200,
      json: async () => (url.endsWith("schema.json") ? schema : {}),
    });

    await expect(loadQuestions({ fetchFn })).rejects.toThrow(
      "The dataset index must contain a datasets array",
    );
  });
});
