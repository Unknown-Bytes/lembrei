'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSurvey } from '@/contexts/SurveyContext';
import { CheckCircle2, Star, Send, MessageSquare } from 'lucide-react';
import { useEnhancedTracking } from '@/lib/services/enhancedTrackingService';

const questions = [
  {
    id: 1,
    title: 'Facilidade de uso',
    text: 'O app foi fácil de entender e navegar.',
    type: 'rating' as const,
  },
  {
    id: 2,
    title: 'Clareza das instruções',
    text: 'As instruções para cadastrar e confirmar doses foram claras.',
    type: 'rating' as const,
  },
  {
    id: 3,
    title: 'Rapidez percebida',
    text: 'Consegui realizar as tarefas no tempo que esperava sem dificuldades.',
    type: 'rating' as const,
  },
  {
    id: 4,
    title: 'Confiança no uso',
    text: 'Senti-me seguro(a) usando o app para registrar meus medicamentos.',
    type: 'rating' as const,
  },
  {
    id: 5,
    title: 'Intenção de uso futuro',
    text: 'Eu usaria este app para gerenciar minha rotina de medicamentos regularmente.',
    type: 'rating' as const,
  },
  {
    id: 6,
    title: 'Faltou alguma coisa?',
    text: 'Houve alguma funcionalidade ou informação que você sentiu falta enquanto usava o app? Explique.',
    type: 'text' as const,
  },
];

export default function FeedbackPage() {
  const router = useRouter();
  const { surveyData } = useSurvey();
  const tracking = useEnhancedTracking();
  const [showIntro, setShowIntro] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<number, Date>>({});

  useEffect(() => {
    if (!showIntro && !startTime) {
      const now = new Date();
      setStartTime(now);
      setQuestionStartTimes({ [questions[0].id]: now });
      
      // Track feedback started
      tracking.trackEvent('feedback_started' as any, {
        totalQuestions: questions.length,
      });
    }
  }, [showIntro, startTime, tracking]);

  const handleStartQuestions = () => {
    setShowIntro(false);
  };

  const handleRatingAnswer = (rating: number) => {
    const questionId = questions[currentQuestion].id;
    const timeSpent = questionStartTimes[questionId] 
      ? new Date().getTime() - questionStartTimes[questionId].getTime()
      : 0;
    
    setAnswers({ ...answers, [questionId]: rating });
    
    // Track answer
    tracking.trackFeedbackAnswer(questionId, rating, {
      questionTitle: questions[currentQuestion].title,
      timeSpent,
    });
    
    moveToNext();
  };

  const handleTextAnswer = (text: string) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: text });
  };

  const moveToNext = () => {
    if (currentQuestion < questions.length - 1) {
      const nextIndex = currentQuestion + 1;
      setQuestionStartTimes({
        ...questionStartTimes,
        [questions[nextIndex].id]: new Date(),
      });
      
      setTimeout(() => {
        setCurrentQuestion(nextIndex);
      }, 300);
    }
  };

  const handleSubmit = async () => {
    const endTime = new Date();
    const timeToComplete = startTime ? endTime.getTime() - startTime.getTime() : 0;
    
    // Save feedback to localStorage (backup)
    const feedback = {
      timestamp: endTime.toISOString(),
      answers,
      timeToComplete,
    };
    
    const existingFeedback = localStorage.getItem('userFeedback');
    const feedbackList = existingFeedback ? JSON.parse(existingFeedback) : [];
    feedbackList.push(feedback);
    localStorage.setItem('userFeedback', JSON.stringify(feedbackList));

    // Send to database
    if (surveyData?.surveyId) {
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surveyId: surveyData.surveyId,
            answers,
            timestamp: endTime.toISOString(),
            timeToComplete,
          }),
        });

        if (!response.ok) {
          console.error('Failed to save feedback to database');
        } else {
          // Track successful submission
          tracking.trackEvent('feedback_submitted' as any, {
            totalQuestions: questions.length,
            answeredQuestions: Object.keys(answers).length,
            timeToComplete,
          });
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
      }
    }

    setIsComplete(true);

    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      router.push('/sc/dashboard');
    }, 3000);
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Introduction Screen
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Parabéns!
            </h1>
            <p className="text-lg text-gray-600">
              Você completou a experiência inicial
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Obrigado por experimentar!
            </h2>
            <div className="space-y-3 text-gray-600">
              <p>
                Esperamos que você tenha tido uma boa primeira impressão do nosso sistema de lembretes de medicação.
              </p>
              <p>
                Sua opinião é extremamente valiosa para nós! Gostaríamos de entender melhor sua experiência para tornar o aplicativo cada vez mais útil e agradável de usar.
              </p>
              <p className="font-medium text-gray-700">
                Pode nos ajudar respondendo algumas perguntas rápidas? Levará apenas 1 minuto.
              </p>
            </div>
          </div>

          <button
            onClick={handleStartQuestions}
            className="w-full bg-teal-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-teal-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Star className="w-5 h-5" />
            Começar avaliação rápida
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Suas respostas são anônimas e nos ajudam muito
          </p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Obrigado pelo seu feedback!
          </h1>
          <p className="text-gray-600 text-lg">
            Sua opinião nos ajuda a melhorar a experiência para todos.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Redirecionando para o painel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-6 mb-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Avaliação da Experiência
          </h1>
          <p className="text-sm text-gray-500">
            Suas respostas nos ajudam a criar uma experiência melhor
          </p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto px-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">
            Pergunta {currentQuestion + 1} de {questions.length}
          </span>
          <span className="text-sm text-gray-500 ml-auto">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Question Title */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">
              {currentQ.title}
            </p>
            <h2 className="text-lg font-medium text-gray-900">
              {currentQ.text}
            </h2>
          </div>

          {/* Rating Type */}
          {currentQ.type === 'rating' && (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                <span>Discordo totalmente</span>
                <span>Concordo totalmente</span>
              </div>
              <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingAnswer(rating)}
                    className={`flex-1 py-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                      answers[currentQ.id] === rating
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        answers[currentQ.id] === rating
                          ? 'text-teal-600 fill-teal-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <span className={`text-sm font-medium ${
                      answers[currentQ.id] === rating
                        ? 'text-teal-600'
                        : 'text-gray-600'
                    }`}>
                      {rating}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Type */}
          {currentQ.type === 'text' && (
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <MessageSquare className="w-4 h-4" />
                <span>Sua resposta (opcional)</span>
              </div>
              <textarea
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleTextAnswer(e.target.value)}
                placeholder="Compartilhe seus pensamentos aqui..."
                className="w-full h-32 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={handleSubmit}
                className="mt-4 w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Enviar Avaliação
              </button>
            </div>
          )}

          {/* Skip Button for non-text questions */}
          {currentQ.type !== 'text' && (
            <button
              onClick={moveToNext}
              className="mt-6 w-full text-gray-500 hover:text-gray-700 py-2 text-sm transition-colors"
            >
              Pular pergunta
            </button>
          )}
        </div>

        {/* Helper Text */}
        <p className="text-center text-gray-500 text-sm mt-4">
          Suas respostas são anônimas e nos ajudam muito
        </p>
      </div>
    </div>
  );
}
