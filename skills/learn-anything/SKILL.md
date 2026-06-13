---
name: learn-anything
description: >
  Builds a personal AI learning system for ANY topic the user wants to learn — not a one-off
  chat, but a real app with a structured course path, an AI tutor that knows where you are, and
  a signature "select any text in an answer to ask a follow-up" annotation interaction. Use this
  whenever someone says they want to learn / study / understand a subject and would benefit from a
  guided system rather than scattered Q&A ("I want to learn X", "help me study Y", "build me a
  course/tutor/study app for Z", "teach me W from scratch"), or explicitly asks for a learning app,
  study tool, interactive course, AI tutor, or the highlight-to-ask-follow-up reading experience.
  Trigger even when the request is framed as engineering ("build me an interactive study app for X",
  "make a tool where I can highlight text and ask about it") rather than as learning — don't fall back
  to an ad-hoc script or static page; this skill's whole point is to give them the real reusable system.
  Defaults to a zero-backend single-page app (data in the browser) talking to any OpenAI-compatible
  LLM, so it runs anywhere with no setup. Builds on the vibe-engineering methodology (plan first,
  keep logic testable, leave a test net) and ships reusable, domain-agnostic course/chat/annotation
  modules so the result is maintainable, not a tangle.
---

# Learn Anything

## What this is for

People learn badly from a wall of chat. They lose the thread, can't tell what they've covered, and
when one sentence in an answer confuses them they either derail the whole conversation or silently
give up. This skill builds them a **learning system** instead: a topic gets turned into an ordered
course path, an AI tutor teaches each lesson while knowing exactly where the learner is, and — the
key move — the learner can **select any span of any AI answer and ask a follow-up question right
there**, inline, without losing their place. Those annotations and their answer threads persist, so
the app doubles as the learner's own annotated notebook.

The output is a real, runnable web app the user owns and can keep iterating on — not a transcript.

## The golden rule: the learner talks about the subject, you build the system

The user wants to learn *cooking*, or *linear algebra*, or *Rust*, or *the French Revolution*. They
do **not** want to think about React, localStorage, or LLM APIs. Talk to them about their subject
("how deep do you want to go on X?", "do you already know Y?") and quietly build the engineering
behind it. When you must surface a choice, make it a plain-language one with a default.

## How this relates to vibe-engineering

This skill is an **application of** the `vibe-engineering` methodology to one specific, valuable app
shape (an AI learning system). If `vibe-engineering` is available, follow its discipline — plan the
domain first, keep logic out of the UI so it's testable, leave a test safety net. This skill adds
the part vibe-engineering doesn't: the **learning-system domain model** and the **ready-made,
domain-agnostic course / chat / annotation modules** in `assets/templates/`. Don't re-derive those
from scratch — they're the proven core; you adapt them to the topic.

## The four pillars

1. **Turn the topic into a structured course path.** An ordered list of lessons, each with a short
   summary, a few key points, optional recommended resources, and a tutor prompt. The path is what
   keeps the learner oriented. AI drafts it; the user edits it. This is the keystone — do it first.
2. **An AI tutor that knows where the learner is.** Each lesson opens a focused tutor conversation;
   the tutor is told which lesson, what's been covered, and the learner's level, so it teaches in
   context instead of answering cold.
3. **Select-to-ask annotation (the signature interaction).** Highlight any text in a tutor answer →
   a floating "ask about this" button → an inline thread opens right under that text → multi-turn
   follow-ups, all persisted. The follow-up prompt always includes the selected span **plus its
   surrounding answer** so the tutor stays on-target.
4. **Progress and notes persist.** Completed lessons unlock the next; annotations and chats are
   saved in the browser. The learner can close the tab and come back to their own annotated course.

## Workflow

Follow these phases in order. The planning phases are what make the result a *system* and not a toy
— don't skip them even under pressure to "just build it."

### Phase 0 — Understand the learner and the subject

Ask 2–4 plain-language questions, then move. Cover: **what** they want to learn, their **current
level** (total beginner vs. brushing up), **how deep / how much time**, and **why** (exam, hobby,
job) since it shapes tone and examples. Don't over-interrogate.

### Phase 0.5 — Right-size the build

Default to the **minimal track**: a single-page frontend with data in the browser (localStorage),
talking directly to an OpenAI-compatible LLM endpoint. No backend, no accounts, no deploy — it runs
for one learner on their own machine with zero setup. This fits almost every "I want to learn X"
request, so don't ask unless there's a real signal otherwise.

Graduate to the **full track** (add a backend) only when there's a genuine need: multiple learners /
accounts, progress synced across devices, shared or curated course catalogs, or saving an API key
server-side instead of in the browser. If that need appears, layer on the `vibe-engineering` Go
backend behind the same modules — the course/chat/annotation logic doesn't change, only where data
lives. When on the fence, stay minimal; it's cheap to graduate later.

### Phase 1 — Draft the course outline (the keystone)

Generate a **course outline** as structured data and show it to the user for editing before building
anything. Read `references/course-design.md` for how to design a good learning sequence. In short:

- Break the topic into an **ordered sequence of lessons** that build on each other (concrete before
  abstract, one idea per lesson, early wins).
- For each lesson: a `title`, a 1–2 sentence `summary`, 3–5 `keyPoints`, an optional list of
  `resources` (AI-recommended links the user can edit or fill in — see below), and a `tutorPrompt`
  (the opening instruction that primes the tutor for that lesson).
- The outline is just data (`assets/templates/src/lib/course.ts` defines the shape). Fill it into
  `src/data/course.ts`.

**On resources:** suggest a few real, well-known starting points where you're confident they exist
(canonical docs, famous textbooks/courses, prominent channels) and clearly mark them as suggestions
the learner should verify. Do **not** fabricate precise URLs you're unsure of — a made-up link is
worse than none. Leave the list easy to edit so the learner can paste their own.

Then **show the user a plain-language summary** ("Here's a 12-lesson path I'd suggest, starting from
… — want to add, cut, or reorder anything?") and get a thumbs up. The edited outline is the contract.

### Phase 2 — Scaffold the app

Generate the project, then drop in the reusable modules and the topic's course data.

```
python3 scripts/scaffold.py --name <project> --topic "<what they're learning>"
```

This creates a Vite + React + TypeScript single-page app and copies in the domain-agnostic core from
`assets/templates/`: the course/progress/chat/annotation stores, the `AnnotatedMessage` component
(the select-to-ask interaction), the LLM client, and a starter `data/course.ts` to fill with the
Phase 1 outline. Run `npm install` then `npm test` to confirm the base is green before building UI.

Two practical notes so the scaffold step stays smooth:

- **Filling `src/data/course.ts`:** the scaffold writes a sample course there. To replace it with the
  Phase 1 outline, this is a *full rewrite* of an existing file — read it once, then overwrite it (or
  just `Write` over it). Don't hand-edit the sample lesson by lesson; swap the whole `course` object.
- **If `npm test` errors with `EAGAIN` / worker-spawn failures** (common in sandboxes that cap
  process spawning), it's the test runner's worker pool, not your code. Re-run single-threaded:
  `npx vitest run --pool=forks --poolOptions.forks.singleFork=true --no-file-parallelism`. The tests
  themselves are fine; this just avoids spawning a worker pool.

- What's in the templates and how the pieces fit: `references/template-architecture.md`.
- The annotation interaction's implementation details and pitfalls: `references/annotation-interaction.md`.
- LLM endpoint configuration (env-driven, OpenAI-compatible): `references/llm-config.md`.

If the user is on a different stack, apply the same four pillars and adapt the templates' logic.

### Phase 3 — Build the learning UI in vertical slices, test-first

Build one complete capability at a time so the app is always runnable:

1. **Course path view** → lesson list with progress/unlock state. Unit-test the unlock logic.
2. **Lesson + tutor chat** → open a lesson, stream answers from the tutor with lesson context.
3. **Select-to-ask annotation** → wire up `AnnotatedMessage`; unit-test the offset/highlight logic,
   then a Playwright test for the critical path: select text → ask → see an inline answer.
4. **Persistence** → confirm progress, chats, and annotations survive a reload.

A slice isn't done until its tests pass. After each, tell the user in plain language what now works.

### Phase 4 — Keep it iterable

When the user returns (add a lesson, change the tutor's style, restyle the UI): read the course data
and `references/template-architecture.md` first, make the change in the right module (not the nearest
file), update tests, and keep the four pillars intact. If they want it to look less generic, see the
design guidance in `references/template-architecture.md`.

## Reference files

Load as needed — don't read them all upfront.

- `references/course-design.md` — How to turn any topic into a good, ordered course outline.
- `references/template-architecture.md` — What each template module does and how they connect.
- `references/annotation-interaction.md` — The select-to-ask interaction: how it works, how to adapt it.
- `references/llm-config.md` — Configuring the OpenAI-compatible endpoint (minimal and full track).

## Templates and scripts

- `scripts/scaffold.py` — Generates the single-page app and installs the reusable modules.
- `assets/templates/` — The domain-agnostic core (stores, components, lib) you adapt per topic.
