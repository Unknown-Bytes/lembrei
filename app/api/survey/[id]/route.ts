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
      secondDashboardEntryAt,
      onboardingCompletedAt, 
      dosesAdded,
      firstTimeEnteringDoseCreationArea,
      doseCreationCompletedAt,
      firstTimeViewingDosesList,
      alarmModalAcknowledgedAt,
      doses,
      userEvents
    } = body;

    // DEV: log incoming payload for debugging
    console.log('[PATCH] Updating survey:', id);
    console.log('[PATCH] Payload:', JSON.stringify(body, null, 2));

    const updateData: any = {};
    if (userName !== undefined) updateData.userName = userName;
    if (firstDashboardEntryAt) updateData.firstDashboardEntryAt = new Date(firstDashboardEntryAt);
    if (secondDashboardEntryAt) updateData.secondDashboardEntryAt = new Date(secondDashboardEntryAt);
    if (onboardingCompletedAt) updateData.onboardingCompletedAt = new Date(onboardingCompletedAt);
    if (dosesAdded !== undefined) updateData.dosesAdded = Boolean(dosesAdded);
    if (firstTimeEnteringDoseCreationArea) updateData.firstTimeEnteringDoseCreationArea = new Date(firstTimeEnteringDoseCreationArea);
    if (doseCreationCompletedAt) updateData.doseCreationCompletedAt = new Date(doseCreationCompletedAt);
    if (firstTimeViewingDosesList) updateData.firstTimeViewingDosesList = new Date(firstTimeViewingDosesList);
    if (alarmModalAcknowledgedAt) updateData.alarmModalAcknowledgedAt = new Date(alarmModalAcknowledgedAt);
    
    // Handle doses as Prisma nested writes
    if (doses !== undefined && Array.isArray(doses)) {
      console.log('[PATCH] Processing', doses.length, 'doses for upsert');
      
      // First, get existing dose IDs
      const existingSurvey = await prisma.survey.findUnique({
        where: { id },
        include: { doses: { select: { id: true } } }
      });
      
      const existingDoseIds = new Set(existingSurvey?.doses.map(d => d.id) || []);
      const newDoseIds = new Set(doses.map((d: any) => d.id));
      
      // Find doses to delete (exist in DB but not in new list)
      const dosesToDelete = Array.from(existingDoseIds).filter(doseId => !newDoseIds.has(doseId));
      
      console.log('[PATCH] Doses to delete:', dosesToDelete.length);
      console.log('[PATCH] Doses to upsert:', doses.length);
      
      // Delete removed doses first
      if (dosesToDelete.length > 0) {
        await prisma.dose.deleteMany({
          where: {
            id: { in: dosesToDelete },
            surveyId: id
          }
        });
        console.log('[PATCH] Deleted', dosesToDelete.length, 'doses');
      }
      
      // Then upsert each dose individually
      let newDosesCreated = 0;
      for (const dose of doses) {
        try {
          const result = await prisma.dose.upsert({
            where: { id: dose.id },
            create: {
              id: dose.id,
              surveyId: id,
              name: dose.name,
              time: dose.time,
              notes: dose.notes || '',
              frequency: dose.frequency,
              selectedDays: dose.selectedDays || [],
              startDate: dose.startDate || null,
              endDate: dose.endDate || null,
            },
            update: {
              name: dose.name,
              time: dose.time,
              notes: dose.notes || '',
              frequency: dose.frequency,
              selectedDays: dose.selectedDays || [],
              startDate: dose.startDate || null,
              endDate: dose.endDate || null,
            },
            select: { createdAt: true, updatedAt: true }
          });
          
          // Check if this was a creation (createdAt === updatedAt)
          if (result.createdAt.getTime() === result.updatedAt.getTime()) {
            newDosesCreated++;
          }
        } catch (error) {
          console.error('[PATCH] Error upserting dose:', dose.id, error);
          throw error; // Re-throw to fail the whole operation
        }
      }
      
      // Update totalDosesCreated counter
      if (newDosesCreated > 0) {
        updateData.totalDosesCreated = { increment: newDosesCreated };
        console.log('[PATCH] Incrementing totalDosesCreated by', newDosesCreated);
      }
      
      console.log('[PATCH] Successfully upserted', doses.length, 'doses');
    }
    
    if (userEvents !== undefined) updateData.userEvents = userEvents;

    console.log('[PATCH] Update data prepared (excluding doses)');


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
      include: {
        doses: true, // Include related doses
      }
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
