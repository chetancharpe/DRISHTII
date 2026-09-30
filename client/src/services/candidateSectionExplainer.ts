/**
 * candidateSectionExplainer.ts
 *
 * Dedicated section orientation and voice navigation registry for DRISHTI.
 * For each section/page inside the candidate portal, it provides:
 * 1. An audio explanation of every interactive element and option in that section.
 * 2. An enumerated list of elements (Option 1, Option 2, Option 3...).
 * 3. Command pattern matching so candidates can select items either by number
 *    ("Option 1", "Select 2", "Pehla", "Second") or by direct name ("Percentages", "Mock Tests").
 */

export interface SectionElement {
  id: string;
  number: number;
  label: string;
  description: string;
  aliases: string[];
  action: (ctx: SectionContext) => void;
  confirmSpeech: string;
}

export interface SectionDescriptor {
  id: string;
  name: string;
  introSpeech: string;
  elementsSummary: string;
  elements: SectionElement[];
}

export interface SectionContext {
  navigate: (to: any) => void;
  speak: (text: string) => void;
  preferences?: any;
  setHighContrast?: (enabled: boolean) => void;
  setFontSize?: (scale: any) => void;
  toggleListening?: () => void;
  speakAvailableCommands?: () => void;
  userName?: string;
}

export function resolveSectionDescriptor(path: string, ctx: SectionContext): SectionDescriptor {
  const name = ctx.userName || 'Candidate';

  // 1. DASHBOARD
  if (path.startsWith('/candidate/dashboard')) {
    const elements: SectionElement[] = [
      {
        id: 'continue-practice',
        number: 1,
        label: 'Continue Percentages Practice',
        description: 'Resumes your practice session on Percentages in Mathematics',
        aliases: ['continue', 'percentages practice', 'resume', 'continue practice', 'abhyas chalu'],
        action: (c) => c.navigate('/candidate/practice/session/demo-percentages'),
        confirmSpeech: 'Launching Percentages Practice session.',
      },
      {
        id: 'learn-curriculum',
        number: 2,
        label: 'Learn Curriculum',
        description: 'Open curriculum subjects: Mathematics, English, General Knowledge, and Reasoning',
        aliases: ['learn', 'curriculum', 'syllabus', 'padho', 'sikho', 'learning'],
        action: (c) => c.navigate('/candidate/learn'),
        confirmSpeech: 'Opening Learning Curriculum.',
      },
      {
        id: 'practice-hub',
        number: 3,
        label: 'Interactive Practice Hub',
        description: 'Practice questions by exam, subject, and topic with instant feedback',
        aliases: ['practice', 'abhyas', 'practice hub'],
        action: (c) => c.navigate('/candidate/practice'),
        confirmSpeech: 'Opening Practice Hub.',
      },
      {
        id: 'mock-tests',
        number: 4,
        label: 'Official Mock Tests',
        description: 'Full-length simulated timed examinations',
        aliases: ['mock tests', 'mock test', 'mocks', 'test series'],
        action: (c) => c.navigate('/candidate/mock-tests'),
        confirmSpeech: 'Opening Mock Tests Portal.',
      },
      {
        id: 'scheduled-exams',
        number: 5,
        label: 'Scheduled Examinations',
        description: 'Official exam schedule and proctored examination hall',
        aliases: ['exams', 'exam', 'pariksha', 'examination', 'examinations'],
        action: (c) => c.navigate('/candidate/exams'),
        confirmSpeech: 'Opening Official Examinations Portal.',
      },
      {
        id: 'results-analytics',
        number: 6,
        label: 'Results and Analytics',
        description: 'Review scorecards, accuracy breakdown, and study insights',
        aliases: ['results', 'scores', 'result', 'parinam', 'scorecard'],
        action: (c) => c.navigate('/candidate/results'),
        confirmSpeech: 'Opening Results and Analytics.',
      },
      {
        id: 'accessibility-settings',
        number: 7,
        label: 'Sensory Accessibility Settings',
        description: 'Adjust high contrast, font size scale, audio narration, and themes',
        aliases: ['settings', 'accessibility', 'preferences', 'contrast', 'font size'],
        action: (c) => c.navigate('/candidate/settings'),
        confirmSpeech: 'Opening Accessibility Settings.',
      },
    ];

    const introSpeech =
      `Welcome to Candidate Dashboard, ${name}. Here are your 7 options: ` +
      `Option 1: Continue Percentages Practice. ` +
      `Option 2: Learn Curriculum. ` +
      `Option 3: Interactive Practice Hub. ` +
      `Option 4: Official Mock Tests. ` +
      `Option 5: Scheduled Examinations. ` +
      `Option 6: Results and Analytics. ` +
      `Option 7: Sensory Accessibility Settings. ` +
      `Say Option 1 to resume practice, or say any option number or name to select.`;

    const elementsSummary =
      `Options available: 1. Continue Practice, 2. Learn Curriculum, 3. Practice Hub, 4. Mock Tests, 5. Scheduled Exams, 6. Results, 7. Settings. Say Option 1 through 7 to select.`;

    return { id: 'dashboard', name: 'Candidate Dashboard', introSpeech, elementsSummary, elements };
  }

  // 2. ACTIVE PRACTICE QUESTION SESSION
  if (path.startsWith('/candidate/practice/session')) {
    const elements: SectionElement[] = [
      {
        id: 'read-question',
        number: 1,
        label: 'Read Current Question and Options',
        description: 'Spoken readout of the active question statement and choices A through D',
        aliases: ['read question', 'repeat', 'sawal padho', 'explain question', 'question sunao'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:practice-read-question')),
        confirmSpeech: 'Reading question and options.',
      },
      {
        id: 'select-option-a',
        number: 2,
        label: 'Select Option A',
        description: 'Select choice A as your answer',
        aliases: ['option a', 'a', 'first option', 'pehla option'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'A' } })),
        confirmSpeech: 'Selecting Option A.',
      },
      {
        id: 'select-option-b',
        number: 3,
        label: 'Select Option B',
        description: 'Select choice B as your answer',
        aliases: ['option b', 'b', 'second option', 'dusra option'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'B' } })),
        confirmSpeech: 'Selecting Option B.',
      },
      {
        id: 'select-option-c',
        number: 4,
        label: 'Select Option C',
        description: 'Select choice C as your answer',
        aliases: ['option c', 'c', 'third option', 'teesra option'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'C' } })),
        confirmSpeech: 'Selecting Option C.',
      },
      {
        id: 'select-option-d',
        number: 5,
        label: 'Select Option D',
        description: 'Select choice D as your answer',
        aliases: ['option d', 'd', 'fourth option', 'chautha option'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'D' } })),
        confirmSpeech: 'Selecting Option D.',
      },
      {
        id: 'next-question',
        number: 6,
        label: 'Next Question',
        description: 'Advance to the next question in this practice set',
        aliases: ['next', 'agla sawal', 'next question', 'aage'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:practice-next')),
        confirmSpeech: 'Next question.',
      },
      {
        id: 'finish-practice',
        number: 7,
        label: 'Finish Practice Session',
        description: 'Complete and review scorecard for this practice set',
        aliases: ['finish', 'submit', 'khatam', 'complete practice'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:practice-submit')),
        confirmSpeech: 'Submitting practice session.',
      },
    ];

    const introSpeech =
      'Interactive Practice Session. Say Read Question to hear the current question and options, or say Option A, Option B, Option C, or Option D to submit your answer, or say Next Question.';
    const elementsSummary =
      'Practice Session options: Say Option A, Option B, Option C, Option D, Next Question, or Read Question.';

    return { id: 'practice-session', name: 'Practice Session', introSpeech, elementsSummary, elements };
  }

  // 3. SPECIFIC SUBTOPIC DETAIL PAGES (/candidate/learn/:subjectId/:topicId)
  if (path.includes('/candidate/learn/reasoning/coding-decoding')) {
    const elements: SectionElement[] = [
      {
        id: 'concept',
        number: 1,
        label: 'Read Concept Notes',
        description: 'Audio explanation of letter shifting patterns and opposite pairs',
        aliases: ['concept', 'read concept', 'notes', 'overview', 'samjhao'],
        action: (c) =>
          c.speak(
            'Coding and Decoding Concept: Words are encrypted using shift patterns such as adding or subtracting letter positions, reverse alphabet pairs where the sum of positions is 27, or numerical substitution. To decode, identify the consistent transformation applied to each letter.'
          ),
        confirmSpeech: 'Reading Concept Notes for Coding and Decoding.',
      },
      {
        id: 'rules',
        number: 2,
        label: 'Read Key Substitution Rules',
        description: 'Alphabet reverse pairs and positional shift formulas',
        aliases: ['rules', 'formulas', 'cheat sheet', 'sutra', 'nayam'],
        action: (c) =>
          c.speak(
            'Key Coding Rules: Rule 1: Opposite pairs: A pairs with Z, B pairs with Y, C pairs with X, M pairs with N. Rule 2: Positional shift: letters may shift forward by plus 1, plus 2, or alternating values. Rule 3: Cross letter swaps in even length words.'
          ),
        confirmSpeech: 'Reading Coding Rules.',
      },
      {
        id: 'start-practice',
        number: 3,
        label: 'Start Practice Questions',
        description: 'Launches 5 interactive practice questions on Coding and Decoding',
        aliases: ['practice', 'start practice', 'questions', 'swal', 'abhyas'],
        action: (c) => c.navigate('/candidate/practice/session/demo-coding-decoding'),
        confirmSpeech: 'Launching Coding and Decoding Practice questions.',
      },
      {
        id: 'back',
        number: 4,
        label: 'Back to Reasoning',
        description: 'Return to Reasoning topics list',
        aliases: ['back', 'wapas', 'reasoning'],
        action: (c) => c.navigate('/candidate/learn/reasoning'),
        confirmSpeech: 'Returning to Reasoning Curriculum.',
      },
    ];

    const introSpeech =
      'Coding and Decoding Topic Study Module. Here are the 4 elements: ' +
      'Option 1: Read Concept Notes and letter shifting logic. ' +
      'Option 2: Read Key Substitution Rules and alphabet pairs. ' +
      'Option 3: Launch Practice Questions on Coding and Decoding. ' +
      'Option 4: Back to Reasoning Subject. ' +
      'Say Option 1 to hear concept, Option 2 for rules, or Option 3 to start practice.';

    const elementsSummary =
      'Coding and Decoding options: 1. Read Concept, 2. Substitution Rules, 3. Launch Practice, 4. Back to Reasoning.';

    return { id: 'learn-topic-coding-decoding', name: 'Coding & Decoding Topic', introSpeech, elementsSummary, elements };
  }

  if (path.includes('/candidate/learn/mathematics/percentages')) {
    const elements: SectionElement[] = [
      {
        id: 'concept',
        number: 1,
        label: 'Read Concept Notes',
        description: 'Audio explanation of percentages and fraction conversion',
        aliases: ['concept', 'read concept', 'notes', 'overview', 'samjhao'],
        action: (c) =>
          c.speak(
            'Percentages concept: A percentage represents a number as a fraction of 100. To convert any fraction to percentage, multiply by 100. For example, 1 divided by 4 equals 25 percent. Key applications include profit and loss, interest, and ratio comparisons.'
          ),
        confirmSpeech: 'Reading Concept Notes for Percentages.',
      },
      {
        id: 'formulas',
        number: 2,
        label: 'Read Important Formulas',
        description: 'Spoken formula cheat-sheet for percentages',
        aliases: ['formulas', 'formula', 'cheat sheet', 'sutra'],
        action: (c) =>
          c.speak(
            'Key Percentages formulas: 1. Percentage increase equals Increase divided by Initial Value multiplied by 100. 2. Percentage decrease equals Decrease divided by Initial Value multiplied by 100. 3. Fraction 1 by 2 is 50 percent, 1 by 3 is 33.33 percent, 1 by 4 is 25 percent, 1 by 5 is 20 percent.'
          ),
        confirmSpeech: 'Reading Formulas for Percentages.',
      },
      {
        id: 'start-practice',
        number: 3,
        label: 'Start Practice Questions',
        description: 'Launches 5 interactive practice questions on percentages',
        aliases: ['practice', 'start practice', 'questions', 'swal', 'abhyas'],
        action: (c) => c.navigate('/candidate/practice/session/demo-percentages'),
        confirmSpeech: 'Launching Percentages Practice session.',
      },
      {
        id: 'back',
        number: 4,
        label: 'Back to Mathematics',
        description: 'Return to Mathematics topics list',
        aliases: ['back', 'wapas', 'mathematics'],
        action: (c) => c.navigate('/candidate/learn/mathematics'),
        confirmSpeech: 'Returning to Mathematics Curriculum.',
      },
    ];

    const introSpeech =
      'Percentages and Fractions Topic. Here are the 4 elements: ' +
      'Option 1: Read Concept Notes and overview. ' +
      'Option 2: Read Important Formulas. ' +
      'Option 3: Launch Practice Questions on Percentages. ' +
      'Option 4: Back to Mathematics. ' +
      'Say Option 1 to hear concept, Option 2 for formulas, or Option 3 to start practice.';

    const elementsSummary =
      'Percentages options: 1. Read Concept, 2. Read Formulas, 3. Launch Practice, 4. Back to Mathematics.';

    return { id: 'learn-topic-percentages', name: 'Percentages Topic', introSpeech, elementsSummary, elements };
  }

  // 4. LEARN TOPICS: MATHEMATICS TOPICS GENERIC
  if (path.startsWith('/candidate/learn/mathematics')) {
    const elements: SectionElement[] = [
      {
        id: 'percentages',
        number: 1,
        label: 'Percentages and Fractions',
        description: '10 lessons covering conversion, percentage change, and word problems',
        aliases: ['percentages', 'percentage', 'fractions', 'pratishat'],
        action: (c) => c.navigate('/candidate/learn/mathematics/percentages'),
        confirmSpeech: 'Opening Percentages and Fractions topic.',
      },
      {
        id: 'algebra',
        number: 2,
        label: 'Algebra and Equations',
        description: 'Linear equations, polynomials, and quadratic formula',
        aliases: ['algebra', 'equations', 'beejganit'],
        action: (c) => c.navigate('/candidate/learn/mathematics/algebra'),
        confirmSpeech: 'Opening Algebra topic.',
      },
      {
        id: 'geometry',
        number: 3,
        label: 'Geometry and Mensuration',
        description: 'Triangles, circles, area, and perimeter calculations',
        aliases: ['geometry', 'mensuration', 'jyamiti'],
        action: (c) => c.navigate('/candidate/learn/mathematics/geometry'),
        confirmSpeech: 'Opening Geometry topic.',
      },
      {
        id: 'back',
        number: 4,
        label: 'Back to Curriculum',
        description: 'Return to subjects menu',
        aliases: ['back', 'wapas', 'curriculum', 'subjects'],
        action: (c) => c.navigate('/candidate/learn'),
        confirmSpeech: 'Returning to Curriculum menu.',
      },
    ];

    const introSpeech =
      'Mathematics Curriculum. Here are the 3 topics available: ' +
      'Option 1: Percentages and Fractions. ' +
      'Option 2: Algebra and Equations. ' +
      'Option 3: Geometry and Mensuration. ' +
      'Say Option 1 or Percentages, Option 2 or Algebra, or Option 3 or Geometry.';

    const elementsSummary =
      'Mathematics options: 1. Percentages, 2. Algebra, 3. Geometry, 4. Back. Say Option 1, 2, or 3.';

    return { id: 'learn-math', name: 'Mathematics Curriculum', introSpeech, elementsSummary, elements };
  }

  // 5. LEARN TOPICS: ENGLISH
  if (path.startsWith('/candidate/learn/english')) {
    const elements: SectionElement[] = [
      {
        id: 'reading-comprehension',
        number: 1,
        label: 'Reading Comprehension',
        description: 'Passage comprehension, inference questions, and main theme extraction',
        aliases: ['reading comprehension', 'comprehension', 'passage'],
        action: (c) => c.navigate('/candidate/learn/english/reading-comprehension'),
        confirmSpeech: 'Opening Reading Comprehension topic.',
      },
      {
        id: 'grammar-rules',
        number: 2,
        label: 'Grammar Rules',
        description: 'Subject-verb agreement, active-passive voice, and tense rules',
        aliases: ['grammar', 'grammar rules', 'vyakaran'],
        action: (c) => c.navigate('/candidate/learn/english/grammar-rules'),
        confirmSpeech: 'Opening Grammar Rules topic.',
      },
      {
        id: 'vocabulary-building',
        number: 3,
        label: 'Vocabulary Building',
        description: 'Synonyms, antonyms, idioms, and one-word substitutions',
        aliases: ['vocabulary', 'vocab', 'words', 'shabd'],
        action: (c) => c.navigate('/candidate/learn/english/vocabulary-building'),
        confirmSpeech: 'Opening Vocabulary Building topic.',
      },
      {
        id: 'back',
        number: 4,
        label: 'Back to Curriculum',
        description: 'Return to subjects menu',
        aliases: ['back', 'wapas', 'curriculum'],
        action: (c) => c.navigate('/candidate/learn'),
        confirmSpeech: 'Returning to Curriculum menu.',
      },
    ];

    const introSpeech =
      'English Language Curriculum. Here are the 3 topics available: ' +
      'Option 1: Reading Comprehension and Passages. ' +
      'Option 2: Grammar Rules and Syntax. ' +
      'Option 3: Vocabulary Building and Idioms. ' +
      'Say Option 1 for Comprehension, Option 2 for Grammar, or Option 3 for Vocabulary.';

    const elementsSummary =
      'English options: 1. Reading Comprehension, 2. Grammar Rules, 3. Vocabulary, 4. Back.';

    return { id: 'learn-english', name: 'English Language Curriculum', introSpeech, elementsSummary, elements };
  }

  // 6. LEARN TOPICS: GENERAL KNOWLEDGE
  if (path.startsWith('/candidate/learn/general-knowledge')) {
    const elements: SectionElement[] = [
      {
        id: 'modern-history',
        number: 1,
        label: 'Modern History',
        description: 'Indian freedom struggle, constitutional milestones, and key historical figures',
        aliases: ['modern history', 'history', 'itihas'],
        action: (c) => c.navigate('/candidate/learn/general-knowledge/modern-history'),
        confirmSpeech: 'Opening Modern History topic.',
      },
      {
        id: 'indian-polity',
        number: 2,
        label: 'Indian Polity and Constitution',
        description: 'Fundamental rights, preamble, parliament, and judiciary',
        aliases: ['indian polity', 'polity', 'constitution', 'samvidhan'],
        action: (c) => c.navigate('/candidate/learn/general-knowledge/indian-polity'),
        confirmSpeech: 'Opening Indian Polity topic.',
      },
      {
        id: 'physical-geography',
        number: 3,
        label: 'Physical Geography',
        description: 'River systems of India, mountain ranges, climate, and minerals',
        aliases: ['physical geography', 'geography', 'bhugol'],
        action: (c) => c.navigate('/candidate/learn/general-knowledge/physical-geography'),
        confirmSpeech: 'Opening Physical Geography topic.',
      },
      {
        id: 'back',
        number: 4,
        label: 'Back to Curriculum',
        description: 'Return to subjects menu',
        aliases: ['back', 'wapas', 'curriculum'],
        action: (c) => c.navigate('/candidate/learn'),
        confirmSpeech: 'Returning to Curriculum menu.',
      },
    ];

    const introSpeech =
      'General Knowledge Curriculum. Here are the 3 topics available: ' +
      'Option 1: Modern History of India. ' +
      'Option 2: Indian Polity and Constitution. ' +
      'Option 3: Physical Geography. ' +
      'Say Option 1 for History, Option 2 for Polity, or Option 3 for Geography.';

    const elementsSummary =
      'General Knowledge options: 1. Modern History, 2. Indian Polity, 3. Geography, 4. Back.';

    return { id: 'learn-gk', name: 'General Knowledge Curriculum', introSpeech, elementsSummary, elements };
  }

  // 7. LEARN TOPICS: REASONING
  if (path.startsWith('/candidate/learn/reasoning')) {
    const elements: SectionElement[] = [
      {
        id: 'coding-decoding',
        number: 1,
        label: 'Coding and Decoding',
        description: 'Letter shifting patterns, reverse alphabet rules, and matrix substitution',
        aliases: ['coding and decoding', 'coding decoding', 'coding'],
        action: (c) => c.navigate('/candidate/learn/reasoning/coding-decoding'),
        confirmSpeech: 'Opening Coding and Decoding topic.',
      },
      {
        id: 'number-series',
        number: 2,
        label: 'Number Series',
        description: 'Arithmetic progressions, prime squares, and alternating series',
        aliases: ['number series', 'series'],
        action: (c) => c.navigate('/candidate/learn/reasoning/number-series'),
        confirmSpeech: 'Opening Number Series topic.',
      },
      {
        id: 'back',
        number: 3,
        label: 'Back to Curriculum',
        description: 'Return to subjects menu',
        aliases: ['back', 'wapas', 'curriculum'],
        action: (c) => c.navigate('/candidate/learn'),
        confirmSpeech: 'Returning to Curriculum menu.',
      },
    ];

    const introSpeech =
      'Reasoning Ability Curriculum. Here are the 2 topics available: ' +
      'Option 1: Coding and Decoding. ' +
      'Option 2: Number Series and Patterns. ' +
      'Say Option 1 for Coding-Decoding, or Option 2 for Number Series.';

    const elementsSummary =
      'Reasoning options: 1. Coding and Decoding, 2. Number Series, 3. Back.';

    return { id: 'learn-reasoning', name: 'Reasoning Ability Curriculum', introSpeech, elementsSummary, elements };
  }

  // 7. LEARN INDEX (SUBJECTS LIST)
  if (path.startsWith('/candidate/learn') || path.startsWith('/candidate/learning')) {
    const elements: SectionElement[] = [
      {
        id: 'math',
        number: 1,
        label: 'Mathematics',
        description: 'Quantitative aptitude including Percentages, Algebra, and Geometry',
        aliases: ['mathematics', 'maths', 'math', 'ganit'],
        action: (c) => c.navigate('/candidate/learn/mathematics'),
        confirmSpeech: 'Opening Mathematics Curriculum.',
      },
      {
        id: 'english',
        number: 2,
        label: 'English Language',
        description: 'Reading comprehension, grammar rules, and vocabulary building',
        aliases: ['english', 'english language', 'angreji'],
        action: (c) => c.navigate('/candidate/learn/english'),
        confirmSpeech: 'Opening English Language Curriculum.',
      },
      {
        id: 'gk',
        number: 3,
        label: 'General Knowledge',
        description: 'Modern history, Indian polity, and physical geography',
        aliases: ['general knowledge', 'gk', 'current affairs', 'samanya gyan'],
        action: (c) => c.navigate('/candidate/learn/general-knowledge'),
        confirmSpeech: 'Opening General Knowledge Curriculum.',
      },
      {
        id: 'reasoning',
        number: 4,
        label: 'Reasoning Ability',
        description: 'Logical reasoning including coding-decoding and number series',
        aliases: ['reasoning', 'logic', 'tarkik'],
        action: (c) => c.navigate('/candidate/learn/reasoning'),
        confirmSpeech: 'Opening Reasoning Ability Curriculum.',
      },
      {
        id: 'dashboard',
        number: 5,
        label: 'Return to Dashboard',
        description: 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech =
      `Learning Curriculum. Here are the 4 subjects available: ` +
      `Option 1: Mathematics - covering Percentages, Algebra, and Geometry. ` +
      `Option 2: English Language - covering Reading Comprehension, Grammar Rules, and Vocabulary. ` +
      `Option 3: General Knowledge - covering Modern History, Indian Polity, and Geography. ` +
      `Option 4: Reasoning Ability - covering Coding-Decoding and Number Series. ` +
      `Say Option 1 or Mathematics, Option 2 or English, Option 3 or GK, or Option 4 or Reasoning.`;

    const elementsSummary =
      `Curriculum options: 1. Mathematics, 2. English, 3. General Knowledge, 4. Reasoning, 5. Dashboard.`;

    return { id: 'learn-index', name: 'Learning Curriculum', introSpeech, elementsSummary, elements };
  }

  // 8. PRACTICE HUB
  if (path.startsWith('/candidate/practice/history')) {
    const elements: SectionElement[] = [
      {
        id: 'new-practice',
        number: 1,
        label: 'Start New Practice Set',
        description: 'Launch a new interactive practice drill',
        aliases: ['new practice', 'practice', 'start practice', 'abhyas'],
        action: (c) => c.navigate('/candidate/practice'),
        confirmSpeech: 'Opening Practice Hub.',
      },
      {
        id: 'dashboard',
        number: 2,
        label: 'Return to Dashboard',
        description: 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech =
      `Practice Session History. Here are your options: Option 1: Start New Practice Set. Option 2: Return to Dashboard. Say Option 1 or Option 2.`;
    const elementsSummary = `Practice History options: 1. New Practice, 2. Dashboard.`;
    return { id: 'practice-history', name: 'Practice History', introSpeech, elementsSummary, elements };
  }

  if (path.startsWith('/candidate/practice')) {
    const elements: SectionElement[] = [
      {
        id: 'percentages-practice',
        number: 1,
        label: 'Percentages and Fractions Practice Set',
        description: 'Quick 5 questions on conversion, percentage changes, and ratio problems',
        aliases: ['percentages', 'percentages practice', 'fractions', 'math practice'],
        action: (c) => c.navigate('/candidate/practice/session/demo-percentages'),
        confirmSpeech: 'Starting 5 questions on Percentages.',
      },
      {
        id: 'coding-practice',
        number: 2,
        label: 'Coding and Decoding Practice Set',
        description: 'Quick 5 questions on letter shifting patterns and numerical substitution',
        aliases: ['coding', 'coding practice', 'coding decoding', 'reasoning practice'],
        action: (c) => c.navigate('/candidate/practice/session/demo-coding-decoding'),
        confirmSpeech: 'Starting 5 questions on Coding and Decoding.',
      },
      {
        id: 'current-affairs-practice',
        number: 3,
        label: 'Current Affairs and Defence Practice Set',
        description: 'Quick 5 questions on national awards, joint military exercises, and summits',
        aliases: ['current affairs', 'gk practice', 'affairs', 'defence'],
        action: (c) => c.navigate('/candidate/practice/session/demo-current-affairs'),
        confirmSpeech: 'Starting 5 questions on Current Affairs.',
      },
      {
        id: 'practice-history',
        number: 4,
        label: 'Practice Session History',
        description: 'Review your previously attempted practice sessions and solutions',
        aliases: ['practice history', 'history', 'purana abhyas'],
        action: (c) => c.navigate('/candidate/practice/history'),
        confirmSpeech: 'Opening Practice History.',
      },
      {
        id: 'dashboard',
        number: 5,
        label: 'Return to Dashboard',
        description: 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech =
      `Practice Hub. Here are the 4 featured sets available right now: ` +
      `Option 1: Quick 5 Questions on Percentages and Fractions in Mathematics. ` +
      `Option 2: Quick 5 Questions on Coding and Decoding in Reasoning. ` +
      `Option 3: Quick 5 Questions on Current Affairs in General Knowledge. ` +
      `Option 4: View your Practice Session History. ` +
      `Say Option 1 for Percentages, Option 2 for Coding, Option 3 for Current Affairs, or Option 4 for History.`;

    const elementsSummary =
      `Practice options: 1. Percentages Practice, 2. Coding Practice, 3. Current Affairs Practice, 4. Practice History, 5. Dashboard. Say Option 1 through 5.`;

    return { id: 'practice-hub', name: 'Practice Hub', introSpeech, elementsSummary, elements };
  }

  // 9. EXAMS PORTAL
  if (path.startsWith('/candidate/exams')) {
    const elements: SectionElement[] = [
      {
        id: 'cds-mock',
        number: 1,
        label: 'CDS Official Mock Exam',
        description: 'UPSC Combined Defence Services simulated examination - 100 Marks',
        aliases: ['cds', 'cds exam', 'defence exam', 'mock exam'],
        action: (c) => c.navigate('/candidate/exams/cds-mock-1/instructions'),
        confirmSpeech: 'Opening CDS Official Mock Exam instructions.',
      },
      {
        id: 'ssc-exam',
        number: 2,
        label: 'SSC CGL Tier 1 Practice Exam',
        description: 'Staff Selection Commission Tier 1 comprehensive test - 200 Marks',
        aliases: ['ssc', 'ssc exam', 'cgl exam', 'ssc cgl'],
        action: (c) => c.navigate('/candidate/exams/ssc-tier1/instructions'),
        confirmSpeech: 'Opening SSC Tier 1 Practice Exam instructions.',
      },
      {
        id: 'dashboard',
        number: 3,
        label: 'Return to Dashboard',
        description: 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech =
      `Official Examinations Portal. Here are your scheduled examinations: ` +
      `Option 1: Combined Defence Services (CDS) Official Mock Exam - 100 Marks. ` +
      `Option 2: SSC Combined Graduate Level Tier 1 Practice Exam - 200 Marks. ` +
      `Say Option 1 or CDS Exam, Option 2 or SSC Exam, or say Dashboard to return.`;

    const elementsSummary =
      `Exams options: 1. CDS Mock Exam, 2. SSC Practice Exam, 3. Dashboard. Say Option 1, 2, or 3.`;

    return { id: 'exams-portal', name: 'Official Examinations Portal', introSpeech, elementsSummary, elements };
  }

  // 10A. MOCK TESTS ACTIVE SESSION
  if (path.includes('/candidate/mock-tests/') && path.includes('/session')) {
    const elements: SectionElement[] = [
      {
        id: 'read-question',
        number: 1,
        label: 'Read Current Question',
        description: 'Audibly read question statement, table, formulas, and options',
        aliases: ['read question', 'repeat question', 'sawal padho', 'question sunao', 'option 1'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:mock-read-question')),
        confirmSpeech: 'Reading question statement and choices.',
      },
      {
        id: 'select-option-a',
        number: 2,
        label: 'Select Option A',
        description: 'Choose option A for current question',
        aliases: ['option a', 'first option', 'pehla option', 'select a', 'option 2'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'A' } })),
        confirmSpeech: 'Selected Option A.',
      },
      {
        id: 'select-option-b',
        number: 3,
        label: 'Select Option B',
        description: 'Choose option B for current question',
        aliases: ['option b', 'second option', 'dusra option', 'select b', 'option 3'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'B' } })),
        confirmSpeech: 'Selected Option B.',
      },
      {
        id: 'select-option-c',
        number: 4,
        label: 'Select Option C',
        description: 'Choose option C for current question',
        aliases: ['option c', 'third option', 'teesra option', 'select c', 'option 4'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'C' } })),
        confirmSpeech: 'Selected Option C.',
      },
      {
        id: 'select-option-d',
        number: 5,
        label: 'Select Option D',
        description: 'Choose option D for current question',
        aliases: ['option d', 'fourth option', 'chautha option', 'select d', 'option 5'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'D' } })),
        confirmSpeech: 'Selected Option D.',
      },
      {
        id: 'next-question',
        number: 6,
        label: 'Next Question',
        description: 'Advance to the next question in the mock examination',
        aliases: ['next', 'next question', 'agla sawal', 'agla', 'option 6'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:mock-next')),
        confirmSpeech: 'Next question.',
      },
      {
        id: 'submit-test',
        number: 7,
        label: 'Submit Mock Test',
        description: 'Finish and submit mock examination for evaluation',
        aliases: ['submit', 'submit test', 'finish test', 'submit mock', 'khatam', 'option 7'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:mock-submit')),
        confirmSpeech: 'Opening submission confirmation dialog.',
      },
    ];

    const introSpeech =
      'Mock Test Session in progress. Say Option A, B, C, or D to answer. Say Next or Previous to navigate. Say Read Question to hear details, Mark for Review to flag, or Submit to finish.';
    const elementsSummary =
      'Mock Session: 1. Read Question, 2. Option A, 3. Option B, 4. Option C, 5. Option D, 6. Next Question, 7. Submit Test.';

    return { id: 'mock-session', name: 'Mock Test Examination Session', introSpeech, elementsSummary, elements };
  }

  // 10B. MOCK TESTS INSTRUCTIONS
  if (path.includes('/candidate/mock-tests/') && path.includes('/instructions')) {
    const elements: SectionElement[] = [
      {
        id: 'start-mock',
        number: 1,
        label: 'Start Mock Examination',
        description: 'Acknowledge rules and launch timed mock examination session',
        aliases: ['start', 'start mock', 'start test', 'begin test', 'shuru karo', 'agree and start', 'launch', 'option 1', 'pehla'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:mock-start-test')),
        confirmSpeech: 'Launching mock examination session.',
      },
      {
        id: 'read-instructions',
        number: 2,
        label: 'Listen to Instructions Summary',
        description: 'Read out marking scheme and navigation guidelines',
        aliases: ['read instructions', 'summary', 'listen summary', 'guidelines', 'option 2', 'dusra'],
        action: () => window.dispatchEvent(new CustomEvent('drishti:mock-read-instructions')),
        confirmSpeech: 'Reading mock test guidelines.',
      },
      {
        id: 'back-to-mocks',
        number: 3,
        label: 'Back to Mock Tests',
        description: 'Return to mock tests directory',
        aliases: ['back', 'wapas', 'all mocks', 'option 3', 'teesra'],
        action: (c) => c.navigate('/candidate/mock-tests'),
        confirmSpeech: 'Returning to Mock Tests catalog.',
      },
    ];

    const introSpeech =
      'Mock Test Instructions. Say Option 1 or Start Test to accept guidelines and begin, Option 2 to hear instructions summary, or Option 3 to go back.';
    const elementsSummary =
      'Mock Test Instructions options: 1. Start Mock Test, 2. Listen Summary, 3. Back to Mock Tests.';

    return { id: 'mock-instructions', name: 'Mock Test Instructions', introSpeech, elementsSummary, elements };
  }

  // 10C. MOCK TEST OVERVIEW / DETAILS
  if (
    path.startsWith('/candidate/mock-tests/') &&
    !path.includes('/instructions') &&
    !path.includes('/session') &&
    !path.includes('/result') &&
    !path.includes('/review') &&
    !path.includes('/history')
  ) {
    const parts = path.split('/');
    const currentTestId = parts[parts.length - 1];
    const elements: SectionElement[] = [
      {
        id: 'continue-instructions',
        number: 1,
        label: 'Continue to Instructions',
        description: 'Proceed to instructions and rules before starting the test',
        aliases: ['instructions', 'continue', 'start', 'start test', 'aage badho', 'nirdesh', 'option 1', 'pehla'],
        action: (c) => c.navigate(`/candidate/mock-tests/${currentTestId}/instructions`),
        confirmSpeech: 'Opening Mock Test Instructions.',
      },
      {
        id: 'back-to-mocks',
        number: 2,
        label: 'Back to Mock Tests Directory',
        description: 'Return to all available subject mock tests',
        aliases: ['back', 'wapas', 'all mocks', 'directory', 'option 2', 'dusra'],
        action: (c) => c.navigate('/candidate/mock-tests'),
        confirmSpeech: 'Returning to Mock Tests directory.',
      },
    ];

    const introSpeech =
      'Mock Test Overview. Say Option 1 or Continue to read instructions and begin, or say Option 2 to return to the mock test catalog.';
    const elementsSummary =
      'Mock Test Overview options: 1. Continue to Instructions, 2. Back to Mock Tests Directory.';

    return { id: 'mock-details', name: 'Mock Test Overview', introSpeech, elementsSummary, elements };
  }

  // 10D. MOCK TESTS PORTAL DIRECTORY
  if (path.startsWith('/candidate/mock-tests')) {
    const elements: SectionElement[] = [
      {
        id: 'full-mock',
        number: 1,
        label: 'CDS Full Practice Examination — 01',
        description: 'Full-length 6-question simulation covering English, Math, and GK under standard timing',
        aliases: ['full mock', 'full test', 'cds mock', 'cds full mock', 'cds', 'full', 'option 1', 'pehla'],
        action: (c) => c.navigate('/candidate/mock-tests/cds-full-mock-01/session'),
        confirmSpeech: 'Starting CDS Full Practice Examination 1. Loading questions.',
      },
      {
        id: 'math-mock',
        number: 2,
        label: 'Elementary Mathematics Subject Mock Test',
        description: 'Dedicated Mathematics mock covering Arithmetic, Algebra, and Geometry with formulas',
        aliases: ['math mock', 'mathematics mock', 'maths mock', 'ganit mock', 'math test', 'math', 'maths', 'mathematics', 'ganit', 'option 2', 'dusra'],
        action: (c) => c.navigate('/candidate/mock-tests/mock-math-01/session'),
        confirmSpeech: 'Starting Elementary Mathematics Mock Test. Loading questions.',
      },
      {
        id: 'english-mock',
        number: 3,
        label: 'English Language & Comprehension Mock Test',
        description: 'Dedicated English mock evaluating Grammar rules, Vocabulary, and Reading Comprehension',
        aliases: ['english mock', 'english test', 'angrezi mock', 'comprehension mock', 'english', 'angrezi', 'option 3', 'teesra'],
        action: (c) => c.navigate('/candidate/mock-tests/mock-eng-01/session'),
        confirmSpeech: 'Starting English Language Mock Test. Loading questions.',
      },
      {
        id: 'gk-mock',
        number: 4,
        label: 'General Knowledge & Defense Mock Test',
        description: 'Subject-wise mock covering Indian Polity, Modern History, General Science, and Defense Affairs',
        aliases: ['gk mock', 'general knowledge mock', 'defense mock', 'samanya gyan mock', 'gk', 'general knowledge', 'samanya gyan', 'defense', 'option 4', 'chautha'],
        action: (c) => c.navigate('/candidate/mock-tests/mock-gk-01/session'),
        confirmSpeech: 'Starting General Knowledge and Defense Mock Test. Loading questions.',
      },
      {
        id: 'reasoning-mock',
        number: 5,
        label: 'Reasoning Ability & Mental Aptitude Mock Test',
        description: 'Subject-wise mock testing Deductive Logic, Coding-Decoding, Number Series, and Direction Sense',
        aliases: ['reasoning mock', 'logic mock', 'tarkik mock', 'mental ability mock', 'reasoning', 'logic', 'tarkik', 'option 5', 'paanchwa'],
        action: (c) => c.navigate('/candidate/mock-tests/mock-reas-01/session'),
        confirmSpeech: 'Starting Reasoning Ability Mock Test. Loading questions.',
      },
      {
        id: 'history',
        number: 6,
        label: 'Mock Test Attempt History',
        description: 'Review your previously completed mock tests, scores, and accuracy',
        aliases: ['attempt history', 'mock history', 'history', 'purane mock', 'option 6', 'chhatwa'],
        action: (c) => c.navigate('/candidate/mock-tests/history'),
        confirmSpeech: 'Opening Mock Test Attempt History.',
      },
      {
        id: 'dashboard',
        number: 7,
        label: 'Return to Dashboard',
        description: 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu', 'option 7', 'saatwa'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech =
      `Mock Tests Portal. Here are your 5 examinations ready to take: ` +
      `Option 1: CDS Full Practice Examination 1. ` +
      `Option 2: Elementary Mathematics Mock Test. ` +
      `Option 3: English Language Mock Test. ` +
      `Option 4: General Knowledge and Defense Mock Test. ` +
      `Option 5: Reasoning Ability Mock Test. ` +
      `Option 6: Attempt History. ` +
      `Say Option 1 through 5, or say Math Mock, English Mock, GK Mock, or Reasoning Mock to start the test immediately.`;

    const elementsSummary =
      `Mock Tests: 1. Full CDS Mock, 2. Mathematics Mock, 3. English Mock, 4. GK Mock, 5. Reasoning Mock, 6. History, 7. Dashboard. Say Option 1 through 7.`;

    return { id: 'mock-tests', name: 'Mock Tests Portal', introSpeech, elementsSummary, elements };
  }

  // 11. RESULTS AND ANALYTICS
  if (path.startsWith('/candidate/results')) {
    const elements: SectionElement[] = [
      {
        id: 'score-summary',
        number: 1,
        label: 'Read Complete Scorecard Summary',
        description: 'Spoken summary of total score, attempted questions, and accuracy',
        aliases: ['scorecard', 'score summary', 'my score', 'read summary', 'parinam'],
        action: (c) =>
          c.speak(
            'Overall Score: 78 percent. Total Questions Attempted: 48. Correct Answers: 38. Incorrect: 10. Accuracy Rate: 79 percent. Percentile: 84th percentile.'
          ),
        confirmSpeech: 'Reading Scorecard Summary.',
      },
      {
        id: 'subject-breakdown',
        number: 2,
        label: 'Read Subject-wise Accuracy Breakdown',
        description: 'Performance statistics across Math, English, GK, and Reasoning',
        aliases: ['subject breakdown', 'accuracy', 'subject scores', 'breakdown'],
        action: (c) =>
          c.speak(
            'Subject-wise Performance Breakdown: Mathematics: 85 percent accuracy. Reasoning Ability: 90 percent accuracy. English Language: 78 percent accuracy. General Knowledge: 65 percent accuracy.'
          ),
        confirmSpeech: 'Reading Subject-wise Breakdown.',
      },
      {
        id: 'practice-weak',
        number: 3,
        label: 'Practice Weak Topics',
        description: 'Launch targeted practice on General Knowledge and Percentages',
        aliases: ['practice weak', 'weak areas', 'weak topics', 'kamzor vishay'],
        action: (c) => c.navigate('/candidate/practice/session/demo-percentages'),
        confirmSpeech: 'Launching practice for weak topics.',
      },
      {
        id: 'dashboard',
        number: 4,
        label: 'Return to Dashboard',
        description: 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech =
      `Results and Analytics Portal. Here are your 4 available actions: ` +
      `Option 1: Read Complete Scorecard Summary. ` +
      `Option 2: Read Subject-wise Accuracy Breakdown. ` +
      `Option 3: Practice Weak Topics. ` +
      `Option 4: Return to Dashboard. ` +
      `Say Option 1 to hear your scores, Option 2 for breakdown, or Option 3 to practice weak topics.`;

    const elementsSummary =
      `Results options: 1. Read Scorecard, 2. Subject Breakdown, 3. Practice Weak Topics, 4. Dashboard.`;

    return { id: 'results', name: 'Results and Analytics', introSpeech, elementsSummary, elements };
  }

  // 12. PROGRESS AND ACTIVITY
  if (path.startsWith('/candidate/progress')) {
    const elements: SectionElement[] = [
      {
        id: 'study-streak',
        number: 1,
        label: 'Read Study Streak',
        description: '7-day consecutive activity streak and total hours logged',
        aliases: ['study streak', 'streak', 'study hours'],
        action: (c) =>
          c.speak(
            'Study Streak: 7 consecutive days active. Total study time logged: 14 hours and 30 minutes across 12 sessions.'
          ),
        confirmSpeech: 'Reading Study Streak.',
      },
      {
        id: 'mastery',
        number: 2,
        label: 'Read Topic Mastery Levels',
        description: 'Mastery percentages for Percentages, Algebra, and Coding',
        aliases: ['mastery', 'topic mastery', 'proficiency'],
        action: (c) =>
          c.speak(
            'Topic Mastery: Percentages: 85 percent mastered. Coding and Decoding: 92 percent mastered. Modern History: 70 percent mastered.'
          ),
        confirmSpeech: 'Reading Topic Mastery.',
      },
      {
        id: 'recent-activity',
        number: 3,
        label: 'Review Recent Activity',
        description: 'Log of your latest tests and drills',
        aliases: ['recent activity', 'activity', 'timeline'],
        action: (c) =>
          c.speak(
            'Recent Activity: Today at 2 PM, you completed 10 Percentages practice questions. Yesterday at 6 PM, you completed CDS Mock test 1.'
          ),
        confirmSpeech: 'Reading Recent Activity.',
      },
      {
        id: 'dashboard',
        number: 4,
        label: 'Return to Dashboard',
        description: 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech =
      `Progress and Mastery Tracking. Here are your 4 available actions: ` +
      `Option 1: Read Study Streak and total hours. ` +
      `Option 2: Read Topic Mastery levels. ` +
      `Option 3: Review Recent Activity Timeline. ` +
      `Option 4: Return to Dashboard. ` +
      `Say Option 1, Option 2, Option 3, or Option 4.`;

    const elementsSummary =
      `Progress options: 1. Study Streak, 2. Topic Mastery, 3. Recent Activity, 4. Dashboard.`;

    return { id: 'progress', name: 'Progress and Mastery', introSpeech, elementsSummary, elements };
  }

  // 13. SETTINGS
  if (path.startsWith('/candidate/settings')) {
    const elements: SectionElement[] = [
      {
        id: 'toggle-contrast',
        number: 1,
        label: 'Toggle High Contrast AAA Mode',
        description: 'Switch between standard theme and maximum contrast black-and-amber theme',
        aliases: ['high contrast', 'contrast', 'toggle contrast', 'black and yellow'],
        action: (c) => {
          if (c.setHighContrast && c.preferences) {
            const next = !c.preferences.highContrast;
            c.setHighContrast(next);
            c.speak(next ? 'High Contrast AAA mode enabled.' : 'Standard contrast restored.');
          }
        },
        confirmSpeech: 'Toggling High Contrast Mode.',
      },
      {
        id: 'increase-font',
        number: 2,
        label: 'Increase Text Size',
        description: 'Scale fonts up to Extra Large (125%) for enhanced readability',
        aliases: ['increase text', 'large text', 'bigger font', 'bada text'],
        action: (c) => {
          if (c.setFontSize) {
            c.setFontSize('xl');
            c.speak('Text size scaled up to Extra Large.');
          }
        },
        confirmSpeech: 'Text size increased.',
      },
      {
        id: 'normal-font',
        number: 3,
        label: 'Reset Text Size to Normal',
        description: 'Restore default 100% font sizing',
        aliases: ['normal text', 'default font', 'reset font', 'standard font'],
        action: (c) => {
          if (c.setFontSize) {
            c.setFontSize('default');
            c.speak('Text size reset to default.');
          }
        },
        confirmSpeech: 'Default text size restored.',
      },
      {
        id: 'toggle-voice',
        number: 4,
        label: 'Toggle Voice Assistant',
        description: 'Pause or resume background speech recognition (Alt+V)',
        aliases: ['toggle voice', 'pause voice', 'stop voice'],
        action: (c) => {
          if (c.toggleListening) c.toggleListening();
        },
        confirmSpeech: 'Toggling Voice Assistant.',
      },
      {
        id: 'dashboard',
        number: 5,
        label: 'Return to Dashboard',
        description: 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech =
      `Sensory Accessibility Settings. Here are your 5 available actions: ` +
      `Option 1: Toggle High Contrast AAA Visual Mode. ` +
      `Option 2: Increase Text Size to Extra Large. ` +
      `Option 3: Reset Text Size to Normal. ` +
      `Option 4: Toggle Voice Assistant Listening. ` +
      `Option 5: Return to Dashboard. ` +
      `Say Option 1 or High Contrast, Option 2 or Increase Text, or say Dashboard.`;

    const elementsSummary =
      `Settings options: 1. Toggle High Contrast, 2. Increase Text, 3. Reset Text, 4. Toggle Voice, 5. Dashboard.`;

    return { id: 'settings', name: 'Accessibility Settings', introSpeech, elementsSummary, elements };
  }

  // 14. HELP AND GUIDES
  if (path.startsWith('/candidate/help')) {
    const elements: SectionElement[] = [
      {
        id: 'commands-cheatsheet',
        number: 1,
        label: 'Read Voice Commands Cheatsheet',
        description: 'Spoken list of all available voice navigation triggers',
        aliases: ['commands', 'voice commands', 'cheatsheet', 'command list'],
        action: (c) => {
          if (c.speakAvailableCommands) c.speakAvailableCommands();
        },
        confirmSpeech: 'Reading Voice Commands.',
      },
      {
        id: 'keyboard-shortcuts',
        number: 2,
        label: 'Read Keyboard Hotkeys',
        description: 'Quick access keyboard combinations including Alt+V and Alt+G',
        aliases: ['keyboard shortcuts', 'shortcuts', 'hotkeys'],
        action: (c) =>
          c.speak(
            'Keyboard shortcuts: Alt plus V toggles voice assistant. Alt plus G speaks page guidance and options. Alt plus D opens Dashboard. Alt plus L opens Learn. Alt plus P opens Practice.'
          ),
        confirmSpeech: 'Reading Keyboard Shortcuts.',
      },
      {
        id: 'dashboard',
        number: 3,
        label: 'Return to Dashboard',
        description: 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech =
      `Help and Guides. Here are your 3 available actions: ` +
      `Option 1: Read all voice navigation commands. ` +
      `Option 2: Read keyboard shortcuts. ` +
      `Option 3: Return to Dashboard. ` +
      `Say Option 1 for commands, Option 2 for hotkeys, or Option 3 for Dashboard.`;

    const elementsSummary =
      `Help options: 1. Voice Commands, 2. Keyboard Shortcuts, 3. Return to Dashboard.`;

    return { id: 'help', name: 'Help and Guides', introSpeech, elementsSummary, elements };
  }

  // 15. DEFAULT FALLBACK
  const defaultElements: SectionElement[] = [
    {
      id: 'dashboard',
      number: 1,
      label: 'Candidate Dashboard',
      description: 'Main workspace overview',
      aliases: ['dashboard', 'home'],
      action: (c) => c.navigate('/candidate/dashboard'),
      confirmSpeech: 'Opening Dashboard.',
    },
    {
      id: 'learn',
      number: 2,
      label: 'Learning Curriculum',
      description: 'Subjects and topics',
      aliases: ['learn', 'curriculum'],
      action: (c) => c.navigate('/candidate/learn'),
      confirmSpeech: 'Opening Learning Curriculum.',
    },
    {
      id: 'practice',
      number: 3,
      label: 'Practice Hub',
      description: 'Practice questions',
      aliases: ['practice'],
      action: (c) => c.navigate('/candidate/practice'),
      confirmSpeech: 'Opening Practice Hub.',
    },
    {
      id: 'help',
      number: 4,
      label: 'Help and Guides',
      description: 'Voice commands and shortcuts',
      aliases: ['help', 'commands'],
      action: (c) => c.navigate('/candidate/help'),
      confirmSpeech: 'Opening Help.',
    },
  ];

  return {
    id: 'candidate-workspace',
    name: 'Candidate Workspace',
    introSpeech: `Candidate Workspace. Say Option 1 for Dashboard, Option 2 for Learn, Option 3 for Practice, or Option 4 for Help.`,
    elementsSummary: `Options: 1. Dashboard, 2. Learn, 3. Practice, 4. Help.`,
    elements: defaultElements,
  };
}
