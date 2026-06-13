import { describe, it, expect } from 'vitest';
import { injectHighlights, type HighlightSpan } from './highlight';

// selectionOffsets needs a DOM; it's exercised by the Playwright e2e test.
// Here we unit-test injectHighlights, the part most likely to silently corrupt
// output, since it does offset math against an HTML string with tags.

describe('injectHighlights', () => {
  it('returns html unchanged when there are no spans', () => {
    const html = '<p>Hello world</p>';
    expect(injectHighlights(html, [])).toBe(html);
  });

  it('wraps a plain-text span that sits inside a single tag', () => {
    const html = '<p>Hello world</p>';
    // plain text is "Hello world"; highlight "world" (offsets 6..11)
    const spans: HighlightSpan[] = [
      { id: 'a', index: 1, startOffset: 6, endOffset: 11 },
    ];
    const out = injectHighlights(html, spans);
    expect(out).toContain('<mark class="la-highlight" data-ann="a">world');
    expect(out).toContain('data-ann-badge="a">1</sup>');
    // text outside the highlight is preserved
    expect(out).toContain('Hello ');
  });

  it('does not count characters inside tags toward plain offsets', () => {
    // plain text: "Hello world" (the <strong> tags are invisible to offsets)
    const html = '<p>Hello <strong>world</strong></p>';
    const spans: HighlightSpan[] = [
      { id: 'b', index: 1, startOffset: 6, endOffset: 11 },
    ];
    const out = injectHighlights(html, spans);
    // The highlight should land on "world", inside the <strong>.
    expect(out).toContain('world');
    expect(out).toContain('data-ann="b"');
  });

  it('applies multiple spans without corrupting earlier offsets', () => {
    const html = '<p>alpha beta gamma</p>';
    // "alpha"=0..5, "gamma"=11..16
    const spans: HighlightSpan[] = [
      { id: 'x', index: 1, startOffset: 0, endOffset: 5 },
      { id: 'y', index: 2, startOffset: 11, endOffset: 16 },
    ];
    const out = injectHighlights(html, spans);
    expect(out).toContain('data-ann="x"');
    expect(out).toContain('data-ann="y"');
    expect(out).toContain('>1</sup>');
    expect(out).toContain('>2</sup>');
    // beta (the gap) stays untouched
    expect(out).toContain('beta');
  });
});
