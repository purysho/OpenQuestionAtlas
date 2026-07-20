import React from "react";

export default function EmptyState({ onReset }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-20 text-center">
      <svg
        aria-hidden="true"
        className="size-10 text-[#67d7dc]"
        fill="none"
        viewBox="0 0 48 48"
      >
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1" />
        <path
          d="M24 13v22M13 24h22"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1"
        />
        <circle cx="24" cy="24" fill="currentColor" r="2.5" />
      </svg>
      <h2 className="mt-7 font-serif text-3xl text-[#f0eadf]">
        This part of the atlas is still uncharted.
      </h2>
      <p className="mt-4 font-sans text-base leading-7 text-[#aebcc4]">
        Widen the search and let another question find you.
      </p>
      <button
        className="mt-7 rounded-md border border-[#67d7dc]/70 px-5 py-2.5 font-sans text-sm text-[#a3edf0] transition hover:bg-[#67d7dc]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67d7dc] focus-visible:ring-offset-4 focus-visible:ring-offset-[#071b2d]"
        onClick={onReset}
        type="button"
      >
        Clear the map
      </button>
    </div>
  );
}
