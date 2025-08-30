export interface LessonData {
  id: string;
  title: string;
  [key: string]: any;
}

export interface SectionData {
  title: string;
  description: string;
  xpRequired: number;
  lessons: LessonData[];
}

export interface SkillData {
  beginner: SectionData;
  intermediate: SectionData;
  advanced: SectionData;
}

import type { User } from '../types';
import { generateSection } from './lessonGenerator';

export async function loadLessonData(skill: keyof Omit<User, 'totalXP'|'streak'|'lastActiveDate'|'badges'>, level: 'beginner' | 'intermediate' | 'advanced', user: User): Promise<SectionData> {
  return await generateSection(skill, level, user);
}
