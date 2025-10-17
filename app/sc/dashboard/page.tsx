"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSurvey } from '@/contexts/SurveyContext';

interface Dose {
  id: string;
  name: string;
  time: string;
  notes: string;
  frequency: string;
  selectedDays: string[];
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { surveyData, updateSurveyData, addUserEvent, loading: contextLoading } = useSurvey();
  const [showAddDoseModal, setShowAddDoseModal] = useState(false);
  const [showAlarmInfoModal, setShowAlarmInfoModal] = useState(false);
  const [hasVisitedDosesList, setHasVisitedDosesList] = useState(false);
  const [ackCaptured, setAckCaptured] = useState(false);
  const [doses, setDoses] = useState<Dose[]>([]);

  // Separate effect for loading doses to avoid infinite loops
  // Use useMemo to create a stable stringified version for comparison
  const dosesFromContextStr = useMemo(() => {
    return JSON.stringify(surveyData?.doses || []);
  }, [surveyData?.doses]);

  useEffect(() => {
    if (contextLoading) return;
    
    const dosesFromContext = JSON.parse(dosesFromContextStr);
    
    // Fallback to localStorage if context is empty
    if (dosesFromContext.length === 0) {
      const dosesRaw = localStorage.getItem('doses') || '[]';
      const parsedDoses = JSON.parse(dosesRaw);
      setDoses(parsedDoses);
    } else {
      setDoses(dosesFromContext);
    }

    // Show alarm info modal ONLY if user has just added their FIRST dose
    const hasSeenAlarmInfo = localStorage.getItem('hasSeenAlarmInfo');
    const hasVisitedDosesPage = localStorage.getItem('hasEnteredDosesArea'); // Check if already visited
    const justAddedFirstDose = surveyData?.dosesAdded && dosesFromContext.length === 1;
    
    // Set if user has visited doses list before
    setHasVisitedDosesList(!!hasVisitedDosesPage);
    
    if (justAddedFirstDose && !hasSeenAlarmInfo) {
      setShowAlarmInfoModal(true);
    }
  }, [contextLoading, dosesFromContextStr, surveyData?.dosesAdded]);

