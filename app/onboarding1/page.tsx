"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logOnboardingVisit, validateCurrentUser } from "@/lib/onboardingUtils";

export default function Onboarding1() {
  const router = useRouter();

  useEffect(() => {
    // Check if user exists
    const userData = localStorage.getItem("currentUser");
    if (!userData) {
      router.push("/");
      return;
    }
    // log visit
    logOnboardingVisit("onboarding1_view");

    // validate stored user and print warnings
    const validation = validateCurrentUser();
    if (!validation.ok) {
      console.warn("currentUser validation issues:", validation.issues);
    }
  }, [router]);

  const handleNext = () => {
    router.push("/onboarding2");
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white px-6 py-8">
      <div className="w-full max-w-md flex flex-col justify-between min-h-[600px]">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-12 h-1.5 bg-teal-500 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full transition-all"></div>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full transition-all"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center space-y-6 animate-fadeIn">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Bem
              <br />
              vindo(a)! 👋
            </h1>
            <p className="text-xl md:text-2xl text-teal-700 mb-4 font-semibold">
              Nunca mais esqueça seus remédios!
            </p>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Vamos te ajudar a criar uma rotina simples e segura para tomar seus
              medicamentos no horário certo.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-3 mt-8">
          <button
            onClick={handleNext}
            className="w-full bg-teal-500 text-white text-lg font-semibold py-4 rounded-2xl shadow-lg hover:bg-teal-600 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            aria-label="Ir para próxima etapa"
          >
            Vamos começar
          </button>
        </div>
      </div>
    </div>
  );
}
