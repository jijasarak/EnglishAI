import { 
  isLevelUnlocked, 
  isLevelCompleted, 
  shouldUnlockNextLevel, 
  getNextLevel,
  LEVEL_THRESHOLDS 
} from '../levels';

describe('Level Utils', () => {
  describe('isLevelUnlocked', () => {
    it('should always unlock beginner level', () => {
      expect(isLevelUnlocked(0, 'beginner')).toBe(true);
      expect(isLevelUnlocked(50, 'beginner')).toBe(true);
    });

    it('should unlock intermediate when XP >= 100', () => {
      expect(isLevelUnlocked(99, 'intermediate')).toBe(false);
      expect(isLevelUnlocked(100, 'intermediate')).toBe(true);
      expect(isLevelUnlocked(150, 'intermediate')).toBe(true);
    });

    it('should unlock advanced when XP >= 300', () => {
      expect(isLevelUnlocked(299, 'advanced')).toBe(false);
      expect(isLevelUnlocked(300, 'advanced')).toBe(true);
      expect(isLevelUnlocked(400, 'advanced')).toBe(true);
    });
  });

  describe('isLevelCompleted', () => {
    it('should complete beginner at 100 XP', () => {
      expect(isLevelCompleted(99, 'beginner')).toBe(false);
      expect(isLevelCompleted(100, 'beginner')).toBe(true);
    });

    it('should complete intermediate at 300 XP', () => {
      expect(isLevelCompleted(299, 'intermediate')).toBe(false);
      expect(isLevelCompleted(300, 'intermediate')).toBe(true);
    });

    it('should complete advanced at 500 XP', () => {
      expect(isLevelCompleted(499, 'advanced')).toBe(false);
      expect(isLevelCompleted(500, 'advanced')).toBe(true);
    });
  });

  describe('shouldUnlockNextLevel', () => {
    it('should indicate when ready to unlock next level', () => {
      expect(shouldUnlockNextLevel(100, 'beginner')).toBe(true);
      expect(shouldUnlockNextLevel(99, 'beginner')).toBe(false);
      expect(shouldUnlockNextLevel(300, 'intermediate')).toBe(true);
      expect(shouldUnlockNextLevel(299, 'intermediate')).toBe(false);
    });
  });

  describe('getNextLevel', () => {
    it('should return correct next level', () => {
      expect(getNextLevel('beginner')).toBe('intermediate');
      expect(getNextLevel('intermediate')).toBe('advanced');
      expect(getNextLevel('advanced')).toBe(null);
    });
  });
});