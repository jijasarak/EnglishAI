const GEMINI_API_KEY = 'AIzaSyC1U4B2azzXyJwfO6byo_UHTJlb3MVU2uw';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface GeneratedLesson {
  id: string;
  title: string;
  tutorial: string;
  content?: any;
  assignments: Assignment[];
}

export interface Assignment {
  id: string;
  type: 'mcq' | 'true-false' | 'fill-blank' | 'open' | 'speaking' | 'writing';
  question: string;
  options?: string[];
  correctAnswer?: string | number | boolean;
  points: number;
  context?: string;
}

async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

export async function generateListeningLesson(level: string, lessonNumber: number, userProgress?: any): Promise<GeneratedLesson> {
  const difficultyMap = {
    beginner: 'simple vocabulary, short sentences, basic topics like family, food, daily routines',
    intermediate: 'moderate vocabulary, complex sentences, topics like work, travel, hobbies',
    advanced: 'sophisticated vocabulary, complex grammar, topics like business, science, culture'
  };

  const prompt = `
Create a listening comprehension lesson for ${level} level English learners (lesson ${lessonNumber}).

Requirements:
- Generate a short audio passage (100-200 words) about an interesting topic
- Use ${difficultyMap[level as keyof typeof difficultyMap]}
- Include a tutorial explaining listening strategies
- Create 4-5 comprehension questions (mix of MCQ, true/false, and open-ended)
- Make it engaging and educational

Return in this JSON format:
{
  "title": "lesson title",
  "tutorial": "explanation of listening strategies and what students will learn",
  "audioText": "the text to be read aloud",
  "assignments": [
    {
      "type": "mcq",
      "question": "question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0,
      "points": 10
    },
    {
      "type": "true-false",
      "question": "statement to evaluate",
      "correctAnswer": true,
      "points": 10
    },
    {
      "type": "open",
      "question": "open-ended question",
      "points": 15
    }
  ]
}
`;

  const response = await callGeminiAPI(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    const lessonData = JSON.parse(jsonMatch[0]);
    return {
      id: `listening-${level}-${lessonNumber}`,
      title: lessonData.title,
      tutorial: lessonData.tutorial,
      content: { audioText: lessonData.audioText },
      assignments: lessonData.assignments.map((a: any, i: number) => ({
        ...a,
        id: `q${i + 1}`
      }))
    };
  }
  
  throw new Error('Failed to parse lesson data');
}

export async function generateReadingLesson(level: string, lessonNumber: number, userProgress?: any): Promise<GeneratedLesson> {
  const difficultyMap = {
    beginner: 'simple vocabulary, short paragraphs, basic sentence structures',
    intermediate: 'moderate vocabulary, longer passages, varied sentence structures',
    advanced: 'sophisticated vocabulary, complex passages, advanced grammar structures'
  };

  const prompt = `
Create a reading comprehension lesson for ${level} level English learners (lesson ${lessonNumber}).

Requirements:
- Generate an engaging reading passage (200-400 words)
- Use ${difficultyMap[level as keyof typeof difficultyMap]}
- Include a tutorial about reading strategies
- Create 4-6 comprehension questions (MCQ, true/false, fill-in-blank, open-ended)
- Focus on comprehension, vocabulary, and inference skills

Return in this JSON format:
{
  "title": "lesson title",
  "tutorial": "reading strategies and learning objectives",
  "passage": "the reading text",
  "assignments": [
    {
      "type": "mcq",
      "question": "question about the passage",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0,
      "points": 10
    },
    {
      "type": "fill-blank",
      "question": "Complete the sentence: The author mentions that _____ is important.",
      "correctAnswer": "education",
      "points": 10
    }
  ]
}
`;

  const response = await callGeminiAPI(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    const lessonData = JSON.parse(jsonMatch[0]);
    return {
      id: `reading-${level}-${lessonNumber}`,
      title: lessonData.title,
      tutorial: lessonData.tutorial,
      content: { passage: lessonData.passage },
      assignments: lessonData.assignments.map((a: any, i: number) => ({
        ...a,
        id: `q${i + 1}`
      }))
    };
  }
  
  throw new Error('Failed to parse lesson data');
}

