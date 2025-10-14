import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { userName, firstDashboardEntryAt, onboardingCompletedAt, dosesAdded } = body;

  // DEV: log incoming payload for debugging
  try { console.debug('[PATCH] payload for survey', id, body); } catch(e){/* ignore */}

  const updateData: {
      userName?: string | null;
      firstDashboardEntryAt?: Date;
      onboardingCompletedAt?: Date;
      dosesAdded?: boolean;
    } = {};
    if (userName !== undefined) updateData.userName = userName;
    if (firstDashboardEntryAt) updateData.firstDashboardEntryAt = new Date(firstDashboardEntryAt);
    if (onboardingCompletedAt) updateData.onboardingCompletedAt = new Date(onboardingCompletedAt);
    if (dosesAdded !== undefined) updateData.dosesAdded = Boolean(dosesAdded);

    const survey = await prisma.survey.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, survey });
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update survey' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const survey = await prisma.survey.findUnique({
      where: { id },
    });

    if (!survey) {
      return NextResponse.json(
        { success: false, error: 'Survey not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch survey' },
      { status: 500 }
    );
  }
}
