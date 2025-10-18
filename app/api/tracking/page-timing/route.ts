import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      surveyId,
      sessionId,
      page,
      enteredAt,
      exitedAt,
      timeSpent,
      interactions,
      maxScrollDepth,
      loadTime,
      metadata,
    } = body;

    if (!surveyId || !page) {
      return NextResponse.json(
        { success: false, error: 'Survey ID and page are required' },
        { status: 400 }
      );
    }

    // Criar registro de page timing
    const timing = await prisma.pageTiming.create({
      data: {
        surveyId,
        sessionId: sessionId || 'unknown',
        page,
        enteredAt: enteredAt ? new Date(enteredAt) : new Date(),
        exitedAt: exitedAt ? new Date(exitedAt) : null,
        timeSpent: timeSpent || null,
        loadTime: loadTime || null,
        interactions: interactions || 0,
        scrollDepthMax: maxScrollDepth || null,
        metadata: metadata || undefined,
      },
    });

    // Atualizar contadores do survey
    await prisma.survey.update({
      where: { id: surveyId },
      data: {
        totalPageViews: { increment: 1 },
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      timingId: timing.id,
    });
  } catch (error) {
    console.error('Error saving page timing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
