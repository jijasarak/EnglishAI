import { callGemini, extractJson } from './ai';
import type { SectionData, LessonData } from './dataLoader';
import type { User } from '../types';

function difficultyFromProgress(progress: { xp: number; completed: string[] }, level: 'beginner'|'intermediate'|'advanced') {
  const base = level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3;
  const bonus = Math.min(Math.floor((progress.xp || 0) / 100), 2);
  return base + bonus; // 1-5
}

function buildSchema(skill: string) {
  if (skill === 'listening') {
    return `{
  "title": string,
  "description": string,
  "lessons": [
    {
      "id": string,
      "title": string,
      "audioText": string,
      "questions": [
        {
          "id": string,
          "question": string,
          "type": "mcq"|"true-false"|"fill-blank"|"open",
          "options"?: string[],
          "correctAnswer": string|number|boolean,
          "points": number
        }
      ]
    }
  ]
}`;
  }
  if (skill === 'reading') {
    return `{
  "title": string,
  "description": string,
  "lessons": [
    {
      "id": string,
      "title": string,
      "text": string,
      "questions": [
        {"id": string, "question": string, "type": "mcq"|"true-false"|"fill-blank"|"open", "options"?: string[], "correctAnswer": string|number|boolean, "points": number}
      ]
    }
  ]
}`;
  }
  if (skill === 'speaking') {
    return `{
  "title": string,
  "description": string,
  "lessons": [
    {
      "id": string,
      "title": string,
      "instructions": string,
      "prompts": string[],
      "questions": [
        {"id": string, "question": string, "type": "open", "correctAnswer": string, "points": number}
      ]
    }
  ]
}`;
  }
  if (skill === 'writing') {
    return `{
  "title": string,
  "description": string,
  "lessons": [
    {
      "id": string,
      "title": string,
      "prompt": string,
      "instructions": string[],
      "minWords": number,
      "questions": [
        {"id": string, "question": string, "type": "open", "correctAnswer": string, "points": number}
      ]
    }
  ]
}`;
  }
  if (skill === 'grammar') {
    return `{
  "title": string,
  "description": string,
  "lessons": [
    {
      "id": string,
      "title": string,
      "explanation": string,
      "examples": string[],
      "questions": [
        {"id": string, "question": string, "type": "mcq"|"true-false"|"fill-blank"|"open", "options"?: string[], "correctAnswer": string|number|boolean, "points": number}
      ]
    }
  ]
}`;
  }
  return `{
  "title": string,
  "description": string,
  "lessons": [
    {
      "id": string,
      "title": string,
      "words": [{"word": string, "definition": string, "example": string, "synonyms"?: string[], "pronunciation"?: string}],
      "questions": [
        {"id": string, "question": string, "type": "mcq"|"true-false"|"fill-blank", "options"?: string[], "correctAnswer": string|number|boolean, "points": number}
      ]
    }
  ]
}`;
}

