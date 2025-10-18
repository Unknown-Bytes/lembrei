'use client';

import { useEffect } from 'react';
import { enhancedTracking } from '@/lib/services/enhancedTrackingService';

export default function TrackingInitializer() {
  useEffect(() => {
    // Initialize tracking with surveyId if available
    const surveyId = localStorage.getItem('surveyId');
    if (surveyId) {
      enhancedTracking.setSurveyId(surveyId);
    }
  }, []);

  return null;
}
