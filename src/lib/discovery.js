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
}
