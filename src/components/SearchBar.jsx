import React from "react";

export default function SearchBar() {
  return (
    <label className="atlas-search flex items-center gap-4 px-5 py-4 sm:px-6 sm:py-5">
      <span className="sr-only">Search open questions</span>
      <svg
        aria-hidden="true"
        className="size-6 shrink-0 text-[#8fa3ae]"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
      <input
        className="min-w-0 flex-1 border-0 bg-transparent font-sans text-base text-[#f7f1e8] outline-none placeholder:text-[#8295a1] sm:text-lg"
        name="search"
        placeholder="Search the unknown"
        type="search"
      />
    </label>
  );
}
