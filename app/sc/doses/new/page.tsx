"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSurvey } from '@/contexts/SurveyContext';
import { Check, Clock, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';

export default function NewDosePage() {
  const router = useRouter();
  const { addUserEvent, updateSurveyData, surveyData } = useSurvey();
  
  // Form state
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [frequency, setFrequency] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [durationType, setDurationType] = useState(""); // "regular" or "period"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [entryTime, setEntryTime] = useState<Date | null>(null);
  const [attemptedNext, setAttemptedNext] = useState(false);

  const commonMeds = [
  'Paracetamol',
  'Ibuprofeno',
  'Dipirona',
  'Omeprazol',
  'Vitamina D',
  'Magnésio',
  'Ferro',
  'Ácido fólico',
  'Cálcio',
  'Anticoncepcional',
  'Buscopan'
];


  const commonTimes = ['08:00', '12:00', '14:00', '18:00', '20:00', '22:00'];

  useEffect(() => {
    const now = new Date();
    setEntryTime(now);
    
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
    
    // IMPORTANT: Get doses from Context (single source of truth)
    const currentDoses = surveyData?.doses || [];
    
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
    
    // Create updated doses array
    const updatedDoses = [...currentDoses, newDose];
    
    console.log('[NewDose] Creating new dose:', newDose.name);
    console.log('[NewDose] Total doses after creation:', updatedDoses.length);
    
    const timeSpentMs = entryTime ? completionTime.getTime() - entryTime.getTime() : 0;
    
    addUserEvent({ 
      type: 'dose_creation_completed',
      doseId: newDose.id,
      timeSpentMs,
      entryTime: entryTime?.toISOString(),
      completionTime: completionTime.toISOString(),
      doseData: newDose
    });
    
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
    
    // IMPORTANT: Update Context first (this will also persist to localStorage)
    updateSurveyData({ 
      dosesAdded: true,
      doses: updatedDoses
    });
    
    // Then save to API in background (non-blocking)
    try {
      if (surveyData?.surveyId) {
        const userEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
        
        fetch(`/api/survey/${surveyData.surveyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            dosesAdded: true,
            doses: updatedDoses,
            userEvents: userEvents,
            doseCreationCompletedAt: completionTime.toISOString(),
            firstTimeEnteringDoseCreationArea: localStorage.getItem('firstTimeEnteringDoseCreationArea')
          }),
        }).catch(e => {
          console.error('Failed to persist survey data to server:', e);
        });
      }
    } catch (e) {
      console.error('Error preparing API request:', e);
    }
    
    // Navigate based on dose count
    if (updatedDoses.length === 1) {
      router.push('/sc/dashboard');
    } else {
      router.push('/sc/doses');
    }
  };

  const canProceedFromStep = (step: number) => {
    switch(step) {
      case 1: return name.trim().length > 0;
      case 2: return time.trim().length > 0;
      case 3: return frequency !== "";
      case 4: return frequency === "daily" || selectedDays.length > 0;
      case 5: return true; // Notes are optional
      case 6: return durationType !== "";
      default: return true;
    }
  };

  const nextStep = () => {
    if (canProceedFromStep(currentStep)) {
      setAttemptedNext(false); // Reset for next step
      // Skip step 4 if frequency is daily
      if (currentStep === 3 && frequency === "daily") {
        setCurrentStep(5);
      }
      // Skip step 7 if durationType is regular (go to save)
      else if (currentStep === 6 && durationType === "regular") {
        handleSave();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      setAttemptedNext(true); // Show validation warnings
    }
  };

  const prevStep = () => {
    // Skip step 4 when going back if frequency is daily
    if (currentStep === 5 && frequency === "daily") {
      setCurrentStep(3);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const totalSteps = frequency === "daily" ? 5 : 6;
  const displayStep = currentStep > 3 && frequency === "daily" ? currentStep - 1 : currentStep;
  const displayTotal = totalSteps - (frequency === "daily" ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => currentStep === 1 ? router.push('/sc/dashboard') : prevStep()}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {currentStep === 1 ? 'Cancelar' : 'Voltar'}
            </button>
            <span className="text-sm text-gray-500">
              Etapa {displayStep} de {displayTotal}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(displayStep / displayTotal) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          
          {/* Step 1: Nome do Remédio */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Qual é o nome do remédio?
                </h2>
                <p className="text-gray-500">
                  Digite o nome ou escolha uma das opções abaixo
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 text-lg text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition placeholder:text-gray-400"
                  placeholder="Ex: Paracetamol"
                />
                {attemptedNext && name.trim().length === 0 && (
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <span className="text-lg">⚠️</span>
                    Digite o nome do medicamento para continuar
                  </p>
                )}

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Sugestões:</p>
                  <div className="flex flex-wrap gap-2">
                    {commonMeds.map((med) => (
                      <button
                        key={med}
                        onClick={() => setName(med)}
                        className={`px-4 py-2 text-sm rounded-lg transition ${
                          name === med 
                            ? 'bg-teal-600 text-white' 
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-600 hover:text-teal-600'
                        }`}
                      >
                        {med}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!canProceedFromStep(1)}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Horário */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <div className="flex items-center gap-2 text-teal-600 mb-4">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">{name}</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Que horas você toma?
                </h2>
                <p className="text-gray-500">
                  Escolha o horário da medicação
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 text-lg text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                {attemptedNext && time.trim().length === 0 && (
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <span className="text-lg">⚠️</span>
                    Selecione um horário para continuar
                  </p>
                )}

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Horários comuns:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {commonTimes.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`px-4 py-2 text-sm rounded-lg transition ${
                          time === t 
                            ? 'bg-teal-600 text-white' 
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-600 hover:text-teal-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!canProceedFromStep(2)}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 3: Frequência */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <div className="flex items-center gap-3 text-teal-600 mb-4 flex-wrap">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> {name}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> {time}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Com que frequência?
                </h2>
                <p className="text-gray-500">
                  É todos os dias ou apenas alguns?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setFrequency("daily")}
                  className={`p-6 text-left border-2 rounded-lg transition ${
                    frequency === "daily"
                      ? "border-teal-600 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg mb-1 text-gray-900">Todos os dias</div>
                      <div className="text-sm text-gray-500">Medicação contínua diária</div>
                    </div>
                    {frequency === "daily" && (
                      <Check className="w-6 h-6 text-teal-600" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setFrequency("weekly")}
                  className={`p-6 text-left border-2 rounded-lg transition ${
                    frequency === "weekly"
                      ? "border-teal-600 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg mb-1 text-gray-900">Dias específicos</div>
                      <div className="text-sm text-gray-500">Escolha os dias da semana</div>
                    </div>
                    {frequency === "weekly" && (
                      <Check className="w-6 h-6 text-teal-600" />
                    )}
                  </div>
                </button>
              </div>

              {attemptedNext && frequency === "" && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <span className="text-lg">⚠️</span>
                  Selecione uma frequência para continuar
                </p>
              )}

              <button
                onClick={nextStep}
                disabled={!canProceedFromStep(3)}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 4: Dias da Semana (só aparece se weekly) */}
          {currentStep === 4 && frequency === "weekly" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <div className="flex items-center gap-3 text-teal-600 mb-4 flex-wrap">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> {name}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> {time}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Quais dias da semana?
                </h2>
                <p className="text-gray-500">
                  Selecione os dias que você toma esse remédio
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {[
                    { key: "monday", label: "S" },
                    { key: "tuesday", label: "T" },
                    { key: "wednesday", label: "Q" },
                    { key: "thursday", label: "Q" },
                    { key: "friday", label: "S" },
                    { key: "saturday", label: "S" },
                    { key: "sunday", label: "D" },
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
                      className={`aspect-square p-3 text-center border-2 rounded-lg transition ${
                        selectedDays.includes(day.key)
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-gray-200 hover:border-gray-300 text-gray-900"
                      }`}
                    >
                      <div className="text-base font-medium">{day.label}</div>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Atalhos:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedDays(["monday", "tuesday", "wednesday", "thursday", "friday"])}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-teal-600 hover:text-teal-600 transition"
                    >
                      Dias úteis
                    </button>
                    <button
                      onClick={() => setSelectedDays(["saturday", "sunday"])}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-teal-600 hover:text-teal-600 transition"
                    >
                      Fins de semana
                    </button>
                  </div>
                </div>
              </div>

              {attemptedNext && selectedDays.length === 0 && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <span className="text-lg">⚠️</span>
                  Selecione pelo menos um dia da semana
                </p>
              )}

              <button
                onClick={nextStep}
                disabled={!canProceedFromStep(4)}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 5/6: Observações (opcional) */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <div className="flex items-center gap-3 text-teal-600 mb-4 flex-wrap">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> {name}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> {time}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> {frequency === "daily" ? "Diário" : `${selectedDays.length} dias`}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Alguma observação?
                </h2>
                <p className="text-gray-500">
                  Opcional: adicione lembretes ou instruções
                </p>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                autoFocus
                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none placeholder:text-gray-400"
                placeholder="Ex: Tomar com comida, evitar álcool..."
              />

              <div className="flex gap-3">
                <button
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Pular
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Tipo de Duração */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <div className="flex items-center gap-3 text-teal-600 mb-4 flex-wrap">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> {name}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> {time}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> {frequency === "daily" ? "Diário" : `${selectedDays.length} dias`}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  É uma medicação regular?
                </h2>
                <p className="text-gray-500">
                  Ou tem um período específico de tratamento?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => {
                    setDurationType("regular");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className={`p-6 text-left border-2 rounded-lg transition ${
                    durationType === "regular"
                      ? "border-teal-600 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg mb-1 text-gray-900">Medicação regular</div>
                      <div className="text-sm text-gray-500">Uso contínuo, sem data de término</div>
                    </div>
                    {durationType === "regular" && (
                      <Check className="w-6 h-6 text-teal-600" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setDurationType("period")}
                  className={`p-6 text-left border-2 rounded-lg transition ${
                    durationType === "period"
                      ? "border-teal-600 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg mb-1 text-gray-900">Período específico</div>
                      <div className="text-sm text-gray-500">Tratamento com data de início e término</div>
                    </div>
                    {durationType === "period" && (
                      <Check className="w-6 h-6 text-teal-600" />
                    )}
                  </div>
                </button>
              </div>

              {attemptedNext && durationType === "" && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <span className="text-lg">⚠️</span>
                  Selecione o tipo de duração para continuar
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </button>
                <button
                  onClick={nextStep}
                  disabled={!canProceedFromStep(6)}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 7: Período (só aparece se durationType === "period") */}
          {currentStep === 7 && durationType === "period" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <div className="flex items-center gap-3 text-teal-600 mb-4 flex-wrap">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> {name}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Check className="w-4 h-4" /> Período específico
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Qual o período do tratamento?
                </h2>
                <p className="text-gray-500">
                  Defina quando começa e termina
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Início
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Término
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Durações comuns:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '1 semana', days: 7 },
                      { label: '2 semanas', days: 14 },
                      { label: '1 mês', days: 30 },
                      { label: '3 meses', days: 90 }
                    ].map(({ label, days }) => (
                      <button
                        key={label}
                        onClick={() => {
                          const today = new Date();
                          const end = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
                          setStartDate(today.toISOString().split('T')[0]);
                          setEndDate(end.toISOString().split('T')[0]);
                        }}
                        className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-teal-600 hover:text-teal-600 transition"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {startDate && endDate && new Date(startDate) >= new Date(endDate) && (
                  <p className="text-sm text-red-600">
                    A data de término deve ser posterior à data de início
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!startDate || !endDate || new Date(startDate) >= new Date(endDate)}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  <Check className="w-5 h-5" />
                  Salvar Medicação
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}