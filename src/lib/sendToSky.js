// Atlas → Lodestar link-builder (brief §6).
//
// Maps a question (already in hand) to a star payload and builds the Lodestar
// add-URL. Encoding + field contract come verbatim from starLink.js; this file
// only does the question → payload mapping and sets origin.

import { buildAddUrl, buildStarPayload } from "./starLink.js";

export function questionToStarPayload(question) {
  return buildStarPayload({
    title: question.question,
    note: question.description ?? "",
    tags: [question.field, ...(question.tags ?? [])].filter(Boolean),
    url: question.source?.url ?? "",
    origin: "atlas",
  });
}

export function buildQuestionStarUrl(question) {
  return buildAddUrl(questionToStarPayload(question));
}
