# Template architecture: what each module does and how they connect

The templates in `assets/templates/` are the proven, domain-agnostic core of the
learning system. The scaffold script copies them into a new project verbatim;
your job is to fill in the topic (`src/data/course.ts`) and build the UI on top.
Don't re-derive these modules — adapt to them.

This file is the map. Read it before changing anything, so your change lands in
the right module instead of the nearest file.

## The layering principle

The whole design keeps **domain logic out of React components** so it stays
testable and reusable. Three layers:

```
lib/        pure functions + the LLM client   (no React, no app state)
stores/     Zustand state + persistence        (no React rendering)
components/ thin React glue over the above     (no business logic)
data/       the ONE topic-specific file        (course.ts)
```

If you find yourself writing offset math or an unlock rule inside a `.tsx` file,
stop — it belongs in `lib/` or `stores/` where it can be unit-tested.

## `src/lib/` — pure, dependency-free building blocks

- **`course.ts`** — the domain model types: `Course`, `Lesson`, `LessonKeyPoint`,
  `LessonResource`. No logic, just the shape the rest of the app agrees on. This
  is what makes the engine domain-agnostic: nothing here knows the subject.
- **`llm.ts`** — the OpenAI-compatible client. `streamChat()` (SSE streaming) and
  `chat()` (one-shot). Reads `VITE_LLM_BASE_URL` / `VITE_LLM_MODEL` /
  `VITE_LLM_API_KEY`. This is the only file that talks to the network in the
  minimal track. See `llm-config.md`.
- **`markdown.ts`** — a tiny hand-rolled Markdown→HTML renderer. Deliberately
  small and predictable because the annotation logic maps offsets onto its
  output. If you swap in a real library, re-verify `highlight.ts`.
- **`highlight.ts`** — the testable core of the select-to-ask feature:
  `selectionOffsets()` (DOM selection → plain-text offsets) and
  `injectHighlights()` (offsets → `<mark>`+badge markup in the HTML). The fiddly
  part of the whole app, isolated and unit-tested. See `annotation-interaction.md`.
- **`id.ts`** — `generateUUID()`. Trivial, shared.

## `src/stores/` — state + persistence (Zustand + `persist`)

Each store persists to localStorage under a `learn-anything-*` key, so progress,
chats, and annotations survive a reload. That persistence is pillar 4.

- **`progressStore.ts`** — `completedIds`, `markCompleted`/`markIncomplete`, and
  `getStatus(lessonId, orderedIds)` returning `completed | current | locked`. The
  unlock rule is the single most important piece of domain logic and has its own
  test (`progressStore.test.ts`). Linear by default; if you want a prerequisite
  DAG, change `getStatus` and its test together.
- **`chatStore.ts`** — one tutor thread per lesson (`threads[lessonId]`).
  `startLesson()` primes the tutor with the lesson's `tutorPrompt`; `send()`
  streams replies via `lib/llm.ts`. This is pillar 2 (context-aware tutor).
- **`annotationStore.ts`** — the select-to-ask state: `Annotation` records (with
  `selectedText`, offsets, and a `followUps` thread) and `askFollowUp()`, which
  sends the selected span **plus the surrounding answer** to the tutor so it
  knows what "this" means. Pillar 3.

## `src/components/`

- **`AnnotatedMessage.tsx`** — renders a tutor answer and wires up the whole
  select-to-ask interaction: selection → floating "Ask about this" button →
  inline panel with a persisted follow-up thread. It's intentionally thin; the
  hard logic is in `lib/highlight.ts`. This is the signature component — reuse it
  anywhere you render a tutor message you want to be annotatable.

## `src/data/course.ts` — the one file you own per topic

Everything above is generic. This file is the entire personality of the app: the
subject, the lessons, the tutor prompts. Replace the sample with the Phase 1
outline. See `course-design.md`.

## `src/App.tsx` — starter shell (yours to rebuild)

The scaffold drops in a minimal `App.tsx` that proves the wiring: a lesson list
with unlock state and a demo of `AnnotatedMessage`. It is **not** the finished
UI — Phase 3 builds the real thing in vertical slices (course view → lesson +
tutor chat → annotation → confirm persistence). Treat `App.tsx` as scaffolding to
replace, not a design to preserve.

## How a request flows (worked example)

Learner opens Lesson 2 and asks a question:

1. `App` (or your lesson view) calls `chatStore.startLesson(2, primer)` where
   `primer` is built from `course.lessons[1].tutorPrompt`.
2. `chatStore` calls `llm.streamChat(...)`; deltas stream into `threads[2]`.
3. The answer renders through `AnnotatedMessage`, which calls
   `markdown.renderMarkdown()` then `highlight.injectHighlights()` for any saved
   annotations.
4. Learner highlights a phrase → `highlight.selectionOffsets()` → floating button
   → `annotationStore.addAnnotation()`.
5. They type a follow-up → `annotationStore.askFollowUp()` sends span + context to
   `llm.chat()` → the answer persists in the annotation's `followUps`.

Every step crosses exactly one layer boundary. Keep it that way.

## Making it look less generic

The scaffold ships neutral CSS (`src/index.css`, all `la-*` classes) on purpose.
When the learner wants personality, restyle there — pick a palette and type that
fit the subject (warm and hand-drawn for cooking; crisp and technical for a
programming course). Don't move logic into the styling pass; it's purely visual.
If you adopt Tailwind or a component library, keep the `la-highlight` / `la-badge`
/ `la-panel` hooks working since the annotation interaction depends on them.

## Graduating to a backend (full track)

If the learner needs accounts, cross-device sync, shared catalogs, or a
server-held API key, layer a backend behind these same modules. The course /
progress / chat / annotation *logic* doesn't change — only where data lives:
swap localStorage persistence for API calls, and point `lib/llm.ts` at your proxy
instead of the LLM directly (so the key stays server-side). See `llm-config.md`.
