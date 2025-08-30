export const GEMINI_MODEL = ((import.meta as any).env?.VITE_GEMINI_MODEL as string) || 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export function getGeminiApiKey(): string | undefined {
  const fromLocal = localStorage.getItem('gemini_api_key') || undefined;
  const fromEnv = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  return fromLocal || fromEnv || undefined;
}

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('Missing Gemini API key');

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
  });

  // Read the body ONCE to avoid "body stream already read" issues
  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}: ${rawText}`);
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