export async function generateSection(skill: keyof Omit<User, 'totalXP'|'streak'|'lastActiveDate'|'badges'>, level: 'beginner'|'intermediate'|'advanced', user: User): Promise<SectionData> {
  const progress = user[skill as keyof Omit<User, 'totalXP'|'streak'|'lastActiveDate'|'badges'>] as any;
  const diff = difficultyFromProgress(progress, level);

  const prompt = `You are an expert ESL curriculum designer. Create dynamic ${skill} lessons for level ${level}.
- Begin each lesson with a short tutorial/explanation appropriate to the skill (see schema fields like audioText/text/explanation/prompt/words).
- Then include 4-6 assignments/questions per lesson.
- Difficulty should increase lesson-by-lesson within the level. Overall difficulty target: ${diff} out of 5.
- Adapt to learner profile: completedActivities=${progress.completed.length}, xp=${progress.xp}.
- IMPORTANT: Return ONLY valid strict JSON (no markdown, no backticks, no comments).
- The JSON MUST match this schema exactly (keys present, types correct):
${buildSchema(skill)}
- Create 3 lessons in the "lessons" array with progressively harder content.
- For MCQ include 4 options and correctAnswer as index (0-based). For fill-blank set correctAnswer as expected string. For true-false use boolean. For open put an exemplar correctAnswer string.
- Keep texts concise (<= 180 words for reading/audio), writing minWords: beginner 80, intermediate 120, advanced 180.
`;

  let raw = await callGemini(prompt);
  let data: any;
  try {
    data = extractJson<any>(raw);
  } catch (e) {
    // Retry with repair prompt
    const repair = await callGemini(`Fix the following to be STRICT, VALID JSON only (no markdown, no comments). Return only JSON.\n\n${raw}`);
    data = extractJson<any>(repair);
  }

  const title = `${skill[0].toUpperCase()+skill.slice(1)} • ${level[0].toUpperCase()+level.slice(1)}`;
  const lessonsArr = Array.isArray(data?.lessons) ? data.lessons as LessonData[] : [];
  if (lessonsArr.length === 0) {
    // Fallback minimal deterministic lessons per skill
    const baseTitle = `${title}`;
    const fallback: LessonData[] = [0,1,2].map(i => {
      const id = `${skill}-${level}-lesson-${i+1}`;
      if (skill === 'listening') return { id, title: `${baseTitle} L${i+1}`, audioText: 'Listen carefully to the short passage about daily activities.', questions: [{ id: `${id}-q1`, question: 'What is the main topic?', type: 'mcq', options: ['Daily routine','Weather','Travel','Food'], correctAnswer: 0, points: 10 }] } as any;
      if (skill === 'reading') return { id, title: `${baseTitle} L${i+1}`, text: 'Read a short paragraph about a community event happening this week.', questions: [{ id: `${id}-q1`, question: 'When is the event?', type: 'fill-blank', correctAnswer: 'this week', points: 10 }] } as any;
      if (skill === 'speaking') return { id, title: `${baseTitle} L${i+1}`, instructions: 'Describe your morning routine in 3-5 sentences.', prompts: ['What time do you wake up?'], questions: [{ id: `${id}-q1`, question: 'Speak about your routine.', type: 'open', correctAnswer: 'Clear, structured routine with time markers', points: 20 }] } as any;
      if (skill === 'writing') return { id, title: `${baseTitle} L${i+1}`, prompt: 'Write about your favorite place and why you like it.', instructions: ['Use past tense at least once'], minWords: level==='beginner'?80:level==='intermediate'?120:180, questions: [{ id: `${id}-q1`, question: 'Submit your paragraph.', type: 'open', correctAnswer: 'Coherent paragraph with reasons and details', points: 20 }] } as any;
      if (skill === 'grammar') return { id, title: `${baseTitle} L${i+1}`, explanation: 'Present simple vs present continuous.', examples: ['I eat breakfast at 8.', 'I am eating now.'], questions: [{ id: `${id}-q1`, question: 'Choose the correct form: I ____ now.', type: 'mcq', options: ['eat','am eating','eats','ate'], correctAnswer: 1, points: 10 }] } as any;
      return { id, title: `${baseTitle} L${i+1}`, words: [{ word: 'adapt', definition: 'to change to fit new conditions', example: 'Plants adapt to different climates.' }], questions: [{ id: `${id}-q1`, question: 'Choose the synonym of adapt', type: 'mcq', options: ['change','ignore','reject','delay'], correctAnswer: 0, points: 10 }] } as any;
    });
    data = { title, description: `AI-generated ${skill} lessons for ${level}`, lessons: fallback };
  }

  const section: SectionData = {
    title,
    description: `AI-generated ${skill} lessons for ${level} level with adaptive difficulty` ,
    xpRequired: level === 'beginner' ? 0 : level === 'intermediate' ? 100 : 300,
    lessons: (data.lessons as LessonData[]).map((l, i) => ({
      ...l,
      id: (l as any).id || `${skill}-${level}-lesson-${i+1}`,
      title: (l as any).title || `${title}: Lesson ${i+1}`
    })),
  };

  return section;
}