export async function generateSpeakingLesson(level: string, lessonNumber: number, userProgress?: any): Promise<GeneratedLesson> {
  const difficultyMap = {
    beginner: 'basic topics, simple questions, short responses expected',
    intermediate: 'everyday situations, detailed responses, opinion questions',
    advanced: 'complex topics, analytical thinking, extended discourse'
  };

  const prompt = `
Create a speaking practice lesson for ${level} level English learners (lesson ${lessonNumber}).

Requirements:
- Focus on ${difficultyMap[level as keyof typeof difficultyMap]}
- Include tutorial about speaking techniques and pronunciation tips
- Create 3-4 speaking prompts that encourage natural conversation
- Include guidance on expected response length and key points to cover

Return in this JSON format:
{
  "title": "lesson title",
  "tutorial": "speaking strategies, pronunciation tips, and objectives",
  "instructions": "general instructions for the speaking exercises",
  "assignments": [
    {
      "type": "speaking",
      "question": "speaking prompt or question",
      "context": "additional context or guidance",
      "points": 20
    }
  ]
}
`;

  const response = await callGeminiAPI(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    const lessonData = JSON.parse(jsonMatch[0]);
    return {
      id: `speaking-${level}-${lessonNumber}`,
      title: lessonData.title,
      tutorial: lessonData.tutorial,
      content: { instructions: lessonData.instructions },
      assignments: lessonData.assignments.map((a: any, i: number) => ({
        ...a,
        id: `q${i + 1}`
      }))
    };
  }
  
  throw new Error('Failed to parse lesson data');
}

export async function generateWritingLesson(level: string, lessonNumber: number, userProgress?: any): Promise<GeneratedLesson> {
  const difficultyMap = {
    beginner: 'simple sentences, basic paragraph structure, 50-100 words',
    intermediate: 'structured paragraphs, clear organization, 150-250 words',
    advanced: 'complex essays, sophisticated arguments, 300-500 words'
  };

  const prompt = `
Create a writing lesson for ${level} level English learners (lesson ${lessonNumber}).

Requirements:
- Focus on ${difficultyMap[level as keyof typeof difficultyMap]}
- Include tutorial about writing techniques and structure
- Create 1-2 writing prompts with clear instructions
- Provide guidance on organization, grammar, and vocabulary usage

Return in this JSON format:
{
  "title": "lesson title",
  "tutorial": "writing strategies, structure tips, and learning objectives",
  "assignments": [
    {
      "type": "writing",
      "question": "writing prompt",
      "instructions": ["instruction1", "instruction2", "instruction3"],
      "minWords": 50,
      "maxWords": 100,
      "points": 25
    }
  ]
}
`;

  const response = await callGeminiAPI(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    const lessonData = JSON.parse(jsonMatch[0]);
    return {
      id: `writing-${level}-${lessonNumber}`,
      title: lessonData.title,
      tutorial: lessonData.tutorial,
      assignments: lessonData.assignments.map((a: any, i: number) => ({
        ...a,
        id: `q${i + 1}`
      }))
    };
  }
  
  throw new Error('Failed to parse lesson data');
}

