"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface SurveyData {
  surveyId: string;
  userName: string;
  userEvents: UserEvent[];
  doses: any[]; // Array of doses
  dashboardEntryRecorded: boolean;
  dosesAdded: boolean;
  addDosePromptShown: boolean;
  addDosePromptAcknowledgedAt: string | null;
}

export interface UserEvent {
  type: string;
  at: string;
  surveyId?: string;
  [key: string]: any;
}

interface SurveyContextType {
  surveyData: SurveyData | null;
  loading: boolean;
  updateSurveyData: (data: Partial<SurveyData>) => void;
  addUserEvent: (event: Omit<UserEvent, 'at' | 'surveyId'>) => void;
  refreshSurveyData: () => void;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export function SurveyProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSurveyData = async () => {
    try {
      const surveyId = localStorage.getItem('surveyId');
      const eventsRaw = localStorage.getItem('userEvents') || '[]';
      const dosesRaw = localStorage.getItem('doses') || '[]';
      const dashboardEntryRecorded = localStorage.getItem('dashboardEntryRecorded') === 'true';
      const addDosePromptShown = localStorage.getItem('addDosePromptShown') === 'true';
      const addDosePromptAcknowledgedAt = localStorage.getItem('addDosePromptAcknowledgedAt');

      if (!surveyId) {
        console.warn('No surveyId found, redirecting to home');
        router.push('/');
        return;
      }

      // Fetch survey data from API to get userName
      const response = await fetch(`/api/survey/${surveyId}`);
      if (!response.ok) {
        // Survey doesn't exist - clear localStorage and redirect
        console.warn('Survey not found in database, clearing localStorage');
        localStorage.clear();
        router.push('/');
        return;
      }
      
      const survey = await response.json();
      const userEvents = JSON.parse(eventsRaw);
      const doses = JSON.parse(dosesRaw);

      setSurveyData({
        surveyId,
        userName: survey.userName || 'Testador',
        dosesAdded: survey.dosesAdded === true,
        userEvents,
        doses,
        dashboardEntryRecorded,
        addDosePromptShown,
        addDosePromptAcknowledgedAt,
      });
    } catch (error) {
      console.error('Error loading survey data:', error);
      // Clear localStorage and redirect on any error
      localStorage.clear();
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveyData();
  }, []);

  const updateSurveyData = (data: Partial<SurveyData>) => {
    if (!surveyData) return;

    const updated = { ...surveyData, ...data };
    // Avoid updating state if nothing actually changed to prevent render loops
    try {
      const currentStr = JSON.stringify(surveyData);
      const updatedStr = JSON.stringify(updated);
      if (currentStr === updatedStr) return;
    } catch (e) {
      // If stringify fails for any reason, fall back to setting state
    }

    setSurveyData(updated);

    // Persist to localStorage
    try {
      if (data.userEvents) {
        localStorage.setItem('userEvents', JSON.stringify(data.userEvents));
      }
      if (data.doses) {
        localStorage.setItem('doses', JSON.stringify(data.doses));
      }
      if (data.dosesAdded !== undefined) {
        localStorage.setItem('dosesAdded', data.dosesAdded ? 'true' : 'false');
      }
      if (data.dashboardEntryRecorded !== undefined) {
        localStorage.setItem('dashboardEntryRecorded', data.dashboardEntryRecorded ? 'true' : 'false');
      }
      if (data.addDosePromptShown !== undefined) {
        localStorage.setItem('addDosePromptShown', data.addDosePromptShown ? 'true' : 'false');
      }
      if (data.addDosePromptAcknowledgedAt !== undefined) {
        if (data.addDosePromptAcknowledgedAt) {
          localStorage.setItem('addDosePromptAcknowledgedAt', data.addDosePromptAcknowledgedAt);
        } else {
          localStorage.removeItem('addDosePromptAcknowledgedAt');
        }
      }
    } catch (error) {
      console.error('Error persisting survey data:', error);
    }
  };

  const addUserEvent = (event: Omit<UserEvent, 'at' | 'surveyId'>) => {
    setSurveyData((prev) => {
      if (!prev) return prev;
      const newEvent: UserEvent = {
        type: event.type,
        ...event,
        at: new Date().toISOString(),
        surveyId: prev.surveyId,
      };
      const updatedEvents = [...prev.userEvents, newEvent];

      // Persist events to localStorage (do not call updateSurveyData here to avoid cascading setState)
      try {
        localStorage.setItem('userEvents', JSON.stringify(updatedEvents));
      } catch (error) {
        console.error('Error persisting user event:', error);
      }

      // Immediately save to database
      fetch(`/api/survey/${prev.surveyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userEvents: updatedEvents
        }),
      }).then(response => {
        if (!response.ok) {
          console.error('Failed to save user event to database');
        }
      }).catch(error => {
        console.error('Error saving user event to database:', error);
      });

      return { ...prev, userEvents: updatedEvents };
    });
  };

  const refreshSurveyData = () => {
    loadSurveyData();
  };

  return (
    <SurveyContext.Provider
      value={{
        surveyData,
        loading,
        updateSurveyData,
        addUserEvent,
        refreshSurveyData,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurvey() {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error('useSurvey must be used within a SurveyProvider');
  }
  return context;
}
