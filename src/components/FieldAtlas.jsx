import React from "react";
import { FIELDS } from "./FieldChips.jsx";

export default function FieldAtlas({ counts, disabled = false, onSelect }) {
  return (
    <section aria-labelledby="field-atlas-title" className="mt-12 w-full">
      <div className="text-center">
        <p className="font-sans text-xs uppercase tracking-[0.24em] text-[#67d7dc]">Explore the atlas</p>
        <h2 className="mt-3 font-serif text-3xl text-[#f0eadf]" id="field-atlas-title">Choose a region of the unknown</h2>
      </div>
      <div className="atlas-regions mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {FIELDS.map(({ icon, label, value }) => (
          <button
            className="atlas-region"
            disabled={disabled || !counts[value]}
            key={value}
            onClick={() => onSelect(value)}
            type="button"
          >
            <span aria-hidden="true" className="text-xl">{icon}</span>
            <span className="mt-3 block font-serif text-lg text-[#eef0e9]">{label}</span>
            <span className="mt-1 block font-sans text-xs text-[#8fa7b4]">{counts[value] ?? 0} questions</span>
          </button>
        ))}
      </div>
    </section>
  );
}
