import React from "react";
import SearchBar from "./components/SearchBar.jsx";

export default function App() {
  return (
    <main className="atlas-shell px-5 sm:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center pt-16 sm:pt-24 lg:pt-28">
        <header className="w-full text-center">
          <h1 className="font-serif text-5xl font-normal leading-[0.96] tracking-[-0.035em] text-[#f0eadf] sm:text-6xl lg:text-[5.25rem]">
            The Open Questions Atlas
          </h1>
        </header>

        <div className="mt-12 w-full max-w-4xl sm:mt-14">
          <SearchBar />
        </div>

        <section
          aria-labelledby="welcome-title"
          className="mt-20 flex w-full max-w-3xl flex-1 flex-col items-center border-y border-[#d7cbb5]/20 py-16 text-center sm:mt-24 sm:py-20"
        >
          <p className="font-sans text-xs uppercase tracking-[0.28em] text-[#67d7dc]">
            A map of the unknown
          </p>
          <h2
            className="mt-7 max-w-2xl font-serif text-3xl leading-tight text-[#f0eadf] sm:text-5xl"
            id="welcome-title"
          >
            Begin with a question.
          </h2>
          <p className="mt-6 max-w-xl font-sans text-base leading-7 text-[#b7c1c8] sm:text-lg">
            Search the questions humanity has not answered yet.
          </p>
        </section>

        <p className="py-8 font-sans text-xs tracking-wide text-[#8d9eaa]">
          The atlas is still being charted.
        </p>
      </div>
    </main>
  );
}
