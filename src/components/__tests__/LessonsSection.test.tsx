import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LessonsSection } from '../LessonsSection';
import { User } from '../../types';
import { sampleLessons } from '../../data/lessons';

const mockUser: User = {
  listening: { level: 'beginner', xp: 0, completed: [] },
  reading: { level: 'beginner', xp: 0, completed: [] },
  speaking: { level: 'beginner', xp: 0, completed: [] },
  writing: { level: 'beginner', xp: 0, completed: [] },
  grammar: { level: 'beginner', xp: 0, completed: [] },
  vocabulary: { level: 'beginner', xp: 0, completed: [] },
  totalXP: 0,
  streak: 0,
  lastActiveDate: '2024-01-01',
  badges: []
};

const mockProps = {
  user: mockUser,
  onBack: jest.fn(),
  onLessonComplete: jest.fn()
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('LessonsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders lessons section with sample lessons', () => {
    render(<LessonsSection {...mockProps} />);
    
    expect(screen.getByText('📚 Learning Modules')).toBeInTheDocument();
    expect(screen.getByText('Master English through structured lessons with examples and exercises')).toBeInTheDocument();
    
    // Check that sample lessons are displayed
    sampleLessons.forEach(lesson => {
      expect(screen.getByText(lesson.title)).toBeInTheDocument();
    });
  });

  it('displays lesson progress correctly', () => {
    const progressData = {
      'grammar-present-simple': {
        lessonId: 'grammar-present-simple',
        completed: true,
        score: 85,
        completedAt: '2024-01-01',
        exerciseResults: []
      }
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(progressData));
    
    render(<LessonsSection {...mockProps} />);
    
    expect(screen.getByText('✓ Completed • Score: 85%')).toBeInTheDocument();
  });

  it('opens lesson viewer when lesson is clicked', () => {
    render(<LessonsSection {...mockProps} />);
    
    const firstLesson = screen.getByText(sampleLessons[0].title);
    fireEvent.click(firstLesson);
    
    // Should show lesson viewer (back button appears)
    expect(screen.getByText('Back to Lessons')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<LessonsSection {...mockProps} />);
    
    const backButton = screen.getByText('Back to Dashboard');
    fireEvent.click(backButton);
    
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('displays progress statistics correctly', () => {
    const progressData = {
      'lesson1': { completed: true, score: 80, exerciseResults: [{ points: 10 }] },
      'lesson2': { completed: true, score: 90, exerciseResults: [{ points: 15 }] }
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(progressData));
    
    render(<LessonsSection {...mockProps} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Lessons completed
    expect(screen.getByText('85%')).toBeInTheDocument(); // Average score
    expect(screen.getByText('25')).toBeInTheDocument(); // Points earned
  });
});