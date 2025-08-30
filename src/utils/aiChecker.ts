import { callGemini, extractJson } from './ai';

export interface AIFeedback {
  correct: boolean;
  score: number; // 0-100
  feedback: string;
}

export async function checkOpenAnswer(question: string, userAnswer: string, context?: string): Promise<AIFeedback> {
  try {
    const prompt = `
You are an English teacher evaluating a student's answer. Provide very short, clear feedback (<= 30 words).

Question: ${question}
${context ? `Context: ${context}` : ''}
Student's Answer: ${userAnswer}

Respond ONLY valid JSON:
{
  "correct": true/false,
  "score": number (0-100),
  "feedback": "concise feedback (<= 30 words), actionable and specific"
}
`;

    const responseText = await callGemini(prompt);
    try {
      const parsed = extractJson<AIFeedback>(responseText);
      // Ensure concise feedback
      if (parsed.feedback) parsed.feedback = String(parsed.feedback).trim().split(/(?<=[.!?])\s+/).slice(0,2).join(' ');
      return parsed;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    // Fallback response if JSON parsing fails
    const ok = userAnswer.trim().length > 0;
    return {
      correct: ok,
      score: ok ? 60 : 20,
      feedback: ok ? 'Good start. Add detail and check grammar.' : 'Please write your answer so I can evaluate it.'
    };

  } catch (error) {
    console.error('Error checking answer with AI:', error);
    return {
      correct: false,
      score: 0,
      feedback: 'Could not evaluate now. Try again.'
    };
  }
}

export async function checkSpeakingAnswer(prompt: string, transcript: string): Promise<AIFeedback> {
  return checkOpenAnswer(
    `Speaking prompt: ${prompt}`,
    transcript,
    'This is a speaking exercise. Evaluate pronunciation, fluency, grammar, and content.'
  );
}

export async function checkWritingAnswer(prompt: string, essay: string, minWords?: number): Promise<AIFeedback> {
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;
  const context = `This is a writing exercise. Word count: ${wordCount}. Evaluate grammar, vocabulary, structure, and content. Do not penalize brevity if content is correct.`;
  return checkOpenAnswer(prompt, essay, context);
}
