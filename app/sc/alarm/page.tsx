"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSurvey } from '@/contexts/SurveyContext';
import { useEnhancedTracking } from '@/lib/services/enhancedTrackingService';
import { Bell, CheckCircle2, X } from 'lucide-react';

interface Dose {
  id: string;
  name: string;
}

export default function AlarmPage() {
  const router = useRouter();
  const { surveyData } = useSurvey();
  const tracking = useEnhancedTracking();
  const [isSliding, setIsSliding] = useState(false);
  const [currentDose, setCurrentDose] = useState<Dose | null>(null);
  const [triggeredAt, setTriggeredAt] = useState<Date | null>(null);

  useEffect(() => {
    const storedAlarm = localStorage.getItem('currentAlarm');
    if (!storedAlarm) {
      router.push('/sc/dashboard');
      return;
    }
    
    const dose = JSON.parse(storedAlarm);
    setCurrentDose(dose);
    
    const now = new Date();
    setTriggeredAt(now);
    
    // Track alarm triggered
    tracking.trackAlarmInteraction('triggered', dose.id, {
      doseName: dose.name,
      triggeredAt: now.toISOString(),
      scheduledTime: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmDoseTaken = () => {
    if (!currentDose) return;

    const confirmedAt = new Date();
    const responseTime = triggeredAt 
      ? Math.round((confirmedAt.getTime() - triggeredAt.getTime()) / 1000)
      : 0;

    // Save to localStorage
    const today = new Date().toISOString().split('T')[0];
    const takenKey = `takenDoses_${today}`;
    const takenDoses = JSON.parse(localStorage.getItem(takenKey) || '[]');

    if (!takenDoses.includes(currentDose.id)) {
      const updatedTaken = [...takenDoses, currentDose.id];
      localStorage.setItem(takenKey, JSON.stringify(updatedTaken));
    }

    // Track alarm confirmed
    tracking.trackAlarmInteraction('confirmed', currentDose.id, {
      doseName: currentDose.name,
      confirmedAt: confirmedAt.toISOString(),
      responseTimeSeconds: responseTime,
      source: 'alarm_modal',
    });

    // Send dose history to API
    if (surveyData?.surveyId) {
      fetch('/api/dose-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: surveyData.surveyId,
          doseId: currentDose.id,
          action: 'taken',
          scheduledTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          actualTime: confirmedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          source: 'alarm',
          takenOnTime: true,
        }),
      }).catch(err => console.error('Error saving dose history:', err));
    }

    localStorage.setItem('hasSeenAlarmInfo', 'true');
    localStorage.removeItem('currentAlarm');

    router.push('/sc/feedback');
  };

  const deferDose = () => {
    if (!currentDose) return;

    const deferredAt = new Date();
    const responseTime = triggeredAt 
      ? Math.round((deferredAt.getTime() - triggeredAt.getTime()) / 1000)
      : 0;

    // Track alarm deferred
    tracking.trackAlarmInteraction('deferred', currentDose.id, {
      doseName: currentDose.name,
      deferredAt: deferredAt.toISOString(),
      responseTimeSeconds: responseTime,
      source: 'alarm_modal',
    });

    localStorage.setItem('hasSeenAlarmInfo', 'true');
    localStorage.removeItem('currentAlarm');
    router.push('/sc/dashboard');
  };

  if (!currentDose) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-teal-600"></div>
      </div>
    );
  }

  const formattedTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #4AA99D 0%, #6DB5AA 50%, #8BC1B7 100%)',
      }}
    >
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8 relative">
          {/* Close button */}
          <button
            onClick={deferDose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="text-center mb-8">
            {/* Animated bell */}
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <Bell className="w-10 h-10 text-white animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-xs font-bold text-white">1</span>
              </div>
            </div>

            {/* Main message */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Hora do medicamento
            </h2>
            <p className="text-xl font-semibold text-gray-800 mb-2">
              {currentDose.name}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-600 font-medium">
                Agendado para {formattedTime}
              </p>
            </div>
          </div>

          {/* Friendly reminder */}
          <div className="mb-6 p-4 bg-teal-50 rounded-2xl border border-teal-100">
            <p className="text-sm text-gray-700 text-center leading-relaxed">
              Lembre-se: tomar seus medicamentos na hora correta é essencial para manter sua saúde em dia.
            </p>
          </div>

          {/* Slide to confirm */}
          <div className="relative mb-6">
            <div className="h-16 bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl overflow-hidden relative border-2 border-gray-200 shadow-inner">
              <div
                className={`h-full bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 flex items-center justify-end px-6 transition-all duration-500 ease-out ${
                  isSliding ? 'w-full' : 'w-0'
                }`}
                onTransitionEnd={() => {
                  if (isSliding) confirmDoseTaken();
                }}
              >
                {isSliding && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                    <span className="text-white font-semibold">Confirmado</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsSliding(true)}
                disabled={isSliding}
                className="absolute inset-0 flex items-center justify-center text-base font-semibold text-gray-700 hover:text-gray-900 transition disabled:cursor-not-allowed"
              >
                {isSliding ? (
                  <span className="text-transparent">Confirmando...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Deslize para confirmar</span>
                    <span className="text-2xl">→</span>
                  </span>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Confirme que você tomou este medicamento
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={deferDose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              Lembrar depois
            </button>
          </div>

          {/* Bottom note */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Este é um exemplo de como funcionam os lembretes
          </p>
        </div>
      </div>
    </div>
  );
}
