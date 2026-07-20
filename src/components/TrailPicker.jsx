import React from "react";

export default function TrailPicker({ onChoose, trails }) {
  return (
    <section aria-labelledby="trails-title" className="mt-14 w-full border-y border-[#d7cbb5]/15 py-10">
      <div className="text-center">
        <p className="font-sans text-xs uppercase tracking-[0.24em] text-[#67d7dc]">Curated trails</p>
        <h2 className="mt-3 font-serif text-3xl text-[#f0eadf]" id="trails-title">Start with a thread</h2>
      </div>
      <div className="mt-7 grid gap-3 md:grid-cols-3">
        {trails.map((trail) => (
          <button className="trail-card text-left" key={trail.id} onClick={() => onChoose(trail)} type="button">
            <span className="font-serif text-xl text-[#f0eadf]">{trail.title}</span>
            <span className="mt-2 block font-sans text-sm leading-6 text-[#aab8c0]">{trail.description}</span>
            <span className="mt-4 block font-sans text-xs uppercase tracking-[0.16em] text-[#67d7dc]">Follow this trail →</span>
          </button>
        ))}
      </div>
    </section>
  );
}
