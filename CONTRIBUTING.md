# Contributing

The Open Questions Atlas is a curation project. Its value depends on every
question being real, useful, and traceable to an approved source.

## Add a question

1. Choose a source from the approved list below and read the source itself.
2. Add a concise, independently phrased entry to `public/data/curated.json`.
3. Give it a unique kebab-case `id` and one field from the fixed vocabulary.
4. Explain why the question remains open without overstating the source.
5. Record the source's real HTTPS URL, name, and applicable license.
6. Add a relevant `rabbitHole` link to an English Wikipedia article about the
   question or its closest core concept.
7. Increase the `curated` count in `public/data/index.json`.
8. Run `npm test`, `npm run lint`, and `npm run build`.

Never add an unsourced entry. Do not invent a question, author, citation, URL,
or license to meet a quantity target. If a source cannot support the entry,
leave it out.

## Schema

Every entry must validate against `public/data/schema.json`:

```json
{
  "id": "biological-function-of-sleep",
  "question": "What is the biological function of sleep?",
  "field": "neuroscience",
  "description": "Sleep is universal across studied animals, but no single proposed function fully explains its effects and evolutionary persistence.",
  "source": {
    "name": "Wikipedia — List of unsolved problems in neuroscience",
    "url": "https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_neuroscience",
    "license": "CC BY-SA 4.0"
  },
  "rabbitHole": {
    "name": "Wikipedia - Sleep",
    "url": "https://en.wikipedia.org/wiki/Sleep"
  },
  "notoriety": "known"
}
```

The required properties are `id`, `question`, `field`, `description`, and
`source`, plus a `rabbitHole` link to an English Wikipedia article. `notoriety`
is optional and may be `famous`, `known`, or `obscure`. Additional properties
are rejected.

## Field vocabulary

Use exactly one of:

- `biology`
- `cosmology`
- `physics`
- `neuroscience`
- `mathematics`
- `computer-science`
- `climate-earth`
- `chemistry`
- `philosophy`
- `medicine`
- `economics`
- `ai`

## Approved sources

- [Wikenigma](https://wikenigma.org.uk/) — CC BY-NC-SA 4.0; preserve the
  non-commercial restriction on each derived entry.
- [Erdős Problems](https://github.com/teorth/erdosproblems) — verify the
  repository's current license before adapting material.
- [Wikipedia's lists of unsolved problems](https://en.wikipedia.org/wiki/Lists_of_unsolved_problems)
  — CC BY-SA; link the specific field page whenever possible.
- [Science: 125 Questions](https://www.science.org/doi/10.1126/science.309.5731.78b)
  — cite and summarize; do not copy.
- [Open Problem Garden](https://www.openproblemgarden.org/) — check the terms
  before adapting material.
- [John Baez's Open Questions in Physics](https://math.ucr.edu/home/baez/physics/)
  — cite the relevant page.

When a source's terms are unclear, do not ship the entry until they are resolved.
Record every source and its terms in `LICENSES.md`.

## Data review checklist

- The ID is unique and kebab-case.
- The question and explanation are independently phrased and accurate.
- The field is in the controlled vocabulary.
- The source URL is real, specific, HTTPS, and from the approved list.
- The per-entry license matches `LICENSES.md`.
- The rabbit-hole URL is a real English Wikipedia article about the question.
- `public/data/index.json` has the correct count.
- Invalid or unsourced entries are still covered by the loader tests as
  dropped-and-logged, never rendered.

## Good first issues

Good starter issues are narrow curation batches such as “add 5 sourced questions
in chemistry” or “add 5 sourced questions in economics.” Each issue should name
an approved source, require one valid entry at a time, and repeat the three-gate
checklist above.
