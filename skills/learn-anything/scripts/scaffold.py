#!/usr/bin/env python3
"""Scaffold a Learn-Anything single-page app and install the reusable modules.

Creates a Vite + React + TypeScript app (minimal track: no backend, data in the
browser, talking to any OpenAI-compatible LLM) and copies the domain-agnostic
core from assets/templates/ into it. After running:

    cd <project> && npm install && npm test && npm run dev

Then fill src/data/course.ts with the Phase 1 outline and build the UI in
vertical slices (see SKILL.md Phase 3).

Usage:
    python3 scripts/scaffold.py --name my-course --topic "Intro to Linear Algebra"
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
TEMPLATES = SKILL_DIR / "assets" / "templates"


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  + {path}")


def package_json(name: str) -> str:
    return json.dumps(
        {
            "name": name,
            "private": True,
            "version": "0.1.0",
            "type": "module",
            "scripts": {
                "dev": "vite",
                "build": "tsc -b && vite build",
                "preview": "vite preview",
                "test": "vitest run",
                "test:watch": "vitest",
                "test:e2e": "playwright test",
            },
            "dependencies": {
                "react": "^18.3.1",
                "react-dom": "^18.3.1",
                "zustand": "^4.5.5",
            },
            "devDependencies": {
                "@playwright/test": "^1.47.0",
                "@types/react": "^18.3.5",
                "@types/react-dom": "^18.3.0",
                "@vitejs/plugin-react": "^4.3.1",
                "jsdom": "^25.0.0",
                "typescript": "^5.5.4",
                "vite": "^5.4.3",
                "vitest": "^2.0.5",
            },
        },
        indent=2,
    )


TSCONFIG = """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src"]
}
"""

VITE_CONFIG = """import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // exclude Playwright specs from the Vitest run
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
"""

PLAYWRIGHT_CONFIG = """import { defineConfig, devices } from '@playwright/test';

// E2E covers the one path unit tests can't: real text selection in a browser.
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
"""


def index_html(topic: str) -> str:
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Learn: {topic}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"""


MAIN_TSX = """import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
"""

# A deliberately small starter App that proves the pieces are wired. The real UI
# is built in vertical slices (SKILL.md Phase 3); this just renders the course
# and a demo of the annotation interaction so `npm run dev` shows something live.
APP_TSX = """import { useState } from 'react';
import { course } from './data/course';
import { AnnotatedMessage } from './components/AnnotatedMessage';
import { useProgressStore } from './stores/progressStore';

export function App() {
  const orderedIds = course.lessons.map((l) => l.id);
  const [activeId, setActiveId] = useState(course.lessons[0]?.id ?? 1);
  const getStatus = useProgressStore((s) => s.getStatus);
  const markCompleted = useProgressStore((s) => s.markCompleted);

  const active = course.lessons.find((l) => l.id === activeId);

  return (
    <div className="la-app">
      <aside className="la-sidebar">
        <h1>{course.topic}</h1>
        <p className="la-desc">{course.description}</p>
        <ol className="la-lessons">
          {course.lessons.map((l) => {
            const status = getStatus(l.id, orderedIds);
            return (
              <li key={l.id}>
                <button
                  className={`la-lesson la-${status}`}
                  disabled={status === 'locked'}
                  onClick={() => setActiveId(l.id)}
                >
                  <span className="la-lesson-title">{l.title}</span>
                  <span className="la-lesson-status">{status}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <main className="la-main">
        {active && (
          <>
            <h2>{active.title}</h2>
            <p className="la-summary">{active.summary}</p>

            {/* Demo: the select-to-ask interaction over the lesson summary.
                Replace with the live tutor chat in Phase 3. Try highlighting
                any phrase below. */}
            <AnnotatedMessage
              messageId={`lesson-${active.id}-intro`}
              lessonId={active.id}
              content={
                `## ${active.title}\\n\\n${active.summary}\\n\\n` +
                active.keyPoints
                  .map((k) => `- **${k.title}** — ${k.desc}`)
                  .join('\\n')
              }
            />

            <button
              className="la-complete"
              onClick={() => markCompleted(active.id)}
            >
              Mark lesson complete
            </button>
          </>
        )}
      </main>
    </div>
  );
}
"""

