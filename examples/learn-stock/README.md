# learn-stock (example)

A real course built with the [`learn-anything`](../../skills/learn-anything) skill:
**Stock Market Investing for Beginners**, a calm 5-lesson path from "what is a share?" to
a simple long-term plan.

This is the source that produced the screenshots in the top-level README. It's a normal
Vite + React + TypeScript single-page app.

```bash
npm install
npm test            # the reusable core's unit tests
npm run build
# configure a .env (see .env.example) pointing at any OpenAI-compatible endpoint
```

The whole topic lives in `src/data/course.ts`; everything else is the domain-agnostic core
the skill ships. `shoot.cjs` is the Playwright harness that captured the README
screenshots by serving the built `dist/` via request interception (no network port) and
seeding realistic localStorage state.
