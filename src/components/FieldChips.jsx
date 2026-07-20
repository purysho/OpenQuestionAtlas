import React from "react";

export const FIELDS = [
  { value: "biology", label: "Biology", icon: "🧬" },
  { value: "cosmology", label: "Cosmology", icon: "🌌" },
  { value: "physics", label: "Physics", icon: "⚛️" },
  { value: "neuroscience", label: "Neuroscience", icon: "🧠" },
  { value: "mathematics", label: "Mathematics", icon: "➗" },
  { value: "computer-science", label: "Computer Science", icon: "💻" },
  { value: "climate-earth", label: "Climate & Earth", icon: "🌍" },
  { value: "chemistry", label: "Chemistry", icon: "🧪" },
  { value: "philosophy", label: "Philosophy", icon: "💭" },
  { value: "medicine", label: "Medicine", icon: "🩺" },
  { value: "economics", label: "Economics", icon: "📈" },
  { value: "ai", label: "AI", icon: "🤖" },
];

export default function FieldChips({
  disabled = false,
  onToggle,
  selected,
}) {
  return (
    <fieldset className="mt-6" disabled={disabled}>
      <legend className="sr-only">Filter by field</legend>
      <div className="flex flex-wrap justify-center gap-2.5">
        {FIELDS.map(({ icon, label, value }) => {
          const active = selected.includes(value);

          return (
            <button
              aria-pressed={active}
              className={"field-chip" + (active ? " field-chip-selected" : "")}
              key={value}
              onClick={() => onToggle(value)}
              type="button"
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
