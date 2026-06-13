// src/data/course.ts — THE ONE FILE YOU FILL PER TOPIC.
//
// Everything else in this app is domain-agnostic. The whole personality of the
// learning system — what it teaches and in what order — lives here. Replace this
// sample with the Phase 1 outline you and the learner agreed on.
//
// Shape reference: src/lib/course.ts. Keep lessons ordered, one idea each, with
// a tutorPrompt that primes the tutor to teach *this* lesson in context.

import type { Course } from '../lib/course';

export const course: Course = {
  topic: 'Sample: The Fundamentals of Bread Baking',
  description:
    'A hands-on path from your first loaf to confidently shaping and scoring ' +
    'sourdough. Each lesson builds on the last; you bake as you go.',
  lessons: [
    {
      id: 1,
      title: 'What bread actually is',
      summary:
        'The four ingredients and what each one does. Why flour + water + salt ' +
        '+ leavening is enough — and what changes when you vary them.',
      keyPoints: [
        { icon: '🌾', title: 'Flour', desc: 'Protein content drives gluten and chew.' },
        { icon: '💧', title: 'Hydration', desc: 'Water ratio sets crumb and handling.' },
        { icon: '🧂', title: 'Salt', desc: 'Flavor, plus it tightens the dough.' },
        { icon: '🫧', title: 'Leavening', desc: 'Yeast or starter makes it rise.' },
      ],
      resources: [
        {
          title: 'King Arthur Baking — Baking 101',
          url: 'https://www.kingarthurbaking.com/learn',
          note: 'suggested — verify before relying on it',
        },
      ],
      tutorPrompt:
        'You are teaching Lesson 1 of a bread-baking course to a motivated ' +
        'beginner. Goal: they understand the role of flour, water, salt, and ' +
        'leavening, and why ratios matter. Open warmly, explain the big picture ' +
        'in plain language, and end by asking what they already know so you can ' +
        'calibrate. Keep it concrete; use a simple loaf as the running example.',
    },
    {
      id: 2,
      title: 'Your first no-knead loaf',
      summary:
        'Make a real loaf tonight with minimal technique, so you have something ' +
        'to taste and reason about before going deeper.',
      keyPoints: [
        { icon: '🥣', title: 'Mix', desc: 'Stir, do not knead. Let time do the work.' },
        { icon: '⏳', title: 'Long rise', desc: '12–18h develops flavor and structure.' },
        { icon: '🔥', title: 'Dutch oven', desc: 'Traps steam for crust and oven spring.' },
      ],
      tutorPrompt:
        'You are teaching Lesson 2: a no-knead loaf. The learner finished Lesson ' +
        '1 (the four ingredients). Walk them through a simple recipe and, more ' +
        'importantly, explain *why* each step works (the long rise, the covered ' +
        'pot). Anticipate first-timer mistakes and reassure them.',
    },
    {
      id: 3,
      title: 'Gluten and the windowpane test',
      summary:
        'What gluten is, how kneading develops it, and how to tell when dough is ' +
        'ready by feel.',
      keyPoints: [
        { icon: '🕸️', title: 'Gluten network', desc: 'Proteins link into an elastic web.' },
        { icon: '🪟', title: 'Windowpane', desc: 'Stretch thin without tearing = ready.' },
        { icon: '✋', title: 'Feel', desc: 'Learn the dough by touch, not the clock.' },
      ],
      tutorPrompt:
        'You are teaching Lesson 3: gluten development. The learner has baked a ' +
        'no-knead loaf and now wants to understand structure. Explain gluten ' +
        'simply, describe the windowpane test, and give them a way to practice ' +
        'judging dough by feel. Connect it back to the loaf they already made.',
    },
  ],
};
