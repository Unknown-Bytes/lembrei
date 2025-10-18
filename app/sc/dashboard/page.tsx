"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSurvey } from '@/contexts/SurveyContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pill, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';


export default function Dashboard() {
  const router = useRouter();
  const { surveyData, addUserEvent, loading: contextLoading } = useSurvey();

  const [checked, setChecked] = useState<number[]>([]);

  type Medication = { name: string; dose: string; time: string };
  const medications: Medication[] = [
    { name: 'Aspirina', dose: '500mg', time: '8:00 AM' },
    { name: 'Metformina', dose: '1000mg', time: '12:00 PM' },
    { name: 'Atorvastatina', dose: '20mg', time: '6:00 PM' },
    { name: 'Lisinopril', dose: '10mg', time: '9:00 PM' },
    { name: 'Omeprazol', dose: '40mg', time: '7:00 AM' },
  ];

  const toggleCheck = (index: number) => {
    setChecked((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

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
    
    console.log('Modal check:', { promptShown, acknowledgedAt, shouldShow: !promptShown && !acknowledgedAt });
    
    // If not shown and not acknowledged, open the modal
    if (!promptShown && !acknowledgedAt) {
      console.log('Opening modal!');
      localStorage.setItem('addDosePromptShown', 'true');
    }

    // Record first dashboard entry if not already recorded
    const hasRecordedEntry = localStorage.getItem('dashboardEntryRecorded');
    if (surveyData?.surveyId && !hasRecordedEntry) {
      const now = new Date().toISOString();
      
      // Save to database
      fetch(`/api/survey/${surveyData.surveyId}`, {
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

      // Add to userEvents through context
      addUserEvent({ type: 'first_dashboard_entry' });
    }
  }, [router, surveyData, addUserEvent, contextLoading]);

  // Modal não implementado nesta tela; apenas registramos no localStorage via efeito acima

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
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col gap-4">
      <header className="flex justify-between items-center mt-2">
        <h1 className="text-lg font-semibold text-black">Olá, Ana!</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon"><Clock className="h-5 w-5" /></Button>
          <Button variant="outline" size="icon"><Pill className="h-5 w-5" /></Button>
        </div>
      </header>

      <p className="text-gray-600 text-sm">Hoje: <strong>3 de 4 doses tomadas</strong></p>

      <motion.div
        className="relative flex flex-col items-center justify-center bg-white rounded-2xl shadow p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#E5E7EB" strokeWidth="10" fill="none" />
            <circle cx="64" cy="64" r="56" stroke="#0D9488" strokeWidth="10" fill="none" strokeDasharray="351" strokeDashoffset="60" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-black">15</span>
            <span className="text-xs text-gray-500">dias seguidos!</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">Você está indo muito bem!</p>
      </motion.div>

      <div className="p-4 pb-16">
      <Card className="mb-4 bg-teal-100 text-teal-800 border-0">
        <CardContent className="text-sm py-3">
          <p>Próxima dose: <strong>Paracetamol 500mg</strong></p>
          <p>Hoje às <strong>14:00</strong></p>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-base font-semibold mb-1 text-gray-600">Minha rotina</h2>
        <p className="text-sm text-gray-600 mb-2">Meu progresso:</p>
        <Card className="p-3 bg-teal-100 text-teal-800 border-0">
          <p className="text-sm mb-1">Próxima conquista: <strong>7 dias seguidos!</strong></p>
          <Progress value={70} className="h-2" />
        </Card>
      </section>

      <section className="grid grid-cols-3 gap-2 mt-3">
        <Button className="flex flex-col items-center justify-center h-20 bg-teal-100 text-teal-800">
          <Pill className="h-6 w-6 mb-1" /> Remédios
        </Button>
        <Button className="flex flex-col items-center justify-center h-20 bg-teal-100 text-teal-800">
          <Plus className="h-6 w-6 mb-1" /> Adicionar dose
        </Button>
        <Button className="flex flex-col items-center justify-center h-20 bg-teal-100 text-teal-800">
          <Clock className="h-6 w-6 mb-1" /> Histórico
        </Button>
      </section>

      <section className="mt-3">
        <h2 className="text-base font-semibold mb-2 text-gray-600">Minha semana</h2>
        <div className="flex gap-2 justify-between">
          {[7,8,9,10,11,12,13].map((day, i) => (
            <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-full ${day <= 11 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{day}</div>
          ))}
        </div>
      </section>

      <section className="mt-3">
        <h2 className="text-base font-semibold mb-2 mt-2 text-gray-600">Medicação Próxima</h2>
        <Card className="divide-y">
          {medications.map((med, index) => (
            <label key={index} className="flex items-center justify-between p-3">
              <div>
                <input type="checkbox" checked={checked.includes(index)} onChange={() => toggleCheck(index)} className="mr-2" />
                <span className="font-medium text-gray-600">{med.name}</span>
                <p className="text-xs text-gray-500">Dosagem: {med.dose}, Horário: {med.time}</p>
              </div>
              {checked.includes(index) && <CheckCircle2 className="text-teal-600" />}
            </label>
          ))}
        </Card>
        <Button className="mt-3 w-full bg-teal-100 text-teal-800">Ver todos</Button>
      </section>

      <nav className="flex justify-around fixed bottom-0 left-0 w-full bg-white py-2 border-t">
        <Button variant="ghost" size="icon"><Pill /></Button>
        <Button variant="ghost" size="icon"><Plus /></Button>
        <Button variant="ghost" size="icon"><Clock /></Button>
      </nav>
      </div>
    </div>
  );
}