export async function generateGrammarLesson(level: string, lessonNumber: number, userProgress?: any): Promise<GeneratedLesson> {
  const topics = {
    beginner: ['present simple', 'articles (a, an, the)', 'plural nouns', 'basic adjectives', 'question formation'],
    intermediate: ['present perfect', 'past continuous', 'conditionals', 'passive voice', 'reported speech'],
    advanced: ['subjunctive mood', 'complex conditionals', 'advanced tenses', 'inversion', 'cleft sentences']
  };

  const topicList = topics[level as keyof typeof topics];
  const topic = topicList[lessonNumber % topicList.length];

  const prompt = `
Create a grammar lesson about "${topic}" for ${level} level English learners.

Requirements:
- Provide clear explanation of the grammar rule
- Include examples and usage patterns
- Create 4-5 practice exercises (fill-in-blank, MCQ, error correction)
- Make it practical and easy to understand

Return in this JSON format:
{
  "title": "lesson title about ${topic}",
  "tutorial": "detailed explanation of the grammar rule with examples",
  "assignments": [
    {
      "type": "fill-blank",
      "question": "Complete the sentence: She _____ (go) to school every day.",
      "correctAnswer": "goes",
      "points": 10
    },
    {
      "type": "mcq",
      "question": "Choose the correct sentence:",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 1,
      "points": 10
    }
  ]
}
`;

  const response = await callGeminiAPI(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    const lessonData = JSON.parse(jsonMatch[0]);
    return {
      id: `grammar-${level}-${lessonNumber}`,
      title: lessonData.title,
      tutorial: lessonData.tutorial,
      assignments: lessonData.assignments.map((a: any, i: number) => ({
        ...a,
        id: `q${i + 1}`
      }))
    };
  }
  
  throw new Error('Failed to parse lesson data');
}

export async function generateVocabularyLesson(level: string, lessonNumber: number, userProgress?: any): Promise<GeneratedLesson> {
  const themes = {
    beginner: ['family members', 'colors and numbers', 'food and drinks', 'body parts', 'daily activities'],
    intermediate: ['emotions and feelings', 'travel and transportation', 'work and professions', 'health and medicine', 'technology'],
    advanced: ['academic vocabulary', 'business terms', 'scientific concepts', 'literary devices', 'philosophical ideas']
  };

  const themeList = themes[level as keyof typeof themes];
  const theme = themeList[lessonNumber % themeList.length];

  const prompt = `
Create a vocabulary lesson about "${theme}" for ${level} level English learners.

Requirements:
- Introduce 8-10 new words related to ${theme}
- Include definitions, pronunciations, and example sentences
- Create practice exercises (matching, fill-in-blank, usage questions)
- Make it engaging and memorable

Return in this JSON format:
{
  "title": "lesson title about ${theme}",
  "tutorial": "introduction to the vocabulary theme and learning strategies",
  "words": [
    {
      "word": "example",
      "definition": "definition here",
      "pronunciation": "/ɪɡˈzæmpəl/",
      "example": "example sentence",
      "synonyms": ["synonym1", "synonym2"]
    }
  ],
  "assignments": [
    {
      "type": "mcq",
      "question": "What does 'word' mean?",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0,
      "points": 10
    }
  ]
}
`;

  const response = await callGeminiAPI(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    const lessonData = JSON.parse(jsonMatch[0]);
    return {
      id: `vocabulary-${level}-${lessonNumber}`,
      title: lessonData.title,
      tutorial: lessonData.tutorial,
      content: { words: lessonData.words },
      assignments: lessonData.assignments.map((a: any, i: number) => ({
        ...a,
        id: `q${i + 1}`
      }))
    };
  }
  
  throw new Error('Failed to parse lesson data');
}

export async function generateLesson(skill: string, level: string, lessonNumber: number, userProgress?: any): Promise<GeneratedLesson> {
  switch (skill) {
    case 'listening':
      return generateListeningLesson(level, lessonNumber, userProgress);
    case 'reading':
      return generateReadingLesson(level, lessonNumber, userProgress);
    case 'speaking':
      return generateSpeakingLesson(level, lessonNumber, userProgress);
    case 'writing':
      return generateWritingLesson(level, lessonNumber, userProgress);
    case 'grammar':
      return generateGrammarLesson(level, lessonNumber, userProgress);
    case 'vocabulary':
      return generateVocabularyLesson(level, lessonNumber, userProgress);
    default:
      throw new Error(`Unknown skill: ${skill}`);
  }
}