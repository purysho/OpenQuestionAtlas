export const TRAILS = [
  {
    id: "origins",
    title: "How things begin",
    description: "From the first living cell to the shape of the universe.",
    questionIds: ["curated-0001", "curated-0003", "curated-0032", "curated-0008"],
  },
  {
    id: "time",
    title: "The nature of time",
    description: "A short route through physics, cosmology, and memory.",
    questionIds: ["curated-0012", "curated-0011", "curated-0006", "curated-0015"],
  },
  {
    id: "mind",
    title: "What makes a mind?",
    description: "Follow consciousness from brains to machines.",
    questionIds: ["curated-0013", "curated-0014", "curated-0035", "curated-0045"],
  },
];

export function questionsForTrail(questions, trail) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  return trail.questionIds.map((id) => byId.get(id)).filter(Boolean);
}
