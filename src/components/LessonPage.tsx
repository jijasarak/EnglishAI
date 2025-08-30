import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { LessonData } from '../utils/dataLoader';
import { checkOpenAnswer, checkSpeakingAnswer, checkWritingAnswer, AIFeedback } from '../utils/aiChecker';
import { getGeminiApiKey } from '../utils/ai';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Play, Pause, RotateCcw, Mic, MicOff, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface LessonPageProps {
  skill: keyof Omit<User, 'totalXP' | 'streak' | 'lastActiveDate' | 'badges'>;
  lesson: LessonData;
  onComplete: (points: number, lessonId: string) => void;
  onBack: () => void;
}

interface Answer {
  questionId: string;
  answer: string | number | boolean;
  isCorrect?: boolean;
  feedback?: string;
  points?: number;
}

export function LessonPage({ skill, lesson, onComplete, onBack }: LessonPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [practiceStarted, setPracticeStarted] = useState(skill !== 'reading');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsQueueRef = useRef<SpeechSynthesisUtterance[] | null>(null);

  const { isListening, transcript, error: speechError, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  const questions = lesson.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => {
    if (transcript && skill === 'speaking') {
      setUserInput(transcript);
    }
  }, [transcript, skill]);

  useEffect(() => {
    setPracticeStarted(skill !== 'reading');
  }, [skill, lesson?.id]);

  const norm = (v: any) => String(v ?? '').toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ');
  const resolveMcqCorrectIndex = (q: any): number | null => {
    const ca = q?.correctAnswer as any;
    if (typeof ca === 'number') return ca;
    if (typeof ca === 'string') {
      const n = Number(ca.trim());
      if (Number.isInteger(n) && String(n) === ca.trim()) return n;
      const idx = (q?.options || []).findIndex((o: any) => norm(o) === norm(ca));
      return idx >= 0 ? idx : null;
    }
    return null;
  };
  const mcqCorrectText = (q: any): string => {
    const idx = resolveMcqCorrectIndex(q);
    if (idx != null && Array.isArray(q?.options) && q.options[idx] != null) return String(q.options[idx]);
    return String(q?.correctAnswer ?? '');
  };
  const normalizeBoolean = (v: any): boolean | null => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1 ? true : v === 0 ? false : null;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (s === 'true' || s === '1') return true;
      if (s === 'false' || s === '0') return false;
    }
    return null;
  };

  const playAudio = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      setIsPaused(false);
      setIsPlaying(true);
      const chunks = String(text).split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
      const queue = chunks.map((chunk) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = 'en-US';
        u.rate = 0.95;
        u.pitch = 1;
        return u;
      });
      ttsQueueRef.current = queue;
      const speakNext = () => {
        if (!ttsQueueRef.current || ttsQueueRef.current.length === 0) {
          setIsPlaying(false);
          setIsPaused(false);
          utteranceRef.current = null;
          return;
        }
        const next = ttsQueueRef.current.shift()!;
        utteranceRef.current = next;
        next.onend = () => speakNext();
        next.onerror = () => speakNext();
        window.speechSynthesis.speak(next);
      };
      speakNext();
    } catch {
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const pauseAudio = () => {
    if (!('speechSynthesis' in window)) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const resumeAudio = () => {
    if (!('speechSynthesis' in window)) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    }
  };

  const restartAudio = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    ttsQueueRef.current = null;
    setIsPaused(false);
    setIsPlaying(false);
    playAudio(text);
  };

  const handleMCQAnswer = (optionIndex: number) => {
    const resolved = resolveMcqCorrectIndex(currentQuestion);
    const isCorrect = resolved != null ? optionIndex === resolved : false;
    const points = isCorrect ? (currentQuestion.points || 10) : 0;

    const answer: Answer = {
      questionId: currentQuestion.id,
      answer: optionIndex,
      isCorrect,
      points,
      feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${mcqCorrectText(currentQuestion)}`
    };

    setAnswers(prev => [...prev, answer]);

    // No auto-advance; show feedback and wait for Next
  };

  const handleTrueFalseAnswer = (answer: boolean) => {
    const correct = normalizeBoolean(currentQuestion.correctAnswer);
    const isCorrect = correct != null ? answer === correct : false;
    const points = isCorrect ? (currentQuestion.points || 10) : 0;

    const answerObj: Answer = {
      questionId: currentQuestion.id,
      answer,
      isCorrect,
      points,
      feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${correct === null ? String(currentQuestion.correctAnswer) : correct ? 'True' : 'False'}`
    };

    setAnswers(prev => [...prev, answerObj]);

    // No auto-advance; show feedback and wait for Next
  };

  const handleFillBlankAnswer = () => {
    const isCorrect = norm(userInput) === norm(currentQuestion.correctAnswer as string);
    const points = isCorrect ? (currentQuestion.points || 10) : 0;

    const answer: Answer = {
      questionId: currentQuestion.id,
      answer: userInput,
      isCorrect,
      points,
      feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${String(currentQuestion.correctAnswer)}`
    };

    setAnswers(prev => [...prev, answer]);

    // No auto-advance; show feedback and wait for Next
  };

  const handleOpenAnswer = async () => {
    if (!userInput.trim()) return;

    if (!getGeminiApiKey()) {
      setAiFeedback({ correct: false, score: 0, feedback: 'Gemini API key missing. Click the gear icon in the header to add your key, then submit again.' });
      return;
    }

    setIsSubmitting(true);

    try {
      let feedback: AIFeedback;
      
      if (skill === 'speaking') {
        feedback = await checkSpeakingAnswer(currentQuestion.question, userInput);
      } else if (skill === 'writing') {
        feedback = await checkWritingAnswer(lesson.prompt || currentQuestion.question, userInput, lesson.minWords);
      } else {
        feedback = await checkOpenAnswer(currentQuestion.question, userInput, lesson.text || lesson.audioText);
      }
      
      setAiFeedback(feedback);
      
      const answer: Answer = {
        questionId: currentQuestion.id,
        answer: userInput,
        isCorrect: feedback.correct,
        points: Math.round((feedback.score / 100) * (currentQuestion.points || 20)),
        feedback: feedback.feedback
      };

      setAnswers(prev => [...prev, answer]);
      
      // No auto-advance; show feedback and wait for Next
    } catch (error) {
      console.error('Error checking answer:', error);
      setAiFeedback({
        correct: false,
        score: 0,
        feedback: 'Unable to evaluate your answer. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishLesson = (allAnswers: Answer[]) => {
    const total = allAnswers.reduce((sum, answer) => sum + (answer.points || 0), 0);
    setTotalScore(total);
    setShowResults(true);
    onComplete(total, lesson.id);
  };

  const goNext = () => {
    const answeredCurrent = answers.find(a => a.questionId === currentQuestion.id);
    if (!answeredCurrent && !aiFeedback) return;
    if (isLastQuestion) {
      finishLesson(answers);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserInput('');
      setAiFeedback(null);
    }
  };

  const tryAgain = () => {
    // Allow re-entry for open/fill-blank answers
    setUserInput('');
    setAiFeedback(null);
    setAnswers(prev => prev.filter(a => a.questionId !== currentQuestion.id));
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const hasAnswered = answers.some(a => a.questionId === currentQuestion.id) || aiFeedback;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{currentQuestion.question}</h3>

          {currentQuestion.type === 'mcq' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const isSelected = answers.find(a => a.questionId === currentQuestion.id)?.answer === index;
                const resolved = resolveMcqCorrectIndex(currentQuestion);
                const isCorrect = resolved != null ? index === resolved : false;

                return (
                  <button
                    key={index}
                    onClick={() => !hasAnswered && handleMCQAnswer(index)}
                    disabled={hasAnswered}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      hasAnswered
                        ? isSelected
                          ? isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-red-500 bg-red-50 text-red-800'
                          : isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {hasAnswered && isSelected && (
                        isCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      {hasAnswered && !isSelected && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'true-false' && (
            <div className="flex space-x-4">
              {[true, false].map((value) => {
                const isSelected = answers.find(a => a.questionId === currentQuestion.id)?.answer === value;
                const correct = normalizeBoolean(currentQuestion.correctAnswer);
                const isCorrect = correct != null ? value === correct : false;

                return (
                  <button
                    key={value.toString()}
                    onClick={() => !hasAnswered && handleTrueFalseAnswer(value)}
                    disabled={hasAnswered}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      hasAnswered
                        ? isSelected
                          ? isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-red-500 bg-red-50 text-red-800'
                          : isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{value ? 'True' : 'False'}</span>
                      {hasAnswered && isSelected && (
                        isCorrect ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      {hasAnswered && !isSelected && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'fill-blank' && (
            <div className="space-y-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={hasAnswered}
              />
              {!hasAnswered && (
                <button
                  onClick={handleFillBlankAnswer}
                  disabled={!userInput.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit Answer
                </button>
              )}
            </div>
          )}

          {currentQuestion.type === 'open' && (
            <div className="space-y-4">
              {skill === 'speaking' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={hasAnswered}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        isListening 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isListening ? 'Stop Recording' : 'Start Recording'}</span>
                    </button>
                    
                    {transcript && (
                      <button
                        onClick={resetTranscript}
                        className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg"
                        disabled={hasAnswered}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {speechError && (
                    <p className="text-red-600 text-sm">{speechError}</p>
                  )}
                </div>
              )}

              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={skill === 'speaking' ? "Your speech will appear here..." : "Type your answer here..."}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={hasAnswered || (skill === 'speaking' && isListening)}
              />
              
              {skill === 'writing' && lesson.minWords && (
                <p className="text-sm text-gray-500">
                  Words: {userInput.trim().split(/\s+/).filter(word => word.length > 0).length} / {lesson.minWords} minimum
                </p>
              )}

              {!hasAnswered && (
                <button
                  onClick={handleOpenAnswer}
                  disabled={!userInput.trim() || isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Evaluating...' : 'Submit Answer'}</span>
                </button>
              )}
            </div>
          )}

          {/* Show feedback for answered questions */}
          {hasAnswered && (
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              {aiFeedback ? (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    {aiFeedback.correct ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-semibold">Score: {aiFeedback.score}/100</span>
                  </div>
                  <p className="text-gray-700">{aiFeedback.feedback}</p>
                </div>
              ) : (
                <p className="text-gray-700">
                  {answers.find(a => a.questionId === currentQuestion.id)?.feedback}
                </p>
              )}
            </div>
          )}

          {/* Navigation controls: Try Again and Next */}
          <div className="mt-6 flex items-center justify-end gap-3">
            {hasAnswered && (currentQuestion.type === 'open' || currentQuestion.type === 'fill-blank') && (
              <button
                onClick={tryAgain}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Try Again
              </button>
            )}
            <button
              onClick={goNext}
              disabled={!hasAnswered}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (skill === 'listening' && lesson.audioText) {
      return (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800">Listen to the passage</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => playAudio(lesson.audioText)}
                disabled={isPlaying || isPaused}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>Play</span>
              </button>
              <button
                onClick={isPaused ? () => resumeAudio() : () => pauseAudio()}
                disabled={!isPlaying && !isPaused}
                className="flex items-center space-x-2 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                <Pause className="w-4 h-4" />
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={() => restartAudio(lesson.audioText)}
                className="flex items-center space-x-2 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (skill === 'reading' && lesson.text && !practiceStarted) {
      return (
        <div className="mb-8 p-6 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Read the passage</h3>
          <p className="text-gray-700 leading-relaxed mb-4">{lesson.text}</p>
          <button
            onClick={() => setPracticeStarted(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Practice
          </button>
        </div>
      );
    }

    if (skill === 'speaking' && lesson.instructions) {
      return (
        <div className="mb-8 p-6 bg-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Speaking Exercise</h3>
          <p className="text-gray-700 mb-4">{lesson.instructions}</p>
          {lesson.prompts && (
            <div className="space-y-2">
              <p className="font-medium text-purple-700">Prompts:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {lesson.prompts.map((prompt: string, index: number) => (
                  <li key={index}>{prompt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (skill === 'writing' && lesson.prompt) {
      return (
        <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Writing Prompt</h3>
          <p className="text-gray-700 mb-4">{lesson.prompt}</p>
          {lesson.instructions && (
            <div className="space-y-2">
              <p className="font-medium text-yellow-700">Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {lesson.instructions.map((instruction: string, index: number) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (skill === 'grammar' && lesson.explanation) {
      return (
        <div className="mb-8 p-6 bg-indigo-50 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4">Grammar Rule</h3>
          <p className="text-gray-700 mb-4">{lesson.explanation}</p>
          {lesson.examples && (
            <div className="space-y-2">
              <p className="font-medium text-indigo-700">Examples:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {lesson.examples.map((example: string, index: number) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (skill === 'vocabulary' && lesson.words) {
      return (
        <div className="mb-8 p-6 bg-pink-50 rounded-lg">
          <h3 className="text-lg font-semibold text-pink-800 mb-4">Vocabulary Words</h3>
          <div className="grid gap-4">
            {lesson.words.map((word: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-pink-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">{word.word}</h4>
                  {word.pronunciation && (
                    <span className="text-sm text-gray-500">{word.pronunciation}</span>
                  )}
                </div>
                <p className="text-gray-700 mb-2">{word.definition}</p>
                <p className="text-gray-600 italic mb-2">"{word.example}"</p>
                {word.synonyms && word.synonyms.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Synonyms: {word.synonyms.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-md w-full"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Lesson Complete!</h2>
          <p className="text-xl text-gray-600 mb-6">
            You earned <span className="font-bold text-blue-600">{totalScore} points</span>
          </p>
          <div className="space-y-4">
            <button
              onClick={onBack}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Continue Learning
            </button>
          </div>
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
          <span>←</span>
          <span>Back to Lessons</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{lesson.title}</h1>
        </div>

        {renderContent()}

        {(practiceStarted || skill !== 'reading') && questions.length > 0 ? (
          renderQuestion()
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Practice Complete!</h3>
            <p className="text-gray-600 mb-6">You've reviewed all the content for this lesson.</p>
            <button
              onClick={() => onComplete(lesson.points || 20, lesson.id)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Mark as Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
