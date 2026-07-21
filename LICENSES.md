# Data licenses

The Open Questions Atlas separates the MIT-licensed application code from its
community-curated question data. Each entry in `public/data/*.json` records its
own source name, source URL, and license.

## Wikipedia open-problem lists

The initial `curated.json` dataset adapts and paraphrases questions from the
following English Wikipedia pages:

- [Lists of problems](https://en.wikipedia.org/wiki/Lists_of_unsolved_problems)
- [Unsolved problems in astronomy](https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_astronomy)
- [Unsolved problems in biology](https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_biology)
- [Unsolved problems in chemistry](https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_chemistry)
- [Unsolved problems in computer science](https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_computer_science)
- [Unsolved problems in economics](https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_economics)
- [Unsolved problems in geoscience](https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_geoscience)
- [Unsolved problems in mathematics](https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_mathematics)
- [Unsolved problems in medicine](https://en.wikipedia.org/wiki/Unsolved_problems_in_medicine)
- [Unsolved problems in neuroscience](https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_neuroscience)
- [Philosophical problems](https://en.wikipedia.org/wiki/List_of_philosophical_problems)
- [Unsolved problems in physics](https://en.wikipedia.org/wiki/List_of_unsolved_problems_in_physics)

Wikipedia text is available under the
[Creative Commons Attribution-ShareAlike 4.0 International license](https://creativecommons.org/licenses/by-sa/4.0/).
The adapted question wording and descriptions in `curated.json` are distributed
under the same license.

Wikipedia is a trademark of the Wikimedia Foundation and is not affiliated with
or endorsing this project.

<!-- ingest:erdos:begin -->
## Erdős Problems

Imported by `npm run ingest -- --only erdos` into `public/data/erdos.json` (12 entries).

Adapted from the [Erdős Problems database](https://github.com/teorth/erdosproblems) (`data/problems.yaml`), licensed under Apache-2.0. Problem statements are independently phrased for the Atlas; each entry links to the source database and to an English Wikipedia article on the problem.
<!-- ingest:erdos:end -->
