# Learning Modules Documentation

## Overview

The Learning Modules feature provides structured lessons with content, examples, and interactive exercises. This system complements the existing skill-based testing with comprehensive learning materials.

## Content Structure

### Lesson Model

Each lesson follows this structure:

```typescript
interface LessonContent {
  id: string;                    // Unique identifier
  title: string;                 // Lesson title
  level: 'beginner' | 'intermediate' | 'advanced';
  topic: string;                 // Subject area
  skill: 'grammar' | 'vocabulary' | 'pronunciation';
  body: string;                  // Main lesson content (markdown-like)
  wordList?: WordItem[];         // Key vocabulary
  examples?: ExampleUsage[];     // Correct/incorrect examples
  exercises: Exercise[];         // Practice exercises
  estimatedTime: number;         // Minutes to complete
}
```

### Content Location

- **Lesson Data**: `src/data/lessons.ts` - Contains sample lessons
- **Types**: `src/types/lesson.ts` - TypeScript interfaces
- **Components**: 
  - `src/components/LessonsSection.tsx` - Main lessons view
  - `src/components/LessonViewer.tsx` - Individual lesson display

## Adding New Lessons

### Method 1: Direct Addition (Recommended for now)

1. Open `src/data/lessons.ts`
2. Add a new lesson object to the `sampleLessons` array
3. Follow the existing structure and include:
   - Unique ID (use kebab-case: `skill-topic-identifier`)
   - Appropriate level and skill classification
   - Rich content with examples
   - 3-6 exercises with varied types

### Method 2: Future Database Integration

The system is designed to support database-backed content. Future implementations could:
- Store lessons in a CMS or database
- Support dynamic content loading
- Enable user-generated content

## Exercise Types

### Multiple Choice (`multiple-choice`)
```typescript
{
  type: 'multiple-choice',
  question: 'Choose the correct form...',
  options: ['option1', 'option2', 'option3', 'option4'],
  correctAnswer: 1, // Index of correct option (0-based)
  explanation: 'Explanation of why this is correct',
  points: 10
}
```

### Fill in the Blank (`fill-blank`)
```typescript
{
  type: 'fill-blank',
  question: 'Complete: I _____ (not/like) coffee.',
  correctAnswer: "don't like", // Exact string match
  explanation: 'Use don\'t for negative present simple',
  points: 10
}
```

### True/False (`true-false`)
```typescript
{
  type: 'true-false',
  question: 'True or False: This statement is correct.',
  correctAnswer: false, // Boolean value
  explanation: 'Explanation of the correct answer',
  points: 10
}
```

## Content Guidelines

### Lesson Body Format
- Use simple markdown-like formatting
- `**Bold Text**` for headings
- `- ` for bullet points
- Regular paragraphs for body text

### Word Lists
Include pronunciation, part of speech, and example sentences:
```typescript
{
  word: 'habit',
  definition: 'something you do regularly',
  pronunciation: '/ˈhæbɪt/',
  partOfSpeech: 'noun',
  example: 'Reading before bed is a good habit.'
}
```

### Examples
Provide correct/incorrect pairs with explanations:
```typescript
{
  correct: 'She works at a hospital.',
  incorrect: 'She work at a hospital.',
  explanation: 'Use "works" (with -s) for third person singular.'
}
```

## Progress Tracking

- Lesson completion is stored in localStorage
- Progress includes score, completion status, and individual exercise results
- XP is awarded based on exercise performance
- Integration with existing badge system

## UI Integration

### Navigation
- Accessible from main dashboard via "Learning Modules" button
- Maintains existing app navigation patterns
- Back navigation preserves user context

### Responsive Design
- Mobile-friendly lesson viewer
- Adaptive exercise layouts
- Consistent with existing app styling

## Testing

### Unit Tests
Test lesson data structure and progress tracking:
```bash
npm test -- --testPathPattern=lesson
```

### Integration Tests
Test lesson navigation and exercise completion flows.

## Future Enhancements

1. **Content Management**: Admin interface for lesson creation
2. **Adaptive Learning**: Difficulty adjustment based on performance
3. **Multimedia**: Audio/video content integration
4. **Social Features**: Lesson sharing and community content
5. **Analytics**: Detailed learning progress tracking

## Troubleshooting

### Common Issues

1. **Lesson not appearing**: Check lesson ID uniqueness and data structure
2. **Exercise not working**: Verify correctAnswer format matches exercise type
3. **Progress not saving**: Check localStorage availability and error console

### Debug Mode
Enable detailed logging by setting localStorage debug flag:
```javascript
localStorage.setItem('debug-lessons', 'true');
```