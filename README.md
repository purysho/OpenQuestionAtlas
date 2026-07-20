# The Open Questions Atlas

The Open Questions Atlas is a static, searchable map of questions humanity has
not answered yet. Search by phrase, combine fields, or choose **Surprise me** to
let a non-repeating question find you.

## Interface preview

```text
                 The Open Questions Atlas

        ┌─────────────────────────────────────┐
        │ Search open questions               │
        └─────────────────────────────────────┘
        [ Biology ] [ Physics ] [ Philosophy ] …

                     Surprise me

             What remains unexplained?
       Why it is open, with a path to the source.
```

The finished interface uses a responsive, keyboard-accessible dark star-chart
layout. The repository intentionally keeps only the files in the architecture
defined by `AGENTS.md`, so the preview is represented here without adding a
separate image asset.

## Quick start

```sh
npm install
npm run dev
npm test
```

Node 20 is the supported runtime. The development server prints the local URL.

## How it works

The browser fetches only static JSON under `public/data/`. `index.json` is the
manifest: the loader fetches every dataset it lists, validates entries against
`schema.json`, drops and logs invalid or unsourced entries, merges the valid
records, and removes duplicate IDs. No backend, database, API key, or external
runtime API is involved.

That manifest is the seam between today's curated seed and future source
imports. Adding another static dataset should require a new JSON file plus one
manifest entry; the React application should not change.

## The philosophy

Most knowledge products organize answers. This one maps the edges of knowledge
instead. Each question is treated as the hero, with enough context to understand
why it remains open and a direct path into the source material.

Every shipped question must be traceable. A smaller honest atlas is better than
a larger one padded with invented questions, authors, or URLs.

## Scripts

- `npm run dev` starts Vite.
- `npm test` runs the loader and discovery tests once.
- `npm run lint` runs the repository's source/build validation gate.
- `npm run build` creates the static production site in `dist/`.

## Contributing

Question curation is the heart of this project. Read [CONTRIBUTING.md](CONTRIBUTING.md)
before adding or changing data. In particular, use an approved primary source,
record its real URL and license on every entry, and run all three gates.

## Licenses

Application code is available under the [MIT License](LICENSE). Question data
keeps its source-specific terms; see [LICENSES.md](LICENSES.md).
