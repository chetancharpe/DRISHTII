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

import { QuestionBankItem, BankQuestionAccessibility } from '../types/examiner';
import { INITIAL_QUESTION_BANK } from '../fixtures/examinerFixtures';
import { storage } from '../utils/storage';

const QB_STORAGE_KEY = 'gowow_question_bank';

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

    // 2. Image alt-text validation
    const hasImage = !!item.imageUrl;
    let hasAltTextIfImage = true;
    if (hasImage) {
      if (!item.accessibility?.altText || item.accessibility.altText.trim().length < 5) {
        hasAltTextIfImage = false;
        blockingErrors.push('Question contains an image but lacks descriptive Alternative Text.');
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
}

export const questionBankService = new QuestionBankService();
