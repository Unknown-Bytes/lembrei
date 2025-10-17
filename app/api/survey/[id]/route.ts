import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { 
      userName, 
      firstDashboardEntryAt, 
      onboardingCompletedAt, 
      dosesAdded,
      firstTimeEnteringDoseCreationArea,
      doseCreationCompletedAt,
      doses,
      userEvents
    } = body;

    // DEV: log incoming payload for debugging
    console.log('[PATCH] Updating survey:', id);
    console.log('[PATCH] Payload:', JSON.stringify(body, null, 2));

    const updateData: {
      userName?: string | null;
      firstDashboardEntryAt?: Date;
      onboardingCompletedAt?: Date;
      dosesAdded?: boolean;
      firstTimeEnteringDoseCreationArea?: Date;
      doseCreationCompletedAt?: Date;
      doses?: any;
      userEvents?: any;
    } = {};
    if (userName !== undefined) updateData.userName = userName;
    if (firstDashboardEntryAt) updateData.firstDashboardEntryAt = new Date(firstDashboardEntryAt);
    if (onboardingCompletedAt) updateData.onboardingCompletedAt = new Date(onboardingCompletedAt);
    if (dosesAdded !== undefined) updateData.dosesAdded = Boolean(dosesAdded);
    if (firstTimeEnteringDoseCreationArea) updateData.firstTimeEnteringDoseCreationArea = new Date(firstTimeEnteringDoseCreationArea);
    if (doseCreationCompletedAt) updateData.doseCreationCompletedAt = new Date(doseCreationCompletedAt);
    if (doses !== undefined) updateData.doses = doses;
    if (userEvents !== undefined) updateData.userEvents = userEvents;

    console.log('[PATCH] Update data:', JSON.stringify(updateData, null, 2));

    const survey = await prisma.survey.update({
      where: { id },
      data: updateData,
    });

    console.log('[PATCH] Survey updated successfully');
    return NextResponse.json({ success: true, survey });
  } catch (error) {
    console.error('[PATCH] Error updating survey:', error);
    console.error('[PATCH] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update survey',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
