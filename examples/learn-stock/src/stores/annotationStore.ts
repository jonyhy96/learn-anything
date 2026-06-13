// Annotation store: the signature "select-to-ask" feature's state.
//
// A learner selects any span inside a tutor answer and asks a follow-up about
// just that span. We store the selected text, where it sits in the source
// message (so we can re-highlight it on reload), and a thread of follow-up
// Q&A pairs. Everything persists, so the app doubles as the learner's own
// annotated notebook.
//
// The crucial design choice is in `askFollowUp`: the question we send the tutor
// includes the *selected span plus the surrounding answer*, so the tutor knows
// what "this" refers to and stays on-target. Annotation-only context would make
// it guess; the whole message would bury the point. See
// references/annotation-interaction.md.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chat, type ChatMessage } from '../lib/llm';
import { generateUUID } from '../lib/id';

export interface FollowUp {
  id: string;
  question: string;
  answer: string;
  pending?: boolean;
  createdAt: number;
}

export interface Annotation {
  id: string;
  /** Which lesson + message this annotation belongs to. */
  lessonId: number;
  messageId: string;
  /** The exact text the learner selected. */
  selectedText: string;
  /** Character offsets into the message's plain text (for re-highlighting). */
  startOffset: number;
  endOffset: number;
  followUps: FollowUp[];
  createdAt: number;
}

interface AnnotationState {
  annotations: Annotation[];

  /** All annotations for a given message, in document order. */
  forMessage: (messageId: string) => Annotation[];

  /** Create an annotation from a selection. Returns its id. */
  addAnnotation: (a: Omit<Annotation, 'id' | 'followUps' | 'createdAt'>) => string;

  removeAnnotation: (id: string) => void;

  /**
   * Ask a follow-up about an annotation. `messageContext` is the full text of
   * the answer the span came from — we pass it so the tutor can resolve "this".
   * Streams nothing here; uses the one-shot `chat` for simplicity since a
   * follow-up is usually short. Swap to streamChat if you want live typing.
   */
  askFollowUp: (
    annotationId: string,
    question: string,
    messageContext: string,
  ) => Promise<void>;
}

export const useAnnotationStore = create<AnnotationState>()(
  persist(
    (set, get) => ({
      annotations: [],

      forMessage: (messageId) =>
        get()
          .annotations.filter((a) => a.messageId === messageId)
          .sort((a, b) => a.startOffset - b.startOffset),

      addAnnotation: (a) => {
        const id = generateUUID();
        set((s) => ({
          annotations: [
            ...s.annotations,
            { ...a, id, followUps: [], createdAt: Date.now() },
          ],
        }));
        return id;
      },

      removeAnnotation: (id) =>
        set((s) => ({
          annotations: s.annotations.filter((a) => a.id !== id),
        })),

      askFollowUp: async (annotationId, question, messageContext) => {
        const ann = get().annotations.find((a) => a.id === annotationId);
        if (!ann) return;

        const followUpId = generateUUID();
        set((s) => ({
          annotations: s.annotations.map((a) =>
            a.id === annotationId
              ? {
                  ...a,
                  followUps: [
                    ...a.followUps,
                    {
                      id: followUpId,
                      question,
                      answer: '',
                      pending: true,
                      createdAt: Date.now(),
                    },
                  ],
                }
              : a,
          ),
        }));

        // The prompt that keeps the tutor on-target: quote the span, give it the
        // surrounding answer for context, then ask the learner's question.
        const messages: ChatMessage[] = [
          {
            role: 'system',
            content:
              'You are a patient tutor. The learner highlighted a specific phrase ' +
              'inside one of your earlier answers and wants to dig into just that ' +
              'phrase. Answer about the highlighted phrase specifically, using the ' +
              'surrounding answer only as context. Be concise and concrete.',
          },
          {
            role: 'user',
            content:
              `Here is the full answer you gave earlier:\n"""\n${messageContext}\n"""\n\n` +
              `The learner highlighted this phrase from it:\n"""\n${ann.selectedText}\n"""\n\n` +
              `Their follow-up question about that phrase:\n${question}`,
          },
        ];

        let answer: string;
        try {
          answer = await chat(messages);
        } catch (err) {
          answer = `⚠️ Couldn't answer: ${
            err instanceof Error ? err.message : String(err)
          }`;
        }

        set((s) => ({
          annotations: s.annotations.map((a) =>
            a.id === annotationId
              ? {
                  ...a,
                  followUps: a.followUps.map((f) =>
                    f.id === followUpId ? { ...f, answer, pending: false } : f,
                  ),
                }
              : a,
          ),
        }));
      },
    }),
    { name: 'learn-anything-annotations' },
  ),
);
