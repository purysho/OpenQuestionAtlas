# The Open Questions Atlas — Project Brief

> **How to use this file:** Commit it to the root of your repo as `AGENTS.md` (Codex reads that file automatically), or attach it to your first Codex cloud task. It contains the full product spec, data schema, architecture rules, build order, and environment settings. Everything Codex needs is in this one document.
>
> **Sibling project:** This is built on the same chassis as *GitHub Treasure Hunt* — static site, search + Surprise Me + categories + cards. The one genuinely new problem is the **data layer**: there is no "open questions API," so this project owns its data as versioned JSON.

---

## 1. What we're building

**The Open Questions Atlas** — a discovery engine for the things humanity still doesn't know. A living map of open questions across every field. You arrive, you find a question that makes you stare at the wall, you follow it down a rabbit hole.

- **For:** the intellectually curious, students hunting a thesis topic, researchers browsing adjacent fields, anyone who finds unanswered questions more thrilling than settled answers.
- **The vibe:** an atlas, not a feed. Calm, spacious, reverent toward the questions. One question can hold the whole screen. You discover something profound, you leave changed.
- **Explicitly NOT:** no AI agents (until V3), no accounts, no social feed, no engagement metrics, no infinite scroll, no answers — the point is the *questions*.

This is a **public, community-curated open-source project**. Its value is the quality and honesty of its dataset.

---

## 2. Hard rules (read first)

1. **Static site only.** No server, no backend, no database, no build-time secrets. Deploys to GitHub Pages.
2. **The app makes ZERO external API calls.** All data is local JSON served from `/public/data/`. No GitHub API, no third-party fetches, no CORS proxies. (This makes it even simpler than Treasure Hunt — no rate limits, no tokens, ever.)
3. **Schema-first, multi-source by design.** The app never reads "the questions file." It reads whatever `index.json` lists, merges those datasets, and runs discovery over the combined pool. Path A ships one dataset; Path B adds more files. Same code either way. **Do not hardcode a single data file.**
4. **Never fabricate a question or a source.** Every question MUST have a real, verifiable `source.url`. If a question can't be sourced, it doesn't ship. When seeding data, draw only from the named sources in §12 with their real URLs, and flag gaps for human curation rather than inventing entries.
5. **Every question carries its own license.** Sources differ (Wikenigma is CC BY-NC-SA; Erdős and Wikipedia differ). License lives per-question in the `source` object, tracked in `LICENSES.md`.
6. **Only make changes directly requested in each task.** No features, backends, routers, or state libraries beyond this spec.

---

## 3. MVP feature spec

