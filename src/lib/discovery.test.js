import { describe, expect, it } from "vitest";
import {
  fieldCounts,
  filterByFields,
  pickSurprise,
  relatedQuestions,
  searchQuestions,
} from "./discovery.js";

const questions = [
  { id: "bio", field: "biology", question: "Why sleep?", description: "Bio" },
  { id: "math", field: "mathematics", question: "Math?", description: "Math" },
  { id: "physics", field: "physics", question: "Physics?", description: "Physics" },
];

describe("searchQuestions", () => {
  it("matches question and description text without regard to case", () => {
    expect(searchQuestions(questions, "SLEEP").map(({ id }) => id)).toEqual(["bio"]);
    expect(searchQuestions(questions, "math").map(({ id }) => id)).toEqual(["math"]);
  });

  it("keeps the full pool for an empty query", () => {
    expect(searchQuestions(questions, "  ")).toEqual(questions);
  });
});

describe("filterByFields", () => {
  it("uses union semantics for multiple selected fields", () => {
    expect(filterByFields(questions, ["biology", "physics"]).map(({ id }) => id)).toEqual([
      "bio",
      "physics",
    ]);
  });

  it("leaves the whole pool available when no field is selected", () => {
    expect(filterByFields(questions, [])).toEqual(questions);
  });
});

describe("pickSurprise", () => {
  it("does not repeat until the available pool is exhausted", () => {
    let seenIds = new Set();
    const picks = [];

    for (let index = 0; index < questions.length + 1; index += 1) {
      const result = pickSurprise(questions, seenIds, () => 0);
      picks.push(result.question.id);
      seenIds = result.seenIds;
    }

    expect(picks).toEqual(["bio", "math", "physics", "bio"]);
  });

  it("returns no question for an empty pool", () => {
    expect(pickSurprise([], new Set(), () => 0.5)).toEqual({
      question: null,
      seenIds: new Set(),
    });
  });
});

describe("atlas discovery", () => {
  it("prioritizes shared tags before questions in the same field", () => {
    const tagged = [
      { ...questions[0], tags: ["origins"] },
      { ...questions[1], tags: ["proof"] },
      { ...questions[2], tags: ["origins"] },
    ];

    expect(relatedQuestions(tagged, tagged[0]).map(({ id }) => id)).toEqual([
      "physics",
    ]);
  });

  it("counts questions by field for the atlas view", () => {
    expect(fieldCounts(questions)).toEqual({
      biology: 1,
      mathematics: 1,
      physics: 1,
    });
  });
});
