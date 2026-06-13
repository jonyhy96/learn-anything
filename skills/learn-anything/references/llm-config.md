# LLM endpoint configuration

The app talks to any **OpenAI-compatible** chat-completions API. That keeps it
portable: the same code runs against a local model on the learner's laptop or a
hosted gateway, with no code change — just config.

## Minimal track (default): browser talks to the LLM directly

In the default single-page build there's no backend. `src/lib/llm.ts` reads three
Vite env vars and calls the endpoint straight from the browser.

| Var                  | Default                          | Purpose                                    |
|----------------------|----------------------------------|--------------------------------------------|
| `VITE_LLM_BASE_URL`  | `http://localhost:8080/v1`       | Base URL of the chat-completions API.      |
| `VITE_LLM_MODEL`     | `gpt-4o`                         | Model name to request.                     |
| `VITE_LLM_API_KEY`   | *(unset)*                        | Optional; sent as `Authorization: Bearer`. |

Set them in a `.env` file (copy from `.env.example`). Only vars prefixed `VITE_`
are exposed to the browser by Vite.

### Recommended local endpoints (zero-cost, private, no key)

- **Ollama** — `VITE_LLM_BASE_URL=http://localhost:11434/v1`, model e.g.
  `llama3.1`. Run `ollama serve` and `ollama pull llama3.1`.
- **LM Studio** — start its local server; base URL is typically
  `http://localhost:1234/v1`.
- **vLLM** — `http://localhost:8000/v1`, model = whatever you served.

These need no API key, so nothing sensitive ships to the browser. This is the
ideal setup for the minimal track.

### The security caveat (read before using a hosted key)

In a pure browser app, **`VITE_LLM_API_KEY` is bundled into the client** and is
visible to anyone using the page. That's fine for:

- a **local** endpoint (no key at all), or
- a key you're genuinely comfortable exposing (a throwaway, tightly rate-limited
  key for personal single-machine use).

It is **not** fine for a real paid key you care about, or anything multi-user. If
you need to keep a key secret, that's the signal to graduate to the full track.

## Full track: proxy through a backend to hide the key

Add a small backend that holds the API key server-side and exposes its own
`/chat/completions` (and `/chat/completions` streaming) endpoint. Then point
`VITE_LLM_BASE_URL` at *your backend*, with no `VITE_LLM_API_KEY` in the browser.
The backend injects the real key when it calls upstream. None of the course /
chat / annotation logic changes — only the URL `lib/llm.ts` points at, and where
the key lives.

This is also where session-scoped routing fits if your backend supports it (e.g.
`{BASE}/sessions/{id}/chat/completions` to reuse conversation context server-side).
The client can pass a session id; the helper falls back to the plain path when
there's no session.

If you're adding a backend, the `vibe-engineering` skill's Go server pattern
drops in cleanly behind these modules.

## Switching providers later

Because everything is OpenAI-compatible and config-driven, moving from a local
model to OpenAI/OpenRouter (or vice versa) is just editing `.env`:

```bash
# Local Ollama
VITE_LLM_BASE_URL=http://localhost:11434/v1
VITE_LLM_MODEL=llama3.1

# OpenAI
VITE_LLM_BASE_URL=https://api.openai.com/v1
VITE_LLM_MODEL=gpt-4o
VITE_LLM_API_KEY=sk-...    # remember the browser-exposure caveat above

# OpenRouter
VITE_LLM_BASE_URL=https://openrouter.ai/api/v1
VITE_LLM_MODEL=anthropic/claude-3.5-sonnet
VITE_LLM_API_KEY=sk-or-...
```

No code change, just restart the dev server so Vite picks up the new env.