### 3.1 Search
Free-text box, client-side, matches against `question` + `description`. Debounced (~200ms; it's in-memory, so fast). No network.

### 3.2 Categories (field chips under the search bar)
Filter by `field`. Ship with these (extend as the dataset grows):

🧬 Biology · 🌌 Cosmology · ⚛️ Physics · 🧠 Neuroscience · ➗ Mathematics · 💻 Computer Science · 🌍 Climate & Earth · 🧪 Chemistry · 💭 Philosophy · 🩺 Medicine · 📈 Economics · 🤖 AI

Each chip filters the in-memory pool. Multiple chips = union of fields. `field` values in the data must match this controlled vocabulary (validate on load; log mismatches).

### 3.3 Surprise Me 🎲
The hero button. One click → one random question from the currently-filtered pool. Since all data is in memory, this is a local random pick — no network, no cache pouch needed. Track seen IDs for the session so it doesn't repeat a question until the pool is exhausted, then reshuffle.

### 3.4 Question card
The soul of the product. Exactly:
- **The question** — the hero. Large, serif, allowed to breathe. This is what people came for.
- **Field tag** — small, quiet.
- **Why it's open** — one line (`description`): the reason this remains unanswered.
- **Follow the rabbit hole →** — link to `source.url` (new tab), labelled with `source.name`.

Nothing else. No answer, no comments, no share count.

### 3.5 Out of scope for MVP (do not build yet)
- **V2 filters:** notoriety (famous / known / obscure — the "hidden gems" analog, powered by an optional `notoriety` field; degrade gracefully when absent), field combinations, filter by source. Build the loader so these are trivial to add.
- **V2 delight — "Down the rabbit hole":** given one question, surface related questions (same field or shared tags). No AI needed — just filtering.
- **V3 AI:** "Why is this hard to answer?" / "Explain like I'm curious" / semantically-related questions. Not before.

---

## 4. Architecture

```
Browser ── fetch ──▶ /data/index.json   (lists active datasets)
   │                      │
   │                      ├─▶ /data/curated.json     (Path A ships this)
   │                      ├─▶ /data/wikenigma.json    (Path B adds this)
   │                      └─▶ /data/erdos.json        (…and this)
   │
   ├─ loader        (fetch listed datasets → validate → merge → dedupe by id)
   ├─ pool          (single in-memory array of all questions)
   ├─ discovery     (search / field filter / Surprise Me all run over the pool)
   └─ GitHub Pages  (static hosting, deployed by Actions)
```

- The entire dataset loads once at startup. Everything after is instant, in-memory, offline-capable.
- **The `index.json` seam is the whole growth story.** Path A = index lists one file. Path B = index lists four. The app can't tell the difference. See §12.

---

## 5. Data layer (this project's "API")

### 5.1 File structure

```
public/data/
  schema.json      # the contract (JSON Schema) every question obeys
  index.json       # lists which datasets are active
  curated.json     # Path A: the hand-curated starter dataset
LICENSES.md        # per-source license terms
```

### 5.2 `index.json`

```json
{
  "datasets": [
    { "id": "curated", "file": "curated.json", "name": "Curated", "count": 42 }
  ]
}
```

Adding a source later = add one line here + drop its JSON file in. Nothing else changes.

### 5.3 Question schema (every entry, every dataset)

```json
{
  "id": "curated-0001",
  "question": "Why do we sleep?",
  "field": "biology",
  "description": "The precise evolutionary and biochemical function of sleep is still unresolved.",
  "source": {
    "name": "Wikenigma",
    "url": "https://wikenigma.org.uk/content/...",
    "license": "CC BY-NC-SA 4.0"
  },
  "notoriety": "known"
}
```

- **`id`** — namespaced by source (`curated-0001`, `wikenigma-0421`) so merged datasets can never collide. Required.
- **`question`, `field`, `description`, `source`** — all required. `field` must be in the §3.2 vocabulary.
- **`source.url`** — must be real and verifiable (rule §2.4). `source.license` is required.
- **`notoriety`** — optional (`famous` | `known` | `obscure`), powers the V2 filter. Ship without it if unknown.

### 5.4 Loader responsibilities (the one thing worth testing hard)
1. Fetch `index.json`, then fetch every listed dataset file.
2. Validate each question against `schema.json`; drop + log invalid entries rather than crashing.
3. Merge into one pool; dedupe by `id`.
4. Expose the pool to search / filter / Surprise Me.
Handle a missing or malformed dataset file gracefully — load the rest, show what loaded.

---

## 6. Tech stack

- **Vite + React + Tailwind CSS.** No router. No state library (useState/useReducer only). Plain `fetch` for local JSON.
- **Vitest** for the loader (validation, merge, dedupe) and Surprise Me (no-repeat-until-exhausted).
- Node 20. npm with committed `package-lock.json`.

### App file structure

```
index.html
vite.config.js            # base: '/open-questions-atlas/'  ← required for Pages
public/data/              # schema.json, index.json, curated.json  (see §5)
src/
  main.jsx
  App.jsx
  lib/loader.js           # fetch + validate + merge + dedupe
  lib/discovery.js        # search, field filter, random pick + seen-tracking
  components/
    SearchBar.jsx
    FieldChips.jsx
    SurpriseButton.jsx
    QuestionCard.jsx
    EmptyState.jsx
    AttributionFooter.jsx # credits sources + links LICENSES.md
.github/workflows/deploy.yml
AGENTS.md                 # this file
LICENSE                   # MIT (code)
LICENSES.md               # per-source data licenses
README.md
CONTRIBUTING.md           # how to add a question (this is a curation project)
```

---

## 7. Design spec

The subject is *the unknown* — design should feel like an atlas or a night sky, not a dashboard. This is the one place to spend boldness; keep everything else quiet.

- **The question is the hero.** On a Surprise Me result, the question can occupy most of the viewport in a large serif face. Reverence through whitespace.
- **Palette:** deep, calm, cartographic — think ink-on-vellum or a star chart, not stark white. One accent for the rabbit-hole link. (Avoid the AI-default cream/terracotta and near-black/acid-green looks; derive the palette from "map of the unknown.")
- **Type:** a characterful serif for questions (they should feel weighty, timeless); a clean sans for UI and field tags; mono only for IDs/metadata if shown.
- **Motion:** one signature moment — the Surprise Me transition, where one question dissolves and the next settles in. Everything else still (respect `prefers-reduced-motion`).
- **Accessible:** full keyboard nav, visible focus, semantic HTML, sufficient contrast on the dark palette. A project about open inquiry must be open to everyone.
- **Copy:** sentence case, no filler. Empty state is an invitation, not an apology.

*(A dedicated design pass can follow, as with Treasure Hunt — treat this section as direction, not final tokens.)*

---

## 8. Build order (run as sequential Codex tasks)

| # | Task | Done when |
|---|---|---|
| 1 | Scaffold Vite + React + Tailwind; calm dark landing with wordmark + search bar | `npm run dev` shows the shell |
| 2 | `schema.json`, `index.json`, seed `curated.json` (40+ real sourced questions), `lib/loader.js` + Vitest | `npm test` passes; loader validates, merges, dedupes; every seeded question has a real `source.url` |
| 3 | Search + QuestionCard (question hero, field tag, why-it's-open, rabbit-hole link) | Typing "sleep" filters to matching questions |
| 4 | Field chips (union filtering over the vocabulary) | Chips filter the pool; combine correctly |
| 5 | Surprise Me + no-repeat-until-exhausted + settle animation | Clicking yields non-repeating random questions from the filtered pool |
| 6 | Empty state + AttributionFooter + `LICENSES.md` | Zero-result state invites action; every source credited + licensed |
| 7 | Pages workflow + README + CONTRIBUTING + polish | Site live on GitHub Pages from `main`; adding a question is documented |

---

## 9. Public repo hygiene

- **LICENSE:** MIT for the code.
- **LICENSES.md:** per-source data terms. **The `NC` in Wikenigma's CC BY-NC-SA matters** if you ever monetize — the app itself can stay non-commercial-friendly, but track it per entry.
- **Repo topics:** `open-questions`, `unsolved-problems`, `open-science`, `discovery`, `wikenigma`, `serendipity`.
- **README:** what it is, screenshot, 3-command quick start, the philosophy (a map of what we don't know), how to contribute.
- **CONTRIBUTING.md:** this is the heart of a curation project — how to add a question (schema, sourcing rule, field vocabulary, the "no unsourced entries" rule). Seed a few `good first issue`s like "add 5 sourced questions in [field]."

---

## 10. Deployment (GitHub Pages via Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - uses: actions/deploy-pages@v4
```

Remember `base: '/open-questions-atlas/'` in `vite.config.js` (match the repo name) or Pages serves broken asset paths.

---

## 11. Codex environment settings (cloud)

- **Dependencies:** with `package-lock.json` committed, Codex auto-installs via npm. Explicit setup script if preferred: `npm ci`.
- **Node version:** environment variable `CODEX_ENV_NODE_VERSION=20`.
- **Secrets:** none. This project needs no credentials anywhere.
- **Agent internet access:** not required for the app (zero external calls). During *seeding* (Task 2), the agent may need read access to the §12 source domains to verify URLs — allowlist those if it fetches to confirm sources; otherwise it works from known URLs.
- Commands the agent should use: `npm run dev` · `npm test` · `npm run lint` · `npm run build`.

---

## 12. Sources, growth path & reference

### The Path A → Path B seam
Path A ships `curated.json` as the only dataset in `index.json`. Path B is **not a rewrite** — it's a small, occasionally-run Node script (`scripts/ingest/`, built later) that reformats each source below into a schema-conforming static JSON file, committed to `public/data/` and added to `index.json`. The site stays 100% static; the data just gets richer. Nothing in `src/` changes.

### Source datasets

| Source | What it is | Role | License note |
|---|---|---|---|
| https://wikenigma.org.uk/ | ~1,286 documented "known unknowns" across ~11 fields | The closest existing thing to the Atlas; prime Path B source | CC BY-NC-SA 4.0 (non-commercial) |
| https://github.com/teorth/erdosproblems | 1,179 Erdős math problems, community DB on GitHub | Forkable structured data → clean Path B ingest | Check repo license |
| https://en.wikipedia.org/wiki/Lists_of_unsolved_problems | Unsolved problems by field | Broad seed content | CC BY-SA |
| https://www.science.org/doi/10.1126/science.309.5731.78b | Science's "125 Questions" | Curated, famous, finite — great starter set | Cite; summarize, don't copy |
| https://www.openproblemgarden.org/ | Curated open math problems | Additional field depth | Check terms |
| https://math.ucr.edu/home/baez/physics/ | Baez's "Open Questions in Physics" | Physics depth | Cite |

### Chassis reference
This project reuses the *GitHub Treasure Hunt* architecture (static site, Vite/React/Tailwind, search + Surprise Me + categories + cards, GitHub Pages). Where a decision isn't specified here, follow the Treasure Hunt pattern.

---

*This brief is for an agentic tool with repo access. Scope: this repository only. Stop and ask before adding any dependency not named in §6, any file outside §6's structure, or before shipping any question that cannot be sourced per §2.4.*
