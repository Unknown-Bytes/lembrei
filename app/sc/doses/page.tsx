"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useSurvey } from '@/contexts/SurveyContext';
import { CalendarIcon, ClockIcon, PlusIcon, PillIcon } from 'lucide-react';

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

  // Use useMemo to create a stable stringified version for comparison
  const dosesFromContextStr = useMemo(() => {
    return JSON.stringify(surveyData?.doses || []);
  }, [surveyData?.doses]);

  useEffect(() => {
    const dosesFromContext = JSON.parse(dosesFromContextStr);
    
    // Fallback to localStorage if context is empty
    if (dosesFromContext.length === 0) {
      const dosesRaw = localStorage.getItem("doses") || "[]";
      const parsedDoses = JSON.parse(dosesRaw);
      
      // If no doses exist at all, redirect to dashboard
      if (parsedDoses.length === 0) {
        router.push('/sc/dashboard');
        return;
      }
      
      setDoses(parsedDoses);
    } else {
      setDoses(dosesFromContext);
    }
    
    setLoading(false);
  }, [dosesFromContextStr, router]);

  // Track ONLY the first time user enters doses area
  useEffect(() => {
    if (loading || !surveyData?.surveyId) return;
    
    const hasEnteredDosesArea = localStorage.getItem('hasEnteredDosesArea');
    
    if (!hasEnteredDosesArea) {
      const now = new Date().toISOString();
      
      // Save to database only
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

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds if present
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getFrequencyText = (frequency: string, selectedDays: string[]) => {
    if (frequency === "daily") return "Diário";
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
    if (!dose.startDate || !dose.endDate) return "bg-slate-100 text-slate-700";
    
    const now = new Date();
    const start = new Date(dose.startDate);
    const end = new Date(dose.endDate);
    
    if (now < start) return "bg-blue-100 text-blue-700";
    if (now > end) return "bg-gray-100 text-gray-500";
    return "bg-green-100 text-green-700";
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando medicações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/sc/dashboard"
                className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="text-lg font-semibold text-slate-900">Doses Cadastradas</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PillIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total de Medicações</p>
                <p className="text-2xl font-semibold text-slate-900">{doses.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Ativas</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {doses.filter(dose => getStatusText(dose) === "Ativo").length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Com Período</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {doses.filter(dose => dose.startDate && dose.endDate).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Medication Button */}
        <div className="mb-6">
          <Link
            href="/sc/doses/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Adicionar Nova Medicação
          </Link>
        </div>

        {/* Doses List */}
        {doses.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
            <PillIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma medicação cadastrada</h3>
            <p className="text-slate-500 mb-6">Comece adicionando sua primeira medicação ao sistema</p>
            <Link
              href="/sc/doses/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Adicionar Medicação
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {doses.map((dose) => (
              <div key={dose.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{dose.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dose)}`}>
                        {getStatusText(dose)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        <span>{formatTime(dose.time)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-slate-600">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        <span>{getFrequencyText(dose.frequency, dose.selectedDays)}</span>
                      </div>
                    </div>
                    
                    {dose.startDate && dose.endDate && (
                      <div className="mb-4">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Período:</span> {formatDate(dose.startDate)} - {formatDate(dose.endDate)}
                        </p>
                      </div>
                    )}
                    
                    {dose.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Observações:</span> {dose.notes}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-400">
                      Criado em {formatDate(dose.createdAt)}
                    </p>
                  </div>
                  
                  <div className="ml-4 flex space-x-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
