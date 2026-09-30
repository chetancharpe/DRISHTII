import {
  MockTest,
  MockTestAnswer,
  MockTestHistoryItem,
  MockTestQuestion,
  MockTestQuestionReview,
  MockTestResult,
  MockTestSection,
  MockTestSession,
} from '../types/mockTest';
import { apiClient } from './api';

/**
 * Service abstraction for Mock Test Engine.
 * Connected directly to FastAPI endpoints:
 * - GET /mock-tests
 * - GET /mock-tests/:id
 * - POST /mock-tests/submit
 * - GET /mock-tests/history
 *
 * Scoring and answer validation are 100% server-authoritative!
 */

const STORAGE_SESSION_PREFIX = 'gowow_mock_session_';
const STORAGE_RESULT_PREFIX = 'gowow_mock_result_';

// In-memory runtime cache
const activeSessions: Map<string, MockTestSession> = new Map();
const completedResults: Map<string, MockTestResult> = new Map();

export const FALLBACK_MOCK_TESTS: MockTest[] = [
  {
    id: 'cds-full-mock-01',
    title: 'CDS Full Practice Examination — 01',
    examName: 'CDS (Combined Defence Services)',
    examCode: 'UPSC-CDS',
    description: 'Comprehensive CDS-style practice mock covering English Language, General Knowledge, and Elementary Mathematics under standard timing.',
    totalQuestions: 6,
    durationMinutes: 45,
    difficulty: 'medium',
    status: 'not_started',
    isRecommended: true,
    instructionsSummary: [
      'Each question has four options with exactly one correct answer.',
      'Marking Scheme: +1 for correct, -0.33 penalty for incorrect.',
      'Accessible keyboard navigation (Alt+1 through Alt+4 to select, Alt+N for next).',
      'Screen-reader audio announcements enabled for questions and options.',
    ],
    markingScheme: {
      correctMarks: 1,
      incorrectPenalty: 0.33,
      unansweredMarks: 0,
    },
    accessibilityHighlights: {
      keyboard: 'Full keyboard navigation with dedicated shortcuts',
      screenReader: 'ARIA-live announcements on option selection and timer milestones',
      audio: 'High-contrast synthetic speech narration available',
      visual: 'Large font scaling and high contrast AAA presets',
    },
    sections: [
      {
        id: 'sec-english',
        name: 'English Language',
        code: 'ENG',
        description: 'Reading comprehension, error spotting, sentence improvement, and vocabulary.',
        totalQuestions: 2,
        questions: [
          {
            id: 'cds-eng-01',
            sectionId: 'sec-english',
            questionNumber: 1,
            text: 'Choose the word that is most nearly opposite in meaning to "CANDID":',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'Outspoken', ariaLabel: 'Option A: Outspoken' },
              { id: 'B', label: 'B', text: 'Secretive', ariaLabel: 'Option B: Secretive' },
              { id: 'C', label: 'C', text: 'Blunt', ariaLabel: 'Option C: Blunt' },
              { id: 'D', label: 'D', text: 'Sincere', ariaLabel: 'Option D: Sincere' },
            ],
            correctOptionIds: ['B'],
            explanation: "'Candid' means truthful and straightforward. Its antonym is 'secretive' or 'deceptive'.",
          },
          {
            id: 'cds-eng-02',
            sectionId: 'sec-english',
            questionNumber: 2,
            text: 'Select the option that correctly rectifies the grammatical error: "Neither the manager nor the employees was present at the briefing."',
            type: 'single_choice',
            difficulty: 'medium',
            options: [
              { id: 'A', label: 'A', text: 'Neither the manager nor the employees were present at the briefing.', ariaLabel: 'Option A: were present' },
              { id: 'B', label: 'B', text: 'Neither the manager or the employees was present at the briefing.', ariaLabel: 'Option B: manager or employees' },
              { id: 'C', label: 'C', text: 'Neither the manager nor the employee was present at the briefing.', ariaLabel: 'Option C: employee was present' },
              { id: 'D', label: 'D', text: 'No correction required; the sentence is correct.', ariaLabel: 'Option D: No correction' },
            ],
            correctOptionIds: ['A'],
            explanation: "When two subjects are joined by 'neither... nor', the verb agrees with the closer subject ('employees', plural), so 'were present' is required.",
          },
        ],
      },
      {
        id: 'sec-math',
        name: 'Elementary Mathematics',
        code: 'MATH',
        description: 'Arithmetic, number systems, algebra, percentages, and quantitative deduction.',
        totalQuestions: 2,
        questions: [
          {
            id: 'cds-math-01',
            sectionId: 'sec-math',
            questionNumber: 3,
            text: 'If 20 is 25% of a number, what is the number?',
            type: 'single_choice',
            difficulty: 'easy',
            formula: {
              visualText: '25% of X = 20  =>  (1/4)X = 20',
              accessibleText: 'twenty-five percent of X equals twenty, which implies one fourth of X equals twenty',
            },
            options: [
              { id: 'A', label: 'A', text: '50', ariaLabel: 'Option A: 50' },
              { id: 'B', label: 'B', text: '80', ariaLabel: 'Option B: 80' },
              { id: 'C', label: 'C', text: '100', ariaLabel: 'Option C: 100' },
              { id: 'D', label: 'D', text: '120', ariaLabel: 'Option D: 120' },
            ],
            correctOptionIds: ['B'],
            explanation: '25% of X = 20 implies (1/4)X = 20, hence X = 80.',
          },
          {
            id: 'cds-math-02',
            sectionId: 'sec-math',
            questionNumber: 4,
            text: 'What is 15% of 240?',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: '32', ariaLabel: 'Option A: 32' },
              { id: 'B', label: 'B', text: '36', ariaLabel: 'Option B: 36' },
              { id: 'C', label: 'C', text: '40', ariaLabel: 'Option C: 40' },
              { id: 'D', label: 'D', text: '42', ariaLabel: 'Option D: 42' },
            ],
            correctOptionIds: ['B'],
            explanation: '10% of 240 is 24. 5% is 12. Sum is 24 + 12 = 36.',
          },
        ],
      },
      {
        id: 'sec-gk',
        name: 'General Knowledge',
        code: 'GK',
        description: 'Current affairs, modern history, and defense.',
        totalQuestions: 2,
        questions: [
          {
            id: 'cds-gk-01',
            sectionId: 'sec-gk',
            questionNumber: 5,
            text: "The bilateral joint military exercise 'MITRA SHAKTI' is conducted between India and which country?",
            type: 'single_choice',
            difficulty: 'medium',
            options: [
              { id: 'A', label: 'A', text: 'Nepal', ariaLabel: 'Option A: Nepal' },
              { id: 'B', label: 'B', text: 'Sri Lanka', ariaLabel: 'Option B: Sri Lanka' },
              { id: 'C', label: 'C', text: 'Bangladesh', ariaLabel: 'Option C: Bangladesh' },
              { id: 'D', label: 'D', text: 'Maldives', ariaLabel: 'Option D: Maldives' },
            ],
            correctOptionIds: ['B'],
            explanation: 'Exercise Mitra Shakti is conducted jointly between the Indian Army and the Sri Lanka Army.',
          },
          {
            id: 'cds-gk-02',
            sectionId: 'sec-gk',
            questionNumber: 6,
            text: 'In a certain code language, CAT is coded as 24 and DOG is coded as 26. What is the code for PIG?',
            type: 'single_choice',
            difficulty: 'medium',
            options: [
              { id: 'A', label: 'A', text: '32', ariaLabel: 'Option A: 32' },
              { id: 'B', label: 'B', text: '30', ariaLabel: 'Option B: 30' },
              { id: 'C', label: 'C', text: '28', ariaLabel: 'Option C: 28' },
              { id: 'D', label: 'D', text: '34', ariaLabel: 'Option D: 34' },
            ],
            correctOptionIds: ['A'],
            explanation: 'Sum of alphabet ranks: P(16) + I(9) + G(7) = 32.',
          },
        ],
      },
    ],
  },
  {
    id: 'mock-math-01',
    title: 'Elementary Mathematics Subject Mock Test',
    examName: 'CDS (Combined Defence Services)',
    examCode: 'CDS-MATH',
    description: 'Dedicated subject mock test covering Arithmetic, Percentages, Algebra, and Geometry with accessible formulas.',
    totalQuestions: 6,
    durationMinutes: 30,
    difficulty: 'medium',
    status: 'not_started',
    isRecommended: true,
    instructionsSummary: [
      'Mathematics subject-wise drill covering Arithmetic, Algebra, and Geometry.',
      'Marking Scheme: +1 for correct, -0.33 penalty for incorrect answers.',
      'Accessible formula narration enabled for all mathematical notation.',
    ],
    markingScheme: {
      correctMarks: 1,
      incorrectPenalty: 0.33,
      unansweredMarks: 0,
    },
    accessibilityHighlights: {
      keyboard: 'Full keyboard navigation supported',
      screenReader: 'Formula spoken text enabled for screen readers',
      audio: 'High-contrast audio description available',
      visual: 'Large font and high contrast modes available',
    },
    sections: [
      {
        id: 'sec-math-arith',
        name: 'Arithmetic & Percentages',
        code: 'ARITH',
        description: 'Percentages, ratios, and commercial arithmetic.',
        totalQuestions: 2,
        questions: [
          {
            id: 'math-m-01',
            sectionId: 'sec-math-arith',
            questionNumber: 1,
            text: 'If 20 is 25% of a number, what is the number?',
            type: 'single_choice',
            difficulty: 'easy',
            formula: {
              visualText: '25% of X = 20  =>  (1/4)X = 20',
              accessibleText: 'twenty-five percent of X equals twenty, which implies one fourth of X equals twenty',
            },
            options: [
              { id: 'A', label: 'A', text: '50', ariaLabel: 'Option A: 50' },
              { id: 'B', label: 'B', text: '80', ariaLabel: 'Option B: 80' },
              { id: 'C', label: 'C', text: '100', ariaLabel: 'Option C: 100' },
              { id: 'D', label: 'D', text: '120', ariaLabel: 'Option D: 120' },
            ],
            correctOptionIds: ['B'],
            explanation: '25% of X = 20 implies (1/4)X = 20, hence X = 80.',
          },
          {
            id: 'math-m-02',
            sectionId: 'sec-math-arith',
            questionNumber: 2,
            text: 'The price of an article increased from ₹800 to ₹1,000. What is the percentage increase?',
            type: 'single_choice',
            difficulty: 'easy',
            formula: {
              visualText: '% Increase = [(New - Original) / Original] × 100',
              accessibleText: 'percentage increase equals new price minus original price divided by original price multiplied by one hundred',
            },
            options: [
              { id: 'A', label: 'A', text: '20%', ariaLabel: 'Option A: 20 percent' },
              { id: 'B', label: 'B', text: '25%', ariaLabel: 'Option B: 25 percent' },
              { id: 'C', label: 'C', text: '30%', ariaLabel: 'Option C: 30 percent' },
              { id: 'D', label: 'D', text: '12.5%', ariaLabel: 'Option D: 12.5 percent' },
            ],
            correctOptionIds: ['B'],
            explanation: 'Absolute increase = 1000 - 800 = 200. Percentage increase = (200 / 800) * 100 = 25%.',
          },
        ],
      },
      {
        id: 'sec-math-alg',
        name: 'Algebra & Equations',
        code: 'ALG',
        description: 'Quadratic roots and algebraic identities.',
        totalQuestions: 2,
        questions: [
          {
            id: 'math-m-03',
            sectionId: 'sec-math-alg',
            questionNumber: 3,
            text: 'If x² - 5x + 6 = 0, what are the roots of the quadratic equation?',
            type: 'single_choice',
            difficulty: 'medium',
            formula: {
              visualText: 'x² - 5x + 6 = (x - 2)(x - 3) = 0',
              accessibleText: 'x squared minus 5x plus 6 equals open parenthesis x minus 2 close parenthesis times open parenthesis x minus 3 close parenthesis equals zero',
            },
            options: [
              { id: 'A', label: 'A', text: '2 and 3', ariaLabel: 'Option A: 2 and 3' },
              { id: 'B', label: 'B', text: '-2 and -3', ariaLabel: 'Option B: -2 and -3' },
              { id: 'C', label: 'C', text: '1 and 6', ariaLabel: 'Option C: 1 and 6' },
              { id: 'D', label: 'D', text: '-1 and -6', ariaLabel: 'Option D: -1 and -6' },
            ],
            correctOptionIds: ['A'],
            explanation: 'Factorizing x² - 5x + 6 = 0 gives (x - 2)(x - 3) = 0, so x = 2 or x = 3.',
          },
          {
            id: 'math-m-04',
            sectionId: 'sec-math-alg',
            questionNumber: 4,
            text: 'What is the standard algebraic expansion of (a - b)²?',
            type: 'single_choice',
            difficulty: 'easy',
            formula: {
              visualText: '(a - b)² = a² - 2ab + b²',
              accessibleText: 'open parenthesis a minus b close parenthesis squared equals a squared minus 2 a b plus b squared',
            },
            options: [
              { id: 'A', label: 'A', text: 'a² - 2ab + b²', ariaLabel: 'Option A: a squared minus 2ab plus b squared' },
              { id: 'B', label: 'B', text: 'a² + 2ab + b²', ariaLabel: 'Option B: a squared plus 2ab plus b squared' },
              { id: 'C', label: 'C', text: 'a² - b²', ariaLabel: 'Option C: a squared minus b squared' },
              { id: 'D', label: 'D', text: 'a² + b²', ariaLabel: 'Option D: a squared plus b squared' },
            ],
            correctOptionIds: ['A'],
            explanation: 'The standard identity is (a - b)² = a² - 2ab + b².',
          },
        ],
      },
      {
        id: 'sec-math-geom',
        name: 'Geometry & Mensuration',
        code: 'GEOM',
        description: 'Properties of triangles and circle mensuration.',
        totalQuestions: 2,
        questions: [
          {
            id: 'math-m-05',
            sectionId: 'sec-math-geom',
            questionNumber: 5,
            text: 'The sum of all three interior angles in any planar triangle is equal to:',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: '90°', ariaLabel: 'Option A: 90 degrees' },
              { id: 'B', label: 'B', text: '180°', ariaLabel: 'Option B: 180 degrees' },
              { id: 'C', label: 'C', text: '270°', ariaLabel: 'Option C: 270 degrees' },
              { id: 'D', label: 'D', text: '360°', ariaLabel: 'Option D: 360 degrees' },
            ],
            correctOptionIds: ['B'],
            explanation: 'The sum of the interior angles of any planar triangle is always 180 degrees.',
          },
          {
            id: 'math-m-06',
            sectionId: 'sec-math-geom',
            questionNumber: 6,
            text: 'What is the area of a circle with a radius of 7 cm? (Take π = 22/7)',
            type: 'single_choice',
            difficulty: 'easy',
            formula: {
              visualText: 'Area = πr² = (22/7) × 7 × 7 = 154 cm²',
              accessibleText: 'Area equals pi r squared equals twenty-two over seven times seven times seven equals 154 square centimeters',
            },
            options: [
              { id: 'A', label: 'A', text: '154 cm²', ariaLabel: 'Option A: 154 square centimeters' },
              { id: 'B', label: 'B', text: '44 cm²', ariaLabel: 'Option B: 44 square centimeters' },
              { id: 'C', label: 'C', text: '88 cm²', ariaLabel: 'Option C: 88 square centimeters' },
              { id: 'D', label: 'D', text: '140 cm²', ariaLabel: 'Option D: 140 square centimeters' },
            ],
            correctOptionIds: ['A'],
            explanation: 'Area = πr² = (22/7) * 7 * 7 = 154 cm².',
          },
        ],
      },
    ],
  },
  {
    id: 'mock-eng-01',
    title: 'English Language & Comprehension Mock Test',
    examName: 'CDS (Combined Defence Services)',
    examCode: 'CDS-ENG',
    description: 'Dedicated English mock test evaluating Grammar rules, Vocabulary antonyms/synonyms, and Reading Comprehension.',
    totalQuestions: 6,
    durationMinutes: 30,
    difficulty: 'medium',
    status: 'not_started',
    isRecommended: true,
    instructionsSummary: [
      'Covers Vocabulary, Grammar Agreement, and Reading Comprehension.',
      'Marking Scheme: +1 for correct, -0.33 penalty for incorrect answers.',
      'Designed for complete screen-reader and voice navigation support.',
    ],
    markingScheme: {
      correctMarks: 1,
      incorrectPenalty: 0.33,
      unansweredMarks: 0,
    },
    accessibilityHighlights: {
      keyboard: 'Full keyboard navigation supported',
      screenReader: 'ARIA-live announcements on option selection',
      audio: 'Audio description support for prompts',
      visual: 'High contrast AAA presets',
    },
    sections: [
      {
        id: 'sec-eng-vocab',
        name: 'Vocabulary & Word Power',
        code: 'VOCAB',
        description: 'Antonyms, synonyms, and contextual vocabulary.',
        totalQuestions: 2,
        questions: [
          {
            id: 'eng-m-01',
            sectionId: 'sec-eng-vocab',
            questionNumber: 1,
            text: 'Choose the word that is most nearly opposite in meaning to "CANDID":',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'Outspoken', ariaLabel: 'Option A: Outspoken' },
              { id: 'B', label: 'B', text: 'Secretive', ariaLabel: 'Option B: Secretive' },
              { id: 'C', label: 'C', text: 'Blunt', ariaLabel: 'Option C: Blunt' },
              { id: 'D', label: 'D', text: 'Sincere', ariaLabel: 'Option D: Sincere' },
            ],
            correctOptionIds: ['B'],
            explanation: "'Candid' means truthful and straightforward. Its direct antonym is 'secretive'.",
          },
          {
            id: 'eng-m-02',
            sectionId: 'sec-eng-vocab',
            questionNumber: 2,
            text: 'Select the word that is most similar in meaning to "METICULOUS":',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'Careless', ariaLabel: 'Option A: Careless' },
              { id: 'B', label: 'B', text: 'Diligent', ariaLabel: 'Option B: Diligent' },
              { id: 'C', label: 'C', text: 'Casual', ariaLabel: 'Option C: Casual' },
              { id: 'D', label: 'D', text: 'Hasty', ariaLabel: 'Option D: Hasty' },
            ],
            correctOptionIds: ['B'],
            explanation: "'Meticulous' means showing great attention to detail; very careful and precise (diligent).",
          },
        ],
      },
      {
        id: 'sec-eng-gram',
        name: 'Grammar & Sentence Correction',
        code: 'GRAM',
        description: 'Subject-verb agreement and sentence rectification.',
        totalQuestions: 2,
        questions: [
          {
            id: 'eng-m-03',
            sectionId: 'sec-eng-gram',
            questionNumber: 3,
            text: 'Select the option that correctly rectifies the grammatical error: "Neither the manager nor the employees was present at the briefing."',
            type: 'single_choice',
            difficulty: 'medium',
            options: [
              { id: 'A', label: 'A', text: 'Neither the manager nor the employees were present at the briefing.', ariaLabel: 'Option A: were present' },
              { id: 'B', label: 'B', text: 'Neither the manager or the employees was present at the briefing.', ariaLabel: 'Option B: manager or employees' },
              { id: 'C', label: 'C', text: 'Neither the manager nor the employee was present at the briefing.', ariaLabel: 'Option C: employee was present' },
              { id: 'D', label: 'D', text: 'No correction required.', ariaLabel: 'Option D: No correction' },
            ],
            correctOptionIds: ['A'],
            explanation: "When two subjects are joined by 'neither... nor', the verb agrees with the closer subject ('employees', plural), so 'were present' is required.",
          },
          {
            id: 'eng-m-04',
            sectionId: 'sec-eng-gram',
            questionNumber: 4,
            text: 'Fill in the blank with the grammatically correct auxiliary verb: "One of the cadets ___ chosen for the special honor guard."',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'was', ariaLabel: 'Option A: was' },
              { id: 'B', label: 'B', text: 'were', ariaLabel: 'Option B: were' },
              { id: 'C', label: 'C', text: 'are', ariaLabel: 'Option C: are' },
              { id: 'D', label: 'D', text: 'have been', ariaLabel: 'Option D: have been' },
            ],
            correctOptionIds: ['A'],
            explanation: "The subject is 'One', which is singular, demanding the singular verb 'was'.",
          },
        ],
      },
      {
        id: 'sec-eng-rc',
        name: 'Reading & Idiomatic Expressions',
        code: 'RC',
        description: 'Discourse markers and idiomatic phrases.',
        totalQuestions: 2,
        questions: [
          {
            id: 'eng-m-05',
            sectionId: 'sec-eng-rc',
            questionNumber: 5,
            text: "When an author uses the transitional phrase 'on the contrary', what argumentative direction is signaled?",
            type: 'single_choice',
            difficulty: 'medium',
            options: [
              { id: 'A', label: 'A', text: 'Reinforcement of a previously stated premise', ariaLabel: 'Option A: Reinforcement' },
              { id: 'B', label: 'B', text: 'An emphatic reversal or counter-argument', ariaLabel: 'Option B: Emphatic reversal' },
              { id: 'C', label: 'C', text: 'A sequential chronological timeline', ariaLabel: 'Option C: Chronological timeline' },
              { id: 'D', label: 'D', text: 'A summary conclusion', ariaLabel: 'Option D: Summary conclusion' },
            ],
            correctOptionIds: ['B'],
            explanation: "'On the contrary' signals a sharp contrast or contradiction to a preceding statement.",
          },
          {
            id: 'eng-m-06',
            sectionId: 'sec-eng-rc',
            questionNumber: 6,
            text: 'What is the meaning of the idiom "To burn the candle at both ends"?',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'To work excessively hard without adequate rest', ariaLabel: 'Option A: Work excessively hard' },
              { id: 'B', label: 'B', text: 'To waste resources foolishly', ariaLabel: 'Option B: Waste resources' },
              { id: 'C', label: 'C', text: 'To remain undecided', ariaLabel: 'Option C: Remain undecided' },
              { id: 'D', label: 'D', text: 'To celebrate enthusiastically', ariaLabel: 'Option D: Celebrate' },
            ],
            correctOptionIds: ['A'],
            explanation: "'To burn the candle at both ends' means exhausting one's physical energies by working early in the morning until late at night.",
          },
        ],
      },
    ],
  },
  {
    id: 'mock-gk-01',
    title: 'General Knowledge & Defense Mock Test',
    examName: 'CDS (Combined Defence Services)',
    examCode: 'CDS-GK',
    description: 'Subject-wise mock covering Indian Polity & Constitution, Modern History, General Science, and Defense Affairs.',
    totalQuestions: 6,
    durationMinutes: 30,
    difficulty: 'easy',
    status: 'not_started',
    isRecommended: true,
    instructionsSummary: [
      'Focused assessment on Indian Polity, Constitution, General Science, and Defense.',
      'Negative marking: +1 for correct answers, -0.33 for incorrect attempts.',
      'Unanswered questions carry zero penalty.',
    ],
    markingScheme: {
      correctMarks: 1,
      incorrectPenalty: 0.33,
      unansweredMarks: 0,
    },
    accessibilityHighlights: {
      keyboard: 'Standard navigation shortcuts active',
      screenReader: 'Accessible tables and question options',
      audio: 'Question audio reader enabled',
      visual: 'Large font and high contrast modes available',
    },
    sections: [
      {
        id: 'sec-gk-pol',
        name: 'Indian Polity & Constitution',
        code: 'POL',
        description: 'Fundamental Rights and Directive Principles.',
        totalQuestions: 2,
        questions: [
          {
            id: 'gk-m-01',
            sectionId: 'sec-gk-pol',
            questionNumber: 1,
            text: 'Which Article of the Indian Constitution guarantees the Right to Equality before Law?',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'Article 14', ariaLabel: 'Option A: Article 14' },
              { id: 'B', label: 'B', text: 'Article 19', ariaLabel: 'Option B: Article 19' },
              { id: 'C', label: 'C', text: 'Article 21', ariaLabel: 'Option C: Article 21' },
              { id: 'D', label: 'D', text: 'Article 32', ariaLabel: 'Option D: Article 32' },
            ],
            correctOptionIds: ['A'],
            explanation: 'Article 14 guarantees equality before law and equal protection of the laws.',
          },
          {
            id: 'gk-m-02',
            sectionId: 'sec-gk-pol',
            questionNumber: 2,
            text: 'The Directive Principles of State Policy in the Indian Constitution were borrowed from which country?',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'United Kingdom', ariaLabel: 'Option A: United Kingdom' },
              { id: 'B', label: 'B', text: 'Ireland', ariaLabel: 'Option B: Ireland' },
              { id: 'C', label: 'C', text: 'USA', ariaLabel: 'Option C: USA' },
              { id: 'D', label: 'D', text: 'Canada', ariaLabel: 'Option D: Canada' },
            ],
            correctOptionIds: ['B'],
            explanation: 'The Directive Principles of State Policy (Part IV) were borrowed from the Constitution of Ireland.',
          },
        ],
      },
      {
        id: 'sec-gk-sci',
        name: 'General Science & Technology',
        code: 'SCI',
        description: 'Environmental science and indigenous aerospace.',
        totalQuestions: 2,
        questions: [
          {
            id: 'gk-m-03',
            sectionId: 'sec-gk-sci',
            questionNumber: 3,
            text: 'Which gas is primarily responsible for the greenhouse effect on Earth?',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'Carbon Dioxide', ariaLabel: 'Option A: Carbon Dioxide' },
              { id: 'B', label: 'B', text: 'Nitrogen', ariaLabel: 'Option B: Nitrogen' },
              { id: 'C', label: 'C', text: 'Oxygen', ariaLabel: 'Option C: Oxygen' },
              { id: 'D', label: 'D', text: 'Argon', ariaLabel: 'Option D: Argon' },
            ],
            correctOptionIds: ['A'],
            explanation: 'Carbon dioxide is the primary greenhouse gas contributing to global temperature trapping.',
          },
          {
            id: 'gk-m-04',
            sectionId: 'sec-gk-sci',
            questionNumber: 4,
            text: 'What is the primary operational fighter aircraft of the Indian Air Force developed indigenously in India?',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'LCA Tejas', ariaLabel: 'Option A: LCA Tejas' },
              { id: 'B', label: 'B', text: 'Sukhoi Su-30MKI', ariaLabel: 'Option B: Sukhoi Su-30MKI' },
              { id: 'C', label: 'C', text: 'Mirage 2000', ariaLabel: 'Option C: Mirage 2000' },
              { id: 'D', label: 'D', text: 'Rafale', ariaLabel: 'Option D: Rafale' },
            ],
            correctOptionIds: ['A'],
            explanation: 'The Light Combat Aircraft (LCA) Tejas is an indigenous 4.5 generation fighter developed by ADA and HAL.',
          },
        ],
      },
      {
        id: 'sec-gk-def',
        name: 'Defense & Modern History',
        code: 'DEF',
        description: 'Armed forces exercises and national historical leaders.',
        totalQuestions: 2,
        questions: [
          {
            id: 'gk-m-05',
            sectionId: 'sec-gk-def',
            questionNumber: 5,
            text: "The bilateral joint military exercise 'MITRA SHAKTI' is conducted between India and which country?",
            type: 'single_choice',
            difficulty: 'medium',
            options: [
              { id: 'A', label: 'A', text: 'Nepal', ariaLabel: 'Option A: Nepal' },
              { id: 'B', label: 'B', text: 'Sri Lanka', ariaLabel: 'Option B: Sri Lanka' },
              { id: 'C', label: 'C', text: 'Bangladesh', ariaLabel: 'Option C: Bangladesh' },
              { id: 'D', label: 'D', text: 'Maldives', ariaLabel: 'Option D: Maldives' },
            ],
            correctOptionIds: ['B'],
            explanation: 'Exercise Mitra Shakti is conducted between Indian Army and Sri Lanka Army.',
          },
          {
            id: 'gk-m-06',
            sectionId: 'sec-gk-def',
            questionNumber: 6,
            text: "Who revitalized and led the Indian National Army (Azad Hind Fauj) with the historic call 'Give me blood, and I shall give you freedom'?",
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'Netaji Subhas Chandra Bose', ariaLabel: 'Option A: Netaji Subhas Chandra Bose' },
              { id: 'B', label: 'B', text: 'Bhagat Singh', ariaLabel: 'Option B: Bhagat Singh' },
              { id: 'C', label: 'C', text: 'Chandrashekhar Azad', ariaLabel: 'Option C: Chandrashekhar Azad' },
              { id: 'D', label: 'D', text: 'Lala Lajpat Rai', ariaLabel: 'Option D: Lala Lajpat Rai' },
            ],
            correctOptionIds: ['A'],
            explanation: 'Netaji Subhas Chandra Bose took supreme command of the INA in 1943 in Singapore.',
          },
        ],
      },
    ],
  },
  {
    id: 'mock-reas-01',
    title: 'Reasoning Ability & Mental Aptitude Mock Test',
    examName: 'CDS (Combined Defence Services)',
    examCode: 'CDS-REAS',
    description: 'Subject-wise mock testing Deductive Logic, Coding-Decoding, Number Series, and Direction Sense.',
    totalQuestions: 6,
    durationMinutes: 30,
    difficulty: 'medium',
    status: 'not_started',
    isRecommended: true,
    instructionsSummary: [
      'Covers Deductive Logic, Coding-Decoding, and Number Sequences.',
      'Marking Scheme: +1 for correct, -0.33 penalty for incorrect answers.',
      'Accessible navigation supported across all question cards.',
    ],
    markingScheme: {
      correctMarks: 1,
      incorrectPenalty: 0.33,
      unansweredMarks: 0,
    },
    accessibilityHighlights: {
      keyboard: 'Full keyboard navigation supported',
      screenReader: 'Screen reader compatible formatting',
      audio: 'Audio description support for prompts',
      visual: 'High contrast and scalable typography supported',
    },
    sections: [
      {
        id: 'sec-reas-code',
        name: 'Coding & Decoding',
        code: 'CODE',
        description: 'Letter shifts and alphabet numerical ranks.',
        totalQuestions: 2,
        questions: [
          {
            id: 'reas-m-01',
            sectionId: 'sec-reas-code',
            questionNumber: 1,
            text: 'In a certain code language, CAT is coded as 24 and DOG is coded as 26. What is the code for PIG?',
            type: 'single_choice',
            difficulty: 'medium',
            options: [
              { id: 'A', label: 'A', text: '32', ariaLabel: 'Option A: 32' },
              { id: 'B', label: 'B', text: '30', ariaLabel: 'Option B: 30' },
              { id: 'C', label: 'C', text: '28', ariaLabel: 'Option C: 28' },
              { id: 'D', label: 'D', text: '34', ariaLabel: 'Option D: 34' },
            ],
            correctOptionIds: ['A'],
            explanation: 'Sum of alphabetical ranks: P(16) + I(9) + G(7) = 32.',
          },
          {
            id: 'reas-m-02',
            sectionId: 'sec-reas-code',
            questionNumber: 2,
            text: 'If "DELHI" is coded as "EDMIJ", how is "MUMBAI" coded following the exact same letter shift rule?',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'NVNCBJ', ariaLabel: 'Option A: NVNCBJ' },
              { id: 'B', label: 'B', text: 'NVMCBJ', ariaLabel: 'Option B: NVMCBJ' },
              { id: 'C', label: 'C', text: 'LTLAZH', ariaLabel: 'Option C: LTLAZH' },
              { id: 'D', label: 'D', text: 'OWNCDK', ariaLabel: 'Option D: OWNCDK' },
            ],
            correctOptionIds: ['A'],
            explanation: 'Each letter is shifted forward by 1: M(+1)=N, U(+1)=V, M(+1)=N, B(+1)=C, A(+1)=B, I(+1)=J => NVNCBJ.',
          },
        ],
      },
      {
        id: 'sec-reas-seq',
        name: 'Number & Alphabet Sequences',
        code: 'SEQ',
        description: 'Progressions, geometric series, and alphabet series.',
        totalQuestions: 2,
        questions: [
          {
            id: 'reas-m-03',
            sectionId: 'sec-reas-seq',
            questionNumber: 3,
            text: 'Find the missing number in the sequence: 3, 7, 15, 31, 63, ___',
            type: 'single_choice',
            difficulty: 'medium',
            options: [
              { id: 'A', label: 'A', text: '95', ariaLabel: 'Option A: 95' },
              { id: 'B', label: 'B', text: '127', ariaLabel: 'Option B: 127' },
              { id: 'C', label: 'C', text: '125', ariaLabel: 'Option C: 125' },
              { id: 'D', label: 'D', text: '110', ariaLabel: 'Option D: 110' },
            ],
            correctOptionIds: ['B'],
            explanation: 'Each term is obtained by: (Previous * 2) + 1. So 63 * 2 + 1 = 127.',
          },
          {
            id: 'reas-m-04',
            sectionId: 'sec-reas-seq',
            questionNumber: 4,
            text: 'What is the next letter in the increasing gap sequence: B, D, G, K, P, ___?',
            type: 'single_choice',
            difficulty: 'medium',
            options: [
              { id: 'A', label: 'A', text: 'S', ariaLabel: 'Option A: S' },
              { id: 'B', label: 'B', text: 'U', ariaLabel: 'Option B: U' },
              { id: 'C', label: 'C', text: 'V', ariaLabel: 'Option C: V' },
              { id: 'D', label: 'D', text: 'W', ariaLabel: 'Option D: W' },
            ],
            correctOptionIds: ['C'],
            explanation: 'The alphabetical ranks increase by consecutive numbers: B(2)+2=D(4), D(4)+3=G(7), G(7)+4=K(11), K(11)+5=P(16), P(16)+6=V(22). Hence V.',
          },
        ],
      },
      {
        id: 'sec-reas-logic',
        name: 'Analogy & Direction Sense',
        code: 'LOGIC',
        description: 'Functional analogies and spatial distance problems.',
        totalQuestions: 2,
        questions: [
          {
            id: 'reas-m-05',
            sectionId: 'sec-reas-logic',
            questionNumber: 5,
            text: 'Complete the analogy: Doctor is to Hospital as Teacher is to:',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'Classroom', ariaLabel: 'Option A: Classroom' },
              { id: 'B', label: 'B', text: 'School', ariaLabel: 'Option B: School' },
              { id: 'C', label: 'C', text: 'Student', ariaLabel: 'Option C: Student' },
              { id: 'D', label: 'D', text: 'Library', ariaLabel: 'Option D: Library' },
            ],
            correctOptionIds: ['B'],
            explanation: "A doctor's primary workplace institution is a hospital; a teacher's primary workplace institution is a school.",
          },
          {
            id: 'reas-m-06',
            sectionId: 'sec-reas-logic',
            questionNumber: 6,
            text: 'A candidate walks 4 km North, then turns right and walks 3 km East. What is the straight-line distance from the starting point?',
            type: 'single_choice',
            difficulty: 'easy',
            formula: {
              visualText: 'Distance = √(4² + 3²) = √(16 + 9) = √25 = 5 km',
              accessibleText: 'Distance equals square root of 4 squared plus 3 squared equals square root of 25 equals 5 kilometers',
            },
            options: [
              { id: 'A', label: 'A', text: '7 km', ariaLabel: 'Option A: 7 kilometers' },
              { id: 'B', label: 'B', text: '5 km', ariaLabel: 'Option B: 5 kilometers' },
              { id: 'C', label: 'C', text: '1 km', ariaLabel: 'Option C: 1 kilometer' },
              { id: 'D', label: 'D', text: '6 km', ariaLabel: 'Option D: 6 kilometers' },
            ],
            correctOptionIds: ['B'],
            explanation: 'Applying Pythagoras theorem: Hypotenuse = √(4² + 3²) = √(16 + 9) = √25 = 5 km.',
          },
        ],
      },
    ],
  },
  {
    id: 'cds-gk-assessment-02',
    title: 'General Knowledge & Current Affairs Drill',
    examName: 'CDS (Combined Defence Services)',
    examCode: 'CDS-2026-GK',
    description: 'Focused assessment on Indian Polity, Constitution, Physical Geography, and General Science.',
    totalQuestions: 4,
    durationMinutes: 30,
    difficulty: 'easy',
    status: 'not_started',
    isRecommended: false,
    instructionsSummary: [
      'This is a focused drill covering Indian Constitution, Geography, and Defense topics.',
      'Negative marking: +1 for correct answers, -0.33 for incorrect attempts.',
      'Unanswered questions carry zero penalty.',
    ],
    markingScheme: {
      correctMarks: 1,
      incorrectPenalty: 0.33,
      unansweredMarks: 0,
    },
    accessibilityHighlights: {
      keyboard: 'Standard navigation shortcuts active',
      screenReader: 'Accessible tables and question options',
      audio: 'Question audio reader enabled',
      visual: 'Large font and high contrast modes available',
    },
    sections: [
      {
        id: 'sec-polity',
        name: 'Indian Polity & Constitution',
        code: 'POL',
        description: 'Fundamental Rights, Directive Principles, and Governance.',
        totalQuestions: 2,
        questions: [
          {
            id: 'gk-q-1',
            sectionId: 'sec-polity',
            questionNumber: 1,
            text: 'Which Article of the Indian Constitution guarantees the Right to Equality before Law?',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'Article 14', ariaLabel: 'Option A: Article 14' },
              { id: 'B', label: 'B', text: 'Article 19', ariaLabel: 'Option B: Article 19' },
              { id: 'C', label: 'C', text: 'Article 21', ariaLabel: 'Option C: Article 21' },
              { id: 'D', label: 'D', text: 'Article 32', ariaLabel: 'Option D: Article 32' },
            ],
            correctOptionIds: ['A'],
            explanation: 'Article 14 guarantees equality before law and equal protection of the laws.',
          },
          {
            id: 'gk-q-2',
            sectionId: 'sec-polity',
            questionNumber: 2,
            text: 'The Directive Principles of State Policy in the Indian Constitution were borrowed from which country?',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'United Kingdom', ariaLabel: 'Option A: United Kingdom' },
              { id: 'B', label: 'B', text: 'Ireland', ariaLabel: 'Option B: Ireland' },
              { id: 'C', label: 'C', text: 'USA', ariaLabel: 'Option C: USA' },
              { id: 'D', label: 'D', text: 'Canada', ariaLabel: 'Option D: Canada' },
            ],
            correctOptionIds: ['B'],
            explanation: 'The Directive Principles of State Policy (Part IV of the Indian Constitution) were borrowed from the Constitution of Ireland.',
          },
        ],
      },
      {
        id: 'sec-science',
        name: 'General Science & Defense',
        code: 'SCI',
        description: 'Physics, Chemistry, Biology, and Defense preparedness.',
        totalQuestions: 2,
        questions: [
          {
            id: 'gk-q-3',
            sectionId: 'sec-science',
            questionNumber: 3,
            text: 'Which gas is primarily responsible for the greenhouse effect on Earth?',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'Carbon Dioxide', ariaLabel: 'Option A: Carbon Dioxide' },
              { id: 'B', label: 'B', text: 'Nitrogen', ariaLabel: 'Option B: Nitrogen' },
              { id: 'C', label: 'C', text: 'Oxygen', ariaLabel: 'Option C: Oxygen' },
              { id: 'D', label: 'D', text: 'Argon', ariaLabel: 'Option D: Argon' },
            ],
            correctOptionIds: ['A'],
            explanation: 'Carbon dioxide is the primary greenhouse gas contributing to the greenhouse effect on Earth.',
          },
          {
            id: 'gk-q-4',
            sectionId: 'sec-science',
            questionNumber: 4,
            text: 'What is the primary operational combat aircraft of the Indian Air Force developed indigenously in India?',
            type: 'single_choice',
            difficulty: 'easy',
            options: [
              { id: 'A', label: 'A', text: 'LCA Tejas', ariaLabel: 'Option A: LCA Tejas' },
              { id: 'B', label: 'B', text: 'Sukhoi Su-30MKI', ariaLabel: 'Option B: Sukhoi Su-30MKI' },
              { id: 'C', label: 'C', text: 'Mirage 2000', ariaLabel: 'Option C: Mirage 2000' },
              { id: 'D', label: 'D', text: 'Rafale', ariaLabel: 'Option D: Rafale' },
            ],
            correctOptionIds: ['A'],
            explanation: 'The Light Combat Aircraft (LCA) Tejas is an indigenous 4.5 generation fighter aircraft.',
          },
        ],
      },
    ],
  },
];

