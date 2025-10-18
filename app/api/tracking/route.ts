import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Tipos dos eventos que serão recebidos
interface TrackingEvent {
  eventId: string;
  type: string;
  timestamp: string;
  sessionId: string;
  surveyId?: string;
  page: string;
  pageUrl: string;
  pageTitle: string;
  referrer?: string;
  userAgent?: string;
  screenResolution?: string;
  viewportSize?: string;
  deviceType?: string;
  language?: string;
  timezone?: string;
  element?: string;
  elementText?: string;
  value?: string;
  xPosition?: number;
  yPosition?: number;
  metadata?: Record<string, any>;
}

function getDeviceType(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  return 'desktop';
}

export async function POST(request: Request) {
  try {
    const { events } = await request.json() as { events: TrackingEvent[] };
    
    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { success: false, error: 'Invalid events data' },
        { status: 400 }
      );
    }

    // Processa cada evento
    for (const event of events) {
      try {
        const surveyId = event.surveyId || event.metadata?.surveyId;
        
        if (!surveyId) {
          console.warn('Event without surveyId:', event.type);
          continue;
        }

        // Decide o tipo de processamento baseado no evento
        switch (event.type) {
          case 'page_enter':
          case 'page_exit':
          case 'page_view':
          case 'navigation':
            await processNavigationEvent(surveyId, event, request);
            break;
          
          case 'button_click':
          case 'input_change':
          case 'input_focus':
          case 'input_blur':
          case 'scroll':
          case 'hover':
            await processInteractionEvent(surveyId, event);
            break;
          
          case 'alarm_triggered':
          case 'alarm_dismissed':
          case 'alarm_snoozed':
          case 'alarm_confirmed':
          case 'alarm_deferred':
            await processAlarmEvent(surveyId, event);
            break;
          
          case 'dose_created':
          case 'dose_updated':
          case 'dose_deleted':
            await processDoseEvent(surveyId, event);
            break;
          
          case 'error_occurred':
          case 'error_boundary':
          case 'api_error':
            await processErrorEvent(surveyId, event);
            break;
          
          default:
            // Para eventos genéricos, salvar como interação
            await processGenericEvent(surveyId, event);
        }

        // Atualiza lastActiveAt do Survey
        await prisma.survey.update({
          where: { id: surveyId },
          data: { lastActiveAt: new Date() },
        }).catch(() => {
          // Survey pode não existir ainda
        });

      } catch (error) {
        console.error(`Error processing event ${event.eventId}:`, error);
        // Continua processando outros eventos mesmo se um falhar
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in tracking endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processNavigationEvent(surveyId: string, event: TrackingEvent, request: Request) {
  await prisma.navEvent.create({
    data: {
      surveyId,
      route: event.page || event.pageUrl,
      routeFrom: event.referrer || null,
      timestamp: new Date(event.timestamp),
      duration: event.metadata?.timeSpent || null,
      exitTimestamp: event.metadata?.exitedAt ? new Date(event.metadata.exitedAt) : null,
      deviceType: event.deviceType || getDeviceType(event.userAgent || ''),
      screenSize: event.screenResolution || null,
      viewportSize: event.viewportSize || null,
      userAgent: event.userAgent || null,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      language: event.language || null,
      timezone: event.timezone || null,
      sessionId: event.sessionId || null,
      scrollDepth: event.metadata?.maxScrollDepth || null,
      clickCount: event.metadata?.interactions || null,
      metadata: event.metadata || undefined,
    },
  });
}

async function processInteractionEvent(surveyId: string, event: TrackingEvent) {
  await prisma.interaction.create({
    data: {
      surveyId,
      type: event.type,
      element: event.element || 'unknown',
      elementText: event.elementText || null,
      page: event.page,
      value: event.value || null,
      xPosition: event.xPosition || null,
      yPosition: event.yPosition || null,
      sessionId: event.sessionId || null,
      timestamp: new Date(event.timestamp),
      metadata: event.metadata || undefined,
    },
  });
}

async function processAlarmEvent(surveyId: string, event: TrackingEvent) {
  const doseId = event.metadata?.doseId;
  
  // Verifica se o survey existe antes de criar o registro
  const surveyExists = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { id: true }
  });
  
  if (!surveyExists) {
    console.warn('[processAlarmEvent] Survey not found:', surveyId, '- skipping alarm interaction');
    return;
  }
  
  await prisma.alarmInteraction.create({
    data: {
      surveyId,
      doseId: doseId || null,
      action: event.type.replace('alarm_', ''),
      timestamp: new Date(event.timestamp),
      scheduledTime: event.metadata?.scheduledTime || null,
      actualTime: event.metadata?.actualTime || new Date(event.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      responseTime: event.metadata?.responseTimeSeconds || null,
      snoozeDuration: event.metadata?.snoozeDuration || null,
      source: event.metadata?.source || 'unknown',
      deviceState: event.metadata?.deviceState || null,
      metadata: event.metadata || undefined,
    },
  });

  // Atualiza contadores no Survey
  const action = event.type.replace('alarm_', '');
  if (action === 'triggered') {
    await prisma.survey.update({
      where: { id: surveyId },
      data: { totalAlarmsSet: { increment: 1 } },
    }).catch(() => {});
  } else if (action === 'dismissed') {
    await prisma.survey.update({
      where: { id: surveyId },
      data: { totalAlarmsDismissed: { increment: 1 } },
    }).catch(() => {});
  } else if (action === 'snoozed') {
    await prisma.survey.update({
      where: { id: surveyId },
      data: { totalAlarmsSnoozed: { increment: 1 } },
    }).catch(() => {});
  }
}

async function processDoseEvent(surveyId: string, event: TrackingEvent) {
  // Dose events are handled by the dose-specific APIs
  // This is just for logging
  console.log('Dose event:', event.type, event.metadata?.doseId);
}

async function processErrorEvent(surveyId: string, event: TrackingEvent) {
  await prisma.errorLog.create({
    data: {
      surveyId: surveyId || null,
      errorType: event.metadata?.type || 'javascript',
      errorMessage: event.metadata?.errorMessage || 'Unknown error',
      errorStack: event.metadata?.errorStack || null,
      page: event.page || null,
      userAgent: event.userAgent || null,
      timestamp: new Date(event.timestamp),
      componentStack: event.metadata?.componentStack || null,
      severity: event.metadata?.severity || 'medium',
      metadata: event.metadata || undefined,
    },
  });
}

async function processGenericEvent(surveyId: string, event: TrackingEvent) {
  // Para eventos que não se encaixam em outras categorias
  await prisma.interaction.create({
    data: {
      surveyId,
      type: event.type,
      element: event.element || 'generic',
      page: event.page,
      value: event.metadata ? JSON.stringify(event.metadata) : null,
      sessionId: event.sessionId || null,
      timestamp: new Date(event.timestamp),
      metadata: event.metadata || undefined,
    },
  });
}

export const dynamic = 'force-dynamic';
