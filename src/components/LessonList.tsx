import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { GeneratedLesson, generateLesson } from '../utils/aiContentGenerator';
import { Loader2, Play, BookOpen, Mic, PenTool, FileText, Brain } from 'lucide-react';

interface LessonListProps {
  skill: keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'>;
  level: 'beginner' | 'intermediate' | 'advanced';
  user: User;
  onLessonSelect: (lesson: GeneratedLesson) => void;
  onBack: () => void;
}

const skillIcons = {
  listening: Play,
  reading: BookOpen,
  speaking: Mic,
  writing: PenTool,
  grammar: Brain,
  vocabulary: FileText
};

export function LessonList({ skill, level, user, onLessonSelect, onBack }: LessonListProps) {
  const [lessons, setLessons] = useState<GeneratedLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingLessonId, setLoadingLessonId] = useState<string | null>(null);

  useEffect(() => {
    initializeLessons();
  }, [skill, level]);

  const initializeLessons = () => {
    // Generate lesson placeholders
    const lessonCount = 5; // 5 lessons per level
    const placeholderLessons: GeneratedLesson[] = [];
    
    for (let i = 1; i <= lessonCount; i++) {
      placeholderLessons.push({
        id: `${skill}-${level}-${i}`,
        title: `Lesson ${i}`,
        tutorial: '',
        assignments: []
      });
    }
    
    setLessons(placeholderLessons);
    setLoading(false);
  };

  const loadLesson = useCallback(async (lessonNumber: number) => {
    const lessonId = `${skill}-${level}-${lessonNumber}`;
    setLoadingLessonId(lessonId);
    
    try {
      setError(null);
      const lesson = await generateLesson(skill, level, lessonNumber, user);
      
      setLessons(prev => prev.map(l => 
        l.id === lessonId ? lesson : l
      ));
      
      onLessonSelect(lesson);
    } catch (err) {
      setError('Failed to generate lesson. Please try again.');
      console.error('Error generating lesson:', err);
    } finally {
      setLoadingLessonId(null);
    }
  }, [skill, level, user, onLessonSelect]);

  const isLessonCompleted = (lessonId: string) => {
    return user[skill].completed.includes(lessonId);
  };

  const canAccessLesson = (index: number) => {
    // First lesson is always accessible
    if (index === 0) return true;
    // Check if previous lesson is completed
    const previousLessonId = `${skill}-${level}-${index}`;
    return isLessonCompleted(previousLessonId);
  };

  const IconComponent = skillIcons[skill];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Preparing lessons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={initializeLessons}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
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
          <span>←</span>
          <span>Back to Level Selection</span>
        </button>

        <div className="text-center mb-8">
          <IconComponent className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {skill.charAt(0).toUpperCase() + skill.slice(1)} - {level.charAt(0).toUpperCase() + level.slice(1)}
          </h1>
          <p className="text-gray-600">AI-generated lessons tailored to your progress</p>
        </div>

        <div className="grid gap-6">
          {lessons.map((lesson, index) => {
            const completed = isLessonCompleted(lesson.id);
            const canAccess = canAccessLesson(index);
            const isLoadingThis = loadingLessonId === lesson.id;

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl p-6 shadow-lg border-2 transition-all duration-200 ${
                  canAccess
                    ? 'border-gray-200 cursor-pointer hover:shadow-xl hover:border-blue-300'
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
                } ${completed ? 'border-green-300 bg-green-50' : ''}`}
                onClick={() => canAccess && !isLoadingThis && loadLesson(index + 1)}
                whileHover={canAccess ? { scale: 1.02 } : {}}
                whileTap={canAccess ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      completed ? 'bg-green-500 text-white' : 
                      canAccess ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {completed ? '✓' : index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{lesson.title}</h3>
                      <p className="text-sm text-gray-600">
                        {completed ? 'Completed' : canAccess ? (isLoadingThis ? 'Generating...' : 'Available') : 'Locked'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {!canAccess && index > 0 && (
                      <p className="text-sm text-gray-500">
                        Complete previous lesson to unlock
                      </p>
                    )}
                    {canAccess && (
                      <div className="flex items-center space-x-2">
                        {isLoadingThis ? (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        )}
                        <span className="text-blue-600 font-medium">
                          {completed ? 'Review' : isLoadingThis ? 'Generating...' : 'Start'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}