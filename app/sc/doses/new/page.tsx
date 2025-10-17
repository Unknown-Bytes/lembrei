"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSurvey } from '@/contexts/SurveyContext';
import Link from 'next/link';
import * as Popover from '@radix-ui/react-popover';
import { CalendarIcon, ClockIcon } from 'lucide-react';

export default function NewDosePage() {
  const router = useRouter();
  const { addUserEvent, updateSurveyData, surveyData } = useSurvey();
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [entryTime, setEntryTime] = useState<Date | null>(null);

  const commonMeds = [
    { name: 'Paracetamol', type: 'Analgésico', dosage: '500mg' },
    { name: 'Ibuprofeno', type: 'Anti-inflamatório', dosage: '400mg' },
    { name: 'Aspirina', type: 'Analgésico', dosage: '100mg' },
    { name: 'Vitamina D', type: 'Suplemento', dosage: '1000 UI' },
    { name: 'Omega 3', type: 'Suplemento', dosage: '1000mg' },
    { name: 'Magnésio', type: 'Suplemento', dosage: '400mg' },
    { name: 'Dipirona', type: 'Analgésico', dosage: '500mg' },
    { name: 'Omeprazol', type: 'Protetor gástrico', dosage: '20mg' }
  ];

  // Track when user first enters the dose creation area
  useEffect(() => {
    const now = new Date();
    setEntryTime(now);
    
    // Record first time entering dose creation area
    const hasEnteredBefore = localStorage.getItem('firstTimeEnteringDoseCreationArea');
    if (!hasEnteredBefore) {
      localStorage.setItem('firstTimeEnteringDoseCreationArea', now.toISOString());
      addUserEvent({ 
        type: 'first_time_entering_dose_creation_area',
        timestamp: now.toISOString()
      });
    }
  }, [addUserEvent]);

  const handleSave = async () => {
    const completionTime = new Date();
    const dosesRaw = localStorage.getItem("doses") || "[]";
    const doses = JSON.parse(dosesRaw);
    
    const newDose = {
      id: `dose_${Date.now()}`,
      name,
      time,
      notes,
      frequency,
      selectedDays: frequency === "weekly" ? selectedDays : [],
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: completionTime.toISOString(),
    };
    
    doses.push(newDose);
    localStorage.setItem("doses", JSON.stringify(doses));
    
    // Calculate time spent in dose creation
    const timeSpentMs = entryTime ? completionTime.getTime() - entryTime.getTime() : 0;
    
    // Record dose creation completion event
    addUserEvent({ 
      type: 'dose_creation_completed',
      doseId: newDose.id,
      timeSpentMs,
      entryTime: entryTime?.toISOString(),
      completionTime: completionTime.toISOString(),
      doseData: newDose
    });
    
    // If the user acknowledged the add-dose prompt earlier, record how long it took
    const ackAt = localStorage.getItem('addDosePromptAcknowledgedAt');
    if (ackAt) {
      const elapsedMs = completionTime.getTime() - new Date(ackAt).getTime();
      addUserEvent({ 
        type: 'dose_created_after_prompt', 
        acknowledgedAt: ackAt, 
        elapsedMs, 
        doseId: newDose.id 
      });
    }
    
    // Update database with complete survey data including doses
    try {
      if (surveyData?.surveyId) {
        // Update context with new doses array
        updateSurveyData({ 
          dosesAdded: true,
          doses: doses
        });
        
        // Get all user events for comprehensive data
        const userEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
        
        console.log('Saving dose to database...', {
          surveyId: surveyData.surveyId,
          dosesCount: doses.length,
          newDose: newDose
        });
        
        const response = await fetch(`/api/survey/${surveyData.surveyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            dosesAdded: true,
            doses: doses,
            userEvents: userEvents,
            doseCreationCompletedAt: completionTime.toISOString(),
            firstTimeEnteringDoseCreationArea: localStorage.getItem('firstTimeEnteringDoseCreationArea')
          }),
        });
        
        const result = await response.json();
        console.log('Dose saved to database:', result);
      } else {
        console.warn('No surveyId found, dose not saved to database');
      }
    } catch (e) {
      console.error('Failed to persist survey data to server:', e);
    }
    
    // Navigation logic based on number of doses
    if (doses.length === 1) {
      // First dose - go to dashboard to see alarm modal
      router.push('/sc/dashboard');
    } else {
      // Second+ dose - go directly to doses list
      router.push('/sc/doses');
    }
  };

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
              <h1 className="text-lg font-semibold text-slate-900">Adicionar Medicação</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          {/* Form Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-medium text-slate-900">Informações da Medicação</h2>
            <p className="text-sm text-slate-500 mt-1">Preencha os dados para adicionar uma nova medicação ao seu cronograma</p>
          </div>

          {/* Form Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Medication Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Nome da Medicação
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ex: Paracetamol, Ibuprofeno, Aspirina..."
              />
              {/* Suggestions as pills below input */}
              <div className="mt-2">
                <div className="text-sm text-slate-500 mb-2">Sugestões rápidas</div>
                <div className="flex flex-wrap gap-2">
                  {commonMeds.map((med) => (
                    <button
                      key={med.name}
                      onClick={() => setName(med.name)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors border ${
                        name === med.name ? 'bg-blue-600 text-white border-transparent' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {med.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Horário
              </label>
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between text-left">
                    <span className={time ? "text-slate-900" : "text-slate-400"}>
                      {time || "Selecione o horário"}
                    </span>
                    <ClockIcon className="w-4 h-4 text-slate-400" />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content className="bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50" sideOffset={5}>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-900">Selecionar Horário</h4>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        {['08:00', '12:00', '14:00', '18:00', '20:00', '22:00'].map((suggestedTime) => (
                          <button
                            key={suggestedTime}
                            onClick={() => {
                              setTime(suggestedTime);
                            }}
                            className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                          >
                            {suggestedTime}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Popover.Arrow className="fill-white" />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Frequência
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFrequency("daily")}
                  className={`p-3 text-left border rounded-md transition-colors ${
                    frequency === "daily"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-medium">Diário</div>
                  <div className="text-sm text-slate-500">Todos os dias</div>
                </button>
                <button
                  onClick={() => setFrequency("weekly")}
                  className={`p-3 text-left border rounded-md transition-colors ${
                    frequency === "weekly"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-medium">Semanal</div>
                  <div className="text-sm text-slate-500">Dias específicos</div>
                </button>
              </div>
            </div>

            {/* Days of the Week - Only show when weekly is selected */}
            {frequency === "weekly" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Dias da Semana
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    { key: "monday", label: "S", full: "Seg" },
                    { key: "tuesday", label: "T", full: "Ter" },
                    { key: "wednesday", label: "Q", full: "Qua" },
                    { key: "thursday", label: "Q", full: "Qui" },
                    { key: "friday", label: "S", full: "Sex" },
                    { key: "saturday", label: "S", full: "Sáb" },
                    { key: "sunday", label: "D", full: "Dom" },
                  ].map((day) => (
                    <button
                      key={day.key}
                      onClick={() => {
                        setSelectedDays(prev => 
                          prev.includes(day.key)
                            ? prev.filter(d => d !== day.key)
                            : [...prev, day.key]
                        );
                      }}
                      className={`p-2 text-center border rounded-md transition-colors ${
                        selectedDays.includes(day.key)
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      title={day.full}
                    >
                      <div className="text-sm font-medium">{day.label}</div>
                    </button>
                  ))}
                </div>
                {selectedDays.length === 0 && (
                  <p className="text-sm text-slate-500">Selecione pelo menos um dia da semana</p>
                )}
                
                {/* Quick presets for common schedules */}
                {frequency === "weekly" && (
                  <div className="mt-3">
                    <p className="text-sm text-slate-600 mb-2">Agendamentos comuns:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedDays(["monday", "tuesday", "wednesday", "thursday", "friday"])}
                        className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                      >
                        Dias úteis
                      </button>
                      <button
                        onClick={() => setSelectedDays(["saturday", "sunday"])}
                        className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                      >
                        Fins de semana
                      </button>
                      <button
                        onClick={() => setSelectedDays(["monday", "wednesday", "friday"])}
                        className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                      >
                        Seg, Qua, Sex
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Observações <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Ex: Tomar com comida, evitar álcool, etc."
              />
            </div>

            {/* Cycle Dates */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-medium text-slate-700">Período do Tratamento</h3>
                <span className="text-slate-400 font-normal text-sm">(opcional)</span>
              </div>
              <p className="text-sm text-slate-500">
                Defina quando começar e terminar este ciclo de medicação
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Quick Duration Presets */}
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Durações comuns:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                      setStartDate(today.toISOString().split('T')[0]);
                      setEndDate(weekFromNow.toISOString().split('T')[0]);
                    }}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      startDate && endDate && 
                      new Date(endDate).getTime() - new Date(startDate).getTime() === 7 * 24 * 60 * 60 * 1000
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    1 semana
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
                      setStartDate(today.toISOString().split('T')[0]);
                      setEndDate(twoWeeksFromNow.toISOString().split('T')[0]);
                    }}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      startDate && endDate && 
                      new Date(endDate).getTime() - new Date(startDate).getTime() === 14 * 24 * 60 * 60 * 1000
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    2 semanas
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                      setStartDate(today.toISOString().split('T')[0]);
                      setEndDate(monthFromNow.toISOString().split('T')[0]);
                    }}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      startDate && endDate && 
                      new Date(endDate).getTime() - new Date(startDate).getTime() === 30 * 24 * 60 * 60 * 1000
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    1 mês
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const threeMonthsFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
                      setStartDate(today.toISOString().split('T')[0]);
                      setEndDate(threeMonthsFromNow.toISOString().split('T')[0]);
                    }}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      startDate && endDate && 
                      new Date(endDate).getTime() - new Date(startDate).getTime() === 90 * 24 * 60 * 60 * 1000
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    3 meses
                  </button>
                </div>
              </div>

              {/* Validation Messages */}
              {startDate && endDate && new Date(startDate) >= new Date(endDate) && (
                <p className="text-sm text-red-600">
                  A data de término deve ser posterior à data de início
                </p>
              )}
            </div>

          </div>

          {/* Form Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {name && time && (frequency === "daily" || (frequency === "weekly" && selectedDays.length > 0)) && 
                 (!startDate || !endDate || new Date(startDate) < new Date(endDate)) ? (
                  <span className="text-green-600">✓ Pronto para salvar</span>
                ) : (
                  <span>
                    {!name && "Preencha o nome da medicação"}
                    {name && !time && "Selecione o horário"}
                    {name && time && frequency === "weekly" && selectedDays.length === 0 && "Selecione os dias da semana"}
                    {name && time && (frequency === "daily" || (frequency === "weekly" && selectedDays.length > 0)) && 
                     startDate && endDate && new Date(startDate) >= new Date(endDate) && "Corrija as datas do período"}
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/sc/dashboard')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name || !time || (frequency === "weekly" && selectedDays.length === 0) || 
                           (startDate && endDate && new Date(startDate) >= new Date(endDate)) || false}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Adicionar Medicação
                </button>
              </div>
            </div>
          </div>
        </div>

  {/* moved common meds into suggestions under the name input */}
      </div>
    </div>
  );
}
