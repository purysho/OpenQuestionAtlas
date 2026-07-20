export function readSharedSelection(search) {
  const params = new URLSearchParams(search);
  return {
    questionId: params.get("question"),
    trailId: params.get("trail"),
  };
}

export function selectionUrl(location, { questionId = null, trailId = null }) {
  const url = new URL(location.href);
  url.searchParams.delete("question");
  url.searchParams.delete("trail");

  if (questionId) url.searchParams.set("question", questionId);
  if (trailId) url.searchParams.set("trail", trailId);

  return url.toString();
}