# Neutral, restyle-friendly CSS. No theme personality on purpose — the skill
# tells you to make it look less generic per topic (see template-architecture.md).
INDEX_CSS = """:root {
  --bg: #ffffff;
  --fg: #1a1a1a;
  --muted: #6b7280;
  --accent: #2563eb;
  --line: #e5e7eb;
  --highlight: #fde68a;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  color: var(--fg);
  background: var(--bg);
}

* { box-sizing: border-box; }
body { margin: 0; }

.la-app { display: flex; min-height: 100vh; }
.la-sidebar {
  width: 300px;
  border-right: 1px solid var(--line);
  padding: 1.5rem;
  flex-shrink: 0;
}
.la-sidebar h1 { font-size: 1.2rem; margin: 0 0 0.5rem; }
.la-desc { color: var(--muted); font-size: 0.85rem; line-height: 1.5; }
.la-lessons { list-style: none; padding: 0; margin: 1.5rem 0 0; }
.la-lesson {
  width: 100%;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.4rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font: inherit;
}
.la-lesson:disabled { opacity: 0.45; cursor: not-allowed; }
.la-lesson.la-current { border-color: var(--accent); }
.la-lesson.la-completed { background: #f0fdf4; }
.la-lesson-status { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; }

.la-main { flex: 1; padding: 2rem 2.5rem; max-width: 760px; }
.la-summary { color: var(--muted); }
.la-complete, .la-ask-button, .la-panel button {
  font: inherit;
  cursor: pointer;
  border-radius: 8px;
}
.la-complete {
  margin-top: 1.5rem;
  padding: 0.6rem 1rem;
  border: none;
  background: var(--accent);
  color: #fff;
}

/* select-to-ask interaction */
.la-message { position: relative; }
.la-prose { line-height: 1.7; }
.la-prose pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}
.la-prose code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.la-highlight { background: var(--highlight); border-radius: 2px; cursor: pointer; }
.la-badge {
  font-size: 0.6rem;
  color: var(--accent);
  margin-left: 1px;
  cursor: pointer;
}
.la-ask-button {
  padding: 0.35rem 0.7rem;
  border: none;
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-size: 0.8rem;
}

.la-panel {
  margin: 0.75rem 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  background: #fafafa;
}
.la-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.la-panel-quote { font-style: italic; color: var(--muted); font-size: 0.85rem; }
.la-panel-actions button {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 0.75rem;
}
.la-followup { margin: 0.5rem 0; }
.la-followup-q { font-weight: 600; font-size: 0.9rem; }
.la-followup-a { color: #374151; font-size: 0.9rem; white-space: pre-wrap; }
.la-panel-input { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.la-panel-input textarea {
  flex: 1;
  resize: vertical;
  padding: 0.5rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  font: inherit;
}
.la-panel-input button {
  border: none;
  background: var(--accent);
  color: #fff;
  padding: 0 1rem;
}
.la-typing { color: var(--muted); }
"""

E2E_SPEC = """import { test, expect } from '@playwright/test';

// The critical path the unit tests can't cover: real selection in a browser.
// Highlight text in the demo message, click "Ask about this", and confirm an
// inline annotation panel opens. (We don't assert on the LLM answer here, since
// that depends on a live endpoint — just that the interaction wires up.)
test('select text -> ask -> inline panel opens', async ({ page }) => {
  await page.goto('/');

  const prose = page.locator('.la-prose').first();
  await expect(prose).toBeVisible();

  // Select the first word of the rendered message.
  await prose.locator('text=/\\\\w+/').first().click();
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.up('Shift');

  const askBtn = page.getByRole('button', { name: 'Ask about this' });
  if (await askBtn.isVisible()) {
    await askBtn.click();
    await expect(page.locator('.la-panel')).toBeVisible();
  }
});
"""

GITIGNORE = """node_modules/
dist/
.env
.env.local
*.log
.DS_Store
test-results/
playwright-report/
"""


def main() -> None:
    ap = argparse.ArgumentParser(description="Scaffold a Learn-Anything app.")
    ap.add_argument("--name", required=True, help="project directory name")
    ap.add_argument("--topic", required=True, help="what the learner is studying")
    ap.add_argument(
        "--dir",
        default=".",
        help="parent directory to create the project in (default: cwd)",
    )
    args = ap.parse_args()

    root = Path(args.dir).resolve() / args.name
    if root.exists() and any(root.iterdir()):
        raise SystemExit(f"refusing to scaffold into non-empty dir: {root}")
    root.mkdir(parents=True, exist_ok=True)
    print(f"Scaffolding Learn-Anything app at {root}\n")

    # 1) Copy the domain-agnostic core (src/ + .env.example) from templates.
    print("Installing reusable modules:")
    for item in sorted(TEMPLATES.glob("src/**/*")):
        if item.is_file():
            rel = item.relative_to(TEMPLATES)
            dest = root / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, dest)
            print(f"  + {dest}")
    shutil.copy2(TEMPLATES / ".env.example", root / ".env.example")
    print(f"  + {root / '.env.example'}")

    # 2) Generate project boilerplate.
    print("\nGenerating project files:")
    write(root / "package.json", package_json(args.name))
    write(root / "tsconfig.json", TSCONFIG)
    write(root / "vite.config.ts", VITE_CONFIG)
    write(root / "playwright.config.ts", PLAYWRIGHT_CONFIG)
    write(root / "index.html", index_html(args.topic))
    write(root / "src" / "main.tsx", MAIN_TSX)
    write(root / "src" / "App.tsx", APP_TSX)
    write(root / "src" / "index.css", INDEX_CSS)
    write(root / "e2e" / "annotation.spec.ts", E2E_SPEC)
    write(root / ".gitignore", GITIGNORE)

    print(
        "\nDone.\n\nNext:\n"
        f"  cd {root}\n"
        "  npm install\n"
        "  npm test            # unit tests should pass on the untouched base\n"
        "  cp .env.example .env && edit it to point at your LLM endpoint\n"
        "  npm run dev\n\n"
        "Then fill src/data/course.ts with the agreed outline and build the UI "
        "in vertical slices (see SKILL.md Phase 3)."
    )


if __name__ == "__main__":
    main()
