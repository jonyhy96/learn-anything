// Pure helpers for the select-to-ask annotation interaction.
//
// These are split out from the React component on purpose: the offset math and
// HTML-injection are the parts most likely to break, and they're far easier to
// reason about (and unit-test) as pure functions. The component stays thin.
//
// THE CORE PROBLEM: the learner selects text in the *rendered* answer, but we
// store offsets against the *plain text*, and later we need to inject highlight
// markup back into the *HTML*. Tags shift positions, so we can't just slice by
// the plain-text offset. The functions below bridge those three views.
//
// See references/annotation-interaction.md for the full walkthrough.

export interface HighlightSpan {
  /** Plain-text start offset of the highlight. */
  startOffset: number;
  /** Plain-text end offset (exclusive). */
  endOffset: number;
  /** Annotation id, used for the badge + anchor. */
  id: string;
  /** 1-based number shown in the footnote badge. */
  index: number;
}

/**
 * Given a container element and a DOM Selection, return the plain-text offsets
 * of the selection relative to the container's text content. Returns null if the
 * selection is empty or falls outside the container.
 *
 * Walks text nodes in order, accumulating length, until it finds the nodes that
 * hold the selection's anchor and focus.
 */
export function selectionOffsets(
  container: HTMLElement,
  range: Range,
): { startOffset: number; endOffset: number; text: string } | null {
  if (range.collapsed) return null;
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null;
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let offset = 0;
  let start = -1;
  let end = -1;
  let node = walker.nextNode();

  while (node) {
    const len = node.textContent?.length ?? 0;
    if (node === range.startContainer) start = offset + range.startOffset;
    if (node === range.endContainer) end = offset + range.endOffset;
    offset += len;
    node = walker.nextNode();
  }

  if (start < 0 || end < 0 || start === end) return null;
  if (start > end) [start, end] = [end, start];

  const text = (container.textContent ?? '').slice(start, end).trim();
  if (!text) return null;
  return { startOffset: start, endOffset: end, text };
}

/**
 * Inject highlight + footnote-badge markup into an HTML string for each span.
 *
 * Strategy: map plain-text offsets to HTML-string offsets by scanning the HTML
 * once, tracking whether we're inside a tag and decrementing a "plain offset"
 * counter only on visible characters. Then splice in markup from the *last* span
 * to the *first* so earlier offsets stay valid as we mutate the string.
 *
 * Each highlight becomes:
 *   <mark class="la-highlight" data-ann="<id>">…<sup class="la-badge">N</sup></mark>
 */
export function injectHighlights(html: string, spans: HighlightSpan[]): string {
  if (spans.length === 0) return html;

  // Build a map: plainOffset -> htmlOffset for every visible character boundary.
  // We only need the boundaries used by spans, but a single pass is simplest.
  const htmlPos: number[] = []; // htmlPos[plainIndex] = index into html
  let inTag = false;
  let inEntity = false;
  let entityBuf = '';
  for (let i = 0; i < html.length; i++) {
    const ch = html[i];
    if (ch === '<') {
      inTag = true;
      continue;
    }
    if (ch === '>') {
      inTag = false;
      continue;
    }
    if (inTag) continue;

    if (ch === '&') {
      inEntity = true;
      entityBuf = '&';
      htmlPos.push(i); // entity counts as one visible char, anchored at '&'
      continue;
    }
    if (inEntity) {
      entityBuf += ch;
      if (ch === ';') inEntity = false;
      continue; // don't add new plain positions for entity body
    }
    htmlPos.push(i);
  }
  // Sentinel for end-of-text mapping.
  htmlPos.push(html.length);

  const sorted = [...spans].sort((a, b) => a.startOffset - b.startOffset);

  // Translate, then apply in reverse so splices don't shift later indices.
  const edits = sorted
    .map((s) => {
      const hStart = htmlPos[s.startOffset];
      const hEnd = htmlPos[s.endOffset];
      if (hStart == null || hEnd == null) return null;
      return { hStart, hEnd, span: s };
    })
    .filter((e): e is { hStart: number; hEnd: number; span: HighlightSpan } => e !== null)
    .sort((a, b) => b.hStart - a.hStart);

  let result = html;
  for (const { hStart, hEnd, span } of edits) {
    const inner = result.slice(hStart, hEnd);
    const wrapped =
      `<mark class="la-highlight" data-ann="${span.id}">${inner}` +
      `<sup class="la-badge" data-ann-badge="${span.id}">${span.index}</sup></mark>`;
    result = result.slice(0, hStart) + wrapped + result.slice(hEnd);
  }
  return result;
}