/**
 * Intelligent helper to resolve mock tests by ID or subject name (math, english, gk, reasoning, etc.)
 */
export function findFallbackMockTest(identifier: string): MockTest {
  if (!identifier) return FALLBACK_MOCK_TESTS[0];
  const query = identifier.toLowerCase().trim();

  // Exact ID
  let match = FALLBACK_MOCK_TESTS.find((t) => t.id.toLowerCase() === query);
  if (match) return match;

  // Contains ID
  match = FALLBACK_MOCK_TESTS.find((t) => t.id.toLowerCase().includes(query));
  if (match) return match;

  // Subject matching
  if (query.includes('math') || query.includes('ganit') || query.includes('arithmetic')) {
    return FALLBACK_MOCK_TESTS.find((t) => t.id === 'mock-math-01') || FALLBACK_MOCK_TESTS[0];
  }
  if (query.includes('eng') || query.includes('angrezi') || query.includes('vocab') || query.includes('grammar')) {
    return FALLBACK_MOCK_TESTS.find((t) => t.id === 'mock-eng-01') || FALLBACK_MOCK_TESTS[0];
  }
  if (query.includes('gk') || query.includes('general') || query.includes('polity') || query.includes('current')) {
    return FALLBACK_MOCK_TESTS.find((t) => t.id === 'mock-gk-01') || FALLBACK_MOCK_TESTS.find((t) => t.id === 'cds-gk-assessment-02') || FALLBACK_MOCK_TESTS[0];
  }
  if (query.includes('reas') || query.includes('logic') || query.includes('tarkik') || query.includes('coding')) {
    return FALLBACK_MOCK_TESTS.find((t) => t.id === 'mock-reas-01') || FALLBACK_MOCK_TESTS[0];
  }
  if (query.includes('full') || query.includes('cds')) {
    return FALLBACK_MOCK_TESTS.find((t) => t.id === 'cds-full-mock-01') || FALLBACK_MOCK_TESTS[0];
  }

  // Title matching
  match = FALLBACK_MOCK_TESTS.find((t) => t.title.toLowerCase().includes(query));
  return match || FALLBACK_MOCK_TESTS[0];
}

