'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logOnboardingVisit, validateCurrentUser } from '@/lib/onboardingUtils';

export default function Onboarding2() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      router.push('/');
      return;
    }
    logOnboardingVisit('onboarding2_view');

    const validation = validateCurrentUser();
    if (!validation.ok) {
      console.warn('currentUser validation issues:', validation.issues);
    }
  }, [router]);

  const handleNext = async () => {
    setIsLoading(true);

    try {
      // Get current user data
      const userData = localStorage.getItem('currentUser');
      const surveyId = localStorage.getItem('surveyId');
      
      if (!userData || !surveyId) {
        throw new Error('Dados não encontrados');
      }

      const user = JSON.parse(userData);

      // Update survey with the name (if provided)
      if (name.trim()) {
        await fetch(`/api/survey/${surveyId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userName: name.trim(),
          }),
        });

        // Store the name locally for display
        user.name = name.trim();
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('userDisplayName', name.trim());
        logOnboardingVisit('onboarding2_name_saved');
      }

      // Navigate to final onboarding step
      router.push('/onboarding3');
    } catch (error) {
      console.error('Erro ao salvar nome:', error);
      // Still navigate to next step even if save fails
      logOnboardingVisit('onboarding2_error');
      router.push('/onboarding3');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    logOnboardingVisit('onboarding2_skipped');
    router.push('/onboarding3');
  };

  const handleBack = () => {
    router.push('/onboarding1');
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white px-6 py-8">
      <div className="w-full max-w-md flex flex-col justify-between min-h-[600px]">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-12 h-1.5 bg-teal-500 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-teal-500 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full transition-all"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center space-y-6 animate-fadeIn">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight text-center">
              Como devemos
              <br />
              te chamar?
            </h1>
            <p className="text-base md:text-lg text-gray-600 mb-8 text-center leading-relaxed">
              Diga seu nome para personalizar sua experiência. Você pode pular esta etapa se preferir.
            </p>

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-left">
                Nome (opcional)
              </label>
              <input
                id="name"
                type="text"
                placeholder="Digite seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleNext();
                  }
                }}
                className="w-full px-5 py-4 bg-white rounded-2xl border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all shadow-sm text-lg"
                maxLength={50}
                autoFocus
                inputMode="text"
                autoComplete="name"
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-3 mt-8">
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="w-full bg-teal-500 text-white text-lg font-semibold py-4 rounded-2xl shadow-lg hover:bg-teal-600 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
            aria-label={isLoading ? 'Salvando' : 'Continuar para próxima etapa'}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </span>
            ) : 'Continuar'}
          </button>
          
          <div className="flex items-center justify-between">
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
            <button
              onClick={handleSkip}
              type="button"
              className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
              aria-label="Pular esta etapa"
            >
              Pular
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}