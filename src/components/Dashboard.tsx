import { motion } from 'framer-motion';
import { User } from '../types';
import { SectionCard } from './SectionCard';

interface DashboardProps {
  user: User;
  onSectionSelect: (section: keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'>) => void;
}

export function Dashboard({ user, onSectionSelect }: DashboardProps) {
  const sections = [
    {
      key: 'listening' as const,
      title: 'Listening',
      icon: '🎧',
      description: 'Improve your listening skills with AI-generated audio exercises'
    },
    {
      key: 'reading' as const,
      title: 'Reading',
      icon: '📖',
      description: 'Enhance reading comprehension with engaging passages'
    },
    {
      key: 'speaking' as const,
      title: 'Speaking',
      icon: '🗣️',
      description: 'Practice pronunciation and fluency with speech recognition'
    },
    {
      key: 'writing' as const,
      title: 'Writing',
      icon: '✍️',
      description: 'Develop writing skills with guided prompts and feedback'
    }
  ];

  const isLocked = (sectionKey: string, user: User) => {
    // All sections are now unlocked from the start
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-800 mb-4"
          >
            Welcome to your English learning journey!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600"
          >
            Choose a section to continue learning
          </motion.p>
        </div>

        <div className="text-center mb-8">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => (onSectionSelect as any)('lessons')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📚 Learning Modules
          </motion.button>
          <p className="text-gray-600 mt-2 text-sm">
            Structured lessons with examples and exercises
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SectionCard
                title={section.title}
                icon={section.icon}
                description={section.description}
                progress={user[section.key]}
                onClick={() => onSectionSelect(section.key)}
                isLocked={isLocked(section.key, user)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
