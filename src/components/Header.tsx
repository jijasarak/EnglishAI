import { useState } from 'react';
import { User } from '../types';
import { badges } from '../utils/badges';
import { Flame, Trophy, Zap, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getGeminiApiKey } from '../utils/ai';

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const userBadges = badges.filter(badge => user.badges.includes(badge.id));
  const [open, setOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const hasKey = Boolean(getGeminiApiKey());

  const saveKey = () => {
    localStorage.setItem('gemini_api_key', keyInput.trim());
    setOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            EnglishAI
          </h1>
          <button
            onClick={() => setOpen(true)}
            title="Settings"
            className="ml-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
          <div className={`ml-2 flex items-center text-sm ${hasKey ? 'text-green-600' : 'text-red-600'}`}>
            {hasKey ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
            <span>{hasKey ? 'AI Ready' : 'Add Gemini Key'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-full">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-700">{user.totalXP} XP</span>
          </div>

          <div className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-full">
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-orange-700">{user.streak} day streak</span>
          </div>

          <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-full">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <span className="font-semibold text-yellow-700">{userBadges.length} badges</span>
          </div>

          {userBadges.length > 0 && (
            <div className="flex space-x-1">
              {userBadges.slice(0, 3).map(badge => (
                <span key={badge.id} className="text-lg" title={badge.name}>
                  {badge.icon}
                </span>
              ))}
              {userBadges.length > 3 && (
                <span className="text-sm text-gray-500">+{userBadges.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Gemini API Key</h3>
            <p className="text-sm text-gray-600 mb-3">Enter your Google Generative Language API key (gemini-1.5-flash).</p>
            <input
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="AIza..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button onClick={saveKey} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
