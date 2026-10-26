/**
 * Question Bank Service Layer
 * Supports item creation, multi-version history, immutable published snapshots,
 * and strict accessibility validation for non-visual candidate access.
 * 
 * Future FastAPI endpoints:
 * - GET /api/question-bank
 * - POST /api/question-bank/questions
 * - PATCH /api/question-bank/questions/:id
 */

import { QuestionBankItem, BankQuestionAccessibility, BankQuestionOption } from '../types/examiner';
import { INITIAL_QUESTION_BANK } from '../fixtures/examinerFixtures';
import { storage } from '../utils/storage';
import { apiClient } from './api';

const QB_STORAGE_KEY = 'gowow_question_bank';

export interface BackendQuestionExaminerResponse {
  id: string;
  question_type: string;
  subject: string;
  topic: string;
  difficulty: string;
  language: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  version_number: number;
  question_text: string;
  options: Array<{
    id: string;
    text: string;
    aria_label?: string;
    display_order: number;
  }>;
  correct_answer: any;
  explanation?: string;
  marks: number;
  negative_marks: number;
  accessibility_metadata?: {
    has_alt_text?: boolean;
    alt_text?: string;
    long_description?: string;
    has_accessible_formula?: boolean;
    formula_spoken_text?: string;
    has_table_headers?: boolean;
    language?: string;
    accessibility_validation_status?: string;
    accessibility_warnings?: string[];
    accessibility_errors?: string[];
  };
}

