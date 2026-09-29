import { LearningSubject, LearningTopic } from '../types/learning';
import { PracticeQuestion } from '../types/practice';

export const FALLBACK_TOPICS: Record<string, LearningTopic> = {
  percentages: {
    id: 'percentages',
    subjectId: 'mathematics',
    name: 'Percentages',
    shortDescription:
      'Core quantitative concept covering conversion, percentage increase/decrease, successive changes, and exam-level word problems.',
    progressPercent: 60,
    completedLessons: 6,
    totalLessons: 10,
    estimatedMinutes: 15,
    isRecommended: true,
    practiceAvailable: true,
    practiceCount: 15,
    learningObjectives: [
      'Understand fraction to percentage conversions and vice versa.',
      'Calculate percentage increase and percentage decrease using standard formulas.',
      'Apply successive percentage change rules to competitive examination word problems.',
      'Solve real-world quantitative questions without relying on visual approximations.',
    ],
    overview:
      'Percentages represent parts per hundred and form the mathematical foundation for Profit & Loss, Simple & Compound Interest, Data Interpretation, and Ratio analysis.',
    sections: [
      {
        id: 'concept-definition',
        title: '1. What is a Percentage?',
        paragraphs: [
          "A percentage is a number or ratio expressed as a fraction of 100. It is often denoted using the percent sign '%'. For example, 45% is equal to 45 out of 100, or the fraction 45/100, which reduces to 9/20 or decimal 0.45.",
          'In competitive exams like the CDS, mastery of standard fraction-to-percentage conversions enables rapid mental calculation without scratch work.',
        ],
        formulas: [
          {
            id: 'formula-basic',
            visualText: 'Percentage = (Part / Whole) × 100',
            accessibleText: 'Percentage equals Part divided by Whole multiplied by one hundred.',
            explanation:
              'Use this basic relationship whenever you need to find what percent one value is of another total.',
          },
          {
            id: 'formula-part',
            visualText: 'Part = (Percentage / 100) × Whole',
            accessibleText: 'Part equals Percentage divided by one hundred multiplied by Whole.',
            explanation:
              'Use this formula to determine the absolute quantity when the percentage and the whole are given.',
          },
        ],
      },
      {
        id: 'percentage-changes',
        title: '2. Percentage Increase and Decrease',
        paragraphs: [
          'Percentage change measures the relative difference between an original value and a new value. When the new value exceeds the original, it is an increase. When the new value is less than the original, it is a decrease.',
          'Always remember that the denominator is the original base value, never the updated value.',
        ],
        formulas: [
          {
            id: 'formula-increase',
            visualText: '% Increase = [(New Value - Original Value) / Original Value] × 100',
            accessibleText:
              'Percentage Increase equals difference between New Value and Original Value, divided by Original Value, multiplied by one hundred.',
          },
          {
            id: 'formula-decrease',
            visualText: '% Decrease = [(Original Value - New Value) / Original Value] × 100',
            accessibleText:
              'Percentage Decrease equals difference between Original Value and New Value, divided by Original Value, multiplied by one hundred.',
          },
        ],
        examples: [
          {
            id: 'ex-1',
            question: 'If 20 is 25% of a number, what is the number?',
            steps: [
              'Step 1: Let the unknown number be denoted as X.',
              'Step 2: Translate the statement into an algebraic equation: 25% of X = 20.',
              'Step 3: Write 25% as the fraction 25/100 (or 1/4): (1/4) × X = 20.',
              'Step 4: Multiply both sides by 4 to solve for X: X = 20 × 4 = 80.',
            ],
            answer: '80',
            explanation:
              'Because 25% is one-fourth of any quantity, four times 20 gives the original whole value of 80.',
          },
        ],
      },
    ],
    quickRecap: [
      'Percent means per hundred (parts out of 100).',
      'Always divide by the original starting value when calculating percentage increase or decrease.',
      'Multiplying by 0.25 is equivalent to dividing by 4.',
      'A successive increase of 10% followed by 10% is equal to an overall 21% increase, not 20%.',
    ],
    audioNarrative:
      'Welcome to the audio walkthrough for Percentages. A percentage is simply a ratio expressed as a fraction of one hundred. For instance, twenty-five percent equals twenty-five over one hundred, or one quarter. In this module, remember two primary rules: First, Percentage equals Part divided by Whole multiplied by one hundred. Second, when finding percentage increase or decrease, the original base value is always placed in the denominator. To practice what you have learned, select the Start Practice button.',
  },
  algebra: {
    id: 'algebra',
    subjectId: 'mathematics',
    name: 'Algebra',
    shortDescription:
      'Linear equations, quadratic roots, algebraic identities, and system of linear equations for competitive exams.',
    progressPercent: 50,
    completedLessons: 4,
    totalLessons: 8,
    estimatedMinutes: 20,
    isRecommended: false,
    practiceAvailable: true,
    practiceCount: 12,
    learningObjectives: [
      'Solve single-variable linear equations and word problems.',
      'Apply quadratic formula and factorization methods to find equation roots.',
      'Use standard algebraic identities like (a + b) squared for fast computation.',
    ],
    overview:
      'Algebra forms the core structural backbone for elementary mathematics in defence and civil service testing.',
    sections: [
      {
        id: 'algebra-identities',
        title: '1. Standard Algebraic Identities',
        paragraphs: [
          'Algebraic identities are equations that remain true for every value substituted for the variables.',
        ],
        formulas: [
          {
            id: 'id-1',
            visualText: '(a + b)² = a² + 2ab + b²',
            accessibleText:
              'Open parenthesis a plus b close parenthesis squared equals a squared plus two a b plus b squared.',
          },
        ],
      },
    ],
    quickRecap: [
      'Linear equations have exactly one solution.',
      'Quadratic equations have at most two roots.',
    ],
  },
  geometry: {
    id: 'geometry',
    subjectId: 'mathematics',
    name: 'Geometry & Mensuration',
    shortDescription:
      'Properties of triangles, circles, polygons, and 2D/3D perimeter, area, and volume calculations.',
    progressPercent: 33,
    completedLessons: 3,
    totalLessons: 9,
    estimatedMinutes: 25,
    isRecommended: false,
    practiceAvailable: true,
    practiceCount: 10,
    learningObjectives: [
      'Classify triangles and calculate hypotenuse using Pythagoras theorem.',
      'Compute perimeter and area of regular 2D polygons.',
    ],
    overview: 'Geometry tests spatial intuition, angle relationships, and mensuration formulas.',
    sections: [],
    quickRecap: ['Sum of angles in any triangle is always 180 degrees.'],
  },
  'reading-comprehension': {
    id: 'reading-comprehension',
    subjectId: 'english',
    name: 'Reading Comprehension',
    shortDescription:
      'Techniques for skimming, tone identification, central theme synthesis, and vocabulary-in-context extraction.',
    progressPercent: 67,
    completedLessons: 8,
    totalLessons: 12,
    estimatedMinutes: 20,
    isRecommended: true,
    practiceAvailable: true,
    practiceCount: 15,
    learningObjectives: [
      'Identify the central claim and supporting evidence within an argumentative passage.',
      'Infer authorial attitude and tone without relying on external assumptions.',
      'Deduce the meaning of unfamiliar vocabulary items directly from sentence context.',
    ],
    overview:
      'Reading comprehension evaluates your ability to process written English accurately, extract nuanced inferences, and answer factual and inferential questions under timed conditions.',
    sections: [
      {
        id: 'rc-strategies',
        title: '1. Structured Reading Methodology',
        paragraphs: [
          "Rather than reading every word with equal weight, first read the introductory and concluding sentences of each paragraph to identify the passage's structural roadmap.",
          "Pay close attention to transitional discourse markers like 'however', 'moreover', 'consequently', and 'in contrast', which flag pivots in the author's argument.",
        ],
      },
    ],
    quickRecap: [
      'The main idea must cover the entire passage, not just a single paragraph.',
      "Avoid choosing extreme options that use absolute words like 'always' or 'never' unless explicitly justified by the text.",
    ],
    audioNarrative:
      'Welcome to Reading Comprehension. In competitive exams, reading comprehension questions test your ability to extract meaning, determine tone, and identify implicit arguments. Read actively by tracking transitions such as however and therefore. Select Start Practice to test your comprehension skills.',
  },
  grammar: {
    id: 'grammar',
    subjectId: 'english',
    name: 'Grammar & Sentence Correction',
    shortDescription:
      'Master subject-verb agreement, pronoun references, modifiers, prepositions, and active/passive voice conventions.',
    progressPercent: 83,
    completedLessons: 10,
    totalLessons: 12,
    estimatedMinutes: 18,
    isRecommended: false,
    practiceAvailable: true,
    practiceCount: 20,
    learningObjectives: [
      'Spot subject-verb agreement discrepancies in complex sentence structures.',
      'Correct misplaced and dangling participle modifiers.',
    ],
    overview:
      'Grammar rules govern sentence clarity and syntax across all competitive English papers.',
    sections: [],
    quickRecap: [
      'A singular subject demands a singular verb, regardless of parenthetical phrases in between.',
    ],
  },
  vocabulary: {
    id: 'vocabulary',
    subjectId: 'english',
    name: 'Vocabulary & Idioms',
    shortDescription:
      'High-frequency root words, synonyms, antonyms, and commonly tested English idioms.',
    progressPercent: 50,
    completedLessons: 5,
    totalLessons: 10,
    estimatedMinutes: 15,
    isRecommended: false,
    practiceAvailable: true,
    practiceCount: 15,
    learningObjectives: [
      'Deconstruct unknown words using Latin and Greek prefixes and roots.',
      'Distinguish subtle connotations between closely related synonyms.',
    ],
    overview:
      'Vocabulary breadth directly influences performance in sentence completion and cloze tests.',
    sections: [],
    quickRecap: ['Context determines whether a word carries a positive, neutral, or pejorative meaning.'],
  },
  history: {
    id: 'history',
    subjectId: 'general-knowledge',
    name: 'Indian History & Freedom Struggle',
    shortDescription:
      'Chronology from the 1857 uprising to Independence, social reform movements, and constitutional milestones.',
    progressPercent: 55,
    completedLessons: 6,
    totalLessons: 11,
    estimatedMinutes: 22,
    isRecommended: false,
    practiceAvailable: true,
    practiceCount: 15,
    learningObjectives: [
      'Chart the timeline of major non-violent movements led by the Indian National Congress.',
      'Understand key legislative milestones including Government of India Acts 1909, 1919, and 1935.',
    ],
    overview:
      'Indian modern history forms a substantial proportion of general knowledge questions in defence and civil examinations.',
    sections: [],
    quickRecap: ['The Non-Cooperation Movement was launched in 1920 following the Jallianwala Bagh tragedy.'],
  },
  'current-affairs': {
    id: 'current-affairs',
    subjectId: 'general-knowledge',
    name: 'Current Affairs & Defence',
    shortDescription:
      'National policy initiatives, multilateral summits, joint bilateral military exercises, and international awards.',
    progressPercent: 44,
    completedLessons: 4,
    totalLessons: 9,
    estimatedMinutes: 15,
    isRecommended: true,
    practiceAvailable: true,
    practiceCount: 20,
    learningObjectives: [
      'Recall key joint defence exercises conducted by Indian Armed Forces with partner nations.',
      'Stay informed on prominent scientific achievements and national infrastructure projects.',
    ],
    overview:
      'Current affairs questions test contemporary awareness across national security, governance, and science.',
    sections: [],
    quickRecap: ['Bilateral military exercises such as Mitra Shakti and Surya Kiran are recurring test items.'],
    audioNarrative:
      'Welcome to Current Affairs and Defence. This section covers key developments in national governance, defense acquisitions, and international treaties. Select Start Practice to test your knowledge on current affairs.',
  },
  geography: {
    id: 'geography',
    subjectId: 'general-knowledge',
    name: 'Physical & Indian Geography',
    shortDescription:
      'River drainage basins, monsoon wind systems, soil classifications, and mineral resources.',
    progressPercent: 50,
    completedLessons: 4,
    totalLessons: 8,
    estimatedMinutes: 20,
    isRecommended: false,
    practiceAvailable: true,
    practiceCount: 12,
    learningObjectives: [
      'Trace the origins and tributaries of Himalayan and Peninsular river networks.',
      'Understand the mechanics of South-West and North-East monsoon mechanisms.',
    ],
    overview:
      'Geography questions evaluate physical terrain analysis and resource distribution in India.',
    sections: [],
    quickRecap: [
      'The Western Ghats act as a major orographic precipitation barrier during the South-West monsoon.',
    ],
  },
  'coding-decoding': {
    id: 'coding-decoding',
    subjectId: 'reasoning',
    name: 'Coding & Decoding',
    shortDescription:
      'Letter shifting patterns, reverse alphabet pairs, numerical substitutions, and matrix coding problems.',
    progressPercent: 70,
    completedLessons: 7,
    totalLessons: 10,
    estimatedMinutes: 15,
    isRecommended: true,
    practiceAvailable: true,
    practiceCount: 15,
    learningObjectives: [
      'Quickly map alphabetic letter ranks from 1 to 26 and their reverse complements (sum equals 27).',
      'Identify shift rules such as alternating additions and subtractions.',
      'Solve conditional symbol substitution puzzles.',
    ],
    overview:
      'Coding and decoding evaluates logical substitution rules and sequential pattern tracking.',
    sections: [
      {
        id: 'cd-logic',
        title: '1. Alphabetical Positioning & Opposite Pairs',
        paragraphs: [
          'Each English letter corresponds to a unique positional number: A = 1, B = 2, up to Z = 26. Useful mnemonic rule is EJOTY, standing for 5, 10, 15, 20, and 25.',
          'Opposite pairs are letters whose positional ranks sum to 27: A with Z (1+26=27), B with Y (2+25=27), and M with N (13+14=27).',
        ],
      },
    ],
    quickRecap: [
      'Use EJOTY (5, 10, 15, 20, 25) to immediately locate letter numbers.',
      'Opposite letters always sum to 27.',
    ],
    audioNarrative:
      'Welcome to Coding and Decoding. In this reasoning topic, you will decipher alphabetical shifts and numerical substitutions. Remember that opposite pairs of letters always sum to twenty-seven. Select Start Practice to test your pattern identification skills.',
  },
  series: {
    id: 'series',
    subjectId: 'reasoning',
    name: 'Number & Alphabet Series',
    shortDescription:
      'Arithmetic, geometric, alternating, and prime-based series progression rules.',
    progressPercent: 62,
    completedLessons: 5,
    totalLessons: 8,
    estimatedMinutes: 18,
    isRecommended: false,
    practiceAvailable: true,
    practiceCount: 15,
    learningObjectives: [
      'Identify second-order difference patterns in complex number sequences.',
      'Detect alternating multi-tier sequences.',
    ],
    overview:
      'Number series questions measure inductive reasoning and mathematical sequence recognition.',
    sections: [],
    quickRecap: [
      'When in doubt, calculate the differences between adjacent numbers to find second-tier patterns.',
    ],
  },
  analogy: {
    id: 'analogy',
    subjectId: 'reasoning',
    name: 'Analogy & Classification',
    shortDescription:
      'Verbal relationships, word associations, number relationships, and odd-one-out puzzles.',
    progressPercent: 80,
    completedLessons: 8,
    totalLessons: 10,
    estimatedMinutes: 12,
    isRecommended: false,
    practiceAvailable: true,
    practiceCount: 10,
    learningObjectives: [
      'Identify the exact functional or taxonomic relationship between word pairs.',
      'Apply proportional logic to mathematical number pairs.',
    ],
    overview:
      'Analogies test proportional relationship deduction across verbal and numeric domains.',
    sections: [],
    quickRecap: [
      'First identify whether the relationship is cause-and-effect, part-to-whole, or functional purpose.',
    ],
  },
};

