import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Award, ArrowLeft } from 'lucide-react';
import { LessonContent, LessonProgress } from '../types/lesson';
import { sampleLessons } from '../data/lessons';
import { LessonViewer } from './LessonViewer';
import { User } from '../types';

interface LessonsSectionProps {
  user: User;
  onBack: () => void;
  onLessonComplete: (lessonId: string, progress: LessonProgress) => void;
}

export function LessonsSection({ user, onBack, onLessonComplete }: LessonsSectionProps) {
  const [selectedLesson, setSelectedLesson] = useState<LessonContent | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});

  useEffect(() => {
    // Load lesson progress from localStorage
    const saved = localStorage.getItem('lesson-progress');
    if (saved) {
      try {
        setLessonProgress(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading lesson progress:', error);
      }
    }
  }, []);

  const saveLessonProgress = (progress: Record<string, LessonProgress>) => {
    setLessonProgress(progress);
    localStorage.setItem('lesson-progress', JSON.stringify(progress));
  };

  const handleLessonComplete = (lessonId: string, progress: LessonProgress) => {
    const updatedProgress = {
      ...lessonProgress,
      [lessonId]: progress
    };
    saveLessonProgress(updatedProgress);
    onLessonComplete(lessonId, progress);
    setSelectedLesson(null);
  };

  const getLessonStatus = (lesson: LessonContent) => {
    const progress = lessonProgress[lesson.id];
    if (!progress) return 'not-started';
    return progress.completed ? 'completed' : 'in-progress';
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'grammar': return '📘';
      case 'vocabulary': return '🧩';
      case 'pronunciation': return '🗣️';
      default: return '📖';
    }
  };

  const getSkillColor = (skill: string) => {
    switch (skill) {
      case 'grammar': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'vocabulary': return 'bg-green-50 text-green-700 border-green-200';
      case 'pronunciation': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (selectedLesson) {
    return (
      <LessonViewer
        lesson={selectedLesson}
        onBack={() => setSelectedLesson(null)}
        onComplete={handleLessonComplete}
        existingProgress={lessonProgress[selectedLesson.id]}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center space-x-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-800 mb-4"
          >
            📚 Learning Modules
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600"
          >
            Master English through structured lessons with examples and exercises
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleLessons.map((lesson, index) => {
            const status = getLessonStatus(lesson);
            const progress = lessonProgress[lesson.id];
            
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer hover:shadow-xl transition-all duration-200"
                onClick={() => setSelectedLesson(lesson)}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{getSkillIcon(lesson.skill)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{lesson.title}</h3>
                      <p className="text-sm text-gray-600 capitalize">{lesson.level}</p>
                    </div>
                  </div>
                  {status === 'completed' && (
                    <Award className="w-5 h-5 text-yellow-500" />
                  )}
                </div>

                <div className="space-y-3">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getSkillColor(lesson.skill)}`}>
                    {lesson.skill}
                  </div>
                  
                  <p className="text-sm text-gray-600">{lesson.topic}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{lesson.estimatedTime} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{lesson.exercises.length} exercises</span>
                    </div>
                  </div>

                  {status === 'completed' && progress && (
                    <div className="bg-green-50 text-green-700 text-xs px-3 py-2 rounded-lg">
                      ✓ Completed • Score: {progress.score}%
                    </div>
                  )}
                  
                  {status === 'in-progress' && (
                    <div className="bg-yellow-50 text-yellow-700 text-xs px-3 py-2 rounded-lg">
                      📖 In Progress
                    </div>
                  )}
                  
                  {status === 'not-started' && (
                    <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg">
                      🚀 Start Learning
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(lessonProgress).filter(p => p.completed).length}
              </div>
              <div className="text-sm text-blue-700">Lessons Completed</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(lessonProgress).length > 0 
                  ? Math.round(Object.values(lessonProgress).reduce((sum, p) => sum + p.score, 0) / Object.values(lessonProgress).length)
                  : 0}%
              </div>
              <div className="text-sm text-green-700">Average Score</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(lessonProgress).reduce((sum, p) => sum + p.exerciseResults.reduce((s, e) => s + e.points, 0), 0)}
              </div>
              <div className="text-sm text-purple-700">Points Earned</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}