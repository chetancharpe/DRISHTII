import { apiClient } from '../api';

export interface BackendAccessibilityProfile {
  id: string;
  user_id: string;
  text_scale: string;
  contrast_mode: string;
  theme: string;
  reduced_motion: boolean;
  simplified_interface: boolean;
  screen_reader_mode: boolean;
  keyboard_navigation: boolean;
  audio_assistance: boolean;
  speech_rate: number;
  speech_volume: number;
  preferred_language: string;
  timer_announcement_mode: string;
  question_reading_mode: string;
  updated_at: string;
}

export const accessibilityApi = {
  async getProfile(token?: string): Promise<BackendAccessibilityProfile | null> {
    try {
      return await apiClient<BackendAccessibilityProfile>('/accessibility/profile', {
        method: 'GET',
        token,
      });
    } catch {
      return null;
    }
  },

  async updateProfile(
    updates: Partial<BackendAccessibilityProfile>,
    token?: string
  ): Promise<BackendAccessibilityProfile | null> {
    try {
      return await apiClient<BackendAccessibilityProfile>('/accessibility/profile', {
        method: 'PATCH',
        token,
        body: JSON.stringify(updates),
      });
    } catch {
      return null;
    }
  },

  async resetProfile(token?: string): Promise<{ status: string; message: string } | null> {
    try {
      return await apiClient<{ status: string; message: string }>('/accessibility/reset', {
        method: 'POST',
        token,
      });
    } catch {
      return null;
    }
  },

  async reportIssue(
    data: { page_url: string; issue_type: string; description: string },
    token?: string
  ): Promise<boolean> {
    try {
      await apiClient('/accessibility/report-issue', {
        method: 'POST',
        token,
        body: JSON.stringify(data),
      });
      return true;
    } catch {
      return false;
    }
  },

  async getScorecard(token?: string): Promise<any> {
    try {
      return await apiClient('/accessibility/scorecard', {
        method: 'GET',
        token,
      });
    } catch {
      return null;
    }
  },

  /**
   * Dispatches AI Accessibility & Interaction Monitoring telemetry events (Requirement #9).
   * Strict privacy: Only metadata is sent; no webcam video or biometric data.
   */
  async postMonitoringEvent(
    event: import('../../types/accessibilityMonitoring').AccessibilityEventPayload,
    token?: string
  ): Promise<{ status: string; event_id: string } | null> {
    try {
      return await apiClient<{ status: string; event_id: string }>('/accessibility/events', {
        method: 'POST',
        token,
        body: JSON.stringify(event),
      });
    } catch {
      return null;
    }
  },
};
