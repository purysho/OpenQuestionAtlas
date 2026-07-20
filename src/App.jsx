import React, { useEffect, useMemo, useRef, useState } from "react";
import AttributionFooter from "./components/AttributionFooter.jsx";
import EmptyState from "./components/EmptyState.jsx";
import FieldAtlas from "./components/FieldAtlas.jsx";
import FieldChips from "./components/FieldChips.jsx";
import QuestionCard from "./components/QuestionCard.jsx";
import SearchBar from "./components/SearchBar.jsx";
import SurpriseButton from "./components/SurpriseButton.jsx";
import TrailPicker from "./components/TrailPicker.jsx";
import {
  fieldCounts,
  filterByFields,
  pickSurprise,
  relatedQuestions,
  searchQuestions,
} from "./lib/discovery.js";
import { loadQuestions } from "./lib/loader.js";
import { FEATURED_QUESTION_ID } from "./lib/featured.js";
import { readSharedSelection, selectionUrl } from "./lib/share.js";
import { questionsForTrail, TRAILS } from "./lib/trails.js";

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedFields, setSelectedFields] = useState([]);
  const [surpriseQuestion, setSurpriseQuestion] = useState(null);
  const [surpriseVersion, setSurpriseVersion] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  const [activeTrail, setActiveTrail] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const seenQuestionIds = useRef(new Set());

  useEffect(() => {
    let active = true;

    loadQuestions({ baseUrl: import.meta.env.BASE_URL + "data" })
      .then((loadedQuestions) => {
        if (!active) return;
        setQuestions(loadedQuestions);
        const shared = readSharedSelection(window.location.search);
        const sharedTrail = TRAILS.find(({ id }) => id === shared.trailId);
        const sharedQuestion = loadedQuestions.find(({ id }) => id === shared.questionId);

        if (sharedTrail) setActiveTrail(sharedTrail);
        if (sharedQuestion) setSurpriseQuestion(sharedQuestion);
        setLoadState("ready");
      })
      .catch((error) => {
        console.error("[atlas] Questions could not be loaded", error);
        if (active) setLoadState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const results = useMemo(
    () =>
      searchQuestions(
        filterByFields(questions, selectedFields),
        debouncedQuery,
      ),
    [debouncedQuery, questions, selectedFields],
  );
  const trailQuestions = useMemo(
    () => (activeTrail ? questionsForTrail(questions, activeTrail) : null),
    [activeTrail, questions],
  );
  const visibleQuestions = trailQuestions ?? results;
  const counts = useMemo(() => fieldCounts(questions), [questions]);
  const related = useMemo(
    () => relatedQuestions(questions, surpriseQuestion),
    [questions, surpriseQuestion],
  );
  const featuredQuestion = useMemo(
    () => questions.find(({ id }) => id === FEATURED_QUESTION_ID),
    [questions],
  );

  const searching = query !== debouncedQuery;
  const hasActiveFilters = Boolean(query.trim() || selectedFields.length || activeTrail);

  function updateSharedSelection(selection) {
    window.history.replaceState({}, "", selectionUrl(window.location, selection));
  }

  function updateQuery(value) {
    setQuery(value);
    setSurpriseQuestion(null);
    setActiveTrail(null);
    updateSharedSelection({});
  }

  function toggleField(field) {
    setSelectedFields((current) =>
      current.includes(field)
        ? current.filter((value) => value !== field)
        : [...current, field],
    );
    setSurpriseQuestion(null);
    setActiveTrail(null);
    updateSharedSelection({});
  }

  function showSurprise() {
    const next = pickSurprise(visibleQuestions, seenQuestionIds.current);
    seenQuestionIds.current = next.seenIds;
    setSeenCount(next.seenIds.size);
    setSurpriseQuestion(next.question);
    setSurpriseVersion((current) => current + 1);
    updateSharedSelection({ questionId: next.question?.id });
  }

  function showQuestion(question) {
    setSurpriseQuestion(question);
    setSurpriseVersion((current) => current + 1);
    updateSharedSelection({ questionId: question.id });
  }

  function chooseField(field) {
    setSelectedFields([field]);
    setQuery("");
    setActiveTrail(null);
    setSurpriseQuestion(null);
    updateSharedSelection({});
  }

  function chooseTrail(trail) {
    setActiveTrail(trail);
    setQuery("");
    setSelectedFields([]);
    setSurpriseQuestion(null);
    updateSharedSelection({ trailId: trail.id });
  }

  function clearDiscovery() {
    setQuery("");
    setSelectedFields([]);
    setSurpriseQuestion(null);
    setActiveTrail(null);
    updateSharedSelection({});
  }

  return (
    <>
      <a className="skip-link" href="#atlas-content">
        Skip to the atlas
      </a>
      <main
        className="atlas-shell px-5 sm:px-8"
        id="atlas-content"
        tabIndex={-1}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center pt-16 sm:pt-24 lg:pt-28">
        <header className="w-full text-center">
          <h1 className="font-serif text-5xl font-normal leading-[0.96] tracking-[-0.035em] text-[#f0eadf] sm:text-6xl lg:text-[5.25rem]">
            The Open Questions Atlas
          </h1>
        </header>

        <div className="mt-12 w-full max-w-4xl sm:mt-14">
          <SearchBar
            disabled={loadState !== "ready"}
            onChange={updateQuery}
            value={query}
          />
          <FieldChips
            disabled={loadState !== "ready"}
            onToggle={toggleField}
            selected={selectedFields}
          />
          <div className="mt-7 flex justify-center">
            <SurpriseButton
              disabled={
                loadState !== "ready" || searching || visibleQuestions.length === 0
              }
              onClick={showSurprise}
            />
          </div>
          {seenCount ? <p className="mt-3 text-center font-sans text-xs text-[#8fa7b4]">{seenCount} question{seenCount === 1 ? "" : "s"} explored this session</p> : null}
        </div>

        <section
          aria-busy={searching || loadState === "loading"}
          aria-live="polite"
          className="mt-16 flex w-full flex-1 flex-col items-center sm:mt-20"
        >
          {loadState === "loading" ? (
            <p className="py-20 font-sans text-sm text-[#9eb0ba]">
              Charting the questions…
            </p>
          ) : null}

          {loadState === "error" ? (
            <p className="py-20 text-center font-sans text-sm text-[#e2c7b5]">
              The atlas could not be opened. Refresh to try again.
            </p>
          ) : null}

          {loadState === "ready" && !hasActiveFilters && !surpriseQuestion ? (
            <div aria-labelledby="welcome-title" className="w-full max-w-4xl pb-16 text-center sm:pb-20" role="region">
              <div className="border-y border-[#d7cbb5]/20 py-14 sm:py-16">
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
              </div>
              <FieldAtlas counts={counts} disabled={loadState !== "ready"} onSelect={chooseField} />
              <TrailPicker onChoose={chooseTrail} trails={TRAILS} />
              {featuredQuestion ? (
                <button className="featured-question mt-10 w-full text-left" onClick={() => showQuestion(featuredQuestion)} type="button">
                  <span className="font-sans text-xs uppercase tracking-[0.22em] text-[#67d7dc]">Question of the week</span>
                  <span className="mt-3 block font-serif text-2xl leading-tight text-[#f0eadf] sm:text-3xl">{featuredQuestion.question}</span>
                  <span className="mt-3 block font-sans text-sm leading-6 text-[#aab8c0]">{featuredQuestion.description}</span>
                  <span className="mt-5 block font-sans text-xs uppercase tracking-[0.16em] text-[#67d7dc]">Enter this question →</span>
                </button>
              ) : null}
            </div>
          ) : null}

          {loadState === "ready" &&
          (hasActiveFilters || surpriseQuestion) &&
          !searching ? (
            <div className="grid w-full gap-8 pb-16">
              <h2 className="sr-only">Question results</h2>
              {surpriseQuestion ? (
                <div
                  className="question-settle"
                  key={surpriseVersion}
                >
                  <QuestionCard onExplore={showQuestion} question={surpriseQuestion} related={related} />
                </div>
              ) : visibleQuestions.length ? (
                <>
                  {activeTrail ? <p className="text-center font-sans text-xs uppercase tracking-[0.22em] text-[#67d7dc]">Trail: {activeTrail.title}</p> : null}
                {visibleQuestions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
                </>
              ) : (
                <EmptyState onReset={clearDiscovery} />
              )}
            </div>
          ) : null}

          {loadState === "ready" && hasActiveFilters && searching ? (
            <p className="py-20 font-sans text-sm text-[#9eb0ba]">
              Searching the atlas…
            </p>
          ) : null}
        </section>

        <AttributionFooter />
        </div>
      </main>
    </>
  );
}
