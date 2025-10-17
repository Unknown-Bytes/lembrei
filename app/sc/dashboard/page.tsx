"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSurvey } from '@/contexts/SurveyContext';
import { Pill, BarChart3, User, Home, Bell, Target, Clock, CheckCircle2, Plus } from 'lucide-react';

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

  const dosesFromContextStr = useMemo(() => {
    return JSON.stringify(surveyData?.doses || []);
  }, [surveyData?.doses]);

  useEffect(() => {
    if (contextLoading) return;
    
    const dosesFromContext = JSON.parse(dosesFromContextStr);
    
    if (dosesFromContext.length === 0) {
      const dosesRaw = localStorage.getItem('doses') || '[]';
      const parsedDoses = JSON.parse(dosesRaw);
      setDoses(parsedDoses);
    } else {
      setDoses(dosesFromContext);
    }

    const hasSeenAlarmInfo = localStorage.getItem('hasSeenAlarmInfo');
    const hasVisitedDosesPage = localStorage.getItem('hasEnteredDosesArea');
    const justAddedFirstDose = surveyData?.dosesAdded && dosesFromContext.length === 1;
    
    setHasVisitedDosesList(!!hasVisitedDosesPage);
    
    if (justAddedFirstDose && !hasSeenAlarmInfo) {
      setShowAlarmInfoModal(true);
    }
  }, [contextLoading, dosesFromContextStr, surveyData?.dosesAdded]);

  useEffect(() => {
    if (contextLoading) return;
    
    if (!surveyData?.surveyId) {
      router.push('/');
      return;
    }

    const promptShown = localStorage.getItem('addDosePromptShown');
    const acknowledgedAt = localStorage.getItem('addDosePromptAcknowledgedAt');
    
    if (!promptShown && !acknowledgedAt) {
      setShowAddDoseModal(true);
      localStorage.setItem('addDosePromptShown', 'true');
    }

    const hasFirstEntry = localStorage.getItem('firstDashboardEntryRecorded');
    const hasSecondEntry = localStorage.getItem('secondDashboardEntryRecorded');
    
    if (!hasFirstEntry) {
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
    
    addUserEvent({ type: 'addDose_prompt_acknowledged' });
  };

  const handleAcknowledgeAlarmInfo = () => {
    const now = new Date().toISOString();
    localStorage.setItem('hasSeenAlarmInfo', 'true');
    setShowAlarmInfoModal(false);
    
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
  };

  const handleNavigateToDoses = () => {
    router.push('/sc/doses');
  };

  if (contextLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-teal-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Add Dose Modal */}
        {showAddDoseModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
              <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-teal-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Próximo desafio!</h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Adicione sua primeira dose ao sistema. Vamos medir quanto tempo leva para você descobrir como fazer isso!
              </p>
              <button
                onClick={handleAcknowledgeAddDose}
                className="w-full bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}

        {/* Alarm Info Modal */}
        {showAlarmInfoModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Alarmes Ativados!</h2>
              <p className="text-sm text-gray-700 mb-3 text-center">
                Ótimo trabalho! Você cadastrou suas doses com sucesso.
              </p>
              
              {!hasVisitedDosesList ? (
                <>
                  <p className="text-xs text-gray-600 mb-6 text-center">
                    A partir de agora, alarmes soarão a qualquer momento nos horários das suas medicações. 
                    <span className="font-medium text-teal-600"> Missão:</span> Visite suas <span className="font-medium text-teal-600">Doses Cadastradas</span> para confirmar e ativar o sistema de lembretes.
                  </p>
                  <button
                    onClick={handleAcknowledgeAlarmInfo}
                    className="w-full bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
                  >
                    Ir para Doses Cadastradas
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-600 mb-6 text-center">
                    A partir de agora, alarmes soarão a qualquer momento nos horários das suas medicações. 
                    Fique atento aos lembretes!
                  </p>
                  <button
                    onClick={handleAcknowledgeAlarmInfo}
                    className="w-full bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
                  >
                    Entendi
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Olá, {surveyData?.userName || 'Testador'}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Gerencie suas medicações</p>
            </div>
            <button className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {!surveyData?.dosesAdded && (
            <div className="mt-4 bg-teal-50 border border-teal-100 rounded-lg px-4 py-3 flex items-start gap-3">
              <Target className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-teal-900">Adicione sua primeira dose ao sistema</p>
            </div>
          )}
          
          {surveyData?.dosesAdded && (
            <div className="mt-4 bg-green-50 border border-green-100 rounded-lg px-4 py-3 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-900">Primeira dose adicionada com sucesso</p>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="px-6 mt-6">
          {/* Progress Circle */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-6">Progresso de Hoje</h2>
            <div className="flex items-center justify-between">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg width={128} height={128} className="transform -rotate-90">
                  <circle
                    stroke="#e5e7eb"
                    fill="transparent"
                    strokeWidth={12}
                    r={52}
                    cx={64}
                    cy={64}
                  />
                  <circle
                    stroke="#0d9488"
                    fill="transparent"
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * 0.25}
                    r={52}
                    cx={64}
                    cy={64}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-gray-900">
                  75%
                </span>
              </div>
              <div className="flex-1 ml-8">
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">3 de 4</p>
                    <p className="text-sm text-gray-500">doses tomadas</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Próxima em 2h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Dose Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Próxima Dose</p>
            {doses.length > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                    <Pill className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doses[0].name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-sm text-gray-500">{doses[0].time}</p>
                    </div>
                  </div>
                </div>
                <button className="w-full bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition">
                  Marcar como tomada
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">Nenhuma medicação cadastrada</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/sc/doses/new"
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-600 hover:bg-teal-50 transition group"
              >
                <Pill className="w-5 h-5 text-gray-600 group-hover:text-teal-600 mb-3" />
                <p className="text-sm font-medium text-gray-900">Nova Dose</p>
                <p className="text-xs text-gray-500 mt-0.5">Adicionar medicação</p>
              </Link>
              
              <button className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-50 transition group">
                <BarChart3 className="w-5 h-5 text-gray-600 group-hover:text-gray-900 mb-3" />
                <p className="text-sm font-medium text-gray-900">Histórico</p>
                <p className="text-xs text-gray-500 mt-0.5">Ver estatísticas</p>
              </button>
            </div>
          </div>

          {/* Week Calendar */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Esta Semana</h2>
            <div className="flex justify-between">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">{day}</span>
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition ${
                      index === 4
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medications List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-700">Minhas Medicações</h2>
              {doses.length > 0 && (
                <Link href="/sc/doses" className="text-xs text-teal-600 font-medium hover:text-teal-700">
                  Ver todas ({doses.length})
                </Link>
              )}
            </div>
            
            {doses.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Pill className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-4">Nenhuma medicação cadastrada</p>
                <Link
                  href="/sc/doses/new"
                  className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar primeira medicação
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {doses.slice(0, 4).map((dose) => (
                  <div key={dose.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-gray-300 transition">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Pill className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{dose.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500">{dose.time}</p>
                        </div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-2 focus:ring-teal-500 cursor-pointer" 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around">
          <button 
            onClick={() => router.push('/sc/dashboard')}
            className="flex flex-col items-center gap-1.5 py-1"
          >
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-teal-600">Início</span>
          </button>
          
          <button 
            onClick={() => router.push('/sc/doses')}
            className="flex flex-col items-center gap-1.5 py-1"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition">
              <Pill className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Remédios</span>
          </button>
          
          <button className="flex flex-col items-center gap-1.5 py-1">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Perfil</span>
          </button>
        </nav>
      </div>
    </>
  );
}