// Domain-agnostic course model.
//
// A "course" is just an ordered list of lessons on whatever topic the learner
// chose. Nothing here knows or cares what the subject is — that lives entirely
// in the data (src/data/course.ts). Keep it that way: the value of this app is
// that the same engine teaches cooking, calculus, or Rust.

export interface LessonResource {
  /** Display label, e.g. "MDN: Array methods" or "3Blue1Brown — Essence of Linear Algebra". */
  title: string;
  /** A link the learner can open. May be edited or filled in by the learner. */
  url: string;
  /** Optional note: "video, 12 min", "official docs", "free", etc. */
  note?: string;
}

export interface LessonKeyPoint {
  /** A short emoji or symbol used as a visual marker. Optional. */
  icon?: string;
  title: string;
  desc: string;
}

export interface Lesson {
  /** Stable 1-based order id. Used for progress + unlock logic. */
  id: number;
  title: string;
  /** 1–2 sentences: what this lesson covers and why it matters. */
  summary: string;
  keyPoints: LessonKeyPoint[];
  /** Optional recommended resources. Learner-editable. */
  resources?: LessonResource[];
  /**
   * The opening instruction sent to the AI tutor when this lesson starts.
   * This is what makes the tutor teach *this* lesson in context rather than
   * answering cold. Write it in the second person to the tutor.
   */
  tutorPrompt: string;
}

export interface Course {
  /** The subject, e.g. "Intro to Linear Algebra" or "Home Cooking Fundamentals". */
  topic: string;
  /** One-paragraph description of the whole path. */
  description: string;
  lessons: Lesson[];
}
