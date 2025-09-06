import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, BookOpen, CheckCircle, XCircle, Award } from 'lucide-react';
import { LessonContent, LessonProgress, ExerciseResult } from '../types/lesson';

interface LessonViewerProps {
  lesson: LessonContent;
  onBack: () => void;
  onComplete: (lessonId: string, progress: LessonProgress) => void;
  existingProgress?: LessonProgress;
}

export function LessonViewer({ lesson, onBack, onComplete, existingProgress }: LessonViewerProps) {
  const [currentSection, setCurrentSection] = useState<'content' | 'exercises'>('content');
  const [currentExercise, setCurrentExercise] = useState(0);
  const [exerciseResults, setExerciseResults] = useState<ExerciseResult[]>(
    existingProgress?.exerciseResults || []
  );
  const [userAnswer, setUserAnswer] = useState<string | number | boolean>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCompleted, setIsCompleted] = useState(existingProgress?.completed || false);

  const handleAnswerSubmit = () => {
    const exercise = lesson.exercises[currentExercise];
    const isCorrect = userAnswer === exercise.correctAnswer;
    const points = isCorrect ? exercise.points : 0;

    const result: ExerciseResult = {
      exerciseId: exercise.id,
      userAnswer,
      correct: isCorrect,
      points
    };

    const updatedResults = [...exerciseResults];
    const existingIndex = updatedResults.findIndex(r => r.exerciseId === exercise.id);
    
    if (existingIndex >= 0) {
      updatedResults[existingIndex] = result;
    } else {
      updatedResults.push(result);
    }

    setExerciseResults(updatedResults);
    setShowFeedback(true);

    // Auto-advance after showing feedback
    setTimeout(() => {
      if (currentExercise < lesson.exercises.length - 1) {
        setCurrentExercise(prev => prev + 1);
        setUserAnswer('');
        setShowFeedback(false);
      } else {
        // All exercises completed
        completeLesson(updatedResults);
      }
    }, 2000);
  };

  const completeLesson = (results: ExerciseResult[]) => {
    const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
    const maxPoints = lesson.exercises.reduce((sum, e) => sum + e.points, 0);
    const score = Math.round((totalPoints / maxPoints) * 100);

    const progress: LessonProgress = {
      lessonId: lesson.id,
      completed: true,
      score,
      completedAt: new Date().toISOString(),
      exerciseResults: results
    };

    setIsCompleted(true);
    onComplete(lesson.id, progress);
  };

  const getSkillColor = (skill: string) => {
    switch (skill) {
      case 'grammar': return 'text-blue-600 bg-blue-50';
      case 'vocabulary': return 'text-green-600 bg-green-50';
      case 'pronunciation': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderExercise = () => {
    const exercise = lesson.exercises[currentExercise];
    const existingResult = exerciseResults.find(r => r.exerciseId === exercise.id);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Exercise {currentExercise + 1} of {lesson.exercises.length}
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentExercise + 1) / lesson.exercises.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-medium text-gray-800 mb-4">{exercise.question}</h4>

          {exercise.type === 'multiple-choice' && (
            <div className="space-y-3">
              {exercise.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showFeedback && setUserAnswer(index)}
                  disabled={showFeedback}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    showFeedback
                      ? userAnswer === index
                        ? userAnswer === exercise.correctAnswer
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-red-500 bg-red-50 text-red-800'
                        : index === exercise.correctAnswer
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-gray-200 bg-gray-50'
                      : userAnswer === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showFeedback && userAnswer === index && (
                      userAnswer === exercise.correctAnswer ? 
                        <CheckCircle className="w-5 h-5 text-green-600" /> : 
                        <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {showFeedback && userAnswer !== index && index === exercise.correctAnswer && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {exercise.type === 'fill-blank' && (
            <div className="space-y-4">
              <input
                type="text"
                value={userAnswer as string}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={showFeedback}
              />
            </div>
          )}

          {exercise.type === 'true-false' && (
            <div className="flex space-x-4">
              {[true, false].map((value) => (
                <button
                  key={value.toString()}
                  onClick={() => !showFeedback && setUserAnswer(value)}
                  disabled={showFeedback}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    showFeedback
                      ? userAnswer === value
                        ? userAnswer === exercise.correctAnswer
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-red-500 bg-red-50 text-red-800'
                        : value === exercise.correctAnswer
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-gray-200 bg-gray-50'
                      : userAnswer === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{value ? 'True' : 'False'}</span>
                    {showFeedback && userAnswer === value && (
                      userAnswer === exercise.correctAnswer ? 
                        <CheckCircle className="w-5 h-5 text-green-600" /> : 
                        <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {showFeedback && userAnswer !== value && value === exercise.correctAnswer && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!showFeedback && userAnswer !== '' && (
            <button
              onClick={handleAnswerSubmit}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Submit Answer
            </button>
          )}

          {showFeedback && (
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-gray-700">{exercise.explanation}</p>
              {existingResult && (
                <p className="text-sm text-gray-600 mt-2">
                  Points earned: {existingResult.points}/{exercise.points}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isCompleted && exerciseResults.length === lesson.exercises.length) {
    const totalPoints = exerciseResults.reduce((sum, r) => sum + r.points, 0);
    const maxPoints = lesson.exercises.reduce((sum, e) => sum + e.points, 0);
    const score = Math.round((totalPoints / maxPoints) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-md w-full"
        >
          <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Lesson Complete!</h2>
          <p className="text-xl text-gray-600 mb-6">
            Score: <span className="font-bold text-blue-600">{score}%</span>
          </p>
          <p className="text-gray-600 mb-6">
            You earned {totalPoints} out of {maxPoints} points
          </p>
          <button
            onClick={onBack}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Back to Lessons
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center space-x-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lessons</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{lesson.title}</h1>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSkillColor(lesson.skill)}`}>
                {lesson.skill}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{lesson.estimatedTime} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <BookOpen className="w-4 h-4" />
                <span>{lesson.exercises.length} exercises</span>
              </div>
              <span className="capitalize">{lesson.level}</span>
            </div>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setCurrentSection('content')}
              className={`flex-1 py-3 px-6 font-medium transition-colors ${
                currentSection === 'content'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📖 Learn
            </button>
            <button
              onClick={() => setCurrentSection('exercises')}
              className={`flex-1 py-3 px-6 font-medium transition-colors ${
                currentSection === 'exercises'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ✏️ Practice
            </button>
          </div>
        </div>

        {currentSection === 'content' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Lesson Content</h2>
              <div className="prose prose-gray max-w-none">
                {lesson.body.split('\n').map((paragraph, index) => {
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return (
                      <h3 key={index} className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                        {paragraph.slice(2, -2)}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <li key={index} className="ml-4 text-gray-700">
                        {paragraph.slice(2)}
                      </li>
                    );
                  }
                  return paragraph.trim() ? (
                    <p key={index} className="text-gray-700 mb-3">
                      {paragraph}
                    </p>
                  ) : null;
                })}
              </div>
            </div>

            {lesson.wordList && lesson.wordList.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 Key Vocabulary</h2>
                <div className="grid gap-4">
                  {lesson.wordList.map((word, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{word.word}</h3>
                        {word.pronunciation && (
                          <span className="text-sm text-gray-500">{word.pronunciation}</span>
                        )}
                      </div>
                      {word.partOfSpeech && (
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mb-2">
                          {word.partOfSpeech}
                        </span>
                      )}
                      <p className="text-gray-700 mb-2">{word.definition}</p>
                      <p className="text-gray-600 italic">"{word.example}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lesson.examples && lesson.examples.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">✅ Examples</h2>
                <div className="space-y-4">
                  {lesson.examples.map((example, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-4 mb-3">
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Correct</span>
                          </div>
                          <p className="text-gray-800">{example.correct}</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-700">Incorrect</span>
                          </div>
                          <p className="text-gray-800">{example.incorrect}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                        💡 {example.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setCurrentSection('exercises')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Start Exercises →
              </button>
            </div>
          </div>
        )}

        {currentSection === 'exercises' && renderExercise()}
      </div>
    </div>
  );
}