export const FALLBACK_SUBJECTS: LearningSubject[] = [
  {
    id: 'mathematics',
    examId: 'cds',
    name: 'Mathematics',
    code: 'MATH',
    description:
      'Build quantitative aptitude, arithmetic precision, and algebraic problem-solving for competitive examinations.',
    iconName: 'Calculator',
    progressPercent: 70,
    completedTopicsCount: 2,
    totalTopicsCount: 3,
    recommendedTopicId: 'percentages',
    topics: [
      FALLBACK_TOPICS['percentages'],
      FALLBACK_TOPICS['algebra'],
      FALLBACK_TOPICS['geometry'],
    ],
  },
  {
    id: 'english',
    examId: 'cds',
    name: 'English Language',
    code: 'ENG',
    description:
      'Enhance grammatical command, vocabulary breadth, and reading comprehension under timed test conditions.',
    iconName: 'BookOpen',
    progressPercent: 75,
    completedTopicsCount: 2,
    totalTopicsCount: 3,
    recommendedTopicId: 'reading-comprehension',
    topics: [
      FALLBACK_TOPICS['reading-comprehension'],
      FALLBACK_TOPICS['grammar'],
      FALLBACK_TOPICS['vocabulary'],
    ],
  },
  {
    id: 'general-knowledge',
    examId: 'cds',
    name: 'General Knowledge',
    code: 'GK',
    description:
      'Stay prepared with structured historical milestones, Indian geography, and verified national current affairs.',
    iconName: 'Globe',
    progressPercent: 65,
    completedTopicsCount: 1,
    totalTopicsCount: 3,
    recommendedTopicId: 'current-affairs',
    topics: [
      FALLBACK_TOPICS['history'],
      FALLBACK_TOPICS['current-affairs'],
      FALLBACK_TOPICS['geography'],
    ],
  },
  {
    id: 'reasoning',
    examId: 'cds',
    name: 'Reasoning Ability',
    code: 'REAS',
    description:
      'Develop deductive reasoning, logical sequencing, and analytical deduction through structured practice.',
    iconName: 'Brain',
    progressPercent: 80,
    completedTopicsCount: 2,
    totalTopicsCount: 3,
    recommendedTopicId: 'coding-decoding',
    topics: [
      FALLBACK_TOPICS['coding-decoding'],
      FALLBACK_TOPICS['series'],
      FALLBACK_TOPICS['analogy'],
    ],
  },
];