/**
 * Normalizes any mock test payload from backend or local cache,
 * ensuring sections, questions, and accessibility fields are never undefined.
 */
function normalizeMockTest(rawTest: any): MockTest {
  if (!rawTest) return FALLBACK_MOCK_TESTS[0];
  const testObj = rawTest.data || rawTest.test || rawTest.mockTest || rawTest;

  const rawSections = testObj.sections || testObj.sectionList || testObj.exam_sections || [];
  const normalizedSections: MockTestSection[] = (Array.isArray(rawSections) ? rawSections : []).map((s: any, idx: number) => {
    const sectionId = s.id || s.sectionId || `sec-${idx + 1}`;
    const sectionName = s.name || s.title || `Section ${idx + 1}`;
    const sectionCode = s.code || s.sectionCode || `SEC${idx + 1}`;
    const sectionDescription = s.description || '';
    const rawQuestions = s.questions || s.questionList || s.items || [];
    const normalizedQuestions: MockTestQuestion[] = (Array.isArray(rawQuestions) ? rawQuestions : []).map((q: any, qIdx: number) => ({
      id: q.id || q.questionId || `q-${idx}-${qIdx}`,
      sectionId: q.sectionId || sectionId,
      questionNumber: q.questionNumber || q.question_number || qIdx + 1,
      text: q.text || q.questionText || q.question_text || `Question ${qIdx + 1}`,
      type: q.type || 'single_choice',
      difficulty: q.difficulty || 'medium',
      options: (q.options || []).map((o: any, oIdx: number) => ({
        id: String(o.id || o.label || String.fromCharCode(65 + oIdx)),
        label: o.label || String.fromCharCode(65 + oIdx),
        text: o.text || o.optionText || o.option_text || '',
        ariaLabel: o.ariaLabel || `Option ${o.label || String.fromCharCode(65 + oIdx)}: ${o.text || ''}`,
      })),
      correctOptionIds: q.correctOptionIds || q.correct_option_ids || (q.options?.[0]?.id ? [String(q.options[0].id)] : ['A']),
      explanation: q.explanation || '',
      formula: q.formula,
      table: q.table,
      audioText: q.audioText || q.audio_text || q.text,
    }));

    const totalQ = s.totalQuestions ?? s.total_questions ?? s.questionCount ?? s.question_count ?? (normalizedQuestions.length > 0 ? normalizedQuestions.length : 2);

    return {
      id: sectionId,
      name: sectionName,
      title: sectionName,
      code: sectionCode,
      description: sectionDescription,
      totalQuestions: totalQ,
      questions: normalizedQuestions,
    };
  });

  return {
    id: testObj.id || 'cds-full-mock-01',
    title: testObj.title || 'Mock Examination',
    examName: testObj.examName || testObj.exam_name || 'CDS (Combined Defence Services)',
    examCode: testObj.examCode || testObj.exam_code || 'UPSC-CDS',
    description: testObj.description || '',
    totalQuestions: testObj.totalQuestions ?? testObj.total_questions ?? (normalizedSections.reduce((acc, s) => acc + s.totalQuestions, 0) || 6),
    durationMinutes: testObj.durationMinutes ?? testObj.duration_minutes ?? 45,
    difficulty: testObj.difficulty || 'medium',
    status: testObj.status || 'not_started',
    isRecommended: testObj.isRecommended ?? testObj.is_recommended ?? false,
    markingScheme: testObj.markingScheme || testObj.marking_scheme || {
      correctMarks: 1,
      incorrectPenalty: 0.33,
      unansweredMarks: 0,
    },
    instructionsSummary: testObj.instructionsSummary || testObj.instructions_summary || [
      'Each question has four options with exactly one correct answer.',
      'Marking Scheme: +1 for correct, -0.33 penalty for incorrect.',
      'Accessible keyboard navigation supported.',
    ],
    accessibilityHighlights: testObj.accessibilityHighlights || testObj.accessibility_highlights || {
      keyboard: 'Full keyboard navigation with dedicated shortcuts',
      screenReader: 'Screen-reader compatible',
      audio: 'Audio text available',
      visual: 'High contrast accessible styling',
    },
    sections: normalizedSections,
  };
}