  useEffect(() => {
    // Wait for context to finish loading
    if (contextLoading) return;
    
    // Check for survey data after loading is complete
    if (!surveyData?.surveyId) {
      router.push('/');
      return;
    }

    // Show the "add dose" prompt once per user (or until acknowledged)
    const promptShown = localStorage.getItem('addDosePromptShown');
    const acknowledgedAt = localStorage.getItem('addDosePromptAcknowledgedAt');
    
    // If not shown and not acknowledged, open the modal
    if (!promptShown && !acknowledgedAt) {
      setShowAddDoseModal(true);
      localStorage.setItem('addDosePromptShown', 'true');
    }

    // Track dashboard entries: first and second time only
    const hasFirstEntry = localStorage.getItem('firstDashboardEntryRecorded');
    const hasSecondEntry = localStorage.getItem('secondDashboardEntryRecorded');
    
    if (!hasFirstEntry) {
      // First time entering dashboard - save to DB only
      const now = new Date().toISOString();
      
      fetch(`/api/survey/${surveyData.surveyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstDashboardEntryAt: now,
        }),
      }).catch((error) => {
        console.error('Error recording first dashboard entry:', error);
      });

      localStorage.setItem('firstDashboardEntryRecorded', 'true');
    } else if (!hasSecondEntry && surveyData?.dosesAdded) {
      // Second time entering dashboard (after creating first dose) - save to DB only
      const now = new Date().toISOString();
      
      fetch(`/api/survey/${surveyData.surveyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secondDashboardEntryAt: now,
        }),
      }).catch((error) => {
        console.error('Error recording second dashboard entry:', error);
      });

      localStorage.setItem('secondDashboardEntryRecorded', 'true');
    }
  }, [router, surveyData, contextLoading]);

  const handleAcknowledgeAddDose = () => {
    const now = new Date().toISOString();
    localStorage.setItem('addDosePromptAcknowledgedAt', now);
    setShowAddDoseModal(false);
    setAckCaptured(true);
    
    // Add event through context
    addUserEvent({ type: 'addDose_prompt_acknowledged' });
  };

  const handleAcknowledgeAlarmInfo = () => {
    const now = new Date().toISOString();
    localStorage.setItem('hasSeenAlarmInfo', 'true');
    setShowAlarmInfoModal(false);
    
    // Save to database
    if (surveyData?.surveyId) {
      fetch(`/api/survey/${surveyData.surveyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alarmModalAcknowledgedAt: now,
        }),
      }).catch((error) => {
        console.error('Error recording alarm modal acknowledgment:', error);
      });
    }
  };  const handleNavigateToDoses = () => {
    // Just navigate, no extra tracking needed
    router.push('/sc/doses');
  };

  if (contextLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
        {/* Add Dose Modal */}
        {showAddDoseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-teal-700 mb-3">Próximo desafio!</h2>
              <p className="text-gray-700 mb-6">
                Adicione sua primeira dose ao sistema. Vamos medir quanto tempo leva para você descobrir como fazer isso! 😊
              </p>
              <button
                onClick={handleAcknowledgeAddDose}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition shadow-lg"
              >
                Entendi
              </button>
            </div>
          </div>
        )}

        {/* Alarm Info Modal */}
        {showAlarmInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex justify-center mb-4">
                <span className="text-6xl">⏰</span>
              </div>
              <h2 className="text-2xl font-bold text-teal-700 mb-3 text-center">Alarmes Ativados!</h2>
              <p className="text-gray-700 mb-4 text-center">
                Ótimo trabalho! Você cadastrou suas doses com sucesso.
              </p>
              
              {!hasVisitedDosesList ? (
                // Version 1: Mission mode - user hasn't visited doses list yet
                <>
                  <p className="text-gray-600 mb-6 text-center text-sm">
                    A partir de agora, alarmes soarão a qualquer momento nos horários das suas medicações. 
                    <span className="font-semibold text-teal-600"> Missão:</span> Visite suas <span className="font-semibold text-teal-600">Doses Cadastradas</span> para confirmar e ativar o sistema de lembretes.
                  </p>
                  <button
                    onClick={handleAcknowledgeAlarmInfo}
                    className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition shadow-lg"
                  >
                    Ir para Doses Cadastradas
                  </button>
                </>
              ) : (
                // Version 2: Info only - user already visited doses list
                <>
                  <p className="text-gray-600 mb-6 text-center text-sm">
                    A partir de agora, alarmes soarão a qualquer momento nos horários das suas medicações. 
                    Fique atento aos lembretes!
                  </p>
                  <button
                    onClick={handleAcknowledgeAlarmInfo}
                    className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition shadow-lg"
                  >
                    Entendi
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Greeting Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-teal-700">Olá, {surveyData?.userName || 'Testador'}!</h1>
          <p className="text-sm text-teal-500 mt-1"> Adicione sua primeira dose ao sistema!</p>
          {surveyData?.dosesAdded && (
            <div className="mt-3">
              <span className="inline-block bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                Dose adicionada ✅
              </span>
            </div>
          )}
        </header>
      </div>
      <div>
        {/* Example with two static circles */}
        <div className="relative h-64 w-64 rounded-full flex items-center justify-center mx-auto my-8">
          <svg width={256} height={256} className="transform -rotate-90">
            {/* Full background circle (colorA) */}
            <circle
              stroke="#bae6fd"
              fill="transparent"
              strokeWidth={20}
              r={108}
              cx={128}
              cy={128}
            />
            {/* Partial progress circle (colorB), 75% */}
            <circle
              stroke="#06b6d4"
              fill="transparent"
              strokeWidth={20}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 108}
              strokeDashoffset={2 * Math.PI * 108 * 0.25}
              r={108}
              cx={128}
              cy={128}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          {/* Centered number */}
          <span className="absolute text-5xl font-semibold text-gray-700 select-none">
            75%
          </span>
        </div>

        {/* Próxima dose card */}
        <div className="bg-white rounded-2xl p-4 shadow-md mb-8">
          <h2 className="text-teal-700 font-semibold text-lg mb-2">Próxima dose</h2>
          {doses.length > 0 ? (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white text-xl shadow">
                  💊
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{doses[0].name}</p>
                  <p className="text-sm text-gray-500">{doses[0].time}</p>
                </div>
              </div>
              <button className="text-teal-600 font-medium hover:underline">Tomar</button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhuma medicação cadastrada ainda</p>
          )}
        </div>

        {/* Minha rotina section */}
        <section className="mb-8">
          <h2 className="text-teal-700 font-semibold text-lg mb-3">Minha rotina</h2>
          <p className="text-sm text-teal-600 mb-2">75% concluído</p>
          <div className="w-full h-4 bg-teal-200 rounded-full overflow-hidden">
            <div className="h-4 bg-teal-600 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </section>

        {/* Acesso rápido section */}
        <section className="mb-8">
          <h2 className="text-teal-700 font-semibold text-lg mb-4">Acesso rápido</h2>
          <div className="flex justify-between gap-4">
            <Link
              href="/sc/doses/new"
              className="flex flex-col items-center bg-white rounded-2xl shadow-md p-4 flex-1 hover:shadow-lg transition cursor-pointer"
              style={{ zIndex: 10, pointerEvents: 'auto' }}
              onClick={() => {
                console.log('Link clicked, navigating to /sc/doses/new');
              }}
            >
              <span className="text-3xl mb-2">💊</span>
              <span className="text-teal-700 font-medium">Remédios</span>
            </Link>
            <button className="flex flex-col items-center bg-white rounded-2xl shadow-md p-4 flex-1 hover:shadow-lg transition">
              <span className="text-3xl mb-2">📊</span>
              <span className="text-teal-700 font-medium">Histórico</span>
            </button>
          </div>
        </section>

        {/* Minha semana section */}
        <section className="mb-8">
          <h2 className="text-teal-700 font-semibold text-lg mb-4">Minha semana</h2>
          <div className="flex justify-between max-w-md mx-auto">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${
                  day === 5
                    ? 'bg-teal-600 text-white font-semibold shadow-lg'
                    : 'bg-white text-teal-600 font-medium shadow'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </section>

        {/* Medicação Próxima list */}
        <section className="mb-8 flex-1 overflow-auto">
          <h2 className="text-teal-700 font-semibold text-lg mb-4">Minhas Medicações</h2>
          {doses.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center">
              <span className="text-4xl mb-2 block">💊</span>
              <p className="text-gray-500 mb-4">Nenhuma medicação cadastrada</p>
              <Link
                href="/sc/doses/new"
                className="inline-block bg-teal-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-teal-700 transition"
              >
                Adicionar primeira medicação
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {doses.slice(0, 4).map((dose) => (
                  <li key={dose.id} className="bg-white rounded-2xl p-4 shadow flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white text-xl shadow">
                        💊
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{dose.name}</p>
                        <p className="text-sm text-gray-500">{dose.time}</p>
                      </div>
                    </div>
                    <input type="checkbox" className="w-5 h-5 text-teal-600 rounded" />
                  </li>
                ))}
              </ul>
              <Link 
                href="/sc/doses"
                className="mt-6 block w-full text-center text-teal-600 font-semibold hover:underline"
              >
                Ver todas ({doses.length})
              </Link>
            </>
          )}
        </section>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around shadow-inner">
          <button 
            onClick={() => {
              console.log('Bottom nav Início button clicked');
              router.push('/sc/dashboard');
            }}
            className="flex flex-col items-center text-teal-600 font-semibold cursor-pointer"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs mt-1">Início</span>
          </button>
          <button 
            onClick={() => {
              console.log('Bottom nav Remédios button clicked');
              router.push('/sc/doses/new');
            }}
            className="flex flex-col items-center text-gray-400 hover:text-teal-600 transition cursor-pointer"
          >
            <span className="text-2xl">💊</span>
            <span className="text-xs mt-1">Remédios</span>
          </button>
          <button 
            onClick={() => {
              console.log('Bottom nav Perfil button clicked');
              // You can add navigation to profile page here when it exists
              // router.push('/sc/profile');
            }}
            className="flex flex-col items-center text-gray-400 hover:text-teal-600 transition cursor-pointer"
          >
            <span className="text-2xl">👤</span>
            <span className="text-xs mt-1">Perfil</span>
          </button>
        </nav>
      </div>
    </>
  );
}
