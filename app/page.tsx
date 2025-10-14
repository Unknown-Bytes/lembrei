'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(162.17deg, #80C2BA 0%, #FFFFFF 100%)' }}>
      {/* Hero Image Section */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image 
              src="/logo.svg" 
              alt="Lembrei!" 
              width={300} 
              height={80}
              priority
              className="h-auto"
            />
          </div>

          {/* Main Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Organize sua saúde,
            <br />
            compartilhe cuidado.
          </h1>

          <p className="text-lg text-gray-700 max-w-md mx-auto mb-12">
            Uma nova forma de gerenciar sua saúde e bem-estar.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col items-center justify-center px-6 pb-16">
        {/* Start Button */}
        <Link href="/register" className="w-full max-w-md">
          <button
            className="w-full bg-teal-300 hover:bg-teal-400 text-white text-2xl font-bold py-6 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Começar
          </button>
        </Link>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            © 2025 Lembrei!. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
