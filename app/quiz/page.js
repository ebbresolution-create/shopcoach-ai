'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

const INITIAL_QUESTIONS = [
  {
    id: 'q1',
    question: 'What best describes your TikTok Shop experience?',
    options: ['Complete beginner', 'Posted a few videos but no sales yet', 'Getting some sales but inconsistent', 'Making steady sales, want to scale'],
  },
  {
    id: 'q2',
    question: 'What niche are you most interested in?',
    options: ['Beauty & Skincare', 'Health & Supplements', 'Home & Lifestyle', 'Fashion & Accessories', 'Tech & Gadgets', 'Other'],
  },
  {
    id: 'q3',
    question: 'What is your biggest challenge right now?',
    options: ['Finding the right products', 'Creating content that converts', 'Getting views', 'Understanding commissions', 'All of the above'],
  },
  {
    id: 'q4',
    question: 'How much time can you dedicate daily?',
    options: ['Less than 1 hour', '1-2 hours', '2-4 hours', 'Full-time (4+ hours)'],
  },
  {
    id: 'q5',
    question: 'What is your monthly revenue goal?',
    options: ['$500 - $1,000', '$1,000 - $3,000', '$3,000 - $10,000', '$10,000+'],
  },
];

export default function QuizPage() {
  const [phase, setPhase] = useState('initial');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [adaptiveIdx, setAdaptiveIdx] = useState(0);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnswer = async (answer) => {
    const currentQuestion = phase === 'initial' ? INITIAL_QUESTIONS[currentQ] : adaptiveQuestions[adaptiveIdx];
    const newAnswers = [...answers, { question: currentQuestion.question, answer }];
    setAnswers(newAnswers);

    if (phase === 'initial') {
      if (currentQ < INITIAL_QUESTIONS.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        setIsLoading(true);
        try {
          const resp = await fetch('/api/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: newAnswers, phase: 'adaptive' }),
          });
          const data = await resp.json();
          if (data.success && data.data.questions) {
            setAdaptiveQuestions(data.data.questions);
            setPhase('adaptive');
          } else {
            fetchResults(newAnswers);
          }
        } catch (e) {
          fetchResults(newAnswers);
        } finally {
          setIsLoading(false);
        }
      }
    } else if (phase === 'adaptive') {
      if (adaptiveIdx < adaptiveQuestions.length - 1) {
        setAdaptiveIdx(adaptiveIdx + 1);
      } else {
        fetchResults(newAnswers);
      }
    }
  };

  const fetchResults = async (allAnswers) => {
    setIsLoading(true);
    setPhase('results');
    try {
      const resp = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: allAnswers, phase: 'results' }),
      });
      const data = await resp.json();
      if (data.success) setResults(data.data);
    } catch (err) {
      console.error('Results error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestion = () => {
    const q = phase === 'initial' ? INITIAL_QUESTIONS[currentQ] : adaptiveQuestions[adaptiveIdx];
    if (!q) return null;
    const total = phase === 'initial' ? INITIAL_QUESTIONS.length : INITIAL_QUESTIONS.length + adaptiveQuestions.length;
    const current = phase === 'initial' ? currentQ + 1 : INITIAL_QUESTIONS.length + adaptiveIdx + 1;
    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between text-xs text-[#64748b] mb-2">
            <span>Question {current} of ~{total}</span>
            <span>{Math.round((current / total) * 100)}%</span>
          </div>
          <div className="w-full bg-[#1e2a3a] rounded-full h-2">
            <div className="bg-gradient-to-r from-[#00f5d4] to-[#0ea5e9] h-2 rounded-full transition-all duration-500" style={{ width: (current / total * 100) + '%' }} />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#e2e8f0] mb-6">{q.question}</h2>
        <div className="space-y-3">
          {q.options.map((opt, idx) => (
            <button key={idx} onClick={() => handleAnswer(opt)} className="w-full text-left p-4 bg-[#0d1117] border border-[#1e2a3a] rounded-lg text-[#e2e8f0] hover:bg-[#1e2a3a] hover:border-[#00f5d4] transition-all duration-200">
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!results) return null;
    const r = results;
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {r.creatorType && (
          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-lg p-6 text-center">
            <div className="text-5xl mb-3">{r.creatorType.emoji}</div>
            <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">{r.creatorType.name}</h2>
            <p className="text-[#64748b]">{r.creatorType.description}</p>
          </div>
        )}
        {r.scores && (
          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-lg p-6">
            <h3 className="text-lg font-bold text-[#e2e8f0] mb-4">Your Scores</h3>
            {Object.entries(r.scores).map(([key, val]) => (
              <div key={key} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#e2e8f0] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-[#00f5d4] font-semibold">{val}/100</span>
                </div>
                <div className="w-full bg-[#1e2a3a] rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#00f5d4] to-[#0ea5e9] h-2 rounded-full" style={{ width: val + '%' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {r.coachAdvice && (
          <div className="bg-[#0d1117] border-l-2 border-[#00f5d4] rounded-lg p-6">
            <h3 className="text-lg font-bold text-[#e2e8f0] mb-2">Coach Advice</h3>
            <p className="text-[#e2e8f0]">{r.coachAdvice}</p>
          </div>
        )}
        <div className="text-center pt-4">
          <a href="/" className="inline-block py-3 px-8 rounded-full bg-gradient-to-r from-[#00f5d4] to-[#0ea5e9] text-[#080b10] font-semibold hover:shadow-lg hover:shadow-[#00f5d4]/20 transition-all duration-200">
            Start Coaching Session
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#080b10] flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2 mb-10">
        <ShoppingBag className="w-7 h-7 text-white" />
        <span className="text-xl font-bold text-white">Shop<span className="text-[#00f5d4]">Coach</span></span>
        <span className="text-sm font-semibold text-[#00f5d4]">AI</span>
      </div>
      {isLoading ? (
        <div className="text-center">
          <div className="flex gap-2 justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-[#00f5d4] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 rounded-full bg-[#00f5d4] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 rounded-full bg-[#00f5d4] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-[#64748b]">{phase === 'results' ? 'Building your Creator DNA Profile...' : 'Analyzing your answers...'}</p>
        </div>
      ) : phase === 'results' && results ? renderResults() : renderQuestion()}
    </div>
  );
}
