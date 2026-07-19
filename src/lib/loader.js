const APPROVED_SOURCE_HOSTS = new Set([
  "wikenigma.org.uk",
  "en.wikipedia.org",
  "science.org",
  "openproblemgarden.org",
  "math.ucr.edu",
]);

function joinUrl(baseUrl, file) {
  return [baseUrl.replace(/\/+$/, ""), file.replace(/^\/+/, "")].join("/");
}

async function fetchJson(fetchFn, url) {
  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error("Request failed with status " + response.status);
  }

  return response.json();
}

function valueMatchesType(value, type) {
  if (type === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  return typeof value === type;
}

function validateNode(value, definition, path, errors) {
  if (definition.type && !valueMatchesType(value, definition.type)) {
    errors.push(path + " must be a " + definition.type);
    return;
  }

  if (definition.type === "string") {
    if (definition.minLength && value.length < definition.minLength) {
      errors.push(path + " is too short");
    }

    if (definition.pattern && !new RegExp(definition.pattern).test(value)) {
      errors.push(path + " has an invalid format");
    }

    if (definition.format === "uri") {
      try {
        new URL(value);
      } catch {
        errors.push(path + " must be a valid URL");
      }
    }
  }

  if (definition.enum && !definition.enum.includes(value)) {
    errors.push(path + " is not in the controlled vocabulary");
  }

  if (definition.type !== "object") {
    return;
  }

  for (const requiredKey of definition.required ?? []) {
    if (!Object.prototype.hasOwnProperty.call(value, requiredKey)) {
      errors.push(path + "." + requiredKey + " is required");
    }
  }

  const properties = definition.properties ?? {};

  if (definition.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!Object.prototype.hasOwnProperty.call(properties, key)) {
        errors.push(path + "." + key + " is not allowed");
      }
    }
  }

  for (const [key, childDefinition] of Object.entries(properties)) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      validateNode(value[key], childDefinition, path + "." + key, errors);
    }
  }
}

export function validateQuestion(question, schema) {
  const errors = [];
  validateNode(question, schema, "question", errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function hasApprovedSource(sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    if (url.protocol !== "https:") {
      return false;
    }

    if (hostname === "github.com") {
      return url.pathname.toLowerCase().startsWith("/teorth/erdosproblems");
    }

    return APPROVED_SOURCE_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

function warn(logger, message) {
  logger?.warn?.("[atlas loader] " + message);
}

function questionsFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.questions)) {
    return payload.questions;
  }

  return null;
}

async function loadDataset(dataset, options) {
  const { baseUrl, fetchFn, logger, schema } = options;

  try {
    const payload = await fetchJson(fetchFn, joinUrl(baseUrl, dataset.file));
    const entries = questionsFromPayload(payload);

    if (!entries) {
      warn(logger, dataset.id + " is malformed and was skipped");
      return [];
    }

    const validEntries = [];

    for (const entry of entries) {
      const result = validateQuestion(entry, schema);
      const label = entry?.id ?? "entry without an id";

      if (!result.valid) {
        warn(
          logger,
          dataset.id + " dropped invalid " + label + ": " + result.errors.join("; "),
        );
        continue;
      }

      if (!hasApprovedSource(entry.source.url)) {
        warn(logger, dataset.id + " dropped unsourced " + label);
        continue;
      }

      validEntries.push(entry);
    }

    return validEntries;
  } catch (error) {
    warn(logger, dataset.id + " could not be loaded: " + error.message);
    return [];
  }
}

export async function loadQuestions({
  baseUrl = "/data",
  fetchFn = fetch,
  logger = console,
} = {}) {
  const [schema, index] = await Promise.all([
    fetchJson(fetchFn, joinUrl(baseUrl, "schema.json")),
    fetchJson(fetchFn, joinUrl(baseUrl, "index.json")),
  ]);

  if (!Array.isArray(index.datasets)) {
    throw new Error("The dataset index must contain a datasets array");
  }

  const datasetResults = await Promise.all(
    index.datasets.map((dataset) =>
      loadDataset(dataset, { baseUrl, fetchFn, logger, schema }),
    ),
  );

  const byId = new Map();

  for (const entries of datasetResults) {
    for (const entry of entries) {
      if (byId.has(entry.id)) {
        warn(logger, "duplicate id " + entry.id + " was skipped");
        continue;
      }

      byId.set(entry.id, entry);
    }
  }

  return [...byId.values()];
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest;

  const validFixture = {
    id: "curated-9001",
    question: "What remains unknown here?",
    field: "biology",
    description: "A sufficiently detailed description of the open problem.",
    source: {
      name: "Wikipedia",
      url: "https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_biology",
      license: "CC BY-SA 4.0",
    },
  };

  async function readShippedData() {
    const { readFile } = await import("node:fs/promises");
    const schemaUrl = new URL("../../public/data/schema.json", import.meta.url);
    const datasetUrl = new URL("../../public/data/curated.json", import.meta.url);
    const [schemaText, datasetText] = await Promise.all([
      readFile(schemaUrl, "utf8"),
      readFile(datasetUrl, "utf8"),
    ]);

    return {
      schema: JSON.parse(schemaText),
      dataset: JSON.parse(datasetText),
    };
  }

  describe("question data integrity", () => {
    it("keeps every shipped entry schema-valid and sourced", async () => {
      const { dataset, schema } = await readShippedData();
      const failures = dataset.flatMap((entry) => {
        const result = validateQuestion(entry, schema);

        if (!result.valid) {
          return [entry.id + ": " + result.errors.join("; ")];
        }

        if (!hasApprovedSource(entry.source.url)) {
          return [entry.id + ": unapproved source"];
        }

        return [];
      });

      expect(dataset).toHaveLength(46);
      expect(failures).toEqual([]);
    });

    it("merges datasets, dedupes ids, and drops-and-logs invalid or unsourced entries", async () => {
      const { schema } = await readShippedData();
      const secondValid = {
        ...validFixture,
        id: "curated-9002",
        field: "physics",
      };
      const unsourced = {
        ...validFixture,
        id: "curated-9003",
        source: {
          ...validFixture.source,
          url: "https://example.com/question",
        },
      };
      const invalid = {
        ...validFixture,
        id: "curated-9004",
        source: {
          name: "Wikipedia",
          license: "CC BY-SA 4.0",
        },
      };
      const payloads = new Map([
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
        ["/data/schema.json", schema],
        ["/data/first.json", [validFixture, invalid]],
        ["/data/second.json", [validFixture, secondValid, unsourced]],
      ]);
      const warnings = [];
      const fetchFn = async (url) => {
        if (!payloads.has(url)) {
          return { ok: false, status: 404, json: async () => null };
        }

        return {
          ok: true,
          status: 200,
          json: async () => payloads.get(url),
        };
      };

      const questions = await loadQuestions({
        fetchFn,
        logger: { warn: (message) => warnings.push(message) },
      });

      expect(questions.map(({ id }) => id)).toEqual([
        "curated-9001",
        "curated-9002",
      ]);
      expect(warnings.some((message) => message.includes("dropped invalid"))).toBe(
        true,
      );
      expect(warnings.some((message) => message.includes("dropped unsourced"))).toBe(
        true,
      );
      expect(warnings.some((message) => message.includes("duplicate id"))).toBe(true);
      expect(warnings.some((message) => message.includes("could not be loaded"))).toBe(
        true,
      );
    });
  });
}
