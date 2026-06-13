// AnnotatedMessage — the signature select-to-ask interaction.
//
// Renders a tutor answer (Markdown -> HTML) and lets the learner highlight any
// span to ask a follow-up question right there. Highlights persist and show a
// footnote badge; clicking a badge opens an inline thread under the message.
//
// The fiddly offset/highlight math lives in lib/highlight.ts (and is unit
// tested). This component is the React glue: selection handling, the floating
// "ask" button, and the inline panel. Styling uses neutral utility classes you
// can restyle freely — nothing here is topic- or theme-specific.

import { useCallback, useMemo, useRef, useState } from 'react';
import { renderMarkdown } from '../lib/markdown';
import {
  injectHighlights,
  selectionOffsets,
  type HighlightSpan,
} from '../lib/highlight';
import { useAnnotationStore, type Annotation } from '../stores/annotationStore';

interface Props {
  /** Stable id of the message being rendered (used to scope annotations). */
  messageId: string;
  lessonId: number;
  /** The raw Markdown answer text. */
  content: string;
}

export function AnnotatedMessage({ messageId, lessonId, content }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const annotations = useAnnotationStore((s) => s.forMessage(messageId));
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation);

  const [popup, setPopup] = useState<{ x: number; y: number } | null>(null);
  const [openAnnId, setOpenAnnId] = useState<string | null>(null);
  const pendingSelection = useRef<{
    startOffset: number;
    endOffset: number;
    text: string;
  } | null>(null);

  // Render markdown once, then inject highlights for every saved annotation.
  const html = useMemo(() => {
    const base = renderMarkdown(content);
    const spans: HighlightSpan[] = annotations.map((a, i) => ({
      id: a.id,
      index: i + 1,
      startOffset: a.startOffset,
      endOffset: a.endOffset,
    }));
    return injectHighlights(base, spans);
  }, [content, annotations]);

  const onMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !containerRef.current) {
      setPopup(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const offsets = selectionOffsets(containerRef.current, range);
    if (!offsets) {
      setPopup(null);
      return;
    }
    pendingSelection.current = offsets;
    const rect = range.getBoundingClientRect();
    setPopup({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  }, []);

  const confirmSelection = useCallback(() => {
    const sel = pendingSelection.current;
    if (!sel) return;
    const id = addAnnotation({
      lessonId,
      messageId,
      selectedText: sel.text,
      startOffset: sel.startOffset,
      endOffset: sel.endOffset,
    });
    pendingSelection.current = null;
    setPopup(null);
    window.getSelection()?.removeAllRanges();
    setOpenAnnId(id);
  }, [addAnnotation, lessonId, messageId]);

  // Open the inline panel when a badge is clicked.
  const onClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const badge = target.closest('[data-ann-badge]') as HTMLElement | null;
    const mark = target.closest('[data-ann]') as HTMLElement | null;
    const annId = badge?.getAttribute('data-ann-badge') ?? mark?.getAttribute('data-ann');
    if (annId) {
      e.preventDefault();
      setOpenAnnId((cur) => (cur === annId ? null : annId));
    }
  }, []);

  const openAnn = annotations.find((a) => a.id === openAnnId) ?? null;

  return (
    <div className="la-message">
      <div
        ref={containerRef}
        className="la-prose"
        onMouseUp={onMouseUp}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {popup && (
        <button
          type="button"
          className="la-ask-button"
          style={{
            position: 'fixed',
            left: popup.x,
            top: popup.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 50,
          }}
          onMouseDown={(e) => e.preventDefault()} // keep selection alive
          onClick={confirmSelection}
        >
          Ask about this
        </button>
      )}

      {openAnn && (
        <InlineAnnotationPanel
          annotation={openAnn}
          messageContext={content}
          onClose={() => setOpenAnnId(null)}
        />
      )}
    </div>
  );
}

function InlineAnnotationPanel({
  annotation,
  messageContext,
  onClose,
}: {
  annotation: Annotation;
  messageContext: string;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState('');
  const askFollowUp = useAnnotationStore((s) => s.askFollowUp);
  const removeAnnotation = useAnnotationStore((s) => s.removeAnnotation);
  const busy = annotation.followUps.some((f) => f.pending);

  const submit = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setQuestion('');
    await askFollowUp(annotation.id, q, messageContext);
  };

  return (
    <div className="la-panel">
      <div className="la-panel-head">
        <span className="la-panel-quote">“{annotation.selectedText}”</span>
        <div className="la-panel-actions">
          <button type="button" onClick={() => removeAnnotation(annotation.id)}>
            Delete
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div className="la-panel-thread">
        {annotation.followUps.map((f) => (
          <div key={f.id} className="la-followup">
            <div className="la-followup-q">{f.question}</div>
            <div className="la-followup-a">
              {f.pending ? <span className="la-typing">…</span> : f.answer}
            </div>
          </div>
        ))}
      </div>

      <div className="la-panel-input">
        <textarea
          value={question}
          placeholder="Ask a follow-up about the highlighted text…"
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={2}
        />
        <button type="button" onClick={() => void submit()} disabled={busy}>
          Send
        </button>
      </div>
    </div>
  );
}
