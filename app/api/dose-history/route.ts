import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      surveyId,
      doseId,
      action, // taken, missed, skipped, snoozed
      scheduledTime,
      actualTime,
      takenOnTime,
      delayMinutes,
      source, // dashboard, alarm, manual
      notes,
      metadata,
    } = body;

    if (!surveyId || !doseId || !action) {
      return NextResponse.json(
        { success: false, error: 'Survey ID, Dose ID, and action are required' },
        { status: 400 }
      );
    }

    // Create dose history entry
    const history = await prisma.doseHistory.create({
      data: {
        surveyId,
        doseId,
        action,
        scheduledTime: scheduledTime || null,
        actualTime: actualTime || null,
        takenOnTime: takenOnTime ?? null,
        delayMinutes: delayMinutes || null,
        source: source || 'manual',
        notes: notes || null,
        metadata: metadata || undefined,
      },
    });

    // Update dose counters
    if (action === 'taken') {
      await prisma.dose.update({
        where: { id: doseId },
        data: {
          totalTaken: { increment: 1 },
          lastTakenAt: new Date(),
        },
      });

      // Update survey counter
      await prisma.survey.update({
        where: { id: surveyId },
        data: {
          totalDosesTaken: { increment: 1 },
          lastActiveAt: new Date(),
        },
      });
    } else if (action === 'missed') {
      await prisma.dose.update({
        where: { id: doseId },
        data: {
          totalMissed: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      historyId: history.id,
    });
  } catch (error) {
    console.error('Error saving dose history:', error);
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