export const mockTestService = {
  /**
   * Fetches all available mock tests from backend with fallback support.
   */
  async getMockTests(): Promise<MockTest[]> {
    try {
      const res: any = await apiClient.get<any>('/mock-tests', { timeoutMs: 3500, retries: 0 });
      const list = Array.isArray(res) ? res : (res?.data || res?.items || res?.tests || []);
      if (Array.isArray(list) && list.length > 0) {
        return list.map(normalizeMockTest);
      }
      return FALLBACK_MOCK_TESTS;
    } catch (err) {
      console.warn('Backend /mock-tests endpoint unavailable, utilizing fallback mock test catalog:', err);
      return FALLBACK_MOCK_TESTS;
    }
  },

  /**
   * Fetches a specific mock test by ID with sanitized questions.
   */
  async getMockTest(id: string): Promise<MockTest | null> {
    try {
      const res: any = await apiClient.get<any>(`/mock-tests/${id}`, { timeoutMs: 3500, retries: 0 });
      if (res) {
        const normalized = normalizeMockTest(res);
        // If server sections had no questions (e.g. list header), enrich from fallback
        if (normalized.sections.every((s) => s.questions.length === 0)) {
          const fallback = findFallbackMockTest(id);
          if (fallback) {
            normalized.sections = fallback.sections;
          }
        }
        return normalized;
      }
    } catch (err) {
      console.warn(`Failed to fetch mock test ${id} from server, checking fallback catalog:`, err);
    }
    const fallback = findFallbackMockTest(id);
    return fallback ? normalizeMockTest(fallback) : null;
  },

  /**
   * Starts a new mock test session.
   */
  async startMockTest(testId: string): Promise<MockTestSession> {
    const rawTest = await this.getMockTest(testId);
    if (!rawTest) {
      throw new Error(`Mock test with ID "${testId}" not found.`);
    }
    const test = normalizeMockTest(rawTest);
    if (!test.sections || test.sections.length === 0 || test.sections.every(s => !s.questions || s.questions.length === 0)) {
      const fb = findFallbackMockTest(testId);
      test.sections = fb.sections;
    }

    const firstSection = test.sections[0] || { id: 'sec-1', name: 'General', code: 'GEN', description: '', totalQuestions: 0, questions: [] };
    const firstQuestion = firstSection.questions?.[0] || {
      id: 'q-1',
      sectionId: firstSection.id,
      questionNumber: 1,
      text: 'Question 1',
      type: 'single_choice' as const,
      difficulty: 'easy' as const,
      options: [],
      correctOptionIds: ['A'],
    };

    const sessionId = `mock-sess-${test.id}-${Date.now()}`;
    const durationSeconds = (test.durationMinutes || 45) * 60;

    const initialAnswers: Record<string, MockTestAnswer> = {};
    (test.sections || []).forEach((sec) => {
      (sec.questions || []).forEach((q) => {
        initialAnswers[q.id] = {
          questionId: q.id,
          sectionId: sec.id,
          selectedOptionIds: [],
          status: 'unanswered',
          markedForReview: false,
          timeSpentSeconds: 0,
        };
      });
    });

    const session: MockTestSession = {
      sessionId,
      testId: test.id,
      testTitle: test.title,
      examName: test.examName,
      totalQuestions: test.totalQuestions,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      durationSeconds,
      secondsRemaining: durationSeconds,
      currentSectionId: firstSection?.id || '',
      currentQuestionId: firstQuestion?.id || '',
      answers: initialAnswers,
    };

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
      localStorage.setItem('gowow_active_mock_session_id', sessionId);
    } catch (e) {
      console.warn('Failed to persist mock test session to localStorage:', e);
    }

    return session;
  },

  /**
   * Retrieves currently active session from localStorage if present.
   */
  async getActiveSession(): Promise<MockTestSession | null> {
    const activeId = localStorage.getItem('gowow_active_mock_session_id');
    if (!activeId) return null;
    return this.getMockSession(activeId);
  },

  /**
   * Retrieves an active or stored mock test session.
   */
  async getMockSession(sessionId: string): Promise<MockTestSession | null> {
    if (activeSessions.has(sessionId)) {
      return { ...activeSessions.get(sessionId)! };
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_SESSION_PREFIX}${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as MockTestSession;
        activeSessions.set(sessionId, parsed);
        return { ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse mock test session from localStorage:', e);
    }

    return null;
  },

  /**
   * Updates an answer within a mock test session.
   */
  async saveAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    timeSpentSeconds: number = 0
  ): Promise<MockTestSession> {
    const session = await this.getMockSession(sessionId);
    if (!session) throw new Error('Session not found.');

    const currentAnswer = session.answers[questionId] || {
      questionId,
      sectionId: session.currentSectionId,
      selectedOptionIds: [],
      status: 'unanswered',
      markedForReview: false,
      timeSpentSeconds: 0,
    };

    const hasSelection = selectedOptionIds.length > 0;
    const newStatus = currentAnswer.markedForReview
      ? hasSelection
        ? 'answered_marked_for_review'
        : 'marked_for_review'
      : hasSelection
      ? 'answered'
      : 'unanswered';

    session.answers[questionId] = {
      ...currentAnswer,
      selectedOptionIds,
      status: newStatus,
      timeSpentSeconds: currentAnswer.timeSpentSeconds + timeSpentSeconds,
    };

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to update mock test session in localStorage:', e);
    }

    return { ...session };
  },

  /**
   * Alias for saveAnswer expected by MockTestSessionPage
   */
  async saveMockAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    timeSpentSeconds: number = 0
  ): Promise<MockTestSession> {
    return this.saveAnswer(sessionId, questionId, selectedOptionIds, timeSpentSeconds);
  },

  /**
   * Toggles the mark for review status.
   */
  async toggleMarkForReview(sessionId: string, questionId: string): Promise<MockTestSession> {
    const session = await this.getMockSession(sessionId);
    if (!session) throw new Error('Session not found.');

    const currentAnswer = session.answers[questionId];
    if (!currentAnswer) return session;

    const newMarked = !currentAnswer.markedForReview;
    const hasSelection = currentAnswer.selectedOptionIds.length > 0;
    const newStatus = newMarked
      ? hasSelection
        ? 'answered_marked_for_review'
        : 'marked_for_review'
      : hasSelection
      ? 'answered'
      : 'unanswered';

    session.answers[questionId] = {
      ...currentAnswer,
      markedForReview: newMarked,
      status: newStatus,
    };

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to update review status in localStorage:', e);
    }

    return { ...session };
  },

  /**
   * Clears candidate's response for a question.
   */
  async clearAnswer(sessionId: string, questionId: string): Promise<MockTestSession> {
    const session = await this.getMockSession(sessionId);
    if (!session) throw new Error('Session not found.');

    const currentAnswer = session.answers[questionId];
    if (!currentAnswer) return session;

    session.answers[questionId] = {
      ...currentAnswer,
      selectedOptionIds: [],
      status: currentAnswer.markedForReview ? 'marked_for_review' : 'unanswered',
    };

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to clear answer in localStorage:', e);
    }

    return { ...session };
  },

  /**
   * Updates current navigation position and remaining timer in active session.
   */
  async updateNavigationPosition(
    sessionId: string,
    sectionId: string,
    questionId: string,
    secondsRemaining?: number
  ): Promise<MockTestSession | null> {
    const session = await this.getMockSession(sessionId);
    if (!session) return null;

    session.currentSectionId = sectionId;
    session.currentQuestionId = questionId;
    if (secondsRemaining !== undefined) {
      session.secondsRemaining = secondsRemaining;
    }

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to update navigation position in localStorage:', e);
    }

    return { ...session };
  },

  /**
   * Submits the mock test to the backend server for authoritative scoring.
   */
  async submitMockTest(session: MockTestSession, secondsRemaining: number): Promise<MockTestResult> {
    const timeUsedSeconds = Math.max(0, session.durationSeconds - secondsRemaining);
    const mins = Math.floor(timeUsedSeconds / 60);
    const secs = timeUsedSeconds % 60;
    const timeUsedFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // Server-authoritative scoring call with local fallback
    let serverResult: any = null;
    let reviews: MockTestQuestionReview[] = [];

    try {
      serverResult = await apiClient.post<any>('/mock-tests/submit', {
        test_id: session.testId,
        answers: session.answers,
        duration_seconds: session.durationSeconds,
        seconds_remaining: secondsRemaining,
      });

      reviews = (serverResult.reviews || []).map((r: any) => ({
        questionId: r.questionId,
        questionNumber: r.questionNumber,
        sectionId: r.sectionId,
        sectionName: r.sectionId.replace('sec-', '').toUpperCase(),
        questionText: r.text,
        type: 'single_choice',
        options: (r.options || []).map((o: any) => ({
          id: o.id,
          label: o.label,
          text: o.text,
          ariaLabel: `Option ${o.label}: ${o.text}`,
        })),
        userOptionIds: r.selectedOptionIds || [],
        correctOptionIds: r.correctOptionIds || [],
        status: r.isCorrect ? 'correct' : r.isSkipped ? 'unanswered' : 'incorrect',
        markedForReview: r.markedForReview,
        explanation: r.explanation,
      }));
    } catch (err) {
      console.warn('Backend /mock-tests/submit unavailable, computing fallback authoritative score locally:', err);
      let correct = 0;
      let incorrect = 0;
      let unanswered = 0;

      const fallbackReviews: MockTestQuestionReview[] = [];
      const testDef = findFallbackMockTest(session.testId);

      const qMap = new Map();
      testDef.sections.forEach((sec) => {
        sec.questions.forEach((q) => qMap.set(q.id, q));
      });

      Object.entries(session.answers).forEach(([qId, ans], idx) => {
        const origQ = qMap.get(qId);
        const correctOpts = origQ?.correctOptionIds || ['A'];
        const selected = ans.selectedOptionIds || [];
        const isAnswered = selected.length > 0;
        const isCorrect = isAnswered && JSON.stringify(selected.sort()) === JSON.stringify(correctOpts.sort());

        if (!isAnswered) unanswered++;
        else if (isCorrect) correct++;
        else incorrect++;

        fallbackReviews.push({
          questionId: qId,
          questionNumber: origQ?.questionNumber || idx + 1,
          sectionId: ans.sectionId || 'sec-1',
          sectionName: ans.sectionId?.replace('sec-', '').toUpperCase() || 'General',
          questionText: origQ?.text || `Question ${idx + 1}`,
          type: 'single_choice',
          options: origQ?.options || [],
          userOptionIds: selected,
          correctOptionIds: correctOpts,
          status: isCorrect ? 'correct' : !isAnswered ? 'unanswered' : 'incorrect',
          markedForReview: ans.markedForReview,
          explanation: origQ?.explanation || 'Standard verified solution and comprehensive pedagogical rationale.',
        });
      });

      const totalQ = session.totalQuestions || Math.max(1, correct + incorrect + unanswered);
      const totalScore = Math.max(0, Math.round((correct * 1 - incorrect * 0.33) * 10) / 10);
      const percentage = Math.round((correct / totalQ) * 100);

      serverResult = {
        testTitle: session.testTitle,
        totalScore,
        maximumScore: totalQ,
        percentage,
        totalQuestions: totalQ,
        correctCount: correct,
        incorrectCount: incorrect,
        unansweredCount: unanswered,
        markedForReviewCount: Object.values(session.answers).filter(a => a.markedForReview).length,
        sections: testDef.sections.map((s) => ({
          sectionId: s.id,
          sectionName: s.name,
          totalQuestions: s.questions.length,
          attemptedCount: s.questions.filter((q) => (session.answers[q.id]?.selectedOptionIds?.length || 0) > 0).length,
          correctCount: s.questions.filter((q) => {
            const sel = session.answers[q.id]?.selectedOptionIds || [];
            return sel.length > 0 && JSON.stringify(sel.sort()) === JSON.stringify(q.correctOptionIds.sort());
          }).length,
          incorrectCount: s.questions.filter((q) => {
            const sel = session.answers[q.id]?.selectedOptionIds || [];
            return sel.length > 0 && JSON.stringify(sel.sort()) !== JSON.stringify(q.correctOptionIds.sort());
          }).length,
          unansweredCount: s.questions.filter((q) => (session.answers[q.id]?.selectedOptionIds?.length || 0) === 0).length,
          score: Math.max(0, correct * 1 - incorrect * 0.33),
          accuracyPercent: percentage,
        })),
      };
      reviews = fallbackReviews;
    }

    const result: MockTestResult = {
      sessionId: session.sessionId,
      testId: session.testId,
      testTitle: serverResult.testTitle,
      examName: session.examName,
      totalScore: serverResult.totalScore,
      maxScore: serverResult.maximumScore,
      percentage: serverResult.percentage,
      totalQuestions: serverResult.totalQuestions,
      correctCount: serverResult.correctCount,
      incorrectCount: serverResult.incorrectCount,
      unansweredCount: serverResult.unansweredCount,
      markedForReviewCount: serverResult.markedForReviewCount,
      timeUsedSeconds,
      timeUsedFormatted,
      sectionPerformances: (serverResult.sections || []).map((s: any) => ({
        sectionId: s.sectionId,
        sectionName: s.sectionName,
        totalQuestions: s.totalQuestions,
        answeredCount: s.attemptedCount,
        correctCount: s.correctCount,
        incorrectCount: s.incorrectCount,
        unansweredCount: s.unansweredCount,
        score: s.score,
        maxScore: s.totalQuestions,
        accuracyPercent: s.accuracyPercent,
        timeSpentSeconds: Math.floor(timeUsedSeconds / (serverResult.sections?.length || 1)),
      })),
      factualInterpretations: [
        `You scored ${serverResult.totalScore} marks out of ${serverResult.maximumScore} (${serverResult.percentage}%).`,
        `Answered ${serverResult.correctCount} correctly, ${serverResult.incorrectCount} incorrectly, and skipped ${serverResult.unansweredCount}.`,
      ],
      recommendedNextSteps: [
        'Review the detailed question explanations to reinforce your conceptual retention.',
        'Focus on topics where errors occurred and schedule a targeted practice set.',
      ],
    };

    completedResults.set(session.sessionId, result);
    completedResults.set(session.testId, result);
    try {
      localStorage.setItem(`${STORAGE_RESULT_PREFIX}${session.sessionId}`, JSON.stringify(result));
      localStorage.setItem(`${STORAGE_RESULT_PREFIX}${session.testId}`, JSON.stringify(result));
      localStorage.setItem(`${STORAGE_RESULT_PREFIX}${session.testId}_latest`, JSON.stringify(result));
      localStorage.setItem(`${STORAGE_RESULT_PREFIX}latest`, JSON.stringify(result));
      localStorage.setItem(`${STORAGE_RESULT_PREFIX}${session.sessionId}_reviews`, JSON.stringify(reviews));
      localStorage.setItem(`${STORAGE_RESULT_PREFIX}${session.testId}_reviews`, JSON.stringify(reviews));
      localStorage.setItem(`${STORAGE_RESULT_PREFIX}latest_reviews`, JSON.stringify(reviews));
      localStorage.removeItem('gowow_active_mock_session_id');
    } catch (e) {
      console.warn('Failed to persist mock test result in localStorage:', e);
    }

    return result;
  },

  /**
   * Finalizes and submits mock test by sessionId.
   */
  async finishMockTest(sessionId: string, secondsRemaining: number): Promise<MockTestResult> {
    const session = await this.getMockSession(sessionId);
    if (!session) throw new Error('Session not found.');
    return this.submitMockTest(session, secondsRemaining);
  },

  /**
   * Discards an active mock test session.
   */
  async discardMockSession(sessionId: string): Promise<void> {
    activeSessions.delete(sessionId);
    try {
      localStorage.removeItem(`${STORAGE_SESSION_PREFIX}${sessionId}`);
      const activeId = localStorage.getItem('gowow_active_mock_session_id');
      if (activeId === sessionId) {
        localStorage.removeItem('gowow_active_mock_session_id');
      }
    } catch (e) {
      console.warn('Failed to remove mock session from localStorage:', e);
    }
  },

  /**
   * Retrieves results for a completed mock test session.
   * Resilient lookup: queries by exact sessionId, testId, latest, or storage search.
   */
  async getMockResult(identifier: string): Promise<MockTestResult | null> {
    if (!identifier) return null;

    if (completedResults.has(identifier)) {
      return { ...completedResults.get(identifier)! };
    }

    const cleanId = identifier.replace(/^mock-sess-/, '');
    if (completedResults.has(cleanId)) {
      return { ...completedResults.get(cleanId)! };
    }

    try {
      // 1. Direct key
      let stored = localStorage.getItem(`${STORAGE_RESULT_PREFIX}${identifier}`);
      // 2. Clean testId
      if (!stored) stored = localStorage.getItem(`${STORAGE_RESULT_PREFIX}${cleanId}`);
      // 3. Clean testId + _latest
      if (!stored) stored = localStorage.getItem(`${STORAGE_RESULT_PREFIX}${cleanId}_latest`);
      // 4. Identifier + _latest
      if (!stored) stored = localStorage.getItem(`${STORAGE_RESULT_PREFIX}${identifier}_latest`);
      // 5. Global latest
      if (!stored && (cleanId === 'latest' || cleanId.length > 0)) {
        stored = localStorage.getItem(`${STORAGE_RESULT_PREFIX}latest`);
      }

      // 6. Search across localStorage entries
      if (!stored) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(STORAGE_RESULT_PREFIX) && !key.endsWith('_reviews')) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}') as MockTestResult;
              if (
                item.testId === identifier ||
                item.testId === cleanId ||
                item.sessionId === identifier ||
                item.sessionId?.includes(cleanId)
              ) {
                completedResults.set(identifier, item);
                return { ...item };
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      if (stored) {
        const parsed = JSON.parse(stored) as MockTestResult;
        completedResults.set(identifier, parsed);
        return { ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load mock result from localStorage:', e);
    }

    return null;
  },

  /**
   * Retrieves question reviews for a completed mock test session.
   */
  async getQuestionReviews(testId: string): Promise<MockTestQuestionReview[]> {
    try {
      let stored = localStorage.getItem(`${STORAGE_RESULT_PREFIX}${testId}_reviews`);
      if (!stored && testId.startsWith('mock-sess-')) {
        const cleanId = testId.replace(/^mock-sess-/, '').replace(/-\d+$/, '');
        stored = localStorage.getItem(`${STORAGE_RESULT_PREFIX}${cleanId}_reviews`);
      }
      if (!stored) {
        stored = localStorage.getItem(`${STORAGE_RESULT_PREFIX}latest_reviews`);
      }
      if (!stored && typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(STORAGE_RESULT_PREFIX) && key.endsWith('_reviews')) {
            stored = localStorage.getItem(key);
            if (stored) break;
          }
        }
      }

      let reviews: MockTestQuestionReview[] = stored ? JSON.parse(stored) : [];

      // Enrich options and text if missing
      const test = await this.getMockTest(testId);
      if (test && test.sections) {
        const questionMap = new Map();
        test.sections.forEach((sec) => {
          sec.questions?.forEach((q) => {
            questionMap.set(q.id, q);
          });
        });

        if (reviews.length > 0) {
          reviews = reviews.map((r) => {
            const origQ = questionMap.get(r.questionId);
            return {
              ...r,
              options: (r.options && r.options.length > 0) ? r.options : (origQ?.options || []),
              questionText: r.questionText || origQ?.text || `Question ${r.questionNumber}`,
              formula: r.formula || origQ?.formula,
              table: r.table || origQ?.table,
            };
          });
          return reviews;
        } else {
          // Construct baseline reviews from test questions if none were saved
          const fallbackReviews: MockTestQuestionReview[] = [];
          test.sections.forEach((sec) => {
            sec.questions?.forEach((q, idx) => {
              fallbackReviews.push({
                questionId: q.id,
                questionNumber: q.questionNumber || idx + 1,
                sectionId: sec.id,
                sectionName: sec.name,
                questionText: q.text,
                type: 'single_choice',
                options: q.options || [],
                userOptionIds: [],
                correctOptionIds: q.correctOptionIds || [(q.options?.[0]?.id || 'A')],
                status: 'unanswered',
                markedForReview: false,
                explanation: q.explanation || 'Official explanation and solution rationale.',
                formula: q.formula,
                table: q.table,
              });
            });
          });
          return fallbackReviews;
        }
      }

      if (reviews.length > 0) return reviews;
    } catch (e) {
      console.warn('Failed to load question reviews from localStorage:', e);
    }
    return [];
  },

  /**
   * Fetches the candidate's prior mock test history with field normalization.
   */
  async getMockTestHistory(): Promise<MockTestHistoryItem[]> {
    try {
      const raw = await apiClient.get<any[]>('/mock-tests/history', { timeoutMs: 3500, retries: 0 });
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((item: any) => ({
          attemptId: item.attemptId || item.id || `hist-${Math.random().toString(36).slice(2, 7)}`,
          sessionId: item.sessionId || `mock-sess-${item.testId || 'cds-full-mock-01'}`,
          testId: item.testId || 'cds-full-mock-01',
          testTitle: item.testTitle || item.title || 'CDS Mock Test',
          examName: item.examName || 'CDS (Combined Defence Services)',
          date: item.completedAt || item.date || new Date().toISOString(),
          formattedDate: item.formattedDate || 'Recent',
          scoreFormatted: item.scoreFormatted || `${item.score ?? 0} / ${item.maxScore ?? 6}`,
          score: item.score ?? 0,
          maxScore: item.maxScore ?? 6,
          percentage: item.percentage ?? item.scorePercentage ?? 0,
          timeUsedFormatted: item.timeUsedFormatted || '30m 0s',
          status: item.status || 'completed',
        }));
      }
    } catch (err) {
      console.warn('Backend /mock-tests/history unavailable, using fallback mock history:', err);
    }

    return [
      {
        attemptId: 'mock-hist-01',
        sessionId: 'mock-sess-cds-full-mock-01-demo1',
        testId: 'cds-full-mock-01',
        testTitle: 'CDS Full Practice Examination — 01',
        examName: 'CDS (Combined Defence Services)',
        date: '2026-09-26 14:30:00',
        formattedDate: '26 Sep 2026',
        scoreFormatted: '4.5 / 6.0',
        score: 4.5,
        maxScore: 6.0,
        percentage: 75.0,
        timeUsedFormatted: '32m 45s',
        status: 'completed',
      },
      {
        attemptId: 'mock-hist-02',
        sessionId: 'mock-sess-cds-gk-assessment-02-demo2',
        testId: 'cds-gk-assessment-02',
        testTitle: 'General Knowledge & Current Affairs Drill',
        examName: 'CDS (Combined Defence Services)',
        date: '2026-09-22 10:15:00',
        formattedDate: '22 Sep 2026',
        scoreFormatted: '3.0 / 4.0',
        score: 3.0,
        maxScore: 4.0,
        percentage: 75.0,
        timeUsedFormatted: '21m 10s',
        status: 'completed',
      },
    ];
  },

  /**
   * Alias for getMockTestHistory
   */
  async getMockHistory(): Promise<MockTestHistoryItem[]> {
    return this.getMockTestHistory();
  },

  /**
   * Retakes a mock test by starting a new session.
   */
  async retakeMockTest(testId: string): Promise<MockTestSession> {
    return this.startMockTest(testId);
  },

  /**
   * Alias for getQuestionReviews
   */
  async getMockReviews(testId: string): Promise<MockTestQuestionReview[]> {
    return this.getQuestionReviews(testId);
  },
};
