// Progress store: which lessons are done, what's unlocked, where the learner is.
//
// The unlock rule is deliberately simple and linear: a lesson is unlocked once
// the one before it is completed. This is the single most testable piece of
// domain logic in the app, so it lives here (not in a component) and has its own
// unit tests. If you later want a DAG of prerequisites instead of a line, change
// `getStatus` and its test together — nothing in the UI should need to know.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LessonStatus = 'completed' | 'current' | 'locked';

interface ProgressState {
  /** Ids of lessons the learner has marked done. */
  completedIds: number[];
  /** Mark a lesson complete. Idempotent. The *next* lesson unlocks for free. */
  markCompleted: (lessonId: number) => void;
  /** Undo completion (e.g. learner wants to revisit). */
  markIncomplete: (lessonId: number) => void;
  /**
   * Status of a lesson given the full ordered id list. Pure given state:
   *   - completed: in completedIds
   *   - current:   the first non-completed lesson, OR any lesson whose
   *                predecessor is completed
   *   - locked:    predecessor not yet completed
   * The first lesson is always at least 'current'.
   */
  getStatus: (lessonId: number, orderedIds: number[]) => LessonStatus;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedIds: [],

      markCompleted: (lessonId) =>
        set((s) =>
          s.completedIds.includes(lessonId)
            ? s
            : { completedIds: [...s.completedIds, lessonId] },
        ),

      markIncomplete: (lessonId) =>
        set((s) => ({
          completedIds: s.completedIds.filter((id) => id !== lessonId),
        })),

      getStatus: (lessonId, orderedIds) => {
        const { completedIds } = get();
        if (completedIds.includes(lessonId)) return 'completed';

        const idx = orderedIds.indexOf(lessonId);
        if (idx <= 0) return 'current'; // first lesson (or unknown id) is open

        const prev = orderedIds[idx - 1];
        return completedIds.includes(prev) ? 'current' : 'locked';
      },

      reset: () => set({ completedIds: [] }),
    }),
    { name: 'learn-anything-progress' },
  ),
);
