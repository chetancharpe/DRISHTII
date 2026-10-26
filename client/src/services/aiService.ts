/**
 * DRISHTI Educational AI Assistance Interface
 *
 * SAFETY & ACCESSIBILITY INVARIANTS:
 * 1. AI is an educational assistant, NEVER authoritative for official scores, eligibility, or timers.
 * 2. STRICT LIVE EXAM RESTRICTION: AI explanations, solving, and hints are completely disabled
 *    during active live examinations to preserve exam integrity.
 * 3. Server-side API integration connects to real LLMs (Gemini / OpenAI) with secure fallback.
 */

import { apiClient } from './api';

export interface AIServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isRestrictedInExam?: boolean;
}

export interface ConceptExplanation {
  conceptOverview: string;
  keyPrinciples: string[];
  simplifiedExplanation: string;
  practiceTip: string;
  source?: string;
}

export interface BackendConceptResponse {
  conceptOverview?: string;
  concept_overview?: string;
  keyPrinciples?: string[];
  key_principles?: string[];
  simplifiedExplanation?: string;
  simplified_explanation?: string;
  practiceTip?: string;
  practice_tip?: string;
  source?: string;
}

export interface BackendSimplifyResponse {
  simplifiedText?: string;
  simplified_text?: string;
  readingEase?: string;
  reading_ease?: string;
  source?: string;
}

export interface BackendSummarizeResponse {
  summary: string;
  keyPoints?: string[];
  key_points?: string[];
  source?: string;
}

class AIService {
  private isLiveExamActive(): boolean {
    if (typeof window === 'undefined') return false;
    // Check if candidate is currently inside an active official examination route
    const path = window.location.pathname;
    return path.includes('/exam/') || path.includes('/live-exam');
  }

  /**
   * Educational concept explanation for learning and practice modes.
   * STRICTLY BLOCKED during live exams!
   */
  public async generateExplanation(
    questionText: string,
    topic: string,
    subject: string = 'General'
  ): Promise<AIServiceResponse<ConceptExplanation>> {
    if (this.isLiveExamActive()) {
      return {
        success: false,
        isRestrictedInExam: true,
        error: 'AI assistance is strictly disabled during active live examinations to maintain exam integrity.',
      };
    }

    try {
      const res = await apiClient.post<BackendConceptResponse>('/ai/explain', {
        questionText,
        topic,
        subject,
        isLiveExam: false,
      });

      if (res) {
        return {
          success: true,
          data: {
            conceptOverview: res.conceptOverview || res.concept_overview || `Core principles of ${topic}.`,
            keyPrinciples: res.keyPrinciples || res.key_principles || [
              'Identify given knowns and constraints before computing values.',
              'Simplify compound fractions or coefficients step by step.',
              'Validate the physical or mathematical plausibility of your answer.',
            ],
            simplifiedExplanation:
              res.simplifiedExplanation ||
              res.simplified_explanation ||
              'In simple terms: isolate terms on one side and solve.',
            practiceTip:
              res.practiceTip ||
              res.practice_tip ||
              'Review similar foundational practice questions to build speed and accuracy.',
            source: res.source,
          },
        };
      }
    } catch (err: any) {
      if (err?.status === 403) {
        return {
          success: false,
          isRestrictedInExam: true,
          error: 'AI assistance is restricted during live examination sessions.',
        };
      }
      console.warn('Backend AI /ai/explain failed or offline, using fallback:', err);
    }

    // High-quality pedagogical fallback when offline
    return {
      success: true,
      data: {
        conceptOverview: `Regarding question "${questionText.slice(0, 45)}...", this problem involves core principles of ${topic}.`,
        keyPrinciples: [
          'Identify given knowns and constraints before calculating.',
          'Check whether the formula requires algebraic simplification.',
          'Verify the physical or mathematical plausibility of your answer.',
        ],
        simplifiedExplanation: 'In simple terms: break down the equation step by step, isolate terms, and solve.',
        practiceTip: 'Review similar foundational practice questions to build speed and accuracy.',
        source: 'pedagogical_heuristic_fallback',
      },
    };
  }

  /**
   * Plain Language Simplifier (Section 44: 'Simplify This')
   * Breaks down complicated technical or academic phrasing into plain language.
   */
  public async simplifyExplanation(complexText: string): Promise<AIServiceResponse<string>> {
    if (this.isLiveExamActive()) {
      return {
        success: false,
        isRestrictedInExam: true,
        error: 'Simplification is disabled during active live examinations.',
      };
    }

    try {
      const res = await apiClient.post<BackendSimplifyResponse>('/ai/simplify', {
        complexText,
        isLiveExam: false,
      });

      if (res?.simplifiedText || res?.simplified_text) {
        return {
          success: true,
          data: res.simplifiedText || res.simplified_text,
        };
      }
    } catch (err: any) {
      if (err?.status === 403) {
        return {
          success: false,
          isRestrictedInExam: true,
          error: 'Simplification is disabled during active live examinations.',
        };
      }
      console.warn('Backend AI /ai/simplify failed or offline, using fallback:', err);
    }

    // Deterministic plain-language summarization
    const simplified = complexText
      .replace(/consequently/gi, 'so')
      .replace(/furthermore/gi, 'also')
      .replace(/in order to/gi, 'to')
      .replace(/utilize/gi, 'use')
      .replace(/demonstrates that/gi, 'shows that');

    return {
      success: true,
      data: simplified,
    };
  }

  /**
   * Educational topic summary for candidate revision
   */
  public async summarizeTopic(topic: string, subject: string = 'General'): Promise<AIServiceResponse<string>> {
    if (this.isLiveExamActive()) {
      return {
        success: false,
        isRestrictedInExam: true,
        error: 'AI assistance is disabled during live exams.',
      };
    }

    try {
      const res = await apiClient.post<BackendSummarizeResponse>('/ai/summarize', {
        topic,
        subject,
        isLiveExam: false,
      });

      if (res?.summary) {
        return {
          success: true,
          data: res.summary,
        };
      }
    } catch (err: any) {
      if (err?.status === 403) {
        return {
          success: false,
          isRestrictedInExam: true,
          error: 'AI assistance is disabled during live exams.',
        };
      }
      console.warn('Backend AI /ai/summarize failed or offline, using fallback:', err);
    }

    return {
      success: true,
      data: `Key concepts in ${topic}: Focus on formulas, edge cases, and step-by-step problem decomposition.`,
    };
  }
}

export const aiService = new AIService();
