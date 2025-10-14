"use client";

import { SurveyProvider } from '@/contexts/SurveyContext';

export default function SCLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SurveyProvider>{children}</SurveyProvider>;
}
