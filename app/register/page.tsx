'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateRandomUser } from '@/lib/userGenerator';
import { logOnboardingVisit } from '@/lib/onboardingUtils';

export default function Register() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLetsGo = async () => {
    setIsStarting(true);
    setError(null);
    
    try {
      // Generate random user data first to get the name
      const randomUser = generateRandomUser();
      
      // Create a new survey in the database with userName
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: randomUser.fullName, // Save "Testador" or custom name to DB
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create survey');
      }

      const { survey } = await response.json();
      
      // Store user data and survey ID locally
      localStorage.setItem('currentUser', JSON.stringify(randomUser));
      localStorage.setItem('surveyId', survey.id);

      // Log that registration flow started
      logOnboardingVisit('register_start');

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to onboarding
      router.push('/onboarding1');
    } catch (err: unknown) {
      console.error('Erro ao criar usuário:', err);
      const message = err instanceof Error ? err.message : String(err ?? 'Erro ao criar usuário. Tente novamente.');
      setError(message);
      setIsStarting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6" style={{ background: 'linear-gradient(162.17deg, #80C2BA 0%, #FFFFFF 100%)' }}>
      <div className="max-w-2xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Pronto para testar nossa
          <br />
          <span className="text-teal-500">nova experiência?</span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-xl mx-auto">
          Estamos coletando insights para criar algo incrível. Sua interação nos ajuda a construir melhor.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-2xl max-w-xl mx-auto">
            <p className="font-medium">❌ {error}</p>
          </div>
        )}

        {/* Let's Go Button */}
        <button
          onClick={handleLetsGo}
          disabled={isStarting}
          className="bg-white hover:bg-gray-50 text-teal-400 text-2xl md:text-3xl font-bold py-6 px-16 rounded-full border-4 border-teal-300 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isStarting ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Iniciando...
            </span>
          ) : (
            "Vamos lá!"
          )}
        </button>

        {/* Info Text */}
        <p className="mt-8 text-sm text-gray-600 max-w-md mx-auto">
          Ao continuar, você está nos ajudando a entender o comportamento do usuário e melhorar a experiência. Todos os dados são anonimizados e usados apenas para fins de pesquisa.
        </p>
      </div>
    </div>
  );
}
