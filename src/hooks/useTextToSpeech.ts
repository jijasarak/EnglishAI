import { useCallback, useEffect, useRef, useState } from 'react';

export type TTSStatus = 'idle' | 'playing' | 'paused';

function chunkText(input: string, maxLen = 180): string[] {
  const text = (input || '').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9\"'\(\[])|\n+/g)
    .map(s => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const s of sentences) {
    if (s.length <= maxLen) {
      chunks.push(s);
      continue;
    }
    // further split by commas or spaces
    let remaining = s;
    while (remaining.length > maxLen) {
      let idx = remaining.lastIndexOf(',', maxLen);
      if (idx < maxLen * 0.6) idx = remaining.lastIndexOf(' ', maxLen);
      if (idx < 0) idx = maxLen;
      chunks.push(remaining.slice(0, idx).trim());
      remaining = remaining.slice(idx).trim();
    }
    if (remaining) chunks.push(remaining);
  }
  return chunks;
}

export function useTextToSpeech() {
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [isSupported, setIsSupported] = useState(false);
  const queueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    return () => {
      try { window.speechSynthesis?.cancel(); } catch {}
      queueRef.current = [];
      currentIndexRef.current = 0;
      setStatus('idle');
    };
  }, []);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    queueRef.current = [];
    currentIndexRef.current = 0;
    setStatus('idle');
  }, [isSupported]);

  const play = useCallback((text: string, opts?: { rate?: number; pitch?: number; voice?: SpeechSynthesisVoice | null }) => {
    if (!isSupported || !text) return;
    // cancel any ongoing
    window.speechSynthesis.cancel();
    queueRef.current = [];
    currentIndexRef.current = 0;

    const chunks = chunkText(text);
    const { rate = 0.95, pitch = 1, voice = null } = opts || {};

    queueRef.current = chunks.map((chunk, idx) => {
      const u = new SpeechSynthesisUtterance(chunk);
      if (voice) u.voice = voice;
      u.rate = rate;
      u.pitch = pitch;
      u.onstart = () => { setStatus('playing'); };
      u.onend = () => {
        currentIndexRef.current = idx + 1;
        if (currentIndexRef.current >= queueRef.current.length) {
          setStatus('idle');
        }
      };
      u.onerror = () => {
        // try to continue to next
        currentIndexRef.current = idx + 1;
        if (currentIndexRef.current >= queueRef.current.length) {
          setStatus('idle');
        }
      };
      return u;
    });

    // Chain speak by scheduling sequentially
    // Some browsers queue automatically; we ensure order
    queueRef.current.forEach((u) => window.speechSynthesis.speak(u));
    setStatus('playing');
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    if (status === 'playing') {
      window.speechSynthesis.pause();
      setStatus('paused');
    }
  }, [isSupported, status]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    if (status === 'paused') {
      window.speechSynthesis.resume();
      setStatus('playing');
    }
  }, [isSupported, status]);

  return {
    isSupported,
    status,
    play,
    pause,
    resume,
    stop,
  } as const;
}
