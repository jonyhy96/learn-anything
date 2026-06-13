// OpenAI-compatible LLM client.
//
// Works with OpenAI, Ollama, vLLM, LM Studio, OpenRouter, or any compatible
// gateway. Configuration is read from Vite env vars (see .env.example):
//
//   VITE_LLM_BASE_URL  default http://localhost:8080/v1
//   VITE_LLM_MODEL     default gpt-4o
//   VITE_LLM_API_KEY   optional; sent as "Authorization: Bearer <key>" if set
//
// MINIMAL TRACK NOTE: in a pure browser app the API key (if any) ships to the
// client, so only use this with a local endpoint (Ollama/LM Studio) or a key
// you're comfortable exposing. To keep a key secret, graduate to the full track
// and proxy requests through a backend — see references/llm-config.md.

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function baseURL(): string {
  const v = (import.meta.env.VITE_LLM_BASE_URL as string | undefined)?.trim();
  return (v && v.replace(/\/+$/, '')) || 'http://localhost:8080/v1';
}

function model(): string {
  return (import.meta.env.VITE_LLM_MODEL as string | undefined)?.trim() || 'gpt-4o';
}

function authHeaders(): Record<string, string> {
  const key = (import.meta.env.VITE_LLM_API_KEY as string | undefined)?.trim();
  return key ? { Authorization: `Bearer ${key}` } : {};
}

/**
 * Stream a chat completion. Calls onDelta with each text chunk as it arrives
 * and resolves with the full accumulated text. Parses Server-Sent Events in the
 * OpenAI streaming format.
 */
export async function streamChat(
  messages: ChatMessage[],
  onDelta: (chunk: string, accumulated: string) => void,
  options?: { signal?: AbortSignal },
): Promise<string> {
  const res = await fetch(`${baseURL()}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ model: model(), messages, stream: true }),
    signal: options?.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`LLM request failed (${res.status})${text ? ': ' + text.slice(0, 200) : ''}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            accumulated += delta;
            onDelta(delta, accumulated);
          }
        } catch {
          // ignore non-JSON keep-alive lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return accumulated;
}

/** Non-streaming variant: returns the full answer in one shot. */
export async function chat(
  messages: ChatMessage[],
  options?: { signal?: AbortSignal },
): Promise<string> {
  const res = await fetch(`${baseURL()}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ model: model(), messages, stream: false }),
    signal: options?.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LLM request failed (${res.status})${text ? ': ' + text.slice(0, 200) : ''}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content || '';
}
