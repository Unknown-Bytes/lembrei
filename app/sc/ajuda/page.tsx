import Link from 'next/link';
import { Target } from 'lucide-react';

export default function AjudaPage() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-lg font-bold mb-4">Ajuda</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Target className="w-6 h-6 text-gray-500" />
        </div>
        <p className="text-sm text-gray-500 mb-4">Precisa de suporte ou informações?</p>
        <Link href="mailto:suporte@lembrei.com" className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition">
          Fale com o suporte
        </Link>
      </div>
    </div>
  );
}
