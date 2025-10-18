"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pill, Clock, ArrowLeft, Calendar, CheckCircle2 } from 'lucide-react';

interface DoseHistory {
  id: string;
  name: string;
  time: string;
  takenAt: string | null;
}

export default function HistoricoPage() {
  const [history, setHistory] = useState<DoseHistory[]>([]);
  const [groupedHistory, setGroupedHistory] = useState<{ [date: string]: DoseHistory[] }>({});

  useEffect(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('takenDoses_'));
    let allDoses: DoseHistory[] = [];
    
    keys.forEach(key => {
      const takenIds: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      const date = key.replace('takenDoses_', '');
      const dosesRaw = localStorage.getItem('doses') || '[]';
      const doses = JSON.parse(dosesRaw);
      
      doses.forEach((dose: any) => {
        if (takenIds.includes(dose.id)) {
          allDoses.push({
            id: dose.id,
            name: dose.name,
            time: dose.time,
            takenAt: date
          });
        }
      });
    });
    
    const sorted = allDoses.sort((a, b) => (a.takenAt && b.takenAt ? b.takenAt.localeCompare(a.takenAt) : 0));
    setHistory(sorted);
    
    // Group by date
    const grouped = sorted.reduce((acc, dose) => {
      const date = dose.takenAt || 'unknown';
      if (!acc[date]) acc[date] = [];
      acc[date].push(dose);
      return acc;
    }, {} as { [date: string]: DoseHistory[] });
    
    setGroupedHistory(grouped);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    }
  };

  const totalDoses = history.length;
  const uniqueDates = Object.keys(groupedHistory).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/sc/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Voltar</span>
              </Link>
              <div className="h-5 w-px bg-gray-200" />
              <h1 className="text-xl font-semibold text-gray-900">Histórico de Doses</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Doses Tomadas</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalDoses}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dias Registrados</p>
                  <p className="text-2xl font-semibold text-gray-900">{uniqueDates}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History List */}
        {history.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma dose registrada</h3>
            <p className="text-gray-500 mb-6">Comece a marcar suas doses como tomadas para ver o histórico</p>
            <Link 
              href="/sc/dashboard" 
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
            >
              Ir para o Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, doses]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">{formatDate(date)}</h2>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-500">{doses.length} {doses.length === 1 ? 'dose' : 'doses'}</span>
                </div>

                {/* Doses for this date */}
                <div className="space-y-2">
                  {doses.map((dose) => (
                    <div 
                      key={dose.id + dose.takenAt} 
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{dose.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-500">{dose.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                          Tomada
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}