import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Create a new survey
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName } = body;

    const survey = await prisma.survey.create({
      data: {
        startedAt: new Date(),
        userName: userName || 'Testador', // Default to "Testador" if not provided
      },
    });

    return NextResponse.json({ success: true, survey });
  } catch (error) {
    console.error('Error creating survey:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    const details = isDev && error && typeof error === 'object' ? {
      name: (error as any).name,
      message: (error as any).message,
      code: (error as any).code,
    } : undefined;
    return NextResponse.json({ success: false, error: 'Failed to create survey', details }, { status: 500 });
  }
}
