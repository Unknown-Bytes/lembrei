import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { surveyId, answers, timestamp, timeToComplete } = body;

    if (!surveyId) {
      return NextResponse.json(
        { success: false, error: 'Survey ID is required' },
        { status: 400 }
      );
    }

    // Mapear as respostas para o formato do banco
    const feedbackData = {
      surveyId,
      easeOfUse: answers[1] || null,              // Pergunta 1
      clarityOfInstructions: answers[2] || null,  // Pergunta 2
      perceivedSpeed: answers[3] || null,         // Pergunta 3
      confidenceInUse: answers[4] || null,        // Pergunta 4
      intentionToUse: answers[5] || null,         // Pergunta 5
      missingFeatures: answers[6] || null,        // Pergunta 6 (texto)
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      timeToComplete: timeToComplete || null,
      source: 'in_app',
      metadata: {
        rawAnswers: answers,
        userAgent: request.headers.get('user-agent'),
        completedAt: new Date().toISOString(),
      },
    };

    // Verificar se o nome do usuário é "Testador" e atualizar se necessário
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: { userName: true },
    });

    if (survey?.userName === 'Testador') {
      const anonymizedName = `testador_${surveyId.substring(0, 10)}`;
      await prisma.survey.update({
        where: { id: surveyId },
        data: {
          userName: anonymizedName,
          feedbackCompletedAt: new Date(),
          lastActiveAt: new Date(),
        },
      });
      console.log(`[Feedback] Updated userName from "Testador" to "${anonymizedName}"`);
    } else {
      // Apenas atualizar feedbackCompletedAt e lastActiveAt
      await prisma.survey.update({
        where: { id: surveyId },
        data: {
          feedbackCompletedAt: new Date(),
          lastActiveAt: new Date(),
        },
      });
    }

    // Criar registro de feedback
    const feedback = await prisma.feedback.create({
      data: feedbackData,
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
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
