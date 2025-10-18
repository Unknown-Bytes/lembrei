import Link from 'next/link';
import { Bell } from 'lucide-react';

export default function AlertasPage() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-lg font-bold mb-4">Alertas</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Bell className="w-6 h-6 text-yellow-500" />
        </div>
        <p className="text-sm text-gray-500 mb-4">Nenhum alerta configurado ainda.</p>
        <Link href="/sc/doses/new" className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition">
          Adicionar dose para configurar alerta
        </Link>
      </div>
    </div>
  );
}
