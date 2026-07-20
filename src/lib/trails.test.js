import { describe, expect, it } from "vitest";
import { questionsForTrail } from "./trails.js";

describe("questionsForTrail", () => {
  it("keeps a trail's editorial order and ignores unavailable questions", () => {
    const questions = [{ id: "second" }, { id: "first" }];
    const trail = { questionIds: ["first", "missing", "second"] };

    expect(questionsForTrail(questions, trail)).toEqual([
      { id: "first" },
      { id: "second" },
    ]);
  });
});
