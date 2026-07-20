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
  if (type === "array") {
    return Array.isArray(value);
  }

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

  if (definition.type === "array" && definition.items) {
    value.forEach((item, index) =>
      validateNode(item, definition.items, path + "[" + index + "]", errors),
    );
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

export function hasWikipediaRabbitHole(rabbitHoleUrl) {
  try {
    const url = new URL(rabbitHoleUrl);
    const hostname = url.hostname.toLowerCase();

    return (
      url.protocol === "https:" &&
      hostname === "en.wikipedia.org" &&
      url.pathname.startsWith("/wiki/")
    );
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

      if (!hasWikipediaRabbitHole(entry.rabbitHole.url)) {
        warn(logger, dataset.id + " dropped non-Wikipedia rabbit hole " + label);
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
