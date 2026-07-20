import { describe, expect, it } from "vitest";
import { readSharedSelection, selectionUrl } from "./share.js";

describe("share links", () => {
  it("reads a shared question or trail from the URL", () => {
    expect(readSharedSelection("?question=curated-0001")).toEqual({
      questionId: "curated-0001",
      trailId: null,
    });
    expect(readSharedSelection("?trail=mind")).toEqual({
      questionId: null,
      trailId: "mind",
    });
  });

  it("creates a clean, shareable URL for the current selection", () => {
    const location = new URL("https://example.com/open-question-atlas/?question=old&trail=old");
    expect(selectionUrl(location, { questionId: "curated-0013" })).toBe(
      "https://example.com/open-question-atlas/?question=curated-0013",
    );
  });
});
