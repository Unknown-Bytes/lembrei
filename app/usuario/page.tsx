"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RandomUser } from '@/lib/types';

export default function Usuario() {
  const router = useRouter();
  const [user, setUser] = useState<RandomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showAddDoseModal, setShowAddDoseModal] = useState(false);
  const [ackCaptured, setAckCaptured] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    const surveyId = localStorage.getItem('surveyId');
    
    if (!userData) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    setLoading(false);

    // Show the "add dose" prompt once per user (or until acknowledged)
    try {
      const promptShown = localStorage.getItem('addDosePromptShown');
      const acknowledgedAt = localStorage.getItem('addDosePromptAcknowledgedAt');
      // If not shown and not acknowledged, open the modal
      if (!promptShown && !acknowledgedAt) {
        setShowAddDoseModal(true);
        localStorage.setItem('addDosePromptShown', 'true');
      }
    } catch (e) {
      console.warn('localStorage unavailable for addDose prompt', e);
    }

    // Record first dashboard entry if not already recorded
    const hasRecordedEntry = localStorage.getItem('dashboardEntryRecorded');
    if (surveyId && !hasRecordedEntry) {
      const now = new Date().toISOString();
      
      // Save to database
      fetch(`/api/survey/${surveyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstDashboardEntryAt: now,
        }),
      }).then(() => {
        localStorage.setItem('dashboardEntryRecorded', 'true');
      }).catch((error) => {
        console.error('Error recording dashboard entry:', error);
      });

      // Also save to userEvents for analytics
      try {
        const eventsRaw = localStorage.getItem('userEvents') || '[]';
        const events = JSON.parse(eventsRaw);
        events.push({ type: 'first_dashboard_entry', at: now, surveyId });
        localStorage.setItem('userEvents', JSON.stringify(events));
      } catch (e) {
        console.warn('Could not record dashboard entry event', e);
      }
    }
  }, [router]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReset = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  const handleAcknowledgeAddDose = () => {
    const now = new Date().toISOString();
    localStorage.setItem('addDosePromptAcknowledgedAt', now);
  setShowAddDoseModal(false);
  setAckCaptured(true);
    // Capture the moment (record timestamp in survey or doses)
    try {
      const surveyId = localStorage.getItem('surveyId') || 'unknown';
      const eventsRaw = localStorage.getItem('userEvents') || '[]';
      const events = JSON.parse(eventsRaw);
      events.push({ type: 'addDose_prompt_acknowledged', at: now, surveyId });
      localStorage.setItem('userEvents', JSON.stringify(events));
    } catch (e) {
      console.warn('Could not record event', e);
    }
  };

  if (loading) {
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
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      {/* Greeting Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-teal-700">Olá, Ana!</h1>
        <p className="text-sm text-teal-500 mt-1">Hoje: 3 de 4 doses tomadas</p>
      </header>

      {/* Circular Progress */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-40 h-40 rounded-full bg-teal-100 flex items-center justify-center shadow-lg">
          <span className="text-6xl font-bold text-teal-700">15</span>
        </div>
        <p className="mt-4 text-teal-600 font-semibold text-lg">dias seguidos!</p>
      </div>

      {/* Próxima dose card */}
      <div className="bg-white rounded-2xl p-4 shadow-md mb-8">
        <h2 className="text-teal-700 font-semibold text-lg mb-2">Próxima dose</h2>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white text-xl shadow">
              💊
            </div>
            <div>
              <p className="font-semibold text-gray-900">Paracetamol</p>
              <p className="text-sm text-gray-500">14:30</p>
            </div>
          </div>
          <button className="text-teal-600 font-medium hover:underline">Tomar</button>
        </div>
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
          <button className="flex flex-col items-center bg-white rounded-2xl shadow-md p-4 flex-1 hover:shadow-lg transition">
            <span className="text-3xl mb-2">💊</span>
            <span className="text-teal-700 font-medium">Remédios</span>
          </button>
          <button
            onClick={() => router.push('/doses/new')}
            className="flex flex-col items-center bg-white rounded-2xl shadow-md p-4 flex-1 hover:shadow-lg transition"
          >
            <span className="text-3xl mb-2">➕</span>
            <span className="text-teal-700 font-medium">Adicionar dose</span>
          </button>
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
        <h2 className="text-teal-700 font-semibold text-lg mb-4">Medicação Próxima</h2>
        <ul className="space-y-3">
          {[
            { id: 1, name: 'Ibuprofeno', time: '08:00' },
            { id: 2, name: 'Amoxicilina', time: '12:00' },
            { id: 3, name: 'Cetirizina', time: '18:00' },
            { id: 4, name: 'Metformina', time: '22:00' },
          ].map(({ id, name, time }) => (
            <li key={id} className="bg-white rounded-2xl p-4 shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white text-xl shadow">
                  💊
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-sm text-gray-500">{time}</p>
                </div>
              </div>
              <input type="checkbox" className="w-5 h-5 text-teal-600 rounded" />
            </li>
          ))}
        </ul>
        <button className="mt-6 w-full text-center text-teal-600 font-semibold hover:underline">
          Ver todos
        </button>
      </section>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around shadow-inner">
        <button className="flex flex-col items-center text-teal-600 font-semibold">
          <span className="text-2xl">🏠</span>
          <span className="text-xs mt-1">Início</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 hover:text-teal-600 transition">
          <span className="text-2xl">💊</span>
          <span className="text-xs mt-1">Remédios</span>
        </button>
        <button className="flex flex-col items-center text-gray-400 hover:text-teal-600 transition">
          <span className="text-2xl">👤</span>
          <span className="text-xs mt-1">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
