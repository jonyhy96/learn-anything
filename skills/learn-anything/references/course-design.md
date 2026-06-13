# Course design: turning any topic into a good learning sequence

The course outline is the keystone of the whole app. A great tutor with a bad
syllabus still leaves the learner lost; a clear path with a mediocre tutor still
gets them somewhere. Spend real effort here, with the learner, before building.

This file is about the *thinking*. The data shape lives in
`assets/templates/src/lib/course.ts`; you fill it into `src/data/course.ts`.

## What makes a sequence "good"

A good course path has a felt sense of momentum: each lesson is a small, complete
win that makes the next one reachable. Aim for these properties.

- **Ordered so each lesson rests on the last.** Concept B should only need
  concepts the learner already met in A. If you catch yourself writing "we'll
  cover this later, but for now just accept…", the order is probably wrong.
- **One idea per lesson.** If a lesson's summary needs the word "and" twice,
  it's two lessons. Small lessons keep the progress bar moving and make the
  unlock mechanic feel rewarding rather than punishing.
- **Concrete before abstract.** People learn the rule faster after they've seen
  two or three instances of it. Start a topic with a worked example or a thing
  they can do, then name the principle. (Bake a loaf, *then* learn what gluten
  is.)
- **Early wins.** The first one or two lessons should let the learner *do*
  something real, even crudely. Motivation is a resource; spend the first lessons
  buying more of it, not front-loading theory.
- **Right length for the goal.** A weekend curiosity is 4–6 lessons. "I want to
  actually be able to do this" is 10–15. Don't pad to look thorough; don't crush
  a big subject into five bullet points. Ask the learner (Phase 0) and size to
  their answer.

## Per-lesson anatomy

Each lesson is one object in the `lessons` array. Fill every field with intent:

- **`title`** — short and concrete. "Your first no-knead loaf" beats "Baking
  basics part 2."
- **`summary`** — 1–2 sentences: what this lesson covers and *why it matters now*.
  The learner reads this to decide they're in the right place.
- **`keyPoints`** — 3–5 anchors. These are the things they should remember a week
  later. An optional `icon` (any emoji or symbol) gives the UI a visual hook.
- **`resources`** — optional, learner-editable. See the rule below.
- **`tutorPrompt`** — the most important field. It's the opening instruction sent
  to the AI tutor when the lesson starts. See "Writing tutor prompts" below.

## The resources rule (don't hallucinate links)

Suggest a few **real, well-known** starting points where you're genuinely
confident they exist: canonical documentation, famous textbooks or courses,
prominent channels or creators. Mark them clearly as suggestions to verify.

Do **not** fabricate precise URLs you're unsure of. A made-up link that 404s is
worse than no link — it erodes trust in the whole course. When unsure of the
exact URL, name the resource ("3Blue1Brown — Essence of Linear Algebra") and let
the learner paste the link, or link to the obvious top-level site you're sure of
rather than a guessed deep link. The `note` field is a good place for "video,
~15 min" or "suggested — verify."

## Writing tutor prompts (the part that makes it feel taught)

The `tutorPrompt` is what turns a generic chatbot into *this lesson's* tutor. A
weak prompt ("Teach lesson 3") produces a cold lecture. A strong one gives the
tutor a role, a goal, the learner's context, and a way to start. Pattern:

> You are teaching Lesson N of a [topic] course to a [learner level]. They have
> just finished [previous lesson], so they know [X]. Goal of this lesson: they
> should walk away able to [concrete outcome]. Open by [orienting move], explain
> [the core idea] in plain language with a concrete example, and check their
> understanding before moving on. Keep [tone notes].

Things good tutor prompts do:

- **Name what the learner already knows**, so the tutor builds on it instead of
  repeating it. (This is why lesson order matters — the prompt can reference it.)
- **State a concrete outcome**, not a topic. "Able to judge dough by feel" beats
  "understand gluten."
- **Set the tone from the Phase 0 "why."** Exam prep wants rigor and practice
  questions; a hobby wants encouragement and play; a job wants real-world
  shortcuts. Bake that into the prompt.
- **Tell it to check in**, so the conversation stays two-way rather than a wall
  of text the learner skims.

## Drafting flow with the learner

1. From the Phase 0 answers, draft the full outline as data (titles + summaries
   first; you can flesh out keyPoints and tutorPrompts once the shape is agreed).
2. Show a **plain-language** summary: "Here's a 12-lesson path, starting from …
   then … building to …. Want to add, cut, or reorder anything?" Don't show them
   TypeScript.
3. Incorporate their edits. The edited outline is the contract — build to it.
4. Only then scaffold and fill `src/data/course.ts`.

The learner talks about the subject; you turn it into the structure.
