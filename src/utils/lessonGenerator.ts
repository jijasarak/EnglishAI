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
- IMPORTANT: Output STRICT JSON that matches this TypeScript type schema (no markdown, no commentary):
${buildSchema(skill)}
- Create 3 lessons in the "lessons" array with progressively harder content.
- For MCQ include 4 options and correctAnswer as index (0-based). For fill-blank set correctAnswer as expected string. For true-false use boolean. For open put an exemplar correctAnswer string.
- Keep texts concise (<= 180 words for reading/audio), writing minWords: beginner 80, intermediate 120, advanced 180.
`;

  const raw = await callGemini(prompt);
  const data = extractJson<any>(raw);

  const title = `${skill[0].toUpperCase()+skill.slice(1)} • ${level[0].toUpperCase()+level.slice(1)}`;
  const section: SectionData = {
    title,
    description: `AI-generated ${skill} lessons for ${level} level with adaptive difficulty` ,
    xpRequired: level === 'beginner' ? 0 : level === 'intermediate' ? 100 : 300,
    lessons: (data.lessons as LessonData[]).map((l, i) => ({
      ...l,
      id: l.id || `${skill}-${level}-lesson-${i+1}`,
      title: l.title || `${title}: Lesson ${i+1}`
    })),
  };

  return section;
}
