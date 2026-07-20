export function searchQuestions(questions, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return questions;
  }

  return questions.filter(({ description, question }) =>
    (question + " " + description).toLocaleLowerCase().includes(normalizedQuery),
  );
}

export function filterByFields(questions, selectedFields) {
  if (!selectedFields.length) {
    return questions;
  }

  const fields = new Set(selectedFields);
  return questions.filter(({ field }) => fields.has(field));
}

export function pickSurprise(questions, seenIds, random = Math.random) {
  if (!questions.length) {
    return { question: null, seenIds: new Set(seenIds) };
  }

  const poolIds = new Set(questions.map(({ id }) => id));
  let available = questions.filter(({ id }) => !seenIds.has(id));
  const nextSeenIds = new Set(seenIds);

  if (!available.length) {
    for (const id of poolIds) {
      nextSeenIds.delete(id);
    }
    available = questions;
  }

  const randomIndex = Math.min(
    available.length - 1,
    Math.floor(Math.max(0, random()) * available.length),
  );
  const question = available[randomIndex];
  nextSeenIds.add(question.id);

  return { question, seenIds: nextSeenIds };
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest;
  const questions = [
    { id: "bio", field: "biology", question: "Biology?", description: "Bio" },
    { id: "math", field: "mathematics", question: "Math?", description: "Math" },
    { id: "physics", field: "physics", question: "Physics?", description: "Physics" },
  ];

  describe("field discovery", () => {
    it("uses union semantics for multiple selected fields", () => {
      expect(
        filterByFields(questions, ["biology", "physics"]).map(({ id }) => id),
      ).toEqual(["bio", "physics"]);
    });

    it("leaves the whole pool available when no field is selected", () => {
      expect(filterByFields(questions, [])).toEqual(questions);
    });
  });

  describe("Surprise me", () => {
    it("does not repeat until the available pool is exhausted", () => {
      let seenIds = new Set();
      const picks = [];

      for (let index = 0; index < questions.length + 1; index += 1) {
        const result = pickSurprise(questions, seenIds, () => 0);
        picks.push(result.question.id);
        seenIds = result.seenIds;
      }

      expect(picks.slice(0, questions.length)).toEqual([
        "bio",
        "math",
        "physics",
      ]);
      expect(picks[questions.length]).toBe("bio");
    });

    it("draws only from the pool it receives", () => {
      const result = pickSurprise(
        filterByFields(questions, ["mathematics"]),
        new Set(),
        () => 0.9,
      );

      expect(result.question.id).toBe("math");
    });
  });
}
