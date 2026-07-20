export function searchQuestions(questions, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return questions;
  }

  return questions.filter(({ description, question }) =>
    (question + " " + description).toLocaleLowerCase().includes(normalizedQuery),
  );
}
