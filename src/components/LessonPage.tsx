import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { LessonData } from '../utils/dataLoader';
import { checkOpenAnswer, checkSpeakingAnswer, checkWritingAnswer, AIFeedback } from '../utils/aiChecker';
import { generateNextTask } from '../utils/lessonGenerator';
import { getGeminiApiKey } from '../utils/ai';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { Play, Pause, RotateCcw, Mic, MicOff, Loader2, CheckCircle, XCircle, Volume2 } from 'lucide-react';

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
  const { isSupported: ttsSupported, status: ttsStatus, play: ttsPlay, pause: ttsPause, resume: ttsResume, stop: ttsStop } = useTextToSpeech();
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);

  const { isListening, transcript, error: speechError, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  const [currentLesson, setCurrentLesson] = useState<any>(lesson);
  const [currentQuestion, setCurrentQuestion] = useState<any>((lesson.questions && lesson.questions[0]) || null);

  useEffect(() => {
    if (transcript && skill === 'speaking') {
      setUserInput(transcript);
    }
  }, [transcript, skill]);

  useEffect(() => {
    if (!currentQuestion) {
      loadNextTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNextTask = async () => {
    try {
      const next = await generateNextTask(skill as string, answers.slice(-5).map(a => ({ correct: !!a.isCorrect, points: a.points })), undefined);
      if (next.lesson) {
        setCurrentLesson((prev: any) => ({ ...prev, ...next.lesson }));
      }
      setCurrentQuestion(next.question);
    } catch (e) {
      console.error('Failed to load next task', e);
      const fallback = { id: `q-${Date.now()}`, question: 'Choose the correct option', type: 'mcq', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 0, points: 10 } as any;
      setCurrentQuestion(fallback);
    } finally {
      setAiFeedback(null);
      setUserInput('');
      setCurrentQuestionIndex(idx => idx + 1);
    }
  };

  const playLessonAudio = (text: string) => {
    if (!ttsSupported) return;
    if (ttsStatus === 'paused') { ttsResume(); return; }
    if (ttsStatus === 'playing') { ttsPause(); return; }
    ttsPlay(text, { rate: 0.95, pitch: 1 });
  };

  const restartLessonAudio = (text: string) => {
    if (!ttsSupported) return;
    ttsStop();
    ttsPlay(text, { rate: 0.95, pitch: 1 });
  };

  const speakQuestion = () => {
    if (!ttsSupported || !currentQuestion) return;
    let q = `${currentQuestion.question}`;
    if (currentQuestion.type === 'mcq' && Array.isArray(currentQuestion.options)) {
      q += '. Options: ' + currentQuestion.options.map((opt: string, i: number) => `Option ${i + 1}: ${opt}`).join('. ');
    }
    ttsPlay(q, { rate: 0.98, pitch: 1 });
  };

  const handleMCQAnswer = (optionIndex: number) => {
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    const points = isCorrect ? (currentQuestion.points || 10) : 0;
    
    const answer: Answer = {
      questionId: currentQuestion.id,
      answer: optionIndex,
      isCorrect,
      points,
      feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${currentQuestion.options?.[currentQuestion.correctAnswer as number]}`
    };

    setAnswers(prev => [...prev, answer]);
    onComplete(points, `${lesson.id}-${Date.now()}`);
  };

  const handleTrueFalseAnswer = (answer: boolean) => {
    const isCorrect = answer === currentQuestion.correctAnswer;
    const points = isCorrect ? (currentQuestion.points || 10) : 0;
    
    const answerObj: Answer = {
      questionId: currentQuestion.id,
      answer,
      isCorrect,
      points,
      feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`
    };

    setAnswers(prev => [...prev, answerObj]);
    onComplete(points, `${lesson.id}-${Date.now()}`);
  };

  const handleFillBlankAnswer = () => {
    const isCorrect = userInput.toLowerCase().trim() === (currentQuestion.correctAnswer as string).toLowerCase().trim();
    const points = isCorrect ? (currentQuestion.points || 10) : 0;
    
    const answer: Answer = {
      questionId: currentQuestion.id,
      answer: userInput,
      isCorrect,
      points,
      feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`
    };

    setAnswers(prev => [...prev, answer]);
    onComplete(points, `${lesson.id}-${Date.now()}`);
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
        feedback = await checkWritingAnswer((currentLesson && currentLesson.prompt) || currentQuestion.question, userInput, currentLesson?.minWords);
      } else {
        feedback = await checkOpenAnswer(currentQuestion.question, userInput, (currentLesson && (currentLesson.text || currentLesson.audioText)) || undefined);
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
      onComplete(answer.points || 0, `${lesson.id}-${Date.now()}`);
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

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const hasAnswered = answers.some(a => a.questionId === currentQuestion.id) || aiFeedback;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Keep practicing</h2>
          <p className="text-gray-600">Adaptive questions will continue. Click Next to get a new one.</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">{currentQuestion.question}</h3>
            <button onClick={speakQuestion} className="ml-4 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
              <Volume2 className="w-4 h-4" />
              <span>Listen</span>
            </button>
          </div>

          {currentQuestion.type === 'mcq' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const isSelected = answers.find(a => a.questionId === currentQuestion.id)?.answer === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                
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
                const isCorrect = value === currentQuestion.correctAnswer;
                
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
              
              {skill === 'writing' && currentLesson?.minWords && (
                <p className="text-sm text-gray-500">
                  Words: {userInput.trim().split(/\s+/).filter(word => word.length > 0).length} / {currentLesson.minWords} minimum
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
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
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
              <div className="flex justify-end">
                <button onClick={loadNextTask} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const l = currentLesson || {};
    if (skill === 'listening' && l.audioText) {
      return (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800">Listen to the passage</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => playLessonAudio(l.audioText)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {ttsStatus === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{ttsStatus === 'playing' ? 'Pause' : ttsStatus === 'paused' ? 'Resume' : 'Play'}</span>
              </button>
              <button
                onClick={() => restartLessonAudio(l.audioText)}
                className="flex items-center space-x-2 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart</span>
              </button>
              <button
                onClick={() => ttsStop()}
                className="flex items-center space-x-2 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (skill === 'reading' && l.text) {
      return (
        <div className="mb-8 p-6 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Read the passage</h3>
          <p className="text-gray-700 leading-relaxed">{l.text}</p>
        </div>
      );
    }

    if (skill === 'speaking' && l.instructions) {
      return (
        <div className="mb-8 p-6 bg-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Speaking Exercise</h3>
          <p className="text-gray-700 mb-4">{l.instructions}</p>
          {l.prompts && (
            <div className="space-y-2">
              <p className="font-medium text-purple-700">Prompts:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {l.prompts.map((prompt: string, index: number) => (
                  <li key={index}>{prompt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (skill === 'writing' && l.prompt) {
      return (
        <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Writing Prompt</h3>
          <p className="text-gray-700 mb-4">{l.prompt}</p>
          {l.instructions && (
            <div className="space-y-2">
              <p className="font-medium text-yellow-700">Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {l.instructions.map((instruction: string, index: number) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Continuous flow: no hard end screen

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

        {renderQuestion()}
      </div>
    </div>
  );
}
