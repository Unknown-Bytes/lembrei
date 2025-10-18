"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useSurvey } from '@/contexts/SurveyContext';
import { Calendar, Clock, Plus, Pill, ArrowLeft, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

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

export default function DosesPage() {
  const router = useRouter();
  const { surveyData } = useSurvey();
  const [doses, setDoses] = useState<Dose[]>([]);
  const [loading, setLoading] = useState(true);
  const [takenDoses, setTakenDoses] = useState<string[]>([]);
  const [slidingDose, setSlidingDose] = useState<string | null>(null);

  const dosesFromContextStr = useMemo(() => {
    return JSON.stringify(surveyData?.doses || []);
  }, [surveyData?.doses]);

  useEffect(() => {
    // IMPORTANT: Use Context as single source of truth
    // Do NOT read from localStorage directly
    const dosesFromContext = JSON.parse(dosesFromContextStr);
    
    console.log('[Doses] Loading doses from Context:', dosesFromContext.length);
    
    if (dosesFromContext.length === 0) {
      router.push('/sc/dashboard');
      return;
    }
    
    setDoses(dosesFromContext);
    setLoading(false);
  }, [dosesFromContextStr, router]);

  useEffect(() => {
    if (loading || !surveyData?.surveyId) return;
    
    const hasEnteredDosesArea = localStorage.getItem('hasEnteredDosesArea');
    
    if (!hasEnteredDosesArea) {
      const now = new Date().toISOString();
      
      fetch(`/api/survey/${surveyData.surveyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstTimeViewingDosesList: now,
        }),
      }).catch((error) => {
        console.error('Error recording first doses list view:', error);
      });
      
      localStorage.setItem('hasEnteredDosesArea', 'true');
    }
  }, [loading, surveyData?.surveyId]);

  // Load taken doses for today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const takenKey = `takenDoses_${today}`;
    const taken = JSON.parse(localStorage.getItem(takenKey) || '[]');
    setTakenDoses(taken);
  }, []);

  // Get today's doses
  const getTodaysDoses = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // "2025-10-17"
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    
    console.log('[Doses] Calculating today\'s doses for:', today, dayOfWeek);
    
    return doses.filter(dose => {
      // Validate date range (startDate and endDate)
      if (dose.startDate && today < dose.startDate) {
        console.log(`[Doses] Dose ${dose.name} not started yet (starts: ${dose.startDate})`);
        return false;
      }
      if (dose.endDate && today > dose.endDate) {
        console.log(`[Doses] Dose ${dose.name} expired (ended: ${dose.endDate})`);
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

  const handleSlideComplete = (doseId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const takenKey = `takenDoses_${today}`;
    
    const updatedTaken = [...takenDoses, doseId];
    setTakenDoses(updatedTaken);
    localStorage.setItem(takenKey, JSON.stringify(updatedTaken));
    setSlidingDose(null);
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getFrequencyText = (frequency: string, selectedDays: string[]) => {
    if (frequency === "daily") return "Todos os dias";
    if (frequency === "weekly") {
      const dayNames = {
        monday: "Seg",
        tuesday: "Ter", 
        wednesday: "Qua",
        thursday: "Qui",
        friday: "Sex",
        saturday: "Sáb",
        sunday: "Dom"
      };
      return selectedDays.map(day => dayNames[day as keyof typeof dayNames]).join(", ");
    }
    return frequency;
  };

  const getStatusColor = (dose: Dose) => {
    if (!dose.startDate || !dose.endDate) return "bg-green-50 text-green-700 border-green-200";
    
    const now = new Date();
    const start = new Date(dose.startDate);
    const end = new Date(dose.endDate);
    
    if (now < start) return "bg-blue-50 text-blue-700 border-blue-200";
    if (now > end) return "bg-gray-100 text-gray-500 border-gray-200";
    return "bg-green-50 text-green-700 border-green-200";
  };

  const getStatusText = (dose: Dose) => {
    if (!dose.startDate || !dose.endDate) return "Ativo";
    
    const now = new Date();
    const start = new Date(dose.startDate);
    const end = new Date(dose.endDate);
    
    if (now < start) return "Agendado";
    if (now > end) return "Finalizado";
    return "Ativo";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-teal-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Carregando medicações...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-semibold text-gray-900">Minhas Medicações</h1>
            </div>
            
            <Link
              href="/sc/doses/new"
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
            >
              <Plus className="w-4 h-4" />
              Nova
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{doses.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ativas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {doses.filter(dose => getStatusText(dose) === "Ativo").length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Programadas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {doses.filter(dose => dose.startDate && dose.endDate).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Doses Section */}
        {getTodaysDoses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Doses de Hoje</h2>
            <div className="space-y-3">
              {getTodaysDoses.map((dose) => {
                const isTaken = takenDoses.includes(dose.id);
                const isSliding = slidingDose === dose.id;
                
                return (
                  <div
                    key={dose.id}
                    className={`bg-white rounded-lg border p-4 transition ${
                      isTaken ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isTaken ? 'bg-green-100' : 'bg-teal-50'
                        }`}>
                          {isTaken ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Pill className="w-5 h-5 text-teal-600" />
                          )}
                        </div>
                        <div>
                          <h3 className={`text-base font-semibold ${
                            isTaken ? 'text-green-900' : 'text-gray-900'
                          }`}>
                            {dose.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600">{formatTime(dose.time)}</span>
                          </div>
                        </div>
                      </div>
                      {isTaken && (
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                          Concluída
                        </span>
                      )}
                    </div>
                    
                    {!isTaken && (
                      <div className="relative">
                        <div className="h-12 bg-gray-100 rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-end px-4 transition-all duration-300 ${
                              isSliding ? 'w-full' : 'w-0'
                            }`}
                            onTransitionEnd={() => {
                              if (isSliding) {
                                handleSlideComplete(dose.id);
                              }
                            }}
                          >
                            {isSliding && (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <button
                            onClick={() => setSlidingDose(dose.id)}
                            disabled={isSliding}
                            className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-700 hover:text-gray-900 transition disabled:cursor-not-allowed"
                          >
                            {isSliding ? 'Marcando...' : 'Deslize para marcar como tomada →'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Doses Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Todas as Medicações</h2>
        </div>

        {/* Doses List */}
        {doses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma medicação cadastrada</h3>
            <p className="text-gray-500 mb-6">Comece adicionando sua primeira medicação</p>
            <Link
              href="/sc/doses/new"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
            >
              <Plus className="w-4 h-4" />
              Adicionar Medicação
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {doses.map((dose) => (
              <div key={dose.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition group">
                <div className="flex items-start justify-between gap-4">
                  {/* Left side - Icon & Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Pill className="w-6 h-6 text-teal-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Title & Status */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-gray-900">{dose.name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(dose)}`}>
                          {getStatusText(dose)}
                        </span>
                      </div>
                      
                      {/* Details Grid */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{formatTime(dose.time)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{getFrequencyText(dose.frequency, dose.selectedDays)}</span>
                        </div>
                      </div>
                      
                      {/* Period */}
                      {dose.startDate && dose.endDate && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">
                            Período: {formatDate(dose.startDate)} até {formatDate(dose.endDate)}
                          </p>
                        </div>
                      )}
                      
                      {/* Notes */}
                      {dose.notes && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {dose.notes}
                          </p>
                        </div>
                      )}
                      
                      {/* Created date */}
                      <p className="text-xs text-gray-400">
                        Criado em {formatDate(dose.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right side - Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom spacing for mobile */}
        <div className="h-20" />
      </div>
    </div>
  );
}