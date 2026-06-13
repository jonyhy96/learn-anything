// Screenshot harness for the learn-stock demo.
// Serves the built dist/ via Playwright request interception (NO network port
// is opened), seeds realistic localStorage state (progress + a select-to-ask
// annotation with a Q&A thread), and captures screenshots for the README.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, 'dist');
const OUT = path.resolve(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.PW_CHROME ||
      '/home/mira/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2, // crisp screenshots
  });

  // Intercept everything under the fake origin and serve from dist/.
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    let p = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = path.join(DIST, p);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const ext = path.extname(file);
      route.fulfill({
        status: 200,
        contentType: MIME[ext] || 'application/octet-stream',
        body: fs.readFileSync(file),
      });
    } else {
      route.fulfill({ status: 404, body: 'not found' });
    }
  });

  await page.goto('http://demo.local/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.la-prose');

  // --- Shot 1: course path overview (fresh state, lesson 1 current) ---
  await page.screenshot({ path: path.join(OUT, '01-course-path.png') });

  // --- Seed state: complete lesson 1, and add an annotation w/ a Q&A on the
  //     lesson-1 intro message, then reload so it renders persistently. ---
  await page.evaluate(() => {
    // progress: lesson 1 completed -> lesson 2 becomes current
    localStorage.setItem(
      'learn-anything-progress',
      JSON.stringify({ state: { completedIds: [1] }, version: 0 }),
    );
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.la-prose');

  // Compute correct offsets for a phrase in the rendered message, then write a
  // seeded annotation (with a follow-up answer) into localStorage.
  const seeded = await page.evaluate(() => {
    const el = document.querySelector('.la-prose');
    const text = el.textContent || '';
    const phrase = 'a real company';
    const start = text.indexOf(phrase);
    if (start < 0) return { ok: false, text };
    const msgId = 'lesson-1-intro';
    const ann = {
      id: 'seed-ann-1',
      lessonId: 1,
      messageId: msgId,
      selectedText: phrase,
      startOffset: start,
      endOffset: start + phrase.length,
      followUps: [
        {
          id: 'seed-fu-1',
          question: 'So I literally own part of the business?',
          answer:
            'Exactly. If a company has issued 1,000,000 shares and you hold ' +
            '100 of them, you own 0.01% of that business — its factories, its ' +
            'brand, and a claim on its future profits. That ownership is what ' +
            'gives a share its value; the ticker price is just what other ' +
            'owners will pay for your slice today.',
          createdAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
    };
    localStorage.setItem(
      'learn-anything-annotations',
      JSON.stringify({ state: { annotations: [ann] }, version: 0 }),
    );
    return { ok: true, start };
  });
  console.log('seed annotation:', JSON.stringify(seeded));

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.la-highlight');

  // --- Shot 2: a persisted highlight + footnote badge in the answer ---
  await page.screenshot({ path: path.join(OUT, '02-highlight.png') });

  // Open the inline annotation thread by clicking the badge.
  await page.click('[data-ann-badge="seed-ann-1"]');
  await page.waitForSelector('.la-panel');
  await page.waitForTimeout(150);

  // --- Shot 3: the select-to-ask inline Q&A thread (the signature move) ---
  await page.screenshot({ path: path.join(OUT, '03-select-to-ask.png') });

  // --- Shot 4: live selection -> floating "Ask about this" button ---
  // Select a phrase inside the prose paragraph and fire a real mouseup so the
  // component's selection handler shows the floating button.
  await page.evaluate(() => {
    const el = document.querySelector('.la-prose');
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let target = null;
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.textContent && n.textContent.includes('claim on its future profits')) {
        target = n;
        break;
      }
    }
    // fall back to the first sizable text node
    if (!target) {
      const w2 = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (w2.nextNode()) {
        if ((w2.currentNode.textContent || '').trim().length > 12) {
          target = w2.currentNode;
          break;
        }
      }
    }
    const txt = target.textContent;
    const phrase = 'ownership';
    let s = txt.indexOf(phrase);
    let e = s + phrase.length;
    if (s < 0) {
      s = 0;
      e = Math.min(10, txt.length);
    }
    const range = document.createRange();
    range.setStart(target, s);
    range.setEnd(target, e);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const rect = range.getBoundingClientRect();
    el.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top,
      }),
    );
  });
  await page.waitForTimeout(250);
  const hasBtn = await page.locator('.la-ask-button').count();
  if (hasBtn) {
    await page.screenshot({ path: path.join(OUT, '04-ask-button.png') });
  }
  console.log('ask-button visible:', hasBtn);

  await browser.close();
  console.log('done; shots in', OUT);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
