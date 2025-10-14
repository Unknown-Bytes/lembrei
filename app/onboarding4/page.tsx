"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { logOnboardingVisit } from '@/lib/onboardingUtils';

export default function Onboarding4() {
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const surveyId = localStorage.getItem('surveyId');
    if (!surveyId) {
      router.push('/');
      return;
    }
    logOnboardingVisit('onboarding4_view');
  }, [router]);

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      const surveyId = localStorage.getItem('surveyId');
      
      if (surveyId) {
        await fetch(`/api/survey/${surveyId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            onboardingCompletedAt: new Date().toISOString(),
          }),
        });

        logOnboardingVisit('onboarding4_completed');
      }
    } catch (error) {
      console.error('Erro ao marcar onboarding como concluído:', error);
      logOnboardingVisit('onboarding4_error');
    }

    router.push('/sc/dashboard');
  };

  const handleBack = () => {
    router.push('/onboarding3');
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white px-6 py-8">
      <div className="w-full max-w-md flex flex-col justify-between min-h-[600px]">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-12 h-1.5 bg-teal-500 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-teal-500 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-teal-500 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-teal-500 rounded-full transition-all"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center space-y-6 animate-fadeIn">
          <div className="text-center space-y-6">
            <div className="mb-6 flex justify-center">
              <div className="bg-white p-6 rounded-3xl shadow-md">
                <Image
                  src="/put_thisOnOnboarding4.png"
                  alt="Ilustração de lembretes inteligentes"
                  width={200}
                  height={200}
                  priority
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Receba lembretes
              <br />
              inteligentes 🔔
            </h1>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-sm mx-auto">
              Nunca perca uma dose. Enviaremos alertas e notificaremos um contato de confiança se você esquecer.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-3 mt-8">
          <button
            onClick={handleFinish}
            disabled={isFinishing}
            className="w-full bg-teal-500 text-white text-lg font-semibold py-4 rounded-2xl shadow-lg hover:bg-teal-600 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
            aria-label={isFinishing ? 'Finalizando' : 'Concluir onboarding'}
          >
            {isFinishing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Finalizando...
              </span>
            ) : 'Começar! 🚀'}
          </button>
          
          <div className="flex items-center justify-center">
            <button
              onClick={handleBack}
              type="button"
              className="text-gray-500 hover:text-gray-700 font-medium transition-colors flex items-center gap-1"
              aria-label="Voltar para etapa anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
