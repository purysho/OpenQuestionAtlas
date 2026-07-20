import React from "react";
import RelatedQuestions from "./RelatedQuestions.jsx";

const FIELD_LABELS = {
  ai: "AI",
  biology: "Biology",
  chemistry: "Chemistry",
  "climate-earth": "Climate & Earth",
  "computer-science": "Computer Science",
  cosmology: "Cosmology",
  economics: "Economics",
  mathematics: "Mathematics",
  medicine: "Medicine",
  neuroscience: "Neuroscience",
  philosophy: "Philosophy",
  physics: "Physics",
};

export default function QuestionCard({ question, related = [], onExplore }) {
  return (
    <article className="question-card mx-auto w-full max-w-4xl px-6 py-12 text-center sm:px-12 sm:py-16">
      <p className="font-sans text-xs uppercase tracking-[0.24em] text-[#67d7dc]">
        {FIELD_LABELS[question.field]}
      </p>
      <h3 className="mx-auto mt-6 max-w-3xl font-serif text-4xl font-normal leading-[1.08] tracking-[-0.025em] text-[#f4eee3] sm:text-6xl">
        {question.question}
      </h3>
      <p className="mx-auto mt-8 max-w-2xl font-sans text-base leading-7 text-[#bdc7cc]">
        <span className="sr-only">Why it is open: </span>
        {question.description}
      </p>
      {question.tags?.length ? (
        <ul aria-label="Question themes" className="mt-7 flex flex-wrap justify-center gap-2">
          {question.tags.map((tag) => (
            <li className="question-tag" key={tag}>{tag.replaceAll("-", " ")}</li>
          ))}
        </ul>
      ) : null}
      <a
        className="mt-9 inline-flex items-center gap-2 font-sans text-base text-[#67d7dc] underline decoration-[#67d7dc]/35 underline-offset-8 transition hover:text-[#a3edf0] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67d7dc] focus-visible:ring-offset-4 focus-visible:ring-offset-[#071b2d]"
        href={question.rabbitHole.url}
        rel="noreferrer"
        target="_blank"
      >
        Follow the rabbit hole <span aria-hidden="true">→</span>
        <span className="sr-only"> at {question.rabbitHole.name}</span>
      </a>
      <p className="mt-7 font-serif text-sm text-[#8f9da5]">
        {question.source.name}{question.notoriety ? " · " + question.notoriety + " question" : ""}
      </p>
      {onExplore ? <RelatedQuestions onExplore={onExplore} questions={related} /> : null}
    </article>
  );
}