function mapBackendToBankItem(
  bQ: BackendQuestionExaminerResponse,
  fallback?: Partial<QuestionBankItem>
): QuestionBankItem {
  let type: QuestionBankItem['type'] = 'single_choice';
  const qType = (bQ.question_type || '').toUpperCase();
  if (qType === 'MULTI_SELECT') type = 'multiple_choice';
  else if (qType === 'NUMERICAL') type = 'numerical';
  else if (qType === 'FILL_IN_BLANK' || qType === 'SHORT_ANSWER') type = 'short_answer';
  else if (fallback?.type) type = fallback.type;

  const diff = (bQ.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard';

  const options: BankQuestionOption[] = (bQ.options || []).map((o, idx) => ({
    id: o.id,
    label: String.fromCharCode(65 + idx),
    text: o.text,
    ariaLabel: o.aria_label || o.text,
    isCorrect: Array.isArray(bQ.correct_answer)
      ? bQ.correct_answer.includes(o.id)
      : bQ.correct_answer === o.id,
  }));

  const meta = bQ.accessibility_metadata || {};

  return {
    id: bQ.id,
    code: fallback?.code || `Q-${bQ.id.slice(0, 6).toUpperCase()}`,
    text: bQ.question_text,
    type,
    subject: bQ.subject || 'General',
    topic: bQ.topic || 'General',
    difficulty: diff,
    marks: bQ.marks || 1,
    negativeMarks: bQ.negative_marks || 0,
    language: bQ.language || 'English',
    tags: fallback?.tags || [bQ.subject, bQ.topic].filter(Boolean),
    options,
    correctAnswerText: typeof bQ.correct_answer === 'string' ? bQ.correct_answer : JSON.stringify(bQ.correct_answer || ''),
    explanation: bQ.explanation || '',
    accessibility: {
      hasReadableText: true,
      hasAltTextIfImage: !!meta.has_alt_text,
      noImageOnlyInformation: true,
      tableHasHeaders: !!meta.has_table_headers,
      formulaHasAccessibleSpeech: !!meta.has_accessible_formula,
      optionsHaveMeaningfulLabels: true,
      languageSpecified: !!bQ.language,
      noColorOnlyInstructions: true,
      altText: meta.alt_text,
      longDescription: meta.long_description,
      formulaSpeech: meta.formula_spoken_text,
    },
    version: bQ.version_number || 1,
    versionHistory: fallback?.versionHistory || [
      {
        versionNumber: bQ.version_number || 1,
        publishedAt: bQ.updated_at ? bQ.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
        authorName: bQ.created_by || fallback?.createdBy || 'Examiner Author',
        changeSummary: 'Authoritative question bank version',
        isImmutable: true,
      },
    ],
    status: (bQ.is_active ? 'approved' : 'draft') as any,
    createdBy: bQ.created_by || fallback?.createdBy || 'Examiner Author',
    createdAt: bQ.created_at ? bQ.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    updatedAt: bQ.updated_at ? bQ.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
    imageUrl: fallback?.imageUrl,
    formulaLatex: fallback?.formulaLatex,
  };
}

export interface AltTextEvaluation {
  quality_score: number;
  is_sufficient: boolean;
  wcag_tier: 'PASS_AAA' | 'PASS_AA' | 'NEEDS_REVISION' | 'FAIL';
  detected_diagram_type: string;
  issues: string[];
  suggestions: string[];
  suggested_alt_text: string;
  suggested_long_description?: string;
}

export interface AccessibilityChecklistResult {
  hasReadableText: boolean;
  hasAltTextIfImage: boolean;
  noImageOnlyInformation: boolean;
  tableHasHeaders: boolean;
  formulaHasAccessibleSpeech: boolean;
  optionsHaveMeaningfulLabels: boolean;
  languageSpecified: boolean;
  noColorOnlyInstructions: boolean;
  blockingErrors: string[];
  warnings: string[];
  isFullyAccessible: boolean;
}

class QuestionBankService {
  private getStoredItems(): QuestionBankItem[] {
    return storage.get<QuestionBankItem[]>(QB_STORAGE_KEY, INITIAL_QUESTION_BANK);
  }

  private saveStoredItems(items: QuestionBankItem[]): void {
    storage.set(QB_STORAGE_KEY, items);
  }

  async getQuestions(filter?: {
    search?: string;
    subject?: string;
    difficulty?: string;
    type?: string;
    language?: string;
  }): Promise<QuestionBankItem[]> {
    try {
      const params: Record<string, string> = {};
      if (filter?.subject && filter.subject !== 'all') params.subject = filter.subject;
      if (filter?.difficulty && filter.difficulty !== 'all') params.difficulty = filter.difficulty.toUpperCase();
      if (filter?.search) params.search = filter.search;

      const queryStr = new URLSearchParams(params).toString();
      const endpoint = queryStr ? `/question-bank?${queryStr}` : '/question-bank';
      const backendItems = await apiClient.get<BackendQuestionExaminerResponse[]>(endpoint);
      if (Array.isArray(backendItems) && backendItems.length > 0) {
        const stored = this.getStoredItems();
        const storedMap = new Map(stored.map((q) => [q.id, q]));
        const mapped = backendItems.map((b) => mapBackendToBankItem(b, storedMap.get(b.id)));
        return mapped;
      }
    } catch (err) {
      console.warn('Backend /question-bank call failed, using local items:', err);
    }

    let items = this.getStoredItems();

    if (!filter) return items;

    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.text.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          i.topic.toLowerCase().includes(q)
      );
    }

    if (filter.subject && filter.subject !== 'all') {
      items = items.filter((i) => i.subject === filter.subject);
    }

    if (filter.difficulty && filter.difficulty !== 'all') {
      items = items.filter((i) => i.difficulty === filter.difficulty);
    }

    if (filter.type && filter.type !== 'all') {
      items = items.filter((i) => i.type === filter.type);
    }

    if (filter.language && filter.language !== 'all') {
      items = items.filter((i) => i.language === filter.language);
    }

    return items;
  }

  async getQuestionById(id: string): Promise<QuestionBankItem | null> {
    try {
      const bQ = await apiClient.get<BackendQuestionExaminerResponse>(`/question-bank/questions/${id}`);
      if (bQ && bQ.id) {
        const stored = this.getStoredItems();
        const local = stored.find((q) => q.id === id);
        return mapBackendToBankItem(bQ, local);
      }
    } catch (err) {
      console.warn(`Backend /question-bank/questions/${id} call failed, checking cached:`, err);
    }
    const items = this.getStoredItems();
    return items.find((q) => q.id === id) || null;
  }

  validateAccessibility(item: Partial<QuestionBankItem>): AccessibilityChecklistResult {
    const blockingErrors: string[] = [];
    const warnings: string[] = [];

    // 1. Text readability
    const hasReadableText = !!(item.text && item.text.trim().length >= 8);
    if (!hasReadableText) {
      blockingErrors.push('Question prompt is too short or empty (minimum 8 characters).');
    }

    // 2. Image alt-text validation & AI gate checks
    const hasImage = !!item.imageUrl;
    let hasAltTextIfImage = true;
    const FORBIDDEN_PLACEHOLDERS = [
      'image', 'photo', 'picture', 'diagram', 'chart', 'graph', 'screenshot',
      'drawing', 'graphic', 'figure', 'img', 'icon', 'untitled'
    ];
    if (hasImage) {
      const rawAlt = (item.accessibility?.altText || '').trim();
      const altLower = rawAlt.toLowerCase();
      if (!rawAlt || rawAlt.length < 5) {
        hasAltTextIfImage = false;
        blockingErrors.push('Question contains an image but lacks descriptive Alternative Text.');
      } else if (FORBIDDEN_PLACEHOLDERS.includes(altLower)) {
        hasAltTextIfImage = false;
        blockingErrors.push(`Alt text cannot be a generic placeholder ('${rawAlt}'). Describe the visual diagram's data or components.`);
      } else if (!item.accessibility?.longDescription) {
        warnings.push('Complex images strongly benefit from an optional Long Description.');
      }
    }

    // 3. Image-only info check
    const noImageOnlyInformation = !(hasImage && (!item.text || item.text.length < 15));
    if (!noImageOnlyInformation) {
      blockingErrors.push('Essential question context is presented in the image alone with inadequate text.');
    }

    // 4. Formula speech check
    let formulaHasAccessibleSpeech = true;
    if (item.formulaLatex) {
      if (!item.accessibility?.formulaSpeech || item.accessibility.formulaSpeech.trim().length < 5) {
        formulaHasAccessibleSpeech = false;
        blockingErrors.push('Mathematical formula requires an accessible ClearSpeak transcription for screen readers.');
      }
    }

    // 5. Table validation
    let tableHasHeaders = true;
    if (item.accessibility?.tableCaption && (!item.accessibility.tableHeaders || item.accessibility.tableHeaders.length === 0)) {
      tableHasHeaders = false;
      blockingErrors.push('Data tables must define column headers (<th>) for screen reader navigation.');
    }

    // 6. Options meaningful labels
    let optionsHaveMeaningfulLabels = true;
    if (item.type === 'single_choice' || item.type === 'multiple_choice' || item.type === 'true_false') {
      if (!item.options || item.options.length < 2) {
        optionsHaveMeaningfulLabels = false;
        blockingErrors.push('Multiple choice / single choice questions must supply at least 2 options.');
      } else {
        const emptyOpts = item.options.filter((o) => !o.text || o.text.trim().length === 0);
        if (emptyOpts.length > 0) {
          optionsHaveMeaningfulLabels = false;
          blockingErrors.push('All option choices must have non-empty text labels.');
        }
        const hasCorrect = item.options.some((o) => o.isCorrect);
        if (!hasCorrect) {
          blockingErrors.push('At least one choice must be marked as the correct answer.');
        }
      }
    }

    // 7. Language specification
    const languageSpecified = !!(item.language && item.language.trim().length > 0);
    if (!languageSpecified) {
      warnings.push('Specifying primary language ensures accurate screen reader pronunciation.');
    }

    // 8. No color-only instructions
    const colorWords = ['red', 'green', 'blue', 'highlighted in yellow', 'color'];
    const textLower = (item.text || '').toLowerCase();
    const hasColorRef = colorWords.some((c) => textLower.includes(c));
    const noColorOnlyInstructions = !hasColorRef;
    if (!noColorOnlyInstructions) {
      warnings.push('Question contains potential color-dependent cues. Ensure cues do not rely on color alone.');
    }

    return {
      hasReadableText,
      hasAltTextIfImage,
      noImageOnlyInformation,
      tableHasHeaders,
      formulaHasAccessibleSpeech,
      optionsHaveMeaningfulLabels,
      languageSpecified,
      noColorOnlyInstructions,
      blockingErrors,
      warnings,
      isFullyAccessible: blockingErrors.length === 0,
    };
  }

  async createQuestion(data: Partial<QuestionBankItem>): Promise<QuestionBankItem> {
    const items = this.getStoredItems();
    const validation = this.validateAccessibility(data);

    if (validation.blockingErrors.length > 0) {
      throw new Error(`Accessibility Validation Failed: ${validation.blockingErrors.join(' | ')}`);
    }

    let backendCreated: BackendQuestionExaminerResponse | null = null;
    try {
      let question_type = 'MULTIPLE_CHOICE';
      if (data.type === 'multiple_choice') question_type = 'MULTI_SELECT';
      else if (data.type === 'numerical') question_type = 'NUMERICAL';
      else if (data.type === 'short_answer') question_type = 'FILL_IN_BLANK';

      const options = (data.options || []).map((o, idx) => ({
        id: o.id || `opt-${idx + 1}`,
        text: o.text,
        aria_label: o.ariaLabel || o.text,
        display_order: idx + 1,
      }));

      let correct_answer: any = data.correctAnswerText || '';
      const correctOpts = (data.options || []).filter((o) => o.isCorrect).map((o) => o.id);
      if (correctOpts.length > 0) {
        correct_answer = question_type === 'MULTI_SELECT' ? correctOpts : correctOpts[0];
      }

      const payload = {
        question_type,
        subject: data.subject || 'General',
        topic: data.topic || 'General',
        difficulty: (data.difficulty || 'MEDIUM').toUpperCase(),
        language: data.language || 'en',
        question_text: data.text || '',
        options,
        correct_answer,
        explanation: data.explanation || '',
        marks: data.marks || 1,
        negative_marks: data.negativeMarks || 0,
        accessibility_metadata: {
          has_alt_text: !!data.accessibility?.altText,
          alt_text: data.accessibility?.altText || null,
          long_description: data.accessibility?.longDescription || null,
          has_accessible_formula: !!data.accessibility?.formulaSpeech,
          formula_spoken_text: data.accessibility?.formulaSpeech || null,
          has_table_headers: !!(data.accessibility?.tableHeaders && data.accessibility.tableHeaders.length > 0),
          language: data.language || 'en',
        },
      };

      backendCreated = await apiClient.post<BackendQuestionExaminerResponse>('/question-bank/questions', payload);
    } catch (err) {
      console.warn('Backend /question-bank/questions create failed, saving locally:', err);
    }

    if (backendCreated) {
      const mapped = mapBackendToBankItem(backendCreated, data);
      items.unshift(mapped);
      this.saveStoredItems(items);
      return mapped;
    }

    const defaultAccessibility: BankQuestionAccessibility = {
      hasReadableText: validation.hasReadableText,
      hasAltTextIfImage: validation.hasAltTextIfImage,
      noImageOnlyInformation: validation.noImageOnlyInformation,
      tableHasHeaders: validation.tableHasHeaders,
      formulaHasAccessibleSpeech: validation.formulaHasAccessibleSpeech,
      optionsHaveMeaningfulLabels: validation.optionsHaveMeaningfulLabels,
      languageSpecified: validation.languageSpecified,
      noColorOnlyInstructions: validation.noColorOnlyInstructions,
      altText: data.accessibility?.altText,
      longDescription: data.accessibility?.longDescription,
      formulaSpeech: data.accessibility?.formulaSpeech,
      tableCaption: data.accessibility?.tableCaption,
      tableHeaders: data.accessibility?.tableHeaders,
    };

    const newItem: QuestionBankItem = {
      id: `qb-${Date.now()}`,
      code: data.code || `Q-${Math.floor(100 + Math.random() * 900)}`,
      text: data.text || '',
      type: data.type || 'single_choice',
      subject: data.subject || 'General',
      topic: data.topic || 'General',
      difficulty: data.difficulty || 'medium',
      marks: data.marks || 1,
      negativeMarks: data.negativeMarks || 0,
      language: data.language || 'English',
      tags: data.tags || [],
      options: data.options || [],
      correctAnswerText: data.correctAnswerText,
      explanation: data.explanation || '',
      accessibility: defaultAccessibility,
      version: 1,
      versionHistory: [
        {
          versionNumber: 1,
          publishedAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-US', { hour12: false })} IST`,
          authorName: data.createdBy || 'Examiner Author',
          changeSummary: 'Initial authoring and accessibility verification',
          isImmutable: true,
        },
      ],
      status: 'approved',
      createdBy: data.createdBy || 'Examiner Author',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      imageUrl: data.imageUrl,
      formulaLatex: data.formulaLatex,
    };

    items.unshift(newItem);
    this.saveStoredItems(items);
    return newItem;
  }

  async updateQuestion(id: string, updates: Partial<QuestionBankItem>): Promise<QuestionBankItem> {
    const items = this.getStoredItems();
    const idx = items.findIndex((q) => q.id === id);
    if (idx === -1) throw new Error(`Question ${id} not found.`);

    const existing = items[idx];
    const validation = this.validateAccessibility({ ...existing, ...updates });
    if (validation.blockingErrors.length > 0) {
      throw new Error(`Accessibility Validation Failed: ${validation.blockingErrors.join(' | ')}`);
    }

    try {
      let question_type = 'MULTIPLE_CHOICE';
      const qType = updates.type || existing.type;
      if (qType === 'multiple_choice') question_type = 'MULTI_SELECT';
      else if (qType === 'numerical') question_type = 'NUMERICAL';
      else if (qType === 'short_answer') question_type = 'FILL_IN_BLANK';

      const currentOptions = updates.options || existing.options || [];
      const options = currentOptions.map((o, optIdx) => ({
        id: o.id || `opt-${optIdx + 1}`,
        text: o.text,
        aria_label: o.ariaLabel || o.text,
        display_order: optIdx + 1,
      }));

      let correct_answer: any = updates.correctAnswerText || existing.correctAnswerText || '';
      const correctOpts = currentOptions.filter((o) => o.isCorrect).map((o) => o.id);
      if (correctOpts.length > 0) {
        correct_answer = question_type === 'MULTI_SELECT' ? correctOpts : correctOpts[0];
      }

      const versionPayload = {
        question_text: updates.text || existing.text,
        options,
        correct_answer,
        explanation: updates.explanation || existing.explanation || '',
        marks: updates.marks || existing.marks || 1,
        negative_marks: updates.negativeMarks ?? existing.negativeMarks ?? 0,
        accessibility_metadata: {
          has_alt_text: !!(updates.accessibility?.altText || existing.accessibility?.altText),
          alt_text: updates.accessibility?.altText || existing.accessibility?.altText || null,
          long_description: updates.accessibility?.longDescription || existing.accessibility?.longDescription || null,
          has_accessible_formula: !!(updates.accessibility?.formulaSpeech || existing.accessibility?.formulaSpeech),
          formula_spoken_text: updates.accessibility?.formulaSpeech || existing.accessibility?.formulaSpeech || null,
          has_table_headers: !!(updates.accessibility?.tableHeaders || existing.accessibility?.tableHeaders),
          language: updates.language || existing.language || 'en',
        },
      };

      const bQ = await apiClient.post<BackendQuestionExaminerResponse>(
        `/question-bank/questions/${id}/versions`,
        versionPayload
      );
      if (bQ && bQ.id) {
        const mapped = mapBackendToBankItem(bQ, { ...existing, ...updates });
        items[idx] = mapped;
        this.saveStoredItems(items);
        return mapped;
      }
    } catch (err) {
      console.warn(`Backend version create failed for question ${id}, updating locally:`, err);
    }

    const nextVersion = existing.version + 1;
    const newVersionEntry = {
      versionNumber: nextVersion,
      publishedAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-US', { hour12: false })} IST`,
      authorName: updates.createdBy || existing.createdBy,
      changeSummary: updates.explanation ? 'Updated explanation and content details' : 'Iterative question enhancement',
      isImmutable: false,
    };

    items[idx] = {
      ...existing,
      ...updates,
      version: nextVersion,
      versionHistory: [...existing.versionHistory, newVersionEntry],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    this.saveStoredItems(items);
    return items[idx];
  }

  async evaluateAltText(payload: {
    alt_text: string;
    long_description?: string;
    question_context?: string;
    image_url?: string;
  }): Promise<AltTextEvaluation> {
    try {
      return await apiClient.post<AltTextEvaluation>('/question-bank/alt-text/evaluate', payload);
    } catch {
      // Local fallback in case offline
      const alt = (payload.alt_text || '').trim();
      const isPlaceholder = ['image', 'diagram', 'chart', 'photo'].includes(alt.toLowerCase());
      const score = !alt ? 0 : isPlaceholder ? 20 : alt.length < 15 ? 50 : 92;
      return {
        quality_score: score,
        is_sufficient: score >= 70,
        wcag_tier: score >= 90 ? 'PASS_AAA' : score >= 70 ? 'PASS_AA' : score >= 40 ? 'NEEDS_REVISION' : 'FAIL',
        detected_diagram_type: 'Educational Diagram',
        issues: !alt
          ? ['Alt text is missing.']
          : isPlaceholder
          ? ['Generic placeholder detected.']
          : [],
        suggestions: ['Provide specific labels, data trends, and key relationships depicted.'],
        suggested_alt_text: `Diagram illustrating ${payload.question_context ? payload.question_context.slice(0, 50) : 'key concepts'} with labeled axes and components.`,
        suggested_long_description: 'Comprehensive non-visual description detailing layout and structural elements.',
      };
    }
  }
}

export const questionBankService = new QuestionBankService();
