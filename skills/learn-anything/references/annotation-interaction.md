# The select-to-ask annotation interaction

This is the signature move of the whole skill. Most "AI tutor" apps are a single
scrolling chat; when one sentence confuses the learner they either derail the
whole conversation asking about it, or give up. Select-to-ask fixes that: the
learner highlights *just* the confusing span, asks about it inline, gets an
answer threaded right there, and never loses their place. The annotations persist,
so the app becomes the learner's own marked-up notebook.

Getting it to feel effortless takes some care. This file explains how it works
and the traps to avoid.

## The user-facing flow

1. The learner selects any text inside a tutor answer.
2. A small floating **"Ask about this"** button appears near the selection.
3. They click it → the span gets a persistent highlight and a footnote badge
   (`¹`, `²`, …), and an inline panel opens right under the message.
4. In the panel they type a follow-up; the answer appears threaded under the
   quote. They can ask several follow-ups; all persist.
5. Later, the highlight and its thread are still there on reload — click the badge
   to reopen.

## The hard problem: three views of the same text

The text exists in three forms, and the interaction has to move between them:

- **Plain text** — what the learner perceives and selects ("…the gluten network…").
- **Rendered HTML** — what's actually on screen (`…the <strong>gluten</strong>
  network…`), where tags shift character positions.
- **Stored offsets** — integers we save so we can re-highlight after reload.

A naive `string.indexOf(selectedText)` breaks the moment the same phrase appears
twice, or the selection spans a tag boundary. So we work in offsets, and we map
carefully between the views. All of this lives in `src/lib/highlight.ts` as pure,
unit-tested functions — keep it there, out of the React component.

## `selectionOffsets(container, range)` — DOM selection → plain-text offsets

Walks the container's text nodes in document order with a `TreeWalker`,
accumulating length, until it finds the nodes holding the selection's anchor and
focus. Returns `{ startOffset, endOffset, text }` relative to the container's
`textContent`. Returns `null` for empty/cross-container selections.

Why offsets and not the raw string: offsets are unambiguous even when the same
phrase repeats, and they survive being stored and re-applied later.

## `injectHighlights(html, spans)` — offsets → markup in the HTML

The reverse direction, and the trickier one. To insert `<mark>` at the right place
we need the *HTML-string* index that corresponds to each *plain-text* offset.

The function scans the HTML once, building a map from plain-text position to
HTML-string position. It tracks whether it's inside a tag (`<…>`) and only counts
visible characters; it treats an HTML entity (`&amp;`) as a single visible char
anchored at the `&`. Then it applies the highlight edits **from last to first**,
so splicing markup in doesn't shift the offsets of edits not yet applied.

Each highlight becomes:

```html
<mark class="la-highlight" data-ann="<id>">…selected…<sup class="la-badge"
  data-ann-badge="<id>">N</sup></mark>
```

The `data-ann` / `data-ann-badge` attributes are how the component knows which
annotation a click landed on. If you restyle, keep these hooks.

## The component glue (`AnnotatedMessage.tsx`)

Thin on purpose. It:

- renders Markdown → HTML, then runs `injectHighlights` for saved annotations;
- on `mouseUp`, computes offsets and positions the floating button (using
  `onMouseDown={e => e.preventDefault()}` on the button so the browser doesn't
  clear the selection before the click registers — a classic gotcha);
- on confirm, calls `annotationStore.addAnnotation` and opens the panel;
- on click of a badge/highlight, toggles the inline panel for that annotation.

## The prompt that keeps the tutor on-target

When the learner asks a follow-up, `annotationStore.askFollowUp` does **not** send
the bare question. It sends:

1. the **full answer** the span came from (as context),
2. the **highlighted span** itself, quoted,
3. the learner's question.

Plus a system message telling the tutor to answer about the highlighted phrase
specifically, using the surrounding answer only as context. This is the difference
between a useful inline answer and the tutor guessing what "this" refers to.
Span-only context makes it guess; dumping the whole conversation buries the point.
Span + its message is the sweet spot.

## Testing it

- **Unit (`highlight.test.ts`)** covers `injectHighlights`: no-op on empty spans,
  wrapping a span inside a single tag, not counting tag characters toward offsets,
  and applying multiple spans without corrupting earlier offsets.
  `selectionOffsets` needs a real DOM, so it's covered by the e2e test instead.
- **E2E (`e2e/annotation.spec.ts`)** drives a real browser: select text → click
  "Ask about this" → assert the inline panel opens. It doesn't assert on the LLM
  answer (that needs a live endpoint) — just that the interaction wires up. This
  is the critical path that unit tests structurally can't reach.

## Adapting it

- **Different renderer:** if you replace `markdown.ts` with a library, re-run the
  highlight tests — richer HTML (tables, nested inline tags) can expose offset
  edge cases. Add test cases for whatever new structures you introduce.
- **Streaming follow-ups:** `askFollowUp` uses the one-shot `chat()` for
  simplicity. Swap to `streamChat()` if you want the answer to type out live;
  the store shape already supports a `pending` flag.
- **Annotating learner messages too:** the component is message-agnostic — pass
  any `messageId` and it scopes annotations to it. You can make user messages
  annotatable as well, though usually only tutor answers need it.
