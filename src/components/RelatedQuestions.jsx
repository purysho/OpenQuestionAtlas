import React from "react";

export default function RelatedQuestions({ onExplore, questions }) {
  if (!questions.length) return null;

  return (
    <aside className="mx-auto mt-10 max-w-3xl border-t border-[#d7cbb5]/15 pt-8" aria-label="Related questions">
      <p className="font-sans text-xs uppercase tracking-[0.22em] text-[#8fa7b4]">Continue the thread</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {questions.map((question) => (
          <button className="related-question" key={question.id} onClick={() => onExplore(question)} type="button">
            {question.question}
          </button>
        ))}
      </div>
    </aside>
  );
}
