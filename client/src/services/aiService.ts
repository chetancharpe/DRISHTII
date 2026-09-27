/**
 * GoWow Educational AI Assistance Interface
 * Enforces Section 39, 40, 41, 42, 43 & 44:
 * 
 * SAFETY PRINCIPLES:
 * 1. AI is an educational assistant, NEVER authoritative for official scores, eligibility, or timers.
 * 2. STRICT LIVE EXAM RESTRICTION: AI explanations, solving, and hints are completely disabled
 *    during active live examinations to preserve exam integrity.
 * 3. Does not require or connect to external surveillance or black-box APIs.
 */

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
    topic: string
  ): Promise<AIServiceResponse<ConceptExplanation>> {
    if (this.isLiveExamActive()) {
      return {
        success: false,
        isRestrictedInExam: true,
        error: "AI assistance is strictly disabled during active live examinations to maintain exam integrity.",
      };
    }

    // Pedagogical concept breakdown
    return {
      success: true,
      data: {
        conceptOverview: `Regarding question "${questionText.slice(0, 40)}...", this problem involves core principles of ${topic}.`,
        keyPrinciples: [
          "Identify the given variables and constraints before calculating.",
          "Check whether the formula requires simplification or factoring.",
          "Verify the physical or mathematical plausibility of your answer.",
        ],
        simplifiedExplanation: `In simple terms: break down the equation step by step, isolate terms on one side, and solve.`,
        practiceTip: "Review similar foundational practice questions to build speed and accuracy.",
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
        error: "Simplification is disabled during active live examinations.",
      };
    }

    // Deterministic plain-language summarization
    const simplified = complexText
      .replace(/consequently/gi, "so")
      .replace(/furthermore/gi, "also")
      .replace(/in order to/gi, "to")
      .replace(/utilize/gi, "use")
      .replace(/demonstrates that/gi, "shows that");

    return {
      success: true,
      data: simplified,
    };
  }

  /**
   * Educational topic summary for candidate revision
   */
  public async summarizeTopic(topic: string): Promise<AIServiceResponse<string>> {
    if (this.isLiveExamActive()) {
      return {
        success: false,
        isRestrictedInExam: true,
        error: "AI assistance is disabled during live exams.",
      };
    }

    return {
      success: true,
      data: `Key concepts in ${topic}: Focus on formulas, edge cases, and step-by-step problem decomposition.`,
    };
  }
}

export const aiService = new AIService();
