export function getGeminiModel(): string {
  const fromEnv = (import.meta as any).env?.VITE_GEMINI_MODEL as string | undefined;
  const fromLocal = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_model') || undefined : undefined;
  return fromEnv || fromLocal || 'gemini-2.0-flash';
}
function getGeminiApiUrl(): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${getGeminiModel()}:generateContent`;
}

export function getGeminiApiKey(): string | undefined {
  const fromEnv = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  const fromLocal = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') || undefined : undefined;
  return fromEnv || fromLocal || undefined;
}

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('Missing Gemini API key');

  const url = `${getGeminiApiUrl()}?key=${apiKey}`;
  const options: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
    cache: 'no-store',
  };

  async function fetchOnce(): Promise<string> {
    const res = await fetch(url, options);
    const rawText = await res.text(); // read once
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${rawText}`);
    return rawText;
  }

  let rawText: string;
  try {
    rawText = await fetchOnce();
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (/body stream already read|bodyUsed/i.test(msg)) {
      // Retry with a brand new request body
      rawText = await fetchOnce();
    } else {
      throw err;
    }
  }

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw new Error(`Invalid JSON from Gemini: ${String(e)}`);
  }
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

function sanitizeJsonLike(input: string): string {
  let s = input.trim();
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/i, '');
  const match = s.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  s = match ? match[0] : s;
  s = s.replace(/[\u2018\u2019\u201A\u201B]/g, "'").replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  s = s.replace(/,(\s*[}\]])/g, '$1');
  return s;
}

export function extractJson<T = any>(raw: string): T {
  try {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON in model response');
    return JSON.parse(match[0]);
  } catch {}
  const sanitized = sanitizeJsonLike(raw);
  try {
    return JSON.parse(sanitized);
  } catch (e) {
    throw e;
  }
}
