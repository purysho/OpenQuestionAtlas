import React from "react";

export default function SurpriseButton({ disabled = false, onClick }) {
  return (
    <button
      className="surprise-button"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="size-5"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 2.75c.3 5.85 3.4 8.95 9.25 9.25-5.85.3-8.95 3.4-9.25 9.25C11.7 15.4 8.6 12.3 2.75 12 8.6 11.7 11.7 8.6 12 2.75Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
      Surprise me
    </button>
  );
}
