// src/data/course.ts — THE ONE FILE YOU FILL PER TOPIC.
//
// This demo teaches stock-market investing for a total beginner. Everything else
// in the app is domain-agnostic; this file is the whole personality.

import type { Course } from '../lib/course';

export const course: Course = {
  topic: 'Stock Market Investing for Beginners',
  description:
    'A calm, plain-English path from "what is a share?" to building and sticking ' +
    'to a simple long-term plan. No jargon dumps, no hot tips — just the ideas ' +
    'that actually matter, in the order they make sense.',
  lessons: [
    {
      id: 1,
      title: 'What a stock actually is',
      summary:
        'A share is a small piece of ownership in a real company. Understand that ' +
        'one idea and most of the market stops feeling like gambling.',
      keyPoints: [
        { icon: '🏢', title: 'Ownership', desc: 'A share = a slice of a real business and its profits.' },
        { icon: '📈', title: 'Price vs. value', desc: 'Price is what it trades at; value is what the business is worth.' },
        { icon: '💵', title: 'How you make money', desc: 'Two ways: the price rises, or the company pays dividends.' },
        { icon: '🎲', title: 'Not a lottery', desc: 'Owning good businesses for years ≠ betting on tickers.' },
      ],
      resources: [
        {
          title: 'Investopedia — Stock Basics',
          url: 'https://www.investopedia.com',
          note: 'suggested — verify; good plain-English glossary',
        },
      ],
      tutorPrompt:
        'You are teaching Lesson 1 of a beginner investing course to someone who ' +
        'has never bought a stock. Goal: they truly grasp that a share is part ' +
        'ownership of a real company, and the two ways owners make money. Open ' +
        'warmly, use a concrete everyday company as the running example, avoid ' +
        'jargon, and end by asking what made them want to start investing so you ' +
        'can tailor later lessons.',
    },
    {
      id: 2,
      title: 'Risk, reward, and time',
      summary:
        'Why stocks can swing wildly day to day but have rewarded patient owners ' +
        'over long periods — and why your time horizon changes everything.',
      keyPoints: [
        { icon: '🎢', title: 'Volatility', desc: 'Short-term prices are noisy; that noise is normal.' },
        { icon: '⏳', title: 'Time horizon', desc: 'Money you need soon does not belong in stocks.' },
        { icon: '⚖️', title: 'Risk = reward', desc: 'Higher potential return comes with bigger swings.' },
      ],
      tutorPrompt:
        'You are teaching Lesson 2: risk, reward, and time horizon. The learner ' +
        'knows a share is ownership (Lesson 1). Help them feel why short-term ' +
        'volatility is normal and why a long horizon is the beginner\'s biggest ' +
        'advantage. Use a simple analogy, and gently correct the urge to "get ' +
        'rich quick." Check how soon they think they\'ll need the money.',
    },
    {
      id: 3,
      title: 'Index funds: the boring superpower',
      summary:
        'Instead of picking winners, you can own a tiny slice of hundreds of ' +
        'companies at once, cheaply. Why this beats most stock-pickers.',
      keyPoints: [
        { icon: '🧺', title: 'Diversification', desc: 'Own the whole market, not one bet.' },
        { icon: '💸', title: 'Low fees', desc: 'Costs compound against you — keep them tiny.' },
        { icon: '🤖', title: 'No guessing', desc: 'You stop needing to predict individual winners.' },
      ],
      resources: [
        {
          title: 'Bogleheads Wiki — Getting Started',
          url: 'https://www.bogleheads.org/wiki/Getting_started',
          note: 'suggested — verify; the classic low-cost index approach',
        },
      ],
      tutorPrompt:
        'You are teaching Lesson 3: index funds. The learner understands risk and ' +
        'time (Lesson 2). Explain what an index fund is, why broad + cheap beats ' +
        'most active picking, and how fees quietly erode returns. Keep it ' +
        'concrete with a simple example, and reassure them that "boring" is the ' +
        'point. Ask whether they have access to a brokerage or retirement account.',
    },
    {
      id: 4,
      title: 'Reading a stock quote',
      summary:
        'Decode the numbers you see on any quote page — price, change, market ' +
        'cap, P/E — so the screen stops being intimidating.',
      keyPoints: [
        { icon: '🏷️', title: 'Price & change', desc: 'Today\'s trade and how far it moved.' },
        { icon: '📊', title: 'Market cap', desc: 'The whole company\'s price tag = shares × price.' },
        { icon: '🔢', title: 'P/E ratio', desc: 'Price relative to earnings — a rough "how expensive" gauge.' },
      ],
      tutorPrompt:
        'You are teaching Lesson 4: reading a stock quote. The learner has the big ' +
        'concepts (Lessons 1–3). Walk them line by line through a typical quote ' +
        'page, explaining price, change, market cap, and P/E in plain terms with ' +
        'one real-feeling example. Emphasize what each number does and does NOT ' +
        'tell you. Invite them to pull up a company they know and read it together.',
    },
    {
      id: 5,
      title: 'Building a simple plan you\'ll actually keep',
      summary:
        'Turn everything into a boring, automatic routine: how much, how often, ' +
        'into what — and the rule that protects you from yourself in a crash.',
      keyPoints: [
        { icon: '🗓️', title: 'Regular investing', desc: 'Invest a fixed amount on a schedule, ignore the noise.' },
        { icon: '🧮', title: 'Asset mix', desc: 'A simple split between stocks and safer assets.' },
        { icon: '🛑', title: 'The crash rule', desc: 'Decide now what you\'ll do when it drops — usually: nothing.' },
        { icon: '🔁', title: 'Automate', desc: 'Remove willpower from the loop; let it run.' },
      ],
      tutorPrompt:
        'You are teaching the final lesson: building a simple, durable plan. The ' +
        'learner now understands shares, risk, index funds, and quotes. Help them ' +
        'draft a concrete routine (amount, frequency, simple asset mix) and, most ' +
        'importantly, a pre-committed rule for market crashes so they don\'t panic-' +
        'sell. End by having them say their plan back in one sentence.',
    },
  ],
};
