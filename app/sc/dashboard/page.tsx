"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSurvey } from '@/contexts/SurveyContext';
import { useEnhancedTracking } from '@/lib/services/enhancedTrackingService';
import { Pill, BarChart3, User, Home, Bell, Target, Clock, CheckCircle2, Plus } from 'lucide-react';
import Image from 'next/image';

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
  const tracking = useEnhancedTracking();
  const [hasVisitedDosesList, setHasVisitedDosesList] = useState(false);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [takenDoses, setTakenDoses] = useState<string[]>([]); // Array of dose IDs taken today
  const [countdown, setCountdown] = useState<number>(5);

  // Load taken doses for today from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const takenKey = `takenDoses_${today}`;
    const taken = JSON.parse(localStorage.getItem(takenKey) || '[]');
    setTakenDoses(taken);
  }, []);

  const markDoseAsTaken = (doseId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const takenKey = `takenDoses_${today}`;
    
    const updatedTaken = [...takenDoses, doseId];
    setTakenDoses(updatedTaken);
    localStorage.setItem(takenKey, JSON.stringify(updatedTaken));
    
    const dose = doses.find(d => d.id === doseId);
    
    // Track event (legacy)
    addUserEvent({
      type: 'dose_marked_taken',
      doseId,
      timestamp: new Date().toISOString(),
    });

    // Enhanced tracking
    tracking.trackDoseTaken(doseId, {
      doseName: dose?.name,
      markedAt: new Date().toISOString(),
      source: 'dashboard',
    });

    // Save to dose history API
    if (surveyData?.surveyId && dose) {
      fetch('/api/dose-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: surveyData.surveyId,
          doseId,
          action: 'taken',
          scheduledTime: dose.time,
          actualTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          source: 'dashboard',
        }),
      }).catch(err => console.error('Error saving dose history:', err));
    }
  };

  // Calculate today's doses and progress
  const getTodaysDoses = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // "2025-10-17"
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    
    console.log('[Dashboard] Calculating today\'s doses for:', today, dayOfWeek);
    
    return doses.filter(dose => {
      // Validate date range (startDate and endDate)
      if (dose.startDate && today < dose.startDate) {
        console.log(`[Dashboard] Dose ${dose.name} not started yet (starts: ${dose.startDate})`);
        return false;
      }
      if (dose.endDate && today > dose.endDate) {
        console.log(`[Dashboard] Dose ${dose.name} expired (ended: ${dose.endDate})`);
        return false;
      }
      
      // Check if dose is active today based on frequency
      if (dose.frequency === 'daily') {
        return true;
      } else if (dose.frequency === 'weekly') {
        // Normalize to lowercase for comparison
        const normalizedDays = dose.selectedDays.map((d: string) => d.toLowerCase());
        return normalizedDays.includes(dayOfWeek);
      }
      return false;
    });
  }, [doses, new Date().toDateString()]); // Re-calculate when date changes

  const todayProgress = useMemo(() => {
    const totalDoses = getTodaysDoses.length;
    if (totalDoses === 0) return { taken: 0, total: 0, percentage: 0 };
    
    // Count how many of today's doses have been taken
    const takenCount = getTodaysDoses.filter(dose => takenDoses.includes(dose.id)).length;
    const percentage = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 0;
    
    return { taken: takenCount, total: totalDoses, percentage };
  }, [getTodaysDoses, takenDoses]);

  // Generate current week dates
  const getCurrentWeek = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Start from Sunday
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return {
        dayLabel: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][i],
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
        fullDate: date
      };
    });
  }, []);

  const dosesFromContextStr = useMemo(() => {
    return JSON.stringify(surveyData?.doses || []);
  }, [surveyData?.doses]);

  useEffect(() => {
    if (contextLoading) return;
    
    // IMPORTANT: Use Context as single source of truth
    // Do NOT read from localStorage directly
    const dosesFromContext = JSON.parse(dosesFromContextStr);
    
    console.log('[Dashboard] Loading doses from Context:', dosesFromContext.length);
    setDoses(dosesFromContext);

    const hasSeenAlarmInfo = localStorage.getItem('hasSeenAlarmInfo');
    const hasVisitedDosesPage = localStorage.getItem('hasEnteredDosesArea');
    
    setHasVisitedDosesList(!!hasVisitedDosesPage);
  }, [contextLoading, dosesFromContextStr]);

  useEffect(() => {
    if (contextLoading) return;
    
    if (!surveyData?.surveyId) {
      router.push('/');
      return;
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

  // Alarm notification logic with countdown
  useEffect(() => {
    // Check if all objectives are complete
    const hasVisitedDosesPage = localStorage.getItem('hasEnteredDosesArea');
    const hasSeenAlarmInfo = localStorage.getItem('hasSeenAlarmInfo');
    const hasMarkedDose = takenDoses.length > 0;
    const allObjectivesComplete = surveyData?.dosesAdded && hasVisitedDosesPage && hasMarkedDose;
    
    console.log('[Dashboard] Alarm check:', {
      allObjectivesComplete,
      dosesCount: doses.length,
      hasSeenAlarmInfo,
      todaysDosesCount: getTodaysDoses.length
    });
    
    if (!allObjectivesComplete || doses.length === 0 || hasSeenAlarmInfo) {
      return;
    }

    // Start countdown and redirect to alarm page
    if (getTodaysDoses.length > 0) {
      // Try to find an untaken dose, or use the first dose for demonstration
      let doseToShow = getTodaysDoses.find(dose => !takenDoses.includes(dose.id));
      if (!doseToShow) {
        doseToShow = getTodaysDoses[0]; // Use first dose as example
      }

      console.log('[Dashboard] Starting alarm countdown for dose:', doseToShow.name);

      // Set initial countdown
      setCountdown(5);

      // Update countdown every second
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Redirect after 5 seconds
      const redirectTimer = setTimeout(() => {
        // Store alarm data in localStorage
        localStorage.setItem('currentAlarm', JSON.stringify(doseToShow));
        console.log('[Dashboard] Redirecting to alarm page');
        router.push('/sc/alarm');
      }, 5000);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(redirectTimer);
      };
    }
    // IMPORTANT: Only use primitive values (.length) in dependencies to avoid infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyData?.dosesAdded, hasVisitedDosesList, takenDoses.length, doses.length, getTodaysDoses.length, router]);

  // Determine next objective in the experience flow
  const getNextObjective = () => {
    if (typeof window === 'undefined') {
      return {
        icon: <Target className="w-5 h-5 text-purple-600" />,
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-100',
        textColor: 'text-purple-900',
        title: 'Seu próximo objetivo',
        description: 'Carregando...',
        action: null,
        actionLink: null
      };
    }

    const hasVisitedDosesPage = localStorage.getItem('hasEnteredDosesArea');
    const hasSeenAlarmInfo = localStorage.getItem('hasSeenAlarmInfo');
    const hasMarkedDose = takenDoses.length > 0 || getTodaysDoses.some(dose => takenDoses.includes(dose.id));
    
    // Step 1: Add first dose
    if (!surveyData?.dosesAdded) {
      return {
        icon: <Target className="w-5 h-5 text-purple-600" />,
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-100',
        textColor: 'text-purple-900',
        title: 'Seu próximo objetivo',
        description: 'Adicione sua primeira dose ao sistema para começar a acompanhar suas medicações',
        action: 'Adicionar dose',
        actionLink: '/sc/doses/new'
      };
    }
    
    // Step 2: View doses list
    if (!hasVisitedDosesPage) {
      return {
        icon: <Pill className="w-5 h-5 text-blue-600" />,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100',
        textColor: 'text-blue-900',
        title: 'Seu próximo objetivo',
        description: 'Visite suas doses cadastradas para ver a lista completa e ativar os lembretes',
        action: 'Ver minhas doses',
        actionLink: '/sc/doses'
      };
    }
    
    // Step 3: Mark a dose as taken
    if (!hasMarkedDose) {
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-teal-600" />,
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-100',
        textColor: 'text-teal-900',
        title: 'Seu próximo objetivo',
        description: 'Marque uma dose como tomada para experimentar o acompanhamento de progresso',
        action: null,
        actionLink: null
      };
    }
    
    // Step 4: Experience alarm simulation
    if (!hasSeenAlarmInfo) {
      const nextDose = getTodaysDoses.find(dose => !takenDoses.includes(dose.id));
      const timeInfo = nextDose ? ` - Próximo alarme: ${nextDose.time.slice(0, 5)}` : '';
      const countdownText = countdown > 0 ? ` (alarme em ${countdown}s)` : ' (redirecionando...)';
      
      return {
        icon: <Bell className="w-5 h-5 text-amber-600" />,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
        textColor: 'text-amber-900',
        title: 'Seu próximo objetivo',
        description: `Os alarmes estão ativados! Experimente os lembretes nos horários configurados${timeInfo}${countdownText}`,
        action: null,
        actionLink: null
      };
    }
    
    // All objectives completed
    return {
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100',
      textColor: 'text-green-900',
      title: 'Experiência completa! 🎉',
      description: 'Você completou todos os objetivos. Continue acompanhando suas medicações diariamente',
      action: null,
      actionLink: null
    };
  };

  const nextObjective = getNextObjective();

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
          
          {/* Dynamic Next Objective Banner */}
          <div className={`mt-4 ${nextObjective.bgColor} border ${nextObjective.borderColor} rounded-lg px-4 py-3`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {nextObjective.icon}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${nextObjective.textColor} uppercase tracking-wide mb-1`}>
                  {nextObjective.title}
                </p>
                <p className={`text-sm ${nextObjective.textColor}`}>
                  {nextObjective.description}
                </p>
                {nextObjective.action && nextObjective.actionLink && (
                  <Link
                    href={nextObjective.actionLink}
                    className={`inline-flex items-center gap-1 mt-2 text-sm font-medium ${nextObjective.textColor} hover:underline`}
                  >
                    {nextObjective.action}
                    <Target className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-6 mt-6">
          {/* Progress Circle */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-6">Progresso de Hoje</h2>
            {doses.length === 0 ? (
              <div className="text-center py-6 px-2">
                <p className="text-sm text-gray-700">
                  Ei, parece que você ainda não tem doses cadastradas cadastre a sua primeira dose e seu progresso diário vai aparecer aqui!
                </p>
                <div className="mt-4">
                  <Link
                    href="/sc/doses/new"
                    className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar primeira dose
                  </Link>
                </div>
              </div>
            ) : (
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
                      stroke={todayProgress.percentage === 100 ? "#10b981" : "#0d9488"}
                      fill="transparent"
                      strokeWidth={12}
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 * (1 - todayProgress.percentage / 100)}
                      r={52}
                      cx={64}
                      cy={64}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-gray-900">
                    {todayProgress.percentage}%
                  </span>
                </div>
                <div className="flex-1 ml-8">
                  <div className="space-y-3">
                    {todayProgress.percentage === 100 ? (
                      <div>
                        <p className="text-2xl font-semibold text-green-600">Parabéns! 🎉</p>
                        <p className="text-sm text-gray-500">100% concluído hoje</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl font-semibold text-gray-900">
                          {todayProgress.taken} de {todayProgress.total}
                        </p>
                        <p className="text-sm text-gray-500">doses tomadas</p>
                      </div>
                    )}
                    {todayProgress.total > todayProgress.taken && getTodaysDoses[todayProgress.taken] && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Próxima: {getTodaysDoses[todayProgress.taken].name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Dose Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Próxima Dose</p>
            {getTodaysDoses.length > 0 ? (
              (() => {
                // Find the next dose that hasn't been taken yet
                const nextDose = getTodaysDoses.find(dose => !takenDoses.includes(dose.id));
                
                if (!nextDose) {
                  return (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-green-600">Todas as doses de hoje foram tomadas!</p>
                      <p className="text-xs text-gray-500 mt-1">Parabéns por manter a regularidade 🎉</p>
                    </div>
                  );
                }
                
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                        <Pill className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{nextDose.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-sm text-gray-500">{nextDose.time}</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => markDoseAsTaken(nextDose.id)}
                      className="w-full bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
                    >
                      Marcar como tomada
                    </button>
                  </>
                );
              })()
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">Nenhuma medicação cadastrada</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Remédios */}
              <Link
                href="/sc/doses"
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-600 hover:bg-teal-50 transition group relative overflow-hidden text-left"
              >
                <Image
                  src={"/pills.png"}
                  fill
                  alt="Pílula"
                  className="absolute inset-0 object-cover opacity-30 group-hover:opacity-25 transition-opacity pointer-events-none"
                />
                <Pill className="w-5 h-5 text-gray-600 group-hover:text-teal-600 mb-3 relative z-10" />
                <p className="text-sm font-medium text-gray-900 relative z-10">Remédios</p>
                <p className="text-xs text-gray-500 mt-0.5 relative z-10">Ver medicações</p>
              </Link>

              {/* Adicionar dose */}
              <Link
                href="/sc/doses/new"
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-600 hover:bg-teal-50 transition group relative overflow-hidden text-left"
              >
                <Plus className="w-5 h-5 text-gray-600 group-hover:text-teal-600 mb-3 relative z-10" />
                <p className="text-sm font-medium text-gray-900 relative z-10">Adicionar dose</p>
                <p className="text-xs text-gray-500 mt-0.5 relative z-10">Cadastrar nova dose</p>
              </Link>

              {/* Histórico */}
              <Link
                href="/sc/historico"
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-50 transition group text-left"
              >
                <BarChart3 className="w-5 h-5 text-gray-600 group-hover:text-gray-900 mb-3" />
                <p className="text-sm font-medium text-gray-900">Histórico</p>
                <p className="text-xs text-gray-500 mt-0.5">Ver estatísticas</p>
              </Link>
              {/* Família */}
              <Link
                href="/sc/familia"
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition group text-left"
              >
                <User className="w-5 h-5 text-blue-500 group-hover:text-blue-600 mb-3" />
                <p className="text-sm font-medium text-gray-900">Família</p>
                <p className="text-xs text-gray-500 mt-0.5">Gerenciar familiares</p>
              </Link>

            </div>
          </div>

          {/* Week Calendar */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Esta Semana</h2>
            <div className="flex justify-between">
              {getCurrentWeek.map((day, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">{day.dayLabel}</span>
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition ${
                      day.isToday
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day.date}
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
        </nav>
      </div>
    </>
  );
}