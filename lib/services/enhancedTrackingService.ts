/**
 * Enhanced Tracking Service - Coleta Científica de Dados
 * 
 * Este serviço coleta dados detalhados sobre:
 * - Tempo de permanência em cada página
 * - Interações do usuário (cliques, inputs, scrolls)
 * - Performance e métricas de carregamento
 * - Comportamento de navegação
 * - Erros e exceções
 */

import { v4 as uuidv4 } from 'uuid';

// Tipos de eventos expandidos
export enum TrackingEventType {
  // Navegação
  PAGE_ENTER = 'page_enter',
  PAGE_EXIT = 'page_exit',
  PAGE_VIEW = 'page_view',
  NAVIGATION = 'navigation',
  
  // Interações com UI
  BUTTON_CLICK = 'button_click',
  INPUT_CHANGE = 'input_change',
  INPUT_FOCUS = 'input_focus',
  INPUT_BLUR = 'input_blur',
  SCROLL = 'scroll',
  HOVER = 'hover',
  
  // Doses
  DOSE_CREATED = 'dose_created',
  DOSE_UPDATED = 'dose_updated',
  DOSE_DELETED = 'dose_deleted',
  DOSE_TAKEN = 'dose_taken',
  DOSE_MISSED = 'dose_missed',
  DOSE_SNOOZED = 'dose_snoozed',
  DOSE_MARKED = 'dose_marked',
  
  // Alarmes
  ALARM_TRIGGERED = 'alarm_triggered',
  ALARM_DISMISSED = 'alarm_dismissed',
  ALARM_SNOOZED = 'alarm_snoozed',
  ALARM_CONFIRMED = 'alarm_confirmed',
  ALARM_DEFERRED = 'alarm_deferred',
  
  // Feedback
  FEEDBACK_STARTED = 'feedback_started',
  FEEDBACK_QUESTION_ANSWERED = 'feedback_question_answered',
  FEEDBACK_SUBMITTED = 'feedback_submitted',
  FEEDBACK_SKIPPED = 'feedback_skipped',
  
  // Onboarding
  ONBOARDING_STARTED = 'onboarding_started',
  ONBOARDING_STEP = 'onboarding_step',
  ONBOARDING_COMPLETED = 'onboarding_completed',
  
  // Erros
  ERROR_OCCURRED = 'error_occurred',
  ERROR_BOUNDARY = 'error_boundary',
  API_ERROR = 'api_error',
  
  // Performance
  PAGE_LOAD = 'page_load',
  SLOW_INTERACTION = 'slow_interaction',
}

interface PageTiming {
  page: string;
  enteredAt: Date;
  exitedAt?: Date;
  timeSpent?: number;
  interactions: number;
  maxScrollDepth: number;
}

interface EventPayload {
  eventId: string;
  type: TrackingEventType;
  timestamp: Date;
  surveyId?: string;
  sessionId: string;
  
  // Dados da página
  page: string;
  pageUrl: string;
  pageTitle: string;
  referrer?: string;
  
  // Dados do dispositivo
  userAgent?: string;
  screenResolution?: string;
  viewportSize?: string;
  deviceType?: string;
  language?: string;
  timezone?: string;
  
  // Dados do evento
  element?: string;
  elementText?: string;
  value?: string;
  xPosition?: number;
  yPosition?: number;
  
  // Performance
  loadTime?: number;
  timeToInteractive?: number;
  
  // Metadados
  metadata?: Record<string, any>;
}

class EnhancedTrackingService {
  private sessionId: string;
  private surveyId: string | null = null;
  private isInitialized: boolean = false;
  
  // Controle de página atual
  private currentPage: string = '';
  private pageEnteredAt: Date = new Date();
  private pageInteractionCount: number = 0;
  private maxScrollDepth: number = 0;
  
  // Fila de eventos
  private eventQueue: EventPayload[] = [];
  private isProcessingQueue: boolean = false;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 10000; // 10 segundos
  private flushIntervalId: NodeJS.Timeout | null = null;
  
  // Timers
  private scrollTimer: NodeJS.Timeout | null = null;
  private hoverTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'server-session';
    
    let sessionId = sessionStorage.getItem('tracking_session_id');
    if (!sessionId) {
      sessionId = `sess_${uuidv4()}`;
      sessionStorage.setItem('tracking_session_id', sessionId);
    }
    
    return sessionId;
  }

  public setSurveyId(surveyId: string): void {
    this.surveyId = surveyId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tracking_survey_id', surveyId);
    }
  }

  private getSurveyId(): string | undefined {
    if (this.surveyId) return this.surveyId;
    if (typeof window === 'undefined') return undefined;
    
    const storedId = localStorage.getItem('tracking_survey_id') || localStorage.getItem('surveyId');
    if (storedId) {
      this.surveyId = storedId;
      return storedId;
    }
    
    return undefined;
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Track page entry
    this.onPageEnter();

    // Setup navigation tracking
    this.setupNavigationTracking();
    
    // Setup interaction tracking
    this.setupInteractionTracking();
    
    // Setup scroll tracking
    this.setupScrollTracking();
    
    // Setup performance tracking
    this.setupPerformanceTracking();
    
    // Setup error tracking
    this.setupErrorTracking();
    
    // Setup periodic flush
    this.setupPeriodicFlush();
    
    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.onPageExit();
        this.flushQueue(true);
      } else {
        this.onPageEnter();
      }
    });
    
    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.onPageExit();
      this.flushQueue(true);
    });

    this.isInitialized = true;
  }

  private setupNavigationTracking(): void {
    // Track route changes (for SPAs)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = (...args) => {
      this.onPageExit();
      originalPushState.apply(window.history, args);
      this.onPageEnter();
    };

    window.history.replaceState = (...args) => {
      this.onPageExit();
      originalReplaceState.apply(window.history, args);
      this.onPageEnter();
    };

    window.addEventListener('popstate', () => {
      this.onPageExit();
      this.onPageEnter();
    });
  }

  private setupInteractionTracking(): void {
    // Track clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const element = this.getElementSelector(target);
      const elementText = target.textContent?.trim().substring(0, 100);
      
      this.pageInteractionCount++;
      
      this.trackEvent(TrackingEventType.BUTTON_CLICK, {
        element,
        elementText,
        xPosition: e.clientX,
        yPosition: e.clientY,
        tagName: target.tagName,
        className: target.className,
      });
    }, true);

    // Track inputs
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const element = this.getElementSelector(target);
        
        this.pageInteractionCount++;
        
        this.trackEvent(TrackingEventType.INPUT_CHANGE, {
          element,
          inputType: target.type,
          hasValue: !!target.value,
          valueLength: target.value?.length || 0,
        });
      }
    }, true);

    // Track focus
    document.addEventListener('focus', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const element = this.getElementSelector(target);
        
        this.trackEvent(TrackingEventType.INPUT_FOCUS, {
          element,
          inputType: (target as HTMLInputElement).type,
        });
      }
    }, true);
  }

  private setupScrollTracking(): void {
    document.addEventListener('scroll', () => {
      if (this.scrollTimer) {
        clearTimeout(this.scrollTimer);
      }
      
      this.scrollTimer = setTimeout(() => {
        const scrollDepth = this.calculateScrollDepth();
        if (scrollDepth > this.maxScrollDepth) {
          this.maxScrollDepth = scrollDepth;
        }
        
        // Track significant scroll milestones
        if ([25, 50, 75, 90, 100].includes(scrollDepth) && scrollDepth > this.maxScrollDepth - 5) {
          this.trackEvent(TrackingEventType.SCROLL, {
            scrollDepth,
            scrollY: window.scrollY,
            documentHeight: document.documentElement.scrollHeight,
          });
        }
      }, 500);
    }, { passive: true });
  }

  private setupPerformanceTracking(): void {
    if ('performance' in window && 'PerformanceObserver' in window) {
      // Track page load performance
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (perfData) {
            this.trackEvent(TrackingEventType.PAGE_LOAD, {
              loadTime: perfData.loadEventEnd - perfData.fetchStart,
              domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
              timeToInteractive: perfData.domInteractive - perfData.fetchStart,
              transferSize: (perfData as any).transferSize,
            });
          }
        }, 0);
      });
    }
  }

  private setupErrorTracking(): void {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackEvent(TrackingEventType.ERROR_OCCURRED, {
        errorMessage: event.message,
        errorStack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, true);
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent(TrackingEventType.ERROR_OCCURRED, {
        errorMessage: event.reason?.message || String(event.reason),
        errorStack: event.reason?.stack,
        type: 'unhandled_rejection',
      }, true);
    });
  }

  private setupPeriodicFlush(): void {
    this.flushIntervalId = setInterval(() => {
      this.flushQueue();
    }, this.FLUSH_INTERVAL);
  }

  private onPageEnter(): void {
    this.currentPage = window.location.pathname;
    this.pageEnteredAt = new Date();
    this.pageInteractionCount = 0;
    this.maxScrollDepth = 0;

    this.trackEvent(TrackingEventType.PAGE_ENTER, {
      referrer: document.referrer,
    });
  }

  private onPageExit(): void {
    if (!this.currentPage) return;

    const exitedAt = new Date();
    const timeSpent = exitedAt.getTime() - this.pageEnteredAt.getTime();

    this.trackEvent(TrackingEventType.PAGE_EXIT, {
      timeSpent,
      interactions: this.pageInteractionCount,
      maxScrollDepth: this.maxScrollDepth,
    });

    // Send timing data to server
    this.sendPageTiming({
      page: this.currentPage,
      enteredAt: this.pageEnteredAt,
      exitedAt,
      timeSpent,
      interactions: this.pageInteractionCount,
      maxScrollDepth: this.maxScrollDepth,
    });
  }

  private calculateScrollDepth(): number {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const scrollable = documentHeight - windowHeight;
    
    if (scrollable <= 0) return 100;
    
    return Math.min(100, Math.round((scrollTop / scrollable) * 100));
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.trim()).slice(0, 2).join('.');
      if (classes) return `.${classes}`;
    }
    return element.tagName.toLowerCase();
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
    return 'desktop';
  }

  public trackEvent(
    type: TrackingEventType,
    metadata: Record<string, any> = {},
    immediate = false
  ): void {
    const event: EventPayload = {
      eventId: `evt_${uuidv4()}`,
      type,
      timestamp: new Date(),
      surveyId: this.getSurveyId(),
      sessionId: this.sessionId,
      page: window.location.pathname,
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceType: this.getDeviceType(),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      metadata: {
        ...metadata,
        surveyId: this.getSurveyId(),
      },
    };

    this.eventQueue.push(event);

    if (this.eventQueue.length > this.MAX_QUEUE_SIZE) {
      this.eventQueue = this.eventQueue.slice(-this.MAX_QUEUE_SIZE);
    }

    if (immediate || this.eventQueue.length >= this.BATCH_SIZE) {
      this.flushQueue();
    }
  }

  private async flushQueue(force = false): Promise<void> {
    if (this.isProcessingQueue || (!force && this.eventQueue.length < this.BATCH_SIZE)) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const eventsToSend = this.eventQueue.splice(0, this.BATCH_SIZE);

      if (eventsToSend.length === 0) {
        return;
      }

      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend }),
        keepalive: force, // Use keepalive for beforeunload
      });

      if (!response.ok) {
        console.error('Failed to send tracking events:', await response.text());
        // Requeue events on error
        this.eventQueue.unshift(...eventsToSend);
      }
    } catch (error) {
      console.error('Error sending tracking events:', error);
    } finally {
      this.isProcessingQueue = false;

      if (this.eventQueue.length > 0) {
        setTimeout(() => this.flushQueue(), 1000);
      }
    }
  }

  private async sendPageTiming(timing: PageTiming): Promise<void> {
    try {
      await fetch('/api/tracking/page-timing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: this.getSurveyId(),
          sessionId: this.sessionId,
          ...timing,
        }),
      });
    } catch (error) {
      console.error('Error sending page timing:', error);
    }
  }

  // Helper methods for common events
  public trackDoseCreated(doseData: any): void {
    this.trackEvent(TrackingEventType.DOSE_CREATED, doseData, true);
  }

  public trackDoseTaken(doseId: string, metadata: Record<string, any> = {}): void {
    this.trackEvent(TrackingEventType.DOSE_TAKEN, { doseId, ...metadata }, true);
  }

  public trackAlarmInteraction(action: string, doseId: string, metadata: Record<string, any> = {}): void {
    const eventType = {
      triggered: TrackingEventType.ALARM_TRIGGERED,
      dismissed: TrackingEventType.ALARM_DISMISSED,
      snoozed: TrackingEventType.ALARM_SNOOZED,
      confirmed: TrackingEventType.ALARM_CONFIRMED,
      deferred: TrackingEventType.ALARM_DEFERRED,
    }[action] || TrackingEventType.ALARM_TRIGGERED;

    this.trackEvent(eventType, { doseId, ...metadata }, true);
  }

  public trackFeedbackAnswer(questionId: number, answer: any, metadata: Record<string, any> = {}): void {
    this.trackEvent(TrackingEventType.FEEDBACK_QUESTION_ANSWERED, {
      questionId,
      answer,
      ...metadata,
    });
  }

  public trackError(error: Error, componentStack?: string, metadata: Record<string, any> = {}): void {
    this.trackEvent(TrackingEventType.ERROR_OCCURRED, {
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack,
      ...metadata,
    }, true);
  }

  public destroy(): void {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
    }
    this.flushQueue(true);
  }
}

// Export singleton instance
export const enhancedTracking = new EnhancedTrackingService();

// React hook
export const useEnhancedTracking = () => {
  return {
    trackEvent: enhancedTracking.trackEvent.bind(enhancedTracking),
    trackDoseCreated: enhancedTracking.trackDoseCreated.bind(enhancedTracking),
    trackDoseTaken: enhancedTracking.trackDoseTaken.bind(enhancedTracking),
    trackAlarmInteraction: enhancedTracking.trackAlarmInteraction.bind(enhancedTracking),
    trackFeedbackAnswer: enhancedTracking.trackFeedbackAnswer.bind(enhancedTracking),
    trackError: enhancedTracking.trackError.bind(enhancedTracking),
    setSurveyId: enhancedTracking.setSurveyId.bind(enhancedTracking),
  };
};

export default enhancedTracking;