export const FALLBACK_PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'math-perc-01',
    subjectId: 'mathematics',
    subjectName: 'Mathematics',
    topicId: 'percentages',
    topicName: 'Percentages',
    type: 'single_choice',
    difficulty: 'easy',
    questionText: 'If 20 is 25% of a number, what is the number?',
    options: [
      { id: 'A', label: 'A', text: '50' },
      { id: 'B', label: 'B', text: '80' },
      { id: 'C', label: 'C', text: '100' },
      { id: 'D', label: 'D', text: '120' },
    ],
    correctOptionIds: ['B'],
    explanation:
      '25% of a number equals 1/4 of that number. If 1/4 of X = 20, then X = 20 × 4 = 80. Therefore, the number is 80.',
    hint: 'Convert 25% to its fraction equivalent of 1/4.',
    audioDescription:
      'Question 1. If 20 is 25 percent of a number, what is the number? Option A: 50. Option B: 80. Option C: 100. Option D: 120.',
  },
  {
    id: 'math-perc-02',
    subjectId: 'mathematics',
    subjectName: 'Mathematics',
    topicId: 'percentages',
    topicName: 'Percentages',
    type: 'single_choice',
    difficulty: 'easy',
    questionText: 'What is 15% of 240?',
    options: [
      { id: 'A', label: 'A', text: '32' },
      { id: 'B', label: 'B', text: '36' },
      { id: 'C', label: 'C', text: '40' },
      { id: 'D', label: 'D', text: '42' },
    ],
    correctOptionIds: ['B'],
    explanation:
      '10% of 240 is 24. 5% of 240 is half of 24, which is 12. Summing 10% and 5% gives 24 + 12 = 36.',
    hint: 'Break 15% into 10% plus 5%.',
    audioDescription:
      'Question 2. What is 15 percent of 240? Option A: 32. Option B: 36. Option C: 40. Option D: 42.',
  },
  {
    id: 'math-perc-03',
    subjectId: 'mathematics',
    subjectName: 'Mathematics',
    topicId: 'percentages',
    topicName: 'Percentages',
    type: 'single_choice',
    difficulty: 'medium',
    questionText:
      'The price of an article increased from ₹800 to ₹1,000. What is the percentage increase?',
    options: [
      { id: 'A', label: 'A', text: '20%' },
      { id: 'B', label: 'B', text: '25%' },
      { id: 'C', label: 'C', text: '30%' },
      { id: 'D', label: 'D', text: '12.5%' },
    ],
    correctOptionIds: ['B'],
    explanation:
      'Absolute increase = ₹1000 - ₹800 = ₹200. Percentage increase = (Increase / Original Base) × 100 = (200 / 800) × 100 = 1/4 × 100 = 25%.',
    hint: 'Always divide by the original starting price of ₹800, not the new price.',
    audioDescription:
      'Question 3. The price of an article increased from 800 rupees to 1000 rupees. What is the percentage increase? Option A: 20 percent. Option B: 25 percent. Option C: 30 percent. Option D: 12.5 percent.',
  },
  {
    id: 'math-perc-04',
    subjectId: 'mathematics',
    subjectName: 'Mathematics',
    topicId: 'percentages',
    topicName: 'Percentages',
    type: 'true_false',
    difficulty: 'easy',
    questionText:
      'True or False: A 10% increase followed by a 10% decrease returns a quantity to its original initial value.',
    options: [
      { id: 'A', label: 'A', text: 'True' },
      { id: 'B', label: 'B', text: 'False' },
    ],
    correctOptionIds: ['B'],
    explanation:
      'False. Let original = 100. A 10% increase makes it 110. A 10% decrease of 110 reduces it by 11 to 99, resulting in a net 1% loss.',
    audioDescription:
      'Question 4. True or False: A 10 percent increase followed by a 10 percent decrease returns a quantity to its original initial value? Option A: True. Option B: False.',
  },
  {
    id: 'math-perc-05',
    subjectId: 'mathematics',
    subjectName: 'Mathematics',
    topicId: 'percentages',
    topicName: 'Percentages',
    type: 'single_choice',
    difficulty: 'hard',
    questionText:
      'In an examination, 65% of candidates passed in English, 60% passed in Mathematics, and 40% passed in both. What percentage of candidates failed in both subjects?',
    options: [
      { id: 'A', label: 'A', text: '15%' },
      { id: 'B', label: 'B', text: '20%' },
      { id: 'C', label: 'C', text: '25%' },
      { id: 'D', label: 'D', text: '35%' },
    ],
    correctOptionIds: ['A'],
    explanation:
      'Using set theory: Passed in at least one subject = P(E) + P(M) - P(E ∩ M) = 65% + 60% - 40% = 85%. Therefore, candidates who failed in both = 100% - 85% = 15%.',
    hint: 'Add the single subject passes and subtract the intersection.',
    audioDescription:
      'Question 5. In an examination, 65 percent passed in English, 60 percent passed in Mathematics, and 40 percent passed in both. What percentage failed in both subjects? Option A: 15 percent. Option B: 20 percent. Option C: 25 percent. Option D: 35 percent.',
  },
  {
    id: 'reas-code-01',
    subjectId: 'reasoning',
    subjectName: 'Reasoning Ability',
    topicId: 'coding-decoding',
    topicName: 'Coding & Decoding',
    type: 'single_choice',
    difficulty: 'easy',
    questionText: "If 'DELHI' is coded as 'EDMIJ', how is 'MUMBAI' coded following the same logic?",
    options: [
      { id: 'A', label: 'A', text: 'NVNCBJ' },
      { id: 'B', label: 'B', text: 'NVMCBJ' },
      { id: 'C', label: 'C', text: 'LTLAZH' },
      { id: 'D', label: 'D', text: 'OWNCDK' },
    ],
    correctOptionIds: ['A'],
    explanation:
      'Every letter is shifted forward by 1 rank: M(+1)=N, U(+1)=V, M(+1)=N, B(+1)=C, A(+1)=B, I(+1)=J giving NVNCBJ.',
    audioDescription:
      'Question 6. If DELHI is coded as EDMIJ, how is MUMBAI coded? Option A: NVNCBJ. Option B: NVMCBJ. Option C: LTLAZH. Option D: OWNCDK.',
  },
  {
    id: 'reas-code-02',
    subjectId: 'reasoning',
    subjectName: 'Reasoning Ability',
    topicId: 'coding-decoding',
    topicName: 'Coding & Decoding',
    type: 'single_choice',
    difficulty: 'medium',
    questionText:
      "In a certain code language, 'CAT' is coded as 24 and 'DOG' is coded as 26. What is the code for 'PIG'?",
    options: [
      { id: 'A', label: 'A', text: '32' },
      { id: 'B', label: 'B', text: '30' },
      { id: 'C', label: 'C', text: '28' },
      { id: 'D', label: 'D', text: '34' },
    ],
    correctOptionIds: ['A'],
    explanation:
      'Sum of alphabetical positions: C(3) + A(1) + T(20) = 24. D(4) + O(15) + G(7) = 26. For PIG: P(16) + I(9) + G(7) = 32.',
    audioDescription:
      'Question 7. In a certain code language, CAT is coded as 24 and DOG is coded as 26. What is the code for PIG? Option A: 32. Option B: 30. Option C: 28. Option D: 34.',
  },
  {
    id: 'eng-gram-01',
    subjectId: 'english',
    subjectName: 'English Language',
    topicId: 'grammar',
    topicName: 'Grammar & Sentence Correction',
    type: 'single_choice',
    difficulty: 'easy',
    questionText: 'Identify the sentence with correct subject-verb agreement:',
    options: [
      { id: 'A', label: 'A', text: 'The group of students were cheering loudly in the auditorium.' },
      { id: 'B', label: 'B', text: 'The group of students was cheering loudly in the auditorium.' },
      { id: 'C', label: 'C', text: 'The group of students are cheering loudly in the auditorium.' },
      { id: 'D', label: 'D', text: 'The group of students have cheered loudly in the auditorium.' },
    ],
    correctOptionIds: ['B'],
    explanation:
      "The subject is the collective singular noun 'The group', not 'students'. Singular subject requires the singular auxiliary verb 'was'.",
    audioDescription:
      'Question 8. Identify the sentence with correct subject-verb agreement. Option A: were cheering. Option B: was cheering. Option C: are cheering. Option D: have cheered.',
  },
  {
    id: 'eng-rc-01',
    subjectId: 'english',
    subjectName: 'English Language',
    topicId: 'reading-comprehension',
    topicName: 'Reading Comprehension',
    type: 'single_choice',
    difficulty: 'medium',
    questionText:
      "When an author uses the transitional phrase 'on the contrary', what argumentative direction is signaled?",
    options: [
      { id: 'A', label: 'A', text: 'Reinforcement of a previously stated premise' },
      { id: 'B', label: 'B', text: 'An emphatic reversal or counter-argument' },
      { id: 'C', label: 'C', text: 'A sequential chronological timeline' },
      { id: 'D', label: 'D', text: 'An introductory rhetorical question' },
    ],
    correctOptionIds: ['B'],
    explanation:
      "'On the contrary' is used to strongly contradict a previous assertion and present the opposing reality.",
    audioDescription:
      'Question 9. When an author uses the phrase on the contrary, what argumentative direction is signaled? Option A: Reinforcement. Option B: An emphatic reversal. Option C: Chronological timeline. Option D: Rhetorical question.',
  },
  {
    id: 'gk-curr-01',
    subjectId: 'general-knowledge',
    subjectName: 'General Knowledge',
    topicId: 'current-affairs',
    topicName: 'Current Affairs & Defence',
    type: 'single_choice',
    difficulty: 'medium',
    questionText:
      "The bilateral joint military exercise 'MITRA SHAKTI' is conducted between the armed forces of India and which neighboring country?",
    options: [
      { id: 'A', label: 'A', text: 'Nepal' },
      { id: 'B', label: 'B', text: 'Sri Lanka' },
      { id: 'C', label: 'C', text: 'Bangladesh' },
      { id: 'D', label: 'D', text: 'Maldives' },
    ],
    correctOptionIds: ['B'],
    explanation:
      'Exercise Mitra Shakti is an annual bilateral military exercise conducted jointly between the Indian Army and the Sri Lanka Army.',
    audioDescription:
      'Question 10. The bilateral joint military exercise MITRA SHAKTI is conducted between India and which country? Option A: Nepal. Option B: Sri Lanka. Option C: Bangladesh. Option D: Maldives.',
  },
];
