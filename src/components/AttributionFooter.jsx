import React from "react";

export default function AttributionFooter() {
  return (
    <footer className="w-full border-t border-[#d7cbb5]/15 py-7 text-center font-sans text-xs leading-6 text-[#8d9eaa]">
      Question data adapted from{" "}
      <a
        className="text-[#b4c7cf] underline decoration-[#b4c7cf]/35 underline-offset-4 hover:text-[#e8eceb] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67d7dc]"
        href="https://en.wikipedia.org/wiki/Lists_of_unsolved_problems"
        rel="noreferrer"
        target="_blank"
      >
        Wikipedia’s open-problem lists
      </a>
      <span aria-hidden="true"> · </span>
      <a
        className="text-[#b4c7cf] underline decoration-[#b4c7cf]/35 underline-offset-4 hover:text-[#e8eceb] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67d7dc]"
        href={import.meta.env.BASE_URL + "LICENSES.md"}
      >
        Sources &amp; data licenses
      </a>
      <span aria-hidden="true"> · </span>
      <a
        className="text-[#b4c7cf] underline decoration-[#b4c7cf]/35 underline-offset-4 hover:text-[#e8eceb] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67d7dc]"
        href={import.meta.env.BASE_URL + "CONTRIBUTING.md"}
      >
        Help map the unknown
      </a>
    </footer>
  );
}
