"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewDosePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    const dosesRaw = localStorage.getItem("doses") || "[]";
    const doses = JSON.parse(dosesRaw);
    const newDose = {
      id: `dose_${Date.now()}`,
      name,
      time,
      notes,
      createdAt: new Date().toISOString(),
    };
    doses.push(newDose);
    localStorage.setItem("doses", JSON.stringify(doses));
    // If the user acknowledged the add-dose prompt earlier, record how long it took
    try {
      const ackAt = localStorage.getItem('addDosePromptAcknowledgedAt');
      if (ackAt) {
        const now = new Date().toISOString();
        const elapsedMs = Date.now() - new Date(ackAt).getTime();
        const eventsRaw = localStorage.getItem('userEvents') || '[]';
        const events = JSON.parse(eventsRaw);
        events.push({ type: 'dose_created_after_prompt', at: now, acknowledgedAt: ackAt, elapsedMs, doseId: newDose.id });
        localStorage.setItem('userEvents', JSON.stringify(events));
      }
    } catch (e) {
      console.warn('Could not record dose timing event', e);
    }
    // navigate back to dashboard
    router.push('/sc/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Adicionar nova dose</h1>

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 rounded-lg border-gray-200 p-3 focus:ring-2 focus:ring-teal-200"
            placeholder="Ex: Aspirina"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Horário</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full mt-1 rounded-lg border-gray-200 p-3 focus:ring-2 focus:ring-teal-200"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-600">Notas (opcional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full mt-1 rounded-lg border-gray-200 p-3 focus:ring-2 focus:ring-teal-200"
            rows={3}
          />
        </label>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/sc/dashboard')}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !time}
            className="flex-1 bg-teal-500 text-white py-3 rounded-lg disabled:opacity-50"
          >
            Salvar dose
          </button>
        </div>
      </div>
    </div>
  );
}
