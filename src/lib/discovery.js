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

export function relatedQuestions(questions, currentQuestion, limit = 3) {
  if (!currentQuestion) return [];

  const currentTags = new Set(currentQuestion.tags ?? []);

  return questions
    .filter(({ id }) => id !== currentQuestion.id)
    .map((question) => ({
      question,
      score:
        (question.field === currentQuestion.field ? 2 : 0) +
        (question.tags ?? []).filter((tag) => currentTags.has(tag)).length * 3,
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.question.id.localeCompare(right.question.id))
    .slice(0, limit)
    .map(({ question }) => question);
}

export function fieldCounts(questions) {
  return questions.reduce((counts, { field }) => {
    counts[field] = (counts[field] ?? 0) + 1;
    return counts;
  }, {});
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
