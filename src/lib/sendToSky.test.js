import { describe, expect, it } from "vitest";

import { LODESTAR_ADD_URL, decodeStarPayload } from "./starLink.js";
import { buildQuestionStarUrl, questionToStarPayload } from "./sendToSky.js";

const question = {
  id: "erdos-1135",
  question:
    "Does repeatedly applying the rule 'halve it if even, otherwise triple it and add one' eventually reach 1 for every positive integer?",
  field: "mathematics",
  description:
    "The Collatz (3n+1) conjecture has been verified for enormous ranges of starting values, yet no proof exists that the process always terminates at 1.",
  tags: ["number-theory"],
  source: {
    name: "Erdős Problems database (teorth/erdosproblems)",
    url: "https://github.com/teorth/erdosproblems/blob/main/data/problems.yaml",
    license: "Apache-2.0",
  },
  rabbitHole: { name: "Wikipedia — Collatz conjecture", url: "https://en.wikipedia.org/wiki/Collatz_conjecture" },
  notoriety: "famous",
};

describe("atlas → sky link-builder", () => {
  it("builds a Lodestar add-URL that decodes back to the exact payload", () => {
    const url = buildQuestionStarUrl(question);
    expect(url.startsWith(LODESTAR_ADD_URL)).toBe(true);

    const decoded = decodeStarPayload(url.slice(LODESTAR_ADD_URL.length));
    expect(decoded).toEqual(questionToStarPayload(question));
  });

  it("maps question fields to the star payload with origin \"atlas\"", () => {
    const payload = questionToStarPayload(question);
    expect(payload.v).toBe(1);
    expect(payload.title).toBe(question.question);
    expect(payload.note).toBe(question.description);
    expect(payload.url).toBe(question.source.url);
    expect(payload.origin).toBe("atlas");
    // field first, then the question's own tags.
    expect(payload.tags).toEqual(["mathematics", "number-theory"]);
  });

  it("tolerates a question with no tags", () => {
    const payload = questionToStarPayload({
      question: "What remains unknown here?",
      field: "physics",
      description: "A sufficiently detailed description of the open problem.",
      source: { url: "https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_physics" },
    });
    expect(payload.tags).toEqual(["physics"]);
    expect(payload.origin).toBe("atlas");
  });
});
