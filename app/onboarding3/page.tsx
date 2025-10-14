"use client";

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { logOnboardingVisit, validateCurrentUser } from '@/lib/onboardingUtils';

export default function Onboarding3() {
  const router = useRouter();

  useEffect(() => {
    // Check if user exists
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      router.push('/');
      return;
    }
    logOnboardingVisit('onboarding3_view');

    const validation = validateCurrentUser();
    if (!validation.ok) {
      console.warn('currentUser validation issues:', validation.issues);
    }
  }, [router]);

  const handleNext = () => {
    router.push('/onboarding4');
  };

  const handleBack = () => {
    router.push('/onboarding2');
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white px-6 py-8">
      <div className="w-full max-w-md flex flex-col justify-between min-h-[600px]">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-12 h-1.5 bg-teal-500 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-teal-500 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-teal-500 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full transition-all"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center space-y-6 animate-fadeIn">
          <div className="text-center space-y-6">
            <div className="mb-6 flex justify-center">
              <div className="bg-white p-6 rounded-3xl shadow-md">
                <Image
                  src="/put_thisOnOnboarding3.png"
                  alt="Ilustração de adicionar medicamentos"
                  width={200}
                  height={200}
                  priority
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Adicione seus
              <br />
              medicamentos 💊
            </h1>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-sm mx-auto">
              Registre seus medicamentos com horários e instruções simples. Nós o lembraremos na hora certa.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-3 mt-8">
          <button
            onClick={handleNext}
            className="w-full bg-teal-500 text-white text-lg font-semibold py-4 rounded-2xl shadow-lg hover:bg-teal-600 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            aria-label="Ir para próxima etapa"
          >
            Continuar
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

