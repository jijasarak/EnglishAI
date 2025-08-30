import { Badge, User } from '../types';

export const badges: Badge[] = [
  { id: 'first-steps', name: 'First Steps', icon: '👶', description: 'Complete your first activity', requirement: 1, category: 'general' },
  { id: 'streak-3', name: 'Consistency', icon: '🔥', description: 'Maintain a 3-day streak', requirement: 3, category: 'streak' },
  { id: 'streak-7', name: 'Week Warrior', icon: '⚡', description: 'Maintain a 7-day streak', requirement: 7, category: 'streak' },
  { id: 'grammar-ninja', name: 'Grammar Ninja', icon: '🥷', description: 'Complete 10 grammar exercises', requirement: 10, category: 'grammar' },
  { id: 'word-wizard', name: 'Word Wizard', icon: '🪄', description: 'Learn 50 new vocabulary words', requirement: 50, category: 'vocabulary' },
  { id: 'listening-master', name: 'Listening Master', icon: '🎧', description: 'Complete 20 listening exercises', requirement: 20, category: 'listening' },
  { id: 'reading-champion', name: 'Reading Champion', icon: '📖', description: 'Complete 15 reading exercises', requirement: 15, category: 'reading' },
  { id: 'speaking-star', name: 'Speaking Star', icon: '⭐', description: 'Complete 10 speaking exercises', requirement: 10, category: 'speaking' },
  { id: 'writing-pro', name: 'Writing Pro', icon: '✍️', description: 'Complete 12 writing exercises', requirement: 12, category: 'writing' },
  { id: 'xp-1000', name: 'Rising Star', icon: '🌟', description: 'Earn 1000 total XP', requirement: 1000, category: 'xp' },
  { id: 'xp-5000', name: 'Super Learner', icon: '🚀', description: 'Earn 5000 total XP', requirement: 5000, category: 'xp' },
  { id: 'listening-mastery', name: 'Listening Mastery', icon: '🏆', description: 'Complete Advanced Listening', requirement: 1, category: 'mastery' },
  { id: 'reading-mastery', name: 'Reading Mastery', icon: '🏆', description: 'Complete Advanced Reading', requirement: 1, category: 'mastery' },
  { id: 'speaking-mastery', name: 'Speaking Mastery', icon: '🏆', description: 'Complete Advanced Speaking', requirement: 1, category: 'mastery' },
  { id: 'writing-mastery', name: 'Writing Mastery', icon: '🏆', description: 'Complete Advanced Writing', requirement: 1, category: 'mastery' },
  { id: 'grammar-mastery', name: 'Grammar Mastery', icon: '🏆', description: 'Complete Advanced Grammar', requirement: 1, category: 'mastery' },
  { id: 'vocabulary-mastery', name: 'Vocabulary Mastery', icon: '🏆', description: 'Complete Advanced Vocabulary', requirement: 1, category: 'mastery' }
];

export function checkNewBadges(user: User): string[] {
  const newBadges: string[] = [];
  
  badges.forEach(badge => {
    if (user.badges.includes(badge.id)) return;
    
    let earned = false;
    
    switch (badge.category) {
      case 'general':
        earned = user.totalXP > 0;
        break;
      case 'streak':
        earned = user.streak >= badge.requirement;
        break;
      case 'xp':
        earned = user.totalXP >= badge.requirement;
        break;
      case 'grammar':
        earned = user.grammar.completed.length >= badge.requirement;
        break;
      case 'vocabulary':
        earned = user.vocabulary.completed.length >= badge.requirement;
        break;
      case 'listening':
        earned = user.listening.completed.length >= badge.requirement;
        break;
      case 'reading':
        earned = user.reading.completed.length >= badge.requirement;
        break;
      case 'speaking':
        earned = user.speaking.completed.length >= badge.requirement;
        break;
      case 'writing':
        earned = user.writing.completed.length >= badge.requirement;
        break;
      case 'mastery':
        earned = (
          (badge.id === 'listening-mastery' && user.listening.level === 'advanced') ||
          (badge.id === 'reading-mastery' && user.reading.level === 'advanced') ||
          (badge.id === 'speaking-mastery' && user.speaking.level === 'advanced') ||
          (badge.id === 'writing-mastery' && user.writing.level === 'advanced') ||
          (badge.id === 'grammar-mastery' && user.grammar.level === 'advanced') ||
          (badge.id === 'vocabulary-mastery' && user.vocabulary.level === 'advanced')
        );
        break;
    }
    
    if (earned) {
      newBadges.push(badge.id);
    }
  });
  
  return newBadges;
}
