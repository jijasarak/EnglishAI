export interface LessonContent {
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  skill: 'grammar' | 'vocabulary' | 'pronunciation';
  body: string;
  wordList?: WordItem[];
  examples?: ExampleUsage[];
  exercises: Exercise[];
  estimatedTime: number; // in minutes
}

export interface WordItem {
  word: string;
  definition: string;
  pronunciation?: string;
  partOfSpeech?: string;
  example: string;
}

export interface ExampleUsage {
  correct: string;
  incorrect: string;
  explanation: string;
}

export interface Exercise {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer: string | number | boolean;
  explanation: string;
  points: number;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score: number;
  completedAt?: string;
  exerciseResults: ExerciseResult[];
}

export interface ExerciseResult {
  exerciseId: string;
  userAnswer: string | number | boolean;
  correct: boolean;
  points: number;
}