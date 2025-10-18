"use client";

import Link from 'next/link';
import { Users, Bell, Calendar, Lock, ArrowLeft, Sparkles } from 'lucide-react';

export default function FamiliaPage() {
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
              <h1 className="text-xl font-semibold text-gray-900">Família</h1>
            </div>
            <div className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Em breve
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100 p-8 text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Users className="w-10 h-10 text-teal-600" />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">Cuidado Familiar Conectado</h2>
            <Sparkles className="w-5 h-5 text-teal-600" />
          </div>
          
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Em breve você poderá adicionar familiares para acompanhar e gerenciar medicações de quem você ama. 
            Mantenha todos seguros e organizados em um só lugar.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Múltiplos Perfis</h3>
              <p className="text-sm text-gray-500">Gerencie medicações de toda a família em um único app</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Lembretes Personalizados</h3>
              <p className="text-sm text-gray-500">Receba notificações para cada familiar no horário certo</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Histórico Completo</h3>
              <p className="text-sm text-gray-500">Acompanhe a adesão ao tratamento de cada pessoa</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Quer ser avisado quando lançarmos?
          </h3>
          <p className="text-gray-500 mb-6">
            Estamos trabalhando para trazer essa funcionalidade em breve. Continue usando o app e fique atento às novidades!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/sc/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div>
            <p className="text-sm text-blue-900 font-medium mb-1">Versão de Testes</p>
            <p className="text-sm text-blue-700">
              Esta é uma versão de demonstração. A funcionalidade de família estará disponível na versão completa do aplicativo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}