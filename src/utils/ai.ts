export const GEMINI_MODEL = 'gemini-1.5-flash';
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

export function extractJson<T = any>(raw: string): T {
  // Try to extract the first JSON object or array from the text
  const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON in model response');
  return JSON.parse(match[0]);
}
