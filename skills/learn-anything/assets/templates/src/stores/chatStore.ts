// Chat store: one tutor conversation per lesson.
//
// Each lesson has its own thread so switching lessons doesn't bleed context.
// The tutor is *primed* with the lesson's tutorPrompt (see lib/course.ts) plus a
// short system message describing the learner, so it teaches in context instead
// of answering cold. Messages stream in via lib/llm.ts (no backend in the
// minimal track). Threads persist so a learner can close the tab and resume.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { streamChat, type ChatMessage } from '../lib/llm';
import { generateUUID } from '../lib/id';

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** True while the assistant message is still streaming. */
  pending?: boolean;
  createdAt: number;
}

interface ChatState {
  /** lessonId -> message thread. */
  threads: Record<number, TutorMessage[]>;
  /** lessonId currently streaming, if any (used to disable input). */
  streamingLesson: number | null;

  /** Messages for a lesson (empty array if none yet). */
  messages: (lessonId: number) => TutorMessage[];

  /**
   * Open a lesson's thread. If it's empty, kick off the tutor's first turn using
   * `systemPrimer` (built from the lesson) so the learner sees a real opening
   * rather than a blank box. No-op if the thread already has messages.
   */
  startLesson: (lessonId: number, systemPrimer: ChatMessage) => Promise<void>;

  /** Send a learner message and stream the tutor's reply. */
  send: (
    lessonId: number,
    text: string,
    systemPrimer: ChatMessage,
  ) => Promise<void>;

  clearLesson: (lessonId: number) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      // Shared streaming routine: append a pending assistant message, then fill
      // it as deltas arrive. `history` is the full message list to send.
      async function run(lessonId: number, history: ChatMessage[]) {
        const assistantId = generateUUID();
        set((s) => ({
          streamingLesson: lessonId,
          threads: {
            ...s.threads,
            [lessonId]: [
              ...(s.threads[lessonId] || []),
              {
                id: assistantId,
                role: 'assistant',
                content: '',
                pending: true,
                createdAt: Date.now(),
              },
            ],
          },
        }));

        const apply = (content: string, pending: boolean) =>
          set((s) => ({
            threads: {
              ...s.threads,
              [lessonId]: (s.threads[lessonId] || []).map((m) =>
                m.id === assistantId ? { ...m, content, pending } : m,
              ),
            },
          }));

        try {
          await streamChat(history, (_chunk, accumulated) =>
            apply(accumulated, true),
          );
        } catch (err) {
          apply(
            `⚠️ The tutor couldn't respond: ${
              err instanceof Error ? err.message : String(err)
            }`,
            false,
          );
          set({ streamingLesson: null });
          return;
        }

        set((s) => ({
          streamingLesson: null,
          threads: {
            ...s.threads,
            [lessonId]: (s.threads[lessonId] || []).map((m) =>
              m.id === assistantId ? { ...m, pending: false } : m,
            ),
          },
        }));
      }

      // Build the wire history for an OpenAI-style call from stored messages.
      const wire = (primer: ChatMessage, msgs: TutorMessage[]): ChatMessage[] => [
        primer,
        ...msgs
          .filter((m) => !m.pending)
          .map((m) => ({ role: m.role, content: m.content })),
      ];

      return {
        threads: {},
        streamingLesson: null,

        messages: (lessonId) => get().threads[lessonId] || [],

        startLesson: async (lessonId, systemPrimer) => {
          const existing = get().threads[lessonId];
          if (existing && existing.length > 0) return;
          await run(lessonId, [systemPrimer]);
        },

        send: async (lessonId, text, systemPrimer) => {
          const userMsg: TutorMessage = {
            id: generateUUID(),
            role: 'user',
            content: text,
            createdAt: Date.now(),
          };
          set((s) => ({
            threads: {
              ...s.threads,
              [lessonId]: [...(s.threads[lessonId] || []), userMsg],
            },
          }));
          await run(lessonId, wire(systemPrimer, get().threads[lessonId] || []));
        },

        clearLesson: (lessonId) =>
          set((s) => {
            const next = { ...s.threads };
            delete next[lessonId];
            return { threads: next };
          }),
      };
    },
    { name: 'learn-anything-chat' },
  ),
);
