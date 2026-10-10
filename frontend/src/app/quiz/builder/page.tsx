'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { UserRole } from '@aptiquiz/shared';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface QuestionDraft {
  id: string;
  text: string;
  type: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  points: number;
  isParameterized: boolean;
  parameterTemplate?: string;
}

export default function QuizBuilderPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Quantitative Aptitude');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [negativeMarking, setNegativeMarking] = useState(0); // 0 or 0.25
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);

  // Questions state
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      id: '1',
      text: 'If 12 men can complete a piece of work in 4 days, how many men are needed to complete it in 2 days?',
      type: 'SINGLE_CHOICE',
      options: ['18', '24', '30', '36'],
      correctAnswer: '24',
      explanation: 'Work = men * days = 12 * 4 = 48 man-days. Men needed = 48 / 2 = 24 men.',
      topic: 'Time and Work',
      difficulty: 'EASY',
      timeLimit: 60,
      points: 100,
      isParameterized: false,
    },
  ]);

  const [activeTab, setActiveTab] = useState<number>(0);

  const addQuestion = () => {
    const newQ: QuestionDraft = {
      id: Date.now().toString(),
      text: '',
      type: 'SINGLE_CHOICE',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      topic: category,
      difficulty: 'MEDIUM',
      timeLimit: timePerQuestion,
      points: 100,
      isParameterized: false,
    };
    setQuestions([...questions, newQ]);
    setActiveTab(questions.length);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    setActiveTab(Math.max(0, index - 1));
  };

  const updateQuestion = (index: number, updates: Partial<QuestionDraft>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a title for the quiz');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Quiz
      const quizRes = await api.post<{ quiz: { id: string } }>('/quizzes', {
        title,
        description,
        category,
        difficulty,
        timePerQuestion,
        negativeMarking,
        visibility: 'PUBLIC',
      });

      const quizId = quizRes.quiz.id;

      // 2. Create questions & attach to quiz
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qRes = await api.post<{ question: { id: string } }>('/questions', {
          text: q.text || `Question ${i + 1}`,
          type: q.type,
          options: q.options.filter((o) => o.trim() !== '').length >= 2 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: q.correctAnswer || q.options[0] || 'Option A',
          explanation: q.explanation,
          topic: q.topic || category,
          difficulty: q.difficulty,
          timeLimit: q.timeLimit || timePerQuestion,
          points: q.points || 100,
          isParameterized: q.isParameterized,
          parameterTemplate: q.isParameterized ? q.parameterTemplate : undefined,
        });

        await api.post(`/quizzes/${quizId}/questions`, {
          questionId: qRes.question.id,
          order: i,
          timeLimit: q.timeLimit,
          points: q.points,
        });
      }

      // 3. Create a room directly for easy hosting
      const roomRes = await api.post<{ room: { code: string } }>('/rooms', {
        quizId,
        joinMode: 'ONLINE_LIVE',
      });

      setCreatedRoomCode(roomRes.room.code);
    } catch (err: any) {
      alert(err.message || 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[activeTab] || questions[0];

  return (
    <ProtectedRoute allowedRoles={[UserRole.HOST, UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN]}>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {createdRoomCode && (
            <div className="card p-6 border-2 border-success-500 bg-success-50 dark:bg-success-900/20 text-center space-y-4">
              <span className="text-4xl block">🎉</span>
              <h2 className="text-2xl font-bold text-success-800 dark:text-success-200">
                Quiz Created Successfully!
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                A live room has been generated with code{' '}
                <span className="font-mono font-bold text-lg text-primary-600 bg-white dark:bg-gray-800 px-3 py-1 rounded-md border">
                  {createdRoomCode}
                </span>
              </p>
              <div className="flex justify-center gap-4 pt-2">
                <Link href={`/room/${createdRoomCode}/host`} className="btn-primary py-2.5 px-6">
                  Open Host Lobby
                </Link>
                <Link href="/dashboard" className="btn-secondary py-2.5 px-4">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Quiz Builder & Question Editor
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Author customized multiple-choice tests, set timer limits, and configure negative marking.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveQuiz} className="space-y-8">
            {/* Quiz General Settings Card */}
            <div className="card p-6 sm:p-8 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
                1. Quiz Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="sm:col-span-2">
                  <label className="label">Quiz Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Campus Placement Sprint: Quantitative Aptitude"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input"
                  >
                    <option value="Quantitative Aptitude">Quantitative Aptitude</option>
                    <option value="Logical Reasoning">Logical Reasoning</option>
                    <option value="Verbal Ability">Verbal Ability</option>
                    <option value="Data Interpretation">Data Interpretation</option>
                    <option value="Core Engineering / CS">Core Engineering / CS</option>
                  </select>
                </div>

                <div>
                  <label className="label">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="input"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="label">Time per Question (seconds)</label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    value={timePerQuestion}
                    onChange={(e) => setTimePerQuestion(parseInt(e.target.value) || 60)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Negative Marking</label>
                  <select
                    value={negativeMarking}
                    onChange={(e) => setNegativeMarking(parseFloat(e.target.value))}
                    className="input"
                  >
                    <option value={0}>0% (No penalty)</option>
                    <option value={0.25}>-25% (-1/4 penalty)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="label">Description / Instructions</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional tips, topics covered, or instructions for participants..."
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Questions Editor */}
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  2. Questions ({questions.length})
                </h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="btn-primary text-sm py-1.5 px-3"
                >
                  + Add Question
                </button>
              </div>

              {/* Question Navigation Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                      activeTab === idx
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Q{idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Question Form */}
              {currentQ && (
                <div className="space-y-6 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500 uppercase">
                      Editing Question {activeTab + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(activeTab)}
                        className="text-xs text-danger-500 hover:underline"
                      >
                        Delete Question
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="label">Question Text *</label>
                    <textarea
                      rows={3}
                      value={currentQ.text}
                      onChange={(e) => updateQuestion(activeTab, { text: e.target.value })}
                      placeholder="Type the question prompt here..."
                      className="input"
                      required
                    />
                  </div>

                  {/* Parameterized option checkbox */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isParameterized"
                      checked={currentQ.isParameterized}
                      onChange={(e) => updateQuestion(activeTab, { isParameterized: e.target.checked })}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <label htmlFor="isParameterized" className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Enable Parameterized Numbers (Anti-Cheat numeric variation)
                    </label>
                  </div>

                  {currentQ.isParameterized && (
                    <div>
                      <label className="label">Parameter Template</label>
                      <input
                        type="text"
                        value={currentQ.parameterTemplate || ''}
                        onChange={(e) => updateQuestion(activeTab, { parameterTemplate: e.target.value })}
                        placeholder="e.g. If {A} men can do work in {B} days..."
                        className="input"
                      />
                    </div>
                  )}

                  {/* 4 Multiple Choice Options */}
                  <div className="space-y-3">
                    <label className="label">Options (Mark the correct answer button)</label>
                    {currentQ.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateQuestion(activeTab, { correctAnswer: opt })}
                          className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center border text-sm transition-colors ${
                            currentQ.correctAnswer === opt && opt !== ''
                              ? 'bg-success-500 text-white border-success-600'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-primary-500'
                          }`}
                          title="Click to set as correct answer"
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...currentQ.options];
                            newOptions[optIdx] = e.target.value;
                            const isCorrect = currentQ.correctAnswer === opt;
                            updateQuestion(activeTab, {
                              options: newOptions,
                              correctAnswer: isCorrect ? e.target.value : currentQ.correctAnswer,
                            });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          className="input flex-1"
                          required
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 mt-1">
                      Click the letter button (A, B, C, D) on the left to set it as the correct answer (turns green).
                    </p>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="label">Explanation & Solution Step</label>
                    <textarea
                      rows={2}
                      value={currentQ.explanation}
                      onChange={(e) => updateQuestion(activeTab, { explanation: e.target.value })}
                      placeholder="Explain how to solve this question for the round result screen..."
                      className="input"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/quiz/explore" className="btn-secondary py-3 px-6">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary py-3 px-8 text-base font-semibold shadow-md"
              >
                {isSubmitting ? 'Saving Quiz & Generating Room...' : 'Save Quiz & Create Room'}
              </button>
            </div>
          </form>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
