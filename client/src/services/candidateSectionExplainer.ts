/**
 * candidateSectionExplainer.ts
 *
 * Dedicated multilingual section orientation and voice navigation registry for DRISHTI.
 * Supports both English ('en') and Hindi ('hi') natively.
 *
 * Provides:
 * 1. Rich spoken audio explanation of all interactive elements in each section.
 * 2. Numbered element matching (Option 1 to 7 / विकल्प 1 से 7, पहला, दूसरा, etc.).
 * 3. Element name and alias matching in both English and Hindi.
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
  const isHindi =
    ctx.preferences?.language === 'hi' || ctx.preferences?.preferredLanguage === 'hi';
  const name = ctx.userName || (isHindi ? 'अभ्यर्थी' : 'Candidate');

  // ==========================================
  // 1. DASHBOARD (/candidate/dashboard)
  // ==========================================
  if (path.startsWith('/candidate/dashboard')) {
    const elements: SectionElement[] = [
      {
        id: 'continue-practice',
        number: 1,
        label: isHindi ? 'प्रतिशत अभ्यास जारी रखें' : 'Continue Percentages Practice',
        description: isHindi
          ? 'गणित में प्रतिशत पर अपना अभ्यास सत्र फिर से शुरू करें'
          : 'Resumes your practice session on Percentages in Mathematics',
        aliases: [
          'continue',
          'percentages practice',
          'resume',
          'continue practice',
          'abhyas chalu',
          'अभ्यास जारी रखें',
          'प्रतिशत अभ्यास',
          'जारी रखें',
          'शुरू करें',
        ],
        action: (c) => c.navigate('/candidate/practice/session/demo-percentages'),
        confirmSpeech: isHindi
          ? 'प्रतिशत अभ्यास सत्र प्रारंभ कर रहे हैं।'
          : 'Launching Percentages Practice session.',
      },
      {
        id: 'learn-curriculum',
        number: 2,
        label: isHindi ? 'पाठ्यक्रम सीखें' : 'Learn Curriculum',
        description: isHindi
          ? 'गणित, अंग्रेजी, सामान्य ज्ञान और रीजनिंग के अध्याय पढ़ें'
          : 'Open curriculum subjects: Mathematics, English, General Knowledge, and Reasoning',
        aliases: [
          'learn',
          'curriculum',
          'syllabus',
          'padho',
          'sikho',
          'learning',
          'सीखें',
          'पाठ्यक्रम',
          'सिलेबस',
          'पढ़ाई',
        ],
        action: (c) => c.navigate('/candidate/learn'),
        confirmSpeech: isHindi
          ? 'सीखने का पाठ्यक्रम खोला जा रहा है।'
          : 'Opening Learning Curriculum.',
      },
      {
        id: 'practice-hub',
        number: 3,
        label: isHindi ? 'इंटरैक्टिव अभ्यास केंद्र' : 'Interactive Practice Hub',
        description: isHindi
          ? 'परीक्षा, विषय और अध्याय के अनुसार प्रश्नों का अभ्यास करें'
          : 'Practice questions by exam, subject, and topic with instant feedback',
        aliases: [
          'practice',
          'abhyas',
          'practice hub',
          'अभ्यास',
          'प्रैक्टिस',
          'अभ्यास केंद्र',
        ],
        action: (c) => c.navigate('/candidate/practice'),
        confirmSpeech: isHindi
          ? 'अभ्यास केंद्र खोला जा रहा है।'
          : 'Opening Practice Hub.',
      },
      {
        id: 'mock-tests',
        number: 4,
        label: isHindi ? 'आधिकारिक मॉक टेस्ट' : 'Official Mock Tests',
        description: isHindi
          ? 'समयबद्ध पूर्ण लंबाई वाली प्रतियोगी परीक्षा सिमुलेशन'
          : 'Full-length simulated timed examinations',
        aliases: [
          'mock tests',
          'mock test',
          'mocks',
          'test series',
          'मॉक टेस्ट',
          'मॉक',
          'टेस्ट सीरीज',
        ],
        action: (c) => c.navigate('/candidate/mock-tests'),
        confirmSpeech: isHindi
          ? 'मॉक टेस्ट पोर्टल खोला जा रहा है।'
          : 'Opening Mock Tests Portal.',
      },
      {
        id: 'scheduled-exams',
        number: 5,
        label: isHindi ? 'निर्धारित परीक्षाएं' : 'Scheduled Examinations',
        description: isHindi
          ? 'आधिकारिक परीक्षा अनुसूची और प्रोक्टर्ड परीक्षा कक्ष'
          : 'Official exam schedule and proctored examination hall',
        aliases: [
          'exams',
          'exam',
          'pariksha',
          'examination',
          'examinations',
          'परीक्षा',
          'परीक्षाएं',
          'एग्जाम',
        ],
        action: (c) => c.navigate('/candidate/exams'),
        confirmSpeech: isHindi
          ? 'आधिकारिक परीक्षा पोर्टल खोला जा रहा है।'
          : 'Opening Official Examinations Portal.',
      },
      {
        id: 'results-analytics',
        number: 6,
        label: isHindi ? 'परिणाम और विश्लेषण' : 'Results and Analytics',
        description: isHindi
          ? 'विस्तृत स्कोरकार्ड, सटीकता दर और अध्ययन प्रगति देखें'
          : 'Review scorecards, accuracy breakdown, and study insights',
        aliases: [
          'results',
          'scores',
          'result',
          'parinam',
          'scorecard',
          'परिणाम',
          'रिजल्ट',
          'स्कोर',
          'स्कोरकार्ड',
        ],
        action: (c) => c.navigate('/candidate/results'),
        confirmSpeech: isHindi
          ? 'परिणाम और विश्लेषण खोला जा रहा है।'
          : 'Opening Results and Analytics.',
      },
      {
        id: 'accessibility-settings',
        number: 7,
        label: isHindi ? 'संवेदी एक्सेसिबिलिटी सेटिंग्स' : 'Sensory Accessibility Settings',
        description: isHindi
          ? 'हाई कंट्रास्ट, टेक्स्ट साइज, वॉइस असिस्टेंट और थीम सेटिंग्स बदलें'
          : 'Adjust high contrast, font size scale, audio narration, and themes',
        aliases: [
          'settings',
          'accessibility',
          'preferences',
          'contrast',
          'font size',
          'सेटिंग्स',
          'एक्सेसिबिलिटी',
          'कंट्रास्ट',
        ],
        action: (c) => c.navigate('/candidate/settings'),
        confirmSpeech: isHindi
          ? 'एक्सेसिबिलिटी सेटिंग्स खोली जा रही हैं।'
          : 'Opening Accessibility Settings.',
      },
    ];

    const introSpeech = isHindi
      ? `अभ्यर्थी डैशबोर्ड में आपका स्वागत है, ${name}। आपके पास 7 मुख्य विकल्प उपलब्ध हैं: ` +
        `विकल्प 1: प्रतिशत अभ्यास जारी रखें। ` +
        `विकल्प 2: पाठ्यक्रम सीखें। ` +
        `विकल्प 3: इंटरैक्टिव अभ्यास केंद्र। ` +
        `विकल्प 4: आधिकारिक मॉक टेस्ट। ` +
        `विकल्प 5: निर्धारित परीक्षाएं। ` +
        `विकल्प 6: परिणाम और विश्लेषण। ` +
        `विकल्प 7: संवेदी एक्सेसिबिलिटी सेटिंग्स। ` +
        `चुनने के लिए विकल्प 1 कहें, या किसी भी विकल्प का नाम या नंबर बोलें।`
      : `Welcome to Candidate Dashboard, ${name}. Here are your 7 options: ` +
        `Option 1: Continue Percentages Practice. ` +
        `Option 2: Learn Curriculum. ` +
        `Option 3: Interactive Practice Hub. ` +
        `Option 4: Official Mock Tests. ` +
        `Option 5: Scheduled Examinations. ` +
        `Option 6: Results and Analytics. ` +
        `Option 7: Sensory Accessibility Settings. ` +
        `Say Option 1 to resume practice, or say any option number or name to select.`;

    const elementsSummary = isHindi
      ? `उपलब्ध विकल्प: 1. अभ्यास जारी रखें, 2. पाठ्यक्रम सीखें, 3. अभ्यास केंद्र, 4. मॉक टेस्ट, 5. परीक्षाएं, 6. परिणाम, 7. सेटिंग्स। विकल्प 1 से 7 तक बोलें।`
      : `Options available: 1. Continue Practice, 2. Learn Curriculum, 3. Practice Hub, 4. Mock Tests, 5. Scheduled Exams, 6. Results, 7. Settings. Say Option 1 through 7 to select.`;

    return {
      id: 'dashboard',
      name: isHindi ? 'अभ्यर्थी डैशबोर्ड' : 'Candidate Dashboard',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 2. PERCENTAGES TOPIC
  // ==========================================
  if (path.startsWith('/candidate/learn/mathematics/percentages')) {
    const elements: SectionElement[] = [
      {
        id: 'concept',
        number: 1,
        label: isHindi ? 'अवधारणा नोट्स सुनें' : 'Read Concept Notes',
        description: isHindi
          ? 'प्रतिशत और भिन्न रूपांतरण का ऑडियो स्पष्टीकरण'
          : 'Audio explanation of percentages and fraction conversion',
        aliases: ['concept', 'read concept', 'notes', 'overview', 'samjhao', 'अवधारणा', 'नोट्स', 'समझाओ'],
        action: (c) =>
          c.speak(
            isHindi
              ? 'प्रतिशत की अवधारणा: प्रतिशत किसी संख्या को 100 के भिन्न के रूप में दर्शाता है। भिन्न को प्रतिशत में बदलने के लिए 100 से गुणा करें। जैसे 1 बटा 4 बराबर 25 प्रतिशत होता है।'
              : 'Percentages concept: A percentage represents a number as a fraction of 100. To convert any fraction to percentage, multiply by 100. For example, 1 divided by 4 equals 25 percent.'
          ),
        confirmSpeech: isHindi
          ? 'प्रतिशत की मुख्य अवधारणा पढ़ रहे हैं।'
          : 'Reading Concept Notes for Percentages.',
      },
      {
        id: 'formulas',
        number: 2,
        label: isHindi ? 'महत्वपूर्ण सूत्र सुनें' : 'Read Important Formulas',
        description: isHindi
          ? 'प्रतिशत वृद्धि और कमी के मुख्य गणितीय सूत्र'
          : 'Spoken formula cheat-sheet for percentages',
        aliases: ['formulas', 'formula', 'cheat sheet', 'sutra', 'सूत्र', 'फॉर्मूला'],
        action: (c) =>
          c.speak(
            isHindi
              ? 'मुख्य प्रतिशत सूत्र: प्रतिशत वृद्धि बराबर वृद्धि बटा प्रारंभिक मान गुणा 100। प्रतिशत कमी बराबर कमी बटा प्रारंभिक मान गुणा 100।'
              : 'Key Percentages formulas: 1. Percentage increase equals Increase divided by Initial Value multiplied by 100. 2. Percentage decrease equals Decrease divided by Initial Value multiplied by 100.'
          ),
        confirmSpeech: isHindi
          ? 'प्रतिशत के मुख्य सूत्र सुना रहे हैं।'
          : 'Reading Formulas for Percentages.',
      },
      {
        id: 'start-practice',
        number: 3,
        label: isHindi ? 'अभ्यास प्रश्न शुरू करें' : 'Start Practice Questions',
        description: isHindi
          ? 'प्रतिशत पर 5 इंटरैक्टिव अभ्यास प्रश्न प्रारंभ करें'
          : 'Launches 5 interactive practice questions on percentages',
        aliases: ['practice', 'start practice', 'questions', 'swal', 'abhyas', 'अभ्यास', 'प्रश्न शुरू करें'],
        action: (c) => c.navigate('/candidate/practice/session/demo-percentages'),
        confirmSpeech: isHindi
          ? 'प्रतिशत अभ्यास सत्र प्रारंभ कर रहे हैं।'
          : 'Launching Percentages Practice session.',
      },
      {
        id: 'back',
        number: 4,
        label: isHindi ? 'वापस गणित पर जाएं' : 'Back to Mathematics',
        description: isHindi ? 'गणित के विषयों की सूची पर लौटें' : 'Return to Mathematics topics list',
        aliases: ['back', 'wapas', 'mathematics', 'वापस', 'गणित'],
        action: (c) => c.navigate('/candidate/learn/mathematics'),
        confirmSpeech: isHindi
          ? 'गणित पाठ्यक्रम पर वापस जा रहे हैं।'
          : 'Returning to Mathematics Curriculum.',
      },
    ];

    const introSpeech = isHindi
      ? `प्रतिशत और भिन्न अध्याय। यहाँ 4 विकल्प उपलब्ध हैं: ` +
        `विकल्प 1: अवधारणा नोट्स सुनें। ` +
        `विकल्प 2: महत्वपूर्ण सूत्र सुनें। ` +
        `विकल्प 3: प्रतिशत पर अभ्यास प्रश्न शुरू करें। ` +
        `विकल्प 4: वापस गणित पर जाएं। ` +
        `विकल्प 1, 2, या 3 बोलें।`
      : `Percentages and Fractions Topic. Here are the 4 elements: ` +
        `Option 1: Read Concept Notes and overview. ` +
        `Option 2: Read Important Formulas. ` +
        `Option 3: Launch Practice Questions on Percentages. ` +
        `Option 4: Back to Mathematics. ` +
        `Say Option 1 to hear concept, Option 2 for formulas, or Option 3 to start practice.`;

    const elementsSummary = isHindi
      ? `प्रतिशत विकल्प: 1. अवधारणा, 2. सूत्र, 3. अभ्यास शुरू, 4. वापस गणित।`
      : `Percentages options: 1. Read Concept, 2. Read Formulas, 3. Launch Practice, 4. Back to Mathematics.`;

    return {
      id: 'learn-topic-percentages',
      name: isHindi ? 'प्रतिशत अध्याय' : 'Percentages Topic',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 3. MATHEMATICS CURRICULUM
  // ==========================================
  if (path.startsWith('/candidate/learn/mathematics')) {
    const elements: SectionElement[] = [
      {
        id: 'percentages',
        number: 1,
        label: isHindi ? 'प्रतिशत और भिन्न' : 'Percentages and Fractions',
        description: isHindi
          ? 'प्रतिशत रूपांतरण, प्रतिशत परिवर्तन और अनुपात शब्द समस्याएं'
          : '10 lessons covering conversion, percentage change, and word problems',
        aliases: ['percentages', 'percentage', 'fractions', 'pratishat', 'प्रतिशत', 'भिन्न'],
        action: (c) => c.navigate('/candidate/learn/mathematics/percentages'),
        confirmSpeech: isHindi
          ? 'प्रतिशत और भिन्न अध्याय खोला जा रहा है।'
          : 'Opening Percentages and Fractions topic.',
      },
      {
        id: 'algebra',
        number: 2,
        label: isHindi ? 'बीजगणित और समीकरण' : 'Algebra and Equations',
        description: isHindi
          ? 'रैखिक समीकरण, बहुपद और द्विघात समीकरण'
          : 'Linear equations, polynomials, and quadratic formula',
        aliases: ['algebra', 'equations', 'beejganit', 'बीजगणित', 'समीकरण'],
        action: (c) => c.navigate('/candidate/learn/mathematics/algebra'),
        confirmSpeech: isHindi
          ? 'बीजगणित अध्याय खोला जा रहा है।'
          : 'Opening Algebra topic.',
      },
      {
        id: 'geometry',
        number: 3,
        label: isHindi ? 'ज्यामिति और क्षेत्रमिति' : 'Geometry and Mensuration',
        description: isHindi
          ? 'त्रिभुज, वृत्त, क्षेत्रफल और परिमाप गणना'
          : 'Triangles, circles, area, and perimeter calculations',
        aliases: ['geometry', 'mensuration', 'jyamiti', 'ज्यामिति', 'क्षेत्रमिति'],
        action: (c) => c.navigate('/candidate/learn/mathematics/geometry'),
        confirmSpeech: isHindi
          ? 'ज्यामिति अध्याय खोला जा रहा है।'
          : 'Opening Geometry topic.',
      },
      {
        id: 'back',
        number: 4,
        label: isHindi ? 'वापस पाठ्यक्रम पर जाएं' : 'Back to Curriculum',
        description: isHindi ? 'विषयों की मुख्य सूची पर लौटें' : 'Return to subjects menu',
        aliases: ['back', 'wapas', 'curriculum', 'subjects', 'वापस', 'पाठ्यक्रम'],
        action: (c) => c.navigate('/candidate/learn'),
        confirmSpeech: isHindi
          ? 'पाठ्यक्रम सूची पर वापस जा रहे हैं।'
          : 'Returning to Curriculum menu.',
      },
    ];

    const introSpeech = isHindi
      ? `गणित पाठ्यक्रम। यहाँ 3 मुख्य अध्याय उपलब्ध हैं: ` +
        `विकल्प 1: प्रतिशत और भिन्न। ` +
        `विकल्प 2: बीजगणित और समीकरण। ` +
        `विकल्प 3: ज्यामिति और क्षेत्रमिति। ` +
        `खोलने के लिए विकल्प 1, प्रतिशत, विकल्प 2, या विकल्प 3 बोलें।`
      : `Mathematics Curriculum. Here are the 3 topics available: ` +
        `Option 1: Percentages and Fractions. ` +
        `Option 2: Algebra and Equations. ` +
        `Option 3: Geometry and Mensuration. ` +
        `Say Option 1 or Percentages, Option 2 or Algebra, or Option 3 or Geometry.`;

    const elementsSummary = isHindi
      ? `गणित विकल्प: 1. प्रतिशत, 2. बीजगणित, 3. ज्यामिति, 4. वापस। विकल्प 1, 2, या 3 कहें।`
      : `Mathematics options: 1. Percentages, 2. Algebra, 3. Geometry, 4. Back. Say Option 1, 2, or 3.`;

    return {
      id: 'learn-math',
      name: isHindi ? 'गणित पाठ्यक्रम' : 'Mathematics Curriculum',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 4. ENGLISH CURRICULUM
  // ==========================================
  if (path.startsWith('/candidate/learn/english')) {
    const elements: SectionElement[] = [
      {
        id: 'reading-comprehension',
        number: 1,
        label: isHindi ? 'रीडिंग कॉम्प्रिहेंशन' : 'Reading Comprehension',
        description: isHindi
          ? 'गद्यांश समझ और निष्कर्ष आधारित प्रश्न'
          : 'Passage comprehension, inference questions, and main theme extraction',
        aliases: ['reading comprehension', 'comprehension', 'passage', 'पैसेज', 'कॉम्प्रिहेंशन'],
        action: (c) => c.navigate('/candidate/learn/english/reading-comprehension'),
        confirmSpeech: isHindi
          ? 'रीडिंग कॉम्प्रिहेंशन अध्याय खोला जा रहा है।'
          : 'Opening Reading Comprehension topic.',
      },
      {
        id: 'grammar-rules',
        number: 2,
        label: isHindi ? 'व्याकरण के नियम' : 'Grammar Rules',
        description: isHindi
          ? 'सब्जेक्ट-वर्ब एग्रीमेंट, एक्टिव-पैसिव वॉइस और टेंस नियम'
          : 'Subject-verb agreement, active-passive voice, and tense rules',
        aliases: ['grammar', 'grammar rules', 'vyakaran', 'व्याकरण', 'ग्रामर'],
        action: (c) => c.navigate('/candidate/learn/english/grammar-rules'),
        confirmSpeech: isHindi
          ? 'व्याकरण नियम अध्याय खोला जा रहा है।'
          : 'Opening Grammar Rules topic.',
      },
      {
        id: 'vocabulary-building',
        number: 3,
        label: isHindi ? 'शब्दावली निर्माण' : 'Vocabulary Building',
        description: isHindi
          ? 'समानार्थी शब्द, विलोम शब्द, मुहावरे और वन-वर्ड सब्स्टीट्यूशन'
          : 'Synonyms, antonyms, idioms, and one-word substitutions',
        aliases: ['vocabulary', 'vocab', 'words', 'shabd', 'शब्दावली', 'वोकैब'],
        action: (c) => c.navigate('/candidate/learn/english/vocabulary-building'),
        confirmSpeech: isHindi
          ? 'शब्दावली अध्याय खोला जा रहा है।'
          : 'Opening Vocabulary Building topic.',
      },
      {
        id: 'back',
        number: 4,
        label: isHindi ? 'वापस पाठ्यक्रम' : 'Back to Curriculum',
        description: isHindi ? 'विषयों की मुख्य सूची पर लौटें' : 'Return to subjects menu',
        aliases: ['back', 'wapas', 'curriculum', 'वापस'],
        action: (c) => c.navigate('/candidate/learn'),
        confirmSpeech: isHindi ? 'पाठ्यक्रम पर वापस जा रहे हैं।' : 'Returning to Curriculum menu.',
      },
    ];

    const introSpeech = isHindi
      ? `अंग्रेजी भाषा पाठ्यक्रम। यहाँ 3 मुख्य अध्याय उपलब्ध हैं: ` +
        `विकल्प 1: रीडिंग कॉम्प्रिहेंशन और पैसेज। ` +
        `विकल्प 2: व्याकरण के नियम। ` +
        `विकल्प 3: शब्दावली और मुहावरे। ` +
        `खोलने के लिए विकल्प 1, विकल्प 2, या विकल्प 3 बोलें।`
      : `English Language Curriculum. Here are the 3 topics available: ` +
        `Option 1: Reading Comprehension and Passages. ` +
        `Option 2: Grammar Rules and Syntax. ` +
        `Option 3: Vocabulary Building and Idioms. ` +
        `Say Option 1 for Comprehension, Option 2 for Grammar, or Option 3 for Vocabulary.`;

    const elementsSummary = isHindi
      ? `अंग्रेजी विकल्प: 1. कॉम्प्रिहेंशन, 2. व्याकरण, 3. शब्दावली, 4. वापस।`
      : `English options: 1. Reading Comprehension, 2. Grammar Rules, 3. Vocabulary, 4. Back.`;

    return {
      id: 'learn-english',
      name: isHindi ? 'अंग्रेजी भाषा पाठ्यक्रम' : 'English Language Curriculum',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 5. GENERAL KNOWLEDGE
  // ==========================================
  if (path.startsWith('/candidate/learn/general-knowledge')) {
    const elements: SectionElement[] = [
      {
        id: 'modern-history',
        number: 1,
        label: isHindi ? 'आधुनिक इतिहास' : 'Modern History',
        description: isHindi
          ? 'भारतीय स्वतंत्रता संग्राम, संविधान और प्रमुख ऐतिहासिक आंदोलन'
          : 'Indian freedom struggle, constitutional milestones, and key historical figures',
        aliases: ['modern history', 'history', 'itihas', 'इतिहास', 'आधुनिक इतिहास'],
        action: (c) => c.navigate('/candidate/learn/general-knowledge/modern-history'),
        confirmSpeech: isHindi
          ? 'आधुनिक इतिहास अध्याय खोला जा रहा है।'
          : 'Opening Modern History topic.',
      },
      {
        id: 'indian-polity',
        number: 2,
        label: isHindi ? 'भारतीय राजव्यवस्था और संविधान' : 'Indian Polity and Constitution',
        description: isHindi
          ? 'मौलिक अधिकार, प्रस्तावना, संसद और न्यायपालिका'
          : 'Fundamental rights, preamble, parliament, and judiciary',
        aliases: ['indian polity', 'polity', 'constitution', 'samvidhan', 'संविधान', 'राजव्यवस्था', 'पॉलिटी'],
        action: (c) => c.navigate('/candidate/learn/general-knowledge/indian-polity'),
        confirmSpeech: isHindi
          ? 'भारतीय राजव्यवस्था अध्याय खोला जा रहा है।'
          : 'Opening Indian Polity topic.',
      },
      {
        id: 'physical-geography',
        number: 3,
        label: isHindi ? 'भौतिक भूगोल' : 'Physical Geography',
        description: isHindi
          ? 'भारत की नदी प्रणालियां, पर्वत श्रृंखलाएं, जलवायु और खनिज'
          : 'River systems of India, mountain ranges, climate, and minerals',
        aliases: ['physical geography', 'geography', 'bhugol', 'भूगोल'],
        action: (c) => c.navigate('/candidate/learn/general-knowledge/physical-geography'),
        confirmSpeech: isHindi
          ? 'भौतिक भूगोल अध्याय खोला जा रहा है।'
          : 'Opening Physical Geography topic.',
      },
      {
        id: 'back',
        number: 4,
        label: isHindi ? 'वापस पाठ्यक्रम' : 'Back to Curriculum',
        description: isHindi ? 'विषयों की मुख्य सूची पर लौटें' : 'Return to subjects menu',
        aliases: ['back', 'wapas', 'curriculum', 'वापस'],
        action: (c) => c.navigate('/candidate/learn'),
        confirmSpeech: isHindi ? 'पाठ्यक्रम पर वापस जा रहे हैं।' : 'Returning to Curriculum menu.',
      },
    ];

    const introSpeech = isHindi
      ? `सामान्य ज्ञान पाठ्यक्रम। यहाँ 3 मुख्य अध्याय उपलब्ध हैं: ` +
        `विकल्प 1: आधुनिक भारत का इतिहास। ` +
        `विकल्प 2: भारतीय राजव्यवस्था और संविधान। ` +
        `विकल्प 3: भौतिक भूगोल। ` +
        `खोलने के लिए विकल्प 1 इतिहास, विकल्प 2 संविधान, या विकल्प 3 भूगोल बोलें।`
      : `General Knowledge Curriculum. Here are the 3 topics available: ` +
        `Option 1: Modern History of India. ` +
        `Option 2: Indian Polity and Constitution. ` +
        `Option 3: Physical Geography. ` +
        `Say Option 1 for History, Option 2 for Polity, or Option 3 for Geography.`;

    const elementsSummary = isHindi
      ? `सामान्य ज्ञान विकल्प: 1. आधुनिक इतिहास, 2. राजव्यवस्था, 3. भूगोल, 4. वापस।`
      : `General Knowledge options: 1. Modern History, 2. Indian Polity, 3. Geography, 4. Back.`;

    return {
      id: 'learn-gk',
      name: isHindi ? 'सामान्य ज्ञान पाठ्यक्रम' : 'General Knowledge Curriculum',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 6. REASONING
  // ==========================================
  if (path.startsWith('/candidate/learn/reasoning')) {
    const elements: SectionElement[] = [
      {
        id: 'coding-decoding',
        number: 1,
        label: isHindi ? 'कोडिंग और डिकोडिंग' : 'Coding and Decoding',
        description: isHindi
          ? 'अक्षर स्थानांतरण पैटर्न, विपरीत वर्णमाला नियम और मैट्रिक्स प्रतिस्थापन'
          : 'Letter shifting patterns, reverse alphabet rules, and matrix substitution',
        aliases: ['coding and decoding', 'coding decoding', 'coding', 'कोडिंग', 'डिकोडिंग'],
        action: (c) => c.navigate('/candidate/learn/reasoning/coding-decoding'),
        confirmSpeech: isHindi
          ? 'कोडिंग और डिकोडिंग अध्याय खोला जा रहा है।'
          : 'Opening Coding and Decoding topic.',
      },
      {
        id: 'number-series',
        number: 2,
        label: isHindi ? 'संख्या श्रृंखला' : 'Number Series',
        description: isHindi
          ? 'समानांतर श्रेणी, अभाज्य वर्ग और वैकल्पिक श्रृंखला पैटर्न'
          : 'Arithmetic progressions, prime squares, and alternating series',
        aliases: ['number series', 'series', 'संख्या श्रृंखला', 'सीरीज'],
        action: (c) => c.navigate('/candidate/learn/reasoning/number-series'),
        confirmSpeech: isHindi
          ? 'संख्या श्रृंखला अध्याय खोला जा रहा है।'
          : 'Opening Number Series topic.',
      },
      {
        id: 'back',
        number: 3,
        label: isHindi ? 'वापस पाठ्यक्रम' : 'Back to Curriculum',
        description: isHindi ? 'विषयों की मुख्य सूची पर लौटें' : 'Return to subjects menu',
        aliases: ['back', 'wapas', 'curriculum', 'वापस'],
        action: (c) => c.navigate('/candidate/learn'),
        confirmSpeech: isHindi ? 'पाठ्यक्रम पर वापस जा रहे हैं।' : 'Returning to Curriculum menu.',
      },
    ];

    const introSpeech = isHindi
      ? `तार्किक क्षमता पाठ्यक्रम। यहाँ 2 मुख्य अध्याय उपलब्ध हैं: ` +
        `विकल्प 1: कोडिंग और डिकोडिंग। ` +
        `विकल्प 2: संख्या श्रृंखला और पैटर्न। ` +
        `खोलने के लिए विकल्प 1 या विकल्प 2 बोलें।`
      : `Reasoning Ability Curriculum. Here are the 2 topics available: ` +
        `Option 1: Coding and Decoding. ` +
        `Option 2: Number Series and Patterns. ` +
        `Say Option 1 for Coding-Decoding, or Option 2 for Number Series.`;

    const elementsSummary = isHindi
      ? `रीजनिंग विकल्प: 1. कोडिंग डिकोडिंग, 2. संख्या श्रृंखला, 3. वापस।`
      : `Reasoning options: 1. Coding and Decoding, 2. Number Series, 3. Back.`;

    return {
      id: 'learn-reasoning',
      name: isHindi ? 'तार्किक क्षमता पाठ्यक्रम' : 'Reasoning Ability Curriculum',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 7. LEARN INDEX (SUBJECTS)
  // ==========================================
  if (path.startsWith('/candidate/learn') || path.startsWith('/candidate/learning')) {
    const elements: SectionElement[] = [
      {
        id: 'math',
        number: 1,
        label: isHindi ? 'गणित' : 'Mathematics',
        description: isHindi
          ? 'संख्यात्मक अभियोग्यता: प्रतिशत, बीजगणित और ज्यामिति'
          : 'Quantitative aptitude including Percentages, Algebra, and Geometry',
        aliases: ['mathematics', 'maths', 'math', 'ganit', 'गणित', 'मैथ्स'],
        action: (c) => c.navigate('/candidate/learn/mathematics'),
        confirmSpeech: isHindi ? 'गणित पाठ्यक्रम खोला जा रहा है।' : 'Opening Mathematics Curriculum.',
      },
      {
        id: 'english',
        number: 2,
        label: isHindi ? 'अंग्रेजी भाषा' : 'English Language',
        description: isHindi
          ? 'रीडिंग कॉम्प्रिहेंशन, व्याकरण नियम और शब्दावली निर्माण'
          : 'Reading comprehension, grammar rules, and vocabulary building',
        aliases: ['english', 'english language', 'angreji', 'अंग्रेजी', 'इंग्लिश'],
        action: (c) => c.navigate('/candidate/learn/english'),
        confirmSpeech: isHindi
          ? 'अंग्रेजी भाषा पाठ्यक्रम खोला जा रहा है।'
          : 'Opening English Language Curriculum.',
      },
      {
        id: 'gk',
        number: 3,
        label: isHindi ? 'सामान्य ज्ञान' : 'General Knowledge',
        description: isHindi
          ? 'आधुनिक इतिहास, भारतीय राजव्यवस्था और भौतिक भूगोल'
          : 'Modern history, Indian polity, and physical geography',
        aliases: ['general knowledge', 'gk', 'current affairs', 'samanya gyan', 'सामान्य ज्ञान', 'जीके'],
        action: (c) => c.navigate('/candidate/learn/general-knowledge'),
        confirmSpeech: isHindi
          ? 'सामान्य ज्ञान पाठ्यक्रम खोला जा रहा है।'
          : 'Opening General Knowledge Curriculum.',
      },
      {
        id: 'reasoning',
        number: 4,
        label: isHindi ? 'तार्किक क्षमता' : 'Reasoning Ability',
        description: isHindi
          ? 'तार्किक तर्क: कोडिंग डिकोडिंग और संख्या श्रृंखला'
          : 'Logical reasoning including coding-decoding and number series',
        aliases: ['reasoning', 'logic', 'tarkik', 'रीजनिंग', 'तर्कशक्ति'],
        action: (c) => c.navigate('/candidate/learn/reasoning'),
        confirmSpeech: isHindi
          ? 'तार्किक क्षमता पाठ्यक्रम खोला जा रहा है।'
          : 'Opening Reasoning Ability Curriculum.',
      },
      {
        id: 'dashboard',
        number: 5,
        label: isHindi ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard',
        description: isHindi ? 'मुख्य वर्कस्पेस पर वापस जाएं' : 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu', 'डैशबोर्ड', 'होम'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: isHindi ? 'डैशबोर्ड पर वापस जा रहे हैं।' : 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech = isHindi
      ? `सीखने का पाठ्यक्रम। यहाँ 4 मुख्य विषय उपलब्ध हैं: ` +
        `विकल्प 1: गणित - प्रतिशत, बीजगणित, और ज्यामिति। ` +
        `विकल्प 2: अंग्रेजी भाषा - कॉम्प्रिहेंशन, व्याकरण, और शब्दावली। ` +
        `विकल्प 3: सामान्य ज्ञान - आधुनिक इतिहास, संविधान, और भूगोल। ` +
        `विकल्प 4: तार्किक क्षमता - कोडिंग डिकोडिंग, और संख्या श्रृंखला। ` +
        `खोलने के लिए विकल्प 1 गणित, विकल्प 2 अंग्रेजी, विकल्प 3 सामान्य ज्ञान, या विकल्प 4 रीजनिंग बोलें।`
      : `Learning Curriculum. Here are the 4 subjects available: ` +
        `Option 1: Mathematics - covering Percentages, Algebra, and Geometry. ` +
        `Option 2: English Language - covering Reading Comprehension, Grammar Rules, and Vocabulary. ` +
        `Option 3: General Knowledge - covering Modern History, Indian Polity, and Geography. ` +
        `Option 4: Reasoning Ability - covering Coding-Decoding and Number Series. ` +
        `Say Option 1 or Mathematics, Option 2 or English, Option 3 or GK, or Option 4 or Reasoning.`;

    const elementsSummary = isHindi
      ? `पाठ्यक्रम विकल्प: 1. गणित, 2. अंग्रेजी, 3. सामान्य ज्ञान, 4. रीजनिंग, 5. डैशबोर्ड।`
      : `Curriculum options: 1. Mathematics, 2. English, 3. General Knowledge, 4. Reasoning, 5. Dashboard.`;

    return {
      id: 'learn-index',
      name: isHindi ? 'सीखने का पाठ्यक्रम' : 'Learning Curriculum',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 8. PRACTICE HUB
  // ==========================================
  if (path.startsWith('/candidate/practice/history')) {
    const elements: SectionElement[] = [
      {
        id: 'new-practice',
        number: 1,
        label: isHindi ? 'नया अभ्यास सत्र शुरू करें' : 'Start New Practice Set',
        description: isHindi ? 'नया इंटरैक्टिव अभ्यास सत्र लॉन्च करें' : 'Launch a new interactive practice drill',
        aliases: ['new practice', 'practice', 'start practice', 'abhyas', 'नया अभ्यास', 'अभ्यास'],
        action: (c) => c.navigate('/candidate/practice'),
        confirmSpeech: isHindi ? 'अभ्यास केंद्र खोला जा रहा है।' : 'Opening Practice Hub.',
      },
      {
        id: 'dashboard',
        number: 2,
        label: isHindi ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard',
        description: isHindi ? 'मुख्य वर्कस्पेस पर वापस जाएं' : 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu', 'डैशबोर्ड', 'होम'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: isHindi ? 'डैशबोर्ड पर वापस जा रहे हैं।' : 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech = isHindi
      ? `अभ्यास सत्र इतिहास। यहाँ उपलब्ध विकल्प: विकल्प 1: नया अभ्यास सेट शुरू करें। विकल्प 2: डैशबोर्ड पर लौटें। विकल्प 1 या 2 बोलें।`
      : `Practice Session History. Here are your options: Option 1: Start New Practice Set. Option 2: Return to Dashboard. Say Option 1 or Option 2.`;
    const elementsSummary = isHindi
      ? `इतिहास विकल्प: 1. नया अभ्यास, 2. डैशबोर्ड।`
      : `Practice History options: 1. New Practice, 2. Dashboard.`;
    return {
      id: 'practice-history',
      name: isHindi ? 'अभ्यास इतिहास' : 'Practice History',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  if (path.startsWith('/candidate/practice')) {
    const elements: SectionElement[] = [
      {
        id: 'percentages-practice',
        number: 1,
        label: isHindi ? 'प्रतिशत और भिन्न अभ्यास सेट' : 'Percentages and Fractions Practice Set',
        description: isHindi
          ? 'गणित में प्रतिशत रूपांतरण और अनुपात के 5 त्वरित प्रश्न'
          : 'Quick 5 questions on conversion, percentage changes, and ratio problems',
        aliases: ['percentages', 'percentages practice', 'fractions', 'math practice', 'प्रतिशत अभ्यास', 'गणित अभ्यास'],
        action: (c) => c.navigate('/candidate/practice/session/demo-percentages'),
        confirmSpeech: isHindi
          ? 'प्रतिशत के 5 प्रश्न प्रारंभ कर रहे हैं।'
          : 'Starting 5 questions on Percentages.',
      },
      {
        id: 'coding-practice',
        number: 2,
        label: isHindi ? 'कोडिंग और डिकोडिंग अभ्यास सेट' : 'Coding and Decoding Practice Set',
        description: isHindi
          ? 'रीजनिंग में अक्षर स्थानांतरण और संख्या प्रतिस्थापन के 5 प्रश्न'
          : 'Quick 5 questions on letter shifting patterns and numerical substitution',
        aliases: ['coding', 'coding practice', 'coding decoding', 'reasoning practice', 'कोडिंग अभ्यास', 'रीजनिंग अभ्यास'],
        action: (c) => c.navigate('/candidate/practice/session/demo-coding-decoding'),
        confirmSpeech: isHindi
          ? 'कोडिंग और डिकोडिंग के 5 प्रश्न प्रारंभ कर रहे हैं।'
          : 'Starting 5 questions on Coding and Decoding.',
      },
      {
        id: 'current-affairs-practice',
        number: 3,
        label: isHindi ? 'समसामयिकी और रक्षा अभ्यास सेट' : 'Current Affairs and Defence Practice Set',
        description: isHindi
          ? 'सामान्य ज्ञान में राष्ट्रीय पुरस्कार, संयुक्त सैन्य अभ्यास और शिखर सम्मेलनों के 5 प्रश्न'
          : 'Quick 5 questions on national awards, joint military exercises, and summits',
        aliases: ['current affairs', 'gk practice', 'affairs', 'defence', 'करंट अफेयर्स', 'सामान्य ज्ञान अभ्यास'],
        action: (c) => c.navigate('/candidate/practice/session/demo-current-affairs'),
        confirmSpeech: isHindi
          ? 'समसामयिकी के 5 प्रश्न प्रारंभ कर रहे हैं।'
          : 'Starting 5 questions on Current Affairs.',
      },
      {
        id: 'practice-history',
        number: 4,
        label: isHindi ? 'अभ्यास सत्र इतिहास' : 'Practice Session History',
        description: isHindi
          ? 'अपने पूर्व अभ्यास सत्रों और समाधानों की समीक्षा करें'
          : 'Review your previously attempted practice sessions and solutions',
        aliases: ['practice history', 'history', 'purana abhyas', 'इतिहास', 'पिछला अभ्यास'],
        action: (c) => c.navigate('/candidate/practice/history'),
        confirmSpeech: isHindi ? 'अभ्यास इतिहास खोला जा रहा है।' : 'Opening Practice History.',
      },
      {
        id: 'dashboard',
        number: 5,
        label: isHindi ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard',
        description: isHindi ? 'मुख्य वर्कस्पेस पर वापस जाएं' : 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu', 'डैशबोर्ड', 'होम'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: isHindi ? 'डैशबोर्ड पर वापस जा रहे हैं।' : 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech = isHindi
      ? `अभ्यास केंद्र। यहाँ 4 चुनिंदा अभ्यास सेट उपलब्ध हैं: ` +
        `विकल्प 1: गणित में प्रतिशत और भिन्न के 5 त्वरित प्रश्न। ` +
        `विकल्प 2: रीजनिंग में कोडिंग और डिकोडिंग के 5 त्वरित प्रश्न। ` +
        `विकल्प 3: सामान्य ज्ञान में समसामयिकी और रक्षा के 5 प्रश्न। ` +
        `विकल्प 4: पिछला अभ्यास इतिहास देखें। ` +
        `प्रारंभ करने के लिए विकल्प 1 प्रतिशत, विकल्प 2 कोडिंग, विकल्प 3 करंट अफेयर्स, या विकल्प 4 इतिहास बोलें।`
      : `Practice Hub. Here are the 4 featured sets available right now: ` +
        `Option 1: Quick 5 Questions on Percentages and Fractions in Mathematics. ` +
        `Option 2: Quick 5 Questions on Coding and Decoding in Reasoning. ` +
        `Option 3: Quick 5 Questions on Current Affairs in General Knowledge. ` +
        `Option 4: View your Practice Session History. ` +
        `Say Option 1 for Percentages, Option 2 for Coding, Option 3 for Current Affairs, or Option 4 for History.`;

    const elementsSummary = isHindi
      ? `अभ्यास विकल्प: 1. प्रतिशत अभ्यास, 2. कोडिंग अभ्यास, 3. करंट अफेयर्स, 4. अभ्यास इतिहास, 5. डैशबोर्ड।`
      : `Practice options: 1. Percentages Practice, 2. Coding Practice, 3. Current Affairs Practice, 4. Practice History, 5. Dashboard. Say Option 1 through 5.`;

    return {
      id: 'practice-hub',
      name: isHindi ? 'अभ्यास केंद्र' : 'Interactive Practice Hub',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 9. EXAMS PORTAL
  // ==========================================
  if (path.startsWith('/candidate/exams')) {
    const elements: SectionElement[] = [
      {
        id: 'cds-mock',
        number: 1,
        label: isHindi ? 'सीडीएस आधिकारिक मॉक परीक्षा' : 'CDS Official Mock Exam',
        description: isHindi
          ? 'यूपीएससी संयुक्त रक्षा सेवा सिमुलेटेड परीक्षा - 100 अंक'
          : 'UPSC Combined Defence Services simulated examination - 100 Marks',
        aliases: ['cds', 'cds exam', 'defence exam', 'mock exam', 'सीडीएस', 'सीडीएस परीक्षा'],
        action: (c) => c.navigate('/candidate/exams/cds-mock-1/instructions'),
        confirmSpeech: isHindi
          ? 'सीडीएस आधिकारिक मॉक परीक्षा निर्देश खोले जा रहे हैं।'
          : 'Opening CDS Official Mock Exam instructions.',
      },
      {
        id: 'ssc-exam',
        number: 2,
        label: isHindi ? 'एसएससी सीजीएल टियर 1 परीक्षा' : 'SSC CGL Tier 1 Practice Exam',
        description: isHindi
          ? 'कर्मचारी चयन आयोग टियर 1 अभ्यास परीक्षा - 200 अंक'
          : 'Staff Selection Commission Tier 1 comprehensive test - 200 Marks',
        aliases: ['ssc', 'ssc exam', 'cgl exam', 'ssc cgl', 'एसएससी', 'एसएससी परीक्षा'],
        action: (c) => c.navigate('/candidate/exams/ssc-tier1/instructions'),
        confirmSpeech: isHindi
          ? 'एसएससी टियर 1 परीक्षा निर्देश खोले जा रहे हैं।'
          : 'Opening SSC Tier 1 Practice Exam instructions.',
      },
      {
        id: 'dashboard',
        number: 3,
        label: isHindi ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard',
        description: isHindi ? 'मुख्य वर्कस्पेस पर वापस जाएं' : 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu', 'डैशबोर्ड', 'होम'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: isHindi ? 'डैशबोर्ड पर वापस जा रहे हैं।' : 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech = isHindi
      ? `आधिकारिक परीक्षा पोर्टल। आपकी निर्धारित परीक्षाएं उपलब्ध हैं: ` +
        `विकल्प 1: संयुक्त रक्षा सेवा सीडीएस आधिकारिक मॉक परीक्षा - 100 अंक। ` +
        `विकल्प 2: एसएससी सीजीएल टियर 1 अभ्यास परीक्षा - 200 अंक। ` +
        `शुरू करने के लिए विकल्प 1 या विकल्प 2 बोलें, अथवा डैशबोर्ड पर लौटने के लिए डैशबोर्ड बोलें।`
      : `Official Examinations Portal. Here are your scheduled examinations: ` +
        `Option 1: Combined Defence Services (CDS) Official Mock Exam - 100 Marks. ` +
        `Option 2: SSC Combined Graduate Level Tier 1 Practice Exam - 200 Marks. ` +
        `Say Option 1 or CDS Exam, Option 2 or SSC Exam, or say Dashboard to return.`;

    const elementsSummary = isHindi
      ? `परीक्षाएं: 1. सीडीएस मॉक परीक्षा, 2. एसएससी अभ्यास परीक्षा, 3. डैशबोर्ड। विकल्प 1, 2, या 3 कहें।`
      : `Exams options: 1. CDS Mock Exam, 2. SSC Practice Exam, 3. Dashboard. Say Option 1, 2, or 3.`;

    return {
      id: 'exams-portal',
      name: isHindi ? 'आधिकारिक परीक्षा पोर्टल' : 'Official Examinations Portal',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 10. MOCK TESTS
  // ==========================================
  if (path.startsWith('/candidate/mock-tests')) {
    const elements: SectionElement[] = [
      {
        id: 'full-mock',
        number: 1,
        label: isHindi ? 'पूर्ण लंबाई सीडीएस मॉक टेस्ट 1' : 'Full-Length CDS Mock Test 1',
        description: isHindi
          ? '100 प्रश्न समयबद्ध मॉक टेस्ट सिमुलेशन'
          : '100 questions timed simulation with audio proctoring',
        aliases: ['full mock', 'full test', 'cds mock', 'पूर्ण मॉक', 'सीडीएस टेस्ट'],
        action: (c) => c.navigate('/candidate/exams/cds-mock-1/instructions'),
        confirmSpeech: isHindi ? 'पूर्ण मॉक टेस्ट 1 प्रारंभ कर रहे हैं।' : 'Launching Full Length Mock Test 1.',
      },
      {
        id: 'math-drill',
        number: 2,
        label: isHindi ? 'गणित गति अभ्यास टेस्ट' : 'Mathematics Speed Drill',
        description: isHindi
          ? '30 प्रश्न समयबद्ध गणित गति अभ्यास'
          : '30 questions timed quantitative aptitude speed test',
        aliases: ['math drill', 'math mock', 'speed drill', 'गणित टेस्ट'],
        action: (c) => c.navigate('/candidate/practice/session/demo-percentages'),
        confirmSpeech: isHindi ? 'गणित गति टेस्ट प्रारंभ कर रहे हैं।' : 'Launching Mathematics Speed Drill.',
      },
      {
        id: 'english-drill',
        number: 3,
        label: isHindi ? 'अंग्रेजी समझ टेस्ट' : 'English Comprehension Drill',
        description: isHindi
          ? '30 प्रश्न अंग्रेजी समझ और शब्दावली टेस्ट'
          : '30 questions reading comprehension and vocabulary drill',
        aliases: ['english drill', 'english mock', 'comprehension drill', 'अंग्रेजी टेस्ट'],
        action: (c) => c.navigate('/candidate/practice/session/demo-reading-comprehension'),
        confirmSpeech: isHindi ? 'अंग्रेजी समझ टेस्ट प्रारंभ कर रहे हैं।' : 'Launching English Comprehension Drill.',
      },
      {
        id: 'dashboard',
        number: 4,
        label: isHindi ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard',
        description: isHindi ? 'मुख्य वर्कस्पेस पर वापस जाएं' : 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu', 'डैशबोर्ड', 'होम'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: isHindi ? 'डैशबोर्ड पर वापस जा रहे हैं।' : 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech = isHindi
      ? `मॉक टेस्ट पोर्टल। यहाँ 3 उपलब्ध टेस्ट हैं: ` +
        `विकल्प 1: पूर्ण लंबाई सीडीएस मॉक टेस्ट 1। ` +
        `विकल्प 2: गणित गति अभ्यास टेस्ट। ` +
        `विकल्प 3: अंग्रेजी समझ टेस्ट। ` +
        `चुनने के लिए विकल्प 1, विकल्प 2, या विकल्प 3 बोलें।`
      : `Mock Tests Portal. Here are your 3 available tests: ` +
        `Option 1: Full-Length CDS Mock Test 1. ` +
        `Option 2: Mathematics Speed Drill. ` +
        `Option 3: English Comprehension Drill. ` +
        `Say Option 1 for Full Mock, Option 2 for Math Drill, or Option 3 for English Drill.`;

    const elementsSummary = isHindi
      ? `मॉक टेस्ट: 1. सीडीएस मॉक, 2. गणित टेस्ट, 3. अंग्रेजी टेस्ट, 4. डैशबोर्ड।`
      : `Mock Tests options: 1. Full CDS Mock, 2. Mathematics Speed Drill, 3. English Comprehension Drill, 4. Dashboard.`;

    return {
      id: 'mock-tests',
      name: isHindi ? 'मॉक टेस्ट पोर्टल' : 'Mock Tests Portal',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 11. RESULTS AND ANALYTICS
  // ==========================================
  if (path.startsWith('/candidate/results')) {
    const elements: SectionElement[] = [
      {
        id: 'score-summary',
        number: 1,
        label: isHindi ? 'संपूर्ण स्कोरकार्ड विवरण सुनें' : 'Read Complete Scorecard Summary',
        description: isHindi
          ? 'कुल अंक, हल किए गए प्रश्न और सटीकता दर का ऑडियो विवरण'
          : 'Spoken summary of total score, attempted questions, and accuracy',
        aliases: ['scorecard', 'score summary', 'my score', 'read summary', 'parinam', 'स्कोर', 'स्कोरकार्ड', 'परिणाम'],
        action: (c) =>
          c.speak(
            isHindi
              ? 'कुल स्कोर: 78 प्रतिशत। कुल हल किए गए प्रश्न: 48। सही उत्तर: 38। गलत उत्तर: 10। समग्र सटीकता दर: 79 प्रतिशत। पर्सेंटाइल: 84वां पर्सेंटाइल।'
              : 'Overall Score: 78 percent. Total Questions Attempted: 48. Correct Answers: 38. Incorrect: 10. Accuracy Rate: 79 percent. Percentile: 84th percentile.'
          ),
        confirmSpeech: isHindi ? 'स्कोरकार्ड विवरण सुना रहे हैं।' : 'Reading Scorecard Summary.',
      },
      {
        id: 'subject-breakdown',
        number: 2,
        label: isHindi ? 'विषयवार सटीकता विवरण सुनें' : 'Read Subject-wise Accuracy Breakdown',
        description: isHindi
          ? 'गणित, अंग्रेजी, सामान्य ज्ञान और रीजनिंग में प्रदर्शन दर'
          : 'Performance statistics across Math, English, GK, and Reasoning',
        aliases: ['subject breakdown', 'accuracy', 'subject scores', 'breakdown', 'विषयवार', 'सटीकता दर'],
        action: (c) =>
          c.speak(
            isHindi
              ? 'विषयवार सटीकता विवरण: गणित: 85 प्रतिशत। तार्किक क्षमता: 90 प्रतिशत। अंग्रेजी भाषा: 78 प्रतिशत। सामान्य ज्ञान: 65 प्रतिशत।'
              : 'Subject-wise Performance Breakdown: Mathematics: 85 percent accuracy. Reasoning Ability: 90 percent accuracy. English Language: 78 percent accuracy. General Knowledge: 65 percent accuracy.'
          ),
        confirmSpeech: isHindi ? 'विषयवार विवरण सुना रहे हैं।' : 'Reading Subject-wise Breakdown.',
      },
      {
        id: 'practice-weak',
        number: 3,
        label: isHindi ? 'कमजोर विषयों का अभ्यास करें' : 'Practice Weak Topics',
        description: isHindi
          ? 'सामान्य ज्ञान और प्रतिशत पर लक्षित अभ्यास सत्र शुरू करें'
          : 'Launch targeted practice on General Knowledge and Percentages',
        aliases: ['practice weak', 'weak areas', 'weak topics', 'kamzor vishay', 'कमजोर विषय'],
        action: (c) => c.navigate('/candidate/practice/session/demo-percentages'),
        confirmSpeech: isHindi ? 'कमजोर विषयों का अभ्यास प्रारंभ कर रहे हैं।' : 'Launching practice for weak topics.',
      },
      {
        id: 'dashboard',
        number: 4,
        label: isHindi ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard',
        description: isHindi ? 'मुख्य वर्कस्पेस पर वापस जाएं' : 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu', 'डैशबोर्ड', 'होम'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: isHindi ? 'डैशबोर्ड पर वापस जा रहे हैं।' : 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech = isHindi
      ? `परिणाम और विश्लेषण पोर्टल। यहाँ 4 उपलब्ध क्रियाएं हैं: ` +
        `विकल्प 1: संपूर्ण स्कोरकार्ड विवरण सुनें। ` +
        `विकल्प 2: विषयवार सटीकता विवरण सुनें। ` +
        `विकल्प 3: कमजोर विषयों का अभ्यास करें। ` +
        `विकल्प 4: डैशबोर्ड पर लौटें। ` +
        `स्कोर सुनने के लिए विकल्प 1, सटीकता के लिए विकल्प 2 बोलें।`
      : `Results and Analytics Portal. Here are your 4 available actions: ` +
        `Option 1: Read Complete Scorecard Summary. ` +
        `Option 2: Read Subject-wise Accuracy Breakdown. ` +
        `Option 3: Practice Weak Topics. ` +
        `Option 4: Return to Dashboard. ` +
        `Say Option 1 to hear your scores, Option 2 for breakdown, or Option 3 to practice weak topics.`;

    const elementsSummary = isHindi
      ? `परिणाम विकल्प: 1. स्कोरकार्ड विवरण, 2. विषयवार विवरण, 3. कमजोर विषय अभ्यास, 4. डैशबोर्ड।`
      : `Results options: 1. Read Scorecard, 2. Subject Breakdown, 3. Practice Weak Topics, 4. Dashboard.`;

    return {
      id: 'results',
      name: isHindi ? 'परिणाम और विश्लेषण' : 'Results and Analytics',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 12. PROGRESS AND MASTERY
  // ==========================================
  if (path.startsWith('/candidate/progress')) {
    const elements: SectionElement[] = [
      {
        id: 'study-streak',
        number: 1,
        label: isHindi ? 'अध्ययन स्ट्रीक सुनें' : 'Read Study Streak',
        description: isHindi
          ? 'लगातार 7 दिन की सक्रियता और कुल अध्ययन घंटे'
          : '7-day consecutive activity streak and total hours logged',
        aliases: ['study streak', 'streak', 'study hours', 'स्ट्रीक', 'घंटे'],
        action: (c) =>
          c.speak(
            isHindi
              ? 'अध्ययन स्ट्रीक: लगातार 7 दिनों से सक्रिय। 12 सत्रों में कुल 14 घंटे और 30 मिनट का अध्ययन समय दर्ज किया गया।'
              : 'Study Streak: 7 consecutive days active. Total study time logged: 14 hours and 30 minutes across 12 sessions.'
          ),
        confirmSpeech: isHindi ? 'अध्ययन स्ट्रीक सुना रहे हैं।' : 'Reading Study Streak.',
      },
      {
        id: 'mastery',
        number: 2,
        label: isHindi ? 'विषयवार महारत प्रतिशत सुनें' : 'Read Topic Mastery Levels',
        description: isHindi
          ? 'प्रतिशत, बीजगणित और कोडिंग में निपुणता दर'
          : 'Mastery percentages for Percentages, Algebra, and Coding',
        aliases: ['mastery', 'topic mastery', 'proficiency', 'महारत', 'निपुणता'],
        action: (c) =>
          c.speak(
            isHindi
              ? 'विषयवार महारत: प्रतिशत: 85 प्रतिशत। कोडिंग और डिकोडिंग: 92 प्रतिशत। आधुनिक इतिहास: 70 प्रतिशत।'
              : 'Topic Mastery: Percentages: 85 percent mastered. Coding and Decoding: 92 percent mastered. Modern History: 70 percent mastered.'
          ),
        confirmSpeech: isHindi ? 'विषयवार महारत सुना रहे हैं।' : 'Reading Topic Mastery.',
      },
      {
        id: 'recent-activity',
        number: 3,
        label: isHindi ? 'हालिया गतिविधि समीक्षा करें' : 'Review Recent Activity',
        description: isHindi ? 'आपके हाल के टेस्ट और अभ्यासों का लॉग' : 'Log of your latest tests and drills',
        aliases: ['recent activity', 'activity', 'timeline', 'गतिविधि'],
        action: (c) =>
          c.speak(
            isHindi
              ? 'हालिया गतिविधि: आज दोपहर 2 बजे, आपने प्रतिशत के 10 प्रश्न पूरे किए। कल शाम 6 बजे, आपने सीडीएस मॉक टेस्ट पूरा किया।'
              : 'Recent Activity: Today at 2 PM, you completed 10 Percentages practice questions. Yesterday at 6 PM, you completed CDS Mock test 1.'
          ),
        confirmSpeech: isHindi ? 'हालिया गतिविधि सुना रहे हैं।' : 'Reading Recent Activity.',
      },
      {
        id: 'dashboard',
        number: 4,
        label: isHindi ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard',
        description: isHindi ? 'मुख्य वर्कस्पेस पर वापस जाएं' : 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu', 'डैशबोर्ड', 'होम'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: isHindi ? 'डैशबोर्ड पर वापस जा रहे हैं।' : 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech = isHindi
      ? `प्रगति और महारत ट्रैकिंग। यहाँ 4 उपलब्ध क्रियाएं हैं: ` +
        `विकल्प 1: अध्ययन स्ट्रीक और कुल घंटे सुनें। ` +
        `विकल्प 2: विषयवार महारत प्रतिशत सुनें। ` +
        `विकल्प 3: हालिया गतिविधि टाइमलाइन सुनें। ` +
        `विकल्प 4: डैशबोर्ड पर लौटें। ` +
        `विकल्प 1, 2, 3, या 4 बोलें।`
      : `Progress and Mastery Tracking. Here are your 4 available actions: ` +
        `Option 1: Read Study Streak and total hours. ` +
        `Option 2: Read Topic Mastery levels. ` +
        `Option 3: Review Recent Activity Timeline. ` +
        `Option 4: Return to Dashboard. ` +
        `Say Option 1, Option 2, Option 3, or Option 4.`;

    const elementsSummary = isHindi
      ? `प्रगति विकल्प: 1. अध्ययन स्ट्रीक, 2. विषय महारत, 3. हालिया गतिविधि, 4. डैशबोर्ड।`
      : `Progress options: 1. Study Streak, 2. Topic Mastery, 3. Recent Activity, 4. Dashboard.`;

    return {
      id: 'progress',
      name: isHindi ? 'प्रगति और महारत' : 'Progress and Mastery',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 13. SETTINGS
  // ==========================================
  if (path.startsWith('/candidate/settings')) {
    const elements: SectionElement[] = [
      {
        id: 'toggle-contrast',
        number: 1,
        label: isHindi ? 'हाई कंट्रास्ट AAA मोड टॉगल करें' : 'Toggle High Contrast AAA Mode',
        description: isHindi
          ? 'मानक थीम और उच्च दृश्य कंट्रास्ट (ब्लैक और एम्बर) के बीच स्विच करें'
          : 'Switch between standard theme and maximum contrast black-and-amber theme',
        aliases: ['high contrast', 'contrast', 'toggle contrast', 'black and yellow', 'हाई कंट्रास्ट', 'कंट्रास्ट'],
        action: (c) => {
          if (c.setHighContrast && c.preferences) {
            const next = !c.preferences.highContrast;
            c.setHighContrast(next);
            c.speak(
              next
                ? isHindi
                  ? 'हाई कंट्रास्ट मोड सक्रिय कर दिया गया है।'
                  : 'High Contrast AAA mode enabled.'
                : isHindi
                ? 'मानक दृश्य कंट्रास्ट रीसेट कर दिया गया है।'
                : 'Standard contrast restored.'
            );
          }
        },
        confirmSpeech: isHindi ? 'कंट्रास्ट मोड बदला जा रहा है।' : 'Toggling High Contrast Mode.',
      },
      {
        id: 'increase-font',
        number: 2,
        label: isHindi ? 'टेक्स्ट साइज बड़ा करें' : 'Increase Text Size',
        description: isHindi
          ? 'बेहतर पठनीयता के लिए फॉन्ट साइज 125% तक बड़ा करें'
          : 'Scale fonts up to Extra Large (125%) for enhanced readability',
        aliases: ['increase text', 'large text', 'bigger font', 'bada text', 'बड़ा टेक्स्ट', 'फॉन्ट बढ़ाएं'],
        action: (c) => {
          if (c.setFontSize) {
            c.setFontSize('xl');
            c.speak(isHindi ? 'टेक्स्ट साइज बड़ा कर दिया गया है।' : 'Text size scaled up to Extra Large.');
          }
        },
        confirmSpeech: isHindi ? 'टेक्स्ट साइज बड़ा किया गया।' : 'Text size increased.',
      },
      {
        id: 'normal-font',
        number: 3,
        label: isHindi ? 'सामान्य टेक्स्ट साइज रीसेट करें' : 'Reset Text Size to Normal',
        description: isHindi ? 'मानक 100% फॉन्ट साइज रीसेट करें' : 'Restore default 100% font sizing',
        aliases: ['normal text', 'default font', 'reset font', 'standard font', 'सामान्य टेक्स्ट', 'नॉर्मल फॉन्ट'],
        action: (c) => {
          if (c.setFontSize) {
            c.setFontSize('default');
            c.speak(isHindi ? 'सामान्य टेक्स्ट साइज रीसेट कर दिया गया है।' : 'Text size reset to default.');
          }
        },
        confirmSpeech: isHindi ? 'सामान्य टेक्स्ट साइज रीसेट हुआ।' : 'Default text size restored.',
      },
      {
        id: 'toggle-voice',
        number: 4,
        label: isHindi ? 'वॉइस असिस्टेंट टॉगल करें' : 'Toggle Voice Assistant',
        description: isHindi
          ? 'माइक्रोफ़ोन लिसनिंग चालू या बंद करें (Alt+V)'
          : 'Pause or resume background speech recognition (Alt+V)',
        aliases: ['toggle voice', 'pause voice', 'stop voice', 'वॉइस बंद', 'माइक बंद'],
        action: (c) => {
          if (c.toggleListening) c.toggleListening();
        },
        confirmSpeech: isHindi ? 'वॉइस असिस्टेंट टॉगल किया जा रहा है।' : 'Toggling Voice Assistant.',
      },
      {
        id: 'dashboard',
        number: 5,
        label: isHindi ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard',
        description: isHindi ? 'मुख्य वर्कस्पेस पर वापस जाएं' : 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu', 'डैशबोर्ड', 'होम'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: isHindi ? 'डैशबोर्ड पर वापस जा रहे हैं।' : 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech = isHindi
      ? `एक्सेसिबिलिटी सेटिंग्स। यहाँ 5 उपलब्ध क्रियाएं हैं: ` +
        `विकल्प 1: हाई कंट्रास्ट दृश्य मोड टॉगल करें। ` +
        `विकल्प 2: टेक्स्ट साइज बड़ा करें। ` +
        `विकल्प 3: सामान्य टेक्स्ट साइज रीसेट करें। ` +
        `विकल्प 4: वॉइस असिस्टेंट चालू या बंद करें। ` +
        `विकल्प 5: डैशबोर्ड पर लौटें। ` +
        `विकल्प 1, 2, या डैशबोर्ड बोलें।`
      : `Sensory Accessibility Settings. Here are your 5 available actions: ` +
        `Option 1: Toggle High Contrast AAA Visual Mode. ` +
        `Option 2: Increase Text Size to Extra Large. ` +
        `Option 3: Reset Text Size to Normal. ` +
        `Option 4: Toggle Voice Assistant Listening. ` +
        `Option 5: Return to Dashboard. ` +
        `Say Option 1 or High Contrast, Option 2 or Increase Text, or say Dashboard.`;

    const elementsSummary = isHindi
      ? `सेटिंग्स विकल्प: 1. हाई कंट्रास्ट, 2. बड़ा टेक्स्ट, 3. सामान्य टेक्स्ट, 4. वॉइस टॉगल, 5. डैशबोर्ड।`
      : `Settings options: 1. Toggle High Contrast, 2. Increase Text, 3. Reset Text, 4. Toggle Voice, 5. Dashboard.`;

    return {
      id: 'settings',
      name: isHindi ? 'एक्सेसिबिलिटी सेटिंग्स' : 'Accessibility Settings',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 14. HELP AND GUIDES
  // ==========================================
  if (path.startsWith('/candidate/help')) {
    const elements: SectionElement[] = [
      {
        id: 'commands-cheatsheet',
        number: 1,
        label: isHindi ? 'वॉइस कमांड सूची सुनें' : 'Read Voice Commands Cheatsheet',
        description: isHindi
          ? 'नेविगेट करने के लिए सभी वॉइस कमांड की सूची सुनें'
          : 'Spoken list of all available voice navigation triggers',
        aliases: ['commands', 'voice commands', 'cheatsheet', 'command list', 'कमांड्स', 'वॉइस कमांड'],
        action: (c) => {
          if (c.speakAvailableCommands) c.speakAvailableCommands();
        },
        confirmSpeech: isHindi ? 'वॉइस कमांड सूची सुना रहे हैं।' : 'Reading Voice Commands.',
      },
      {
        id: 'keyboard-shortcuts',
        number: 2,
        label: isHindi ? 'कीबोर्ड शॉर्टकट कुंजियां सुनें' : 'Read Keyboard Hotkeys',
        description: isHindi
          ? 'Alt+V और Alt+G सहित त्वरित शॉर्टकट कुंजियां सुनें'
          : 'Quick access keyboard combinations including Alt+V and Alt+G',
        aliases: ['keyboard shortcuts', 'shortcuts', 'hotkeys', 'शॉर्टकट', 'कुंजियां'],
        action: (c) =>
          c.speak(
            isHindi
              ? 'कीबोर्ड शॉर्टकट: Alt प्लस V वॉइस असिस्टेंट को चालू या बंद करता है। Alt प्लस G सक्रिय पृष्ठ के सभी विकल्पों को समझाता है। Alt प्लस D डैशबोर्ड खोलता है। Alt प्लस L पाठ्यक्रम खोलता है। Alt प्लस P अभ्यास केंद्र खोलता है।'
              : 'Keyboard shortcuts: Alt plus V toggles voice assistant. Alt plus G speaks page guidance and options. Alt plus D opens Dashboard. Alt plus L opens Learn. Alt plus P opens Practice.'
          ),
        confirmSpeech: isHindi ? 'कीबोर्ड शॉर्टकट सुना रहे हैं।' : 'Reading Keyboard Shortcuts.',
      },
      {
        id: 'dashboard',
        number: 3,
        label: isHindi ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard',
        description: isHindi ? 'मुख्य वर्कस्पेस पर वापस जाएं' : 'Go back to Candidate Workspace',
        aliases: ['dashboard', 'home', 'main menu', 'डैशबोर्ड', 'होम'],
        action: (c) => c.navigate('/candidate/dashboard'),
        confirmSpeech: isHindi ? 'डैशबोर्ड पर वापस जा रहे हैं।' : 'Returning to Candidate Dashboard.',
      },
    ];

    const introSpeech = isHindi
      ? `सहायता और मार्गदर्शन। यहाँ 3 उपलब्ध क्रियाएं हैं: ` +
        `विकल्प 1: सभी वॉइस कमांड की सूची सुनें। ` +
        `विकल्प 2: कीबोर्ड शॉर्टकट कुंजियां सुनें। ` +
        `विकल्प 3: डैशबोर्ड पर लौटें। ` +
        `कमांड्स सुनने के लिए विकल्प 1, शॉर्टकट के लिए विकल्प 2 बोलें।`
      : `Help and Guides. Here are your 3 available actions: ` +
        `Option 1: Read all voice navigation commands. ` +
        `Option 2: Read keyboard shortcuts. ` +
        `Option 3: Return to Dashboard. ` +
        `Say Option 1 for commands, Option 2 for hotkeys, or Option 3 for Dashboard.`;

    const elementsSummary = isHindi
      ? `सहायता विकल्प: 1. वॉइस कमांड्स, 2. कीबोर्ड शॉर्टकट, 3. डैशबोर्ड।`
      : `Help options: 1. Voice Commands, 2. Keyboard Shortcuts, 3. Return to Dashboard.`;

    return {
      id: 'help',
      name: isHindi ? 'सहायता और मार्गदर्शन' : 'Help and Guides',
      introSpeech,
      elementsSummary,
      elements,
    };
  }

  // ==========================================
  // 15. DEFAULT FALLBACK
  // ==========================================
  const defaultElements: SectionElement[] = [
    {
      id: 'dashboard',
      number: 1,
      label: isHindi ? 'डैशबोर्ड' : 'Candidate Dashboard',
      description: isHindi ? 'मुख्य वर्कस्पेस' : 'Main workspace overview',
      aliases: ['dashboard', 'home', 'डैशबोर्ड', 'होम'],
      action: (c) => c.navigate('/candidate/dashboard'),
      confirmSpeech: isHindi ? 'डैशबोर्ड खोला जा रहा है।' : 'Opening Dashboard.',
    },
    {
      id: 'learn',
      number: 2,
      label: isHindi ? 'पाठ्यक्रम सीखें' : 'Learning Curriculum',
      description: isHindi ? 'विषय और अध्याय' : 'Subjects and topics',
      aliases: ['learn', 'curriculum', 'सीखें', 'पाठ्यक्रम'],
      action: (c) => c.navigate('/candidate/learn'),
      confirmSpeech: isHindi ? 'पाठ्यक्रम खोला जा रहा है।' : 'Opening Learning Curriculum.',
    },
    {
      id: 'practice',
      number: 3,
      label: isHindi ? 'अभ्यास केंद्र' : 'Practice Hub',
      description: isHindi ? 'अभ्यास प्रश्न' : 'Practice questions',
      aliases: ['practice', 'अभ्यास'],
      action: (c) => c.navigate('/candidate/practice'),
      confirmSpeech: isHindi ? 'अभ्यास केंद्र खोला जा रहा है।' : 'Opening Practice Hub.',
    },
    {
      id: 'help',
      number: 4,
      label: isHindi ? 'सहायता' : 'Help and Guides',
      description: isHindi ? 'वॉइस कमांड और शॉर्टकट' : 'Voice commands and shortcuts',
      aliases: ['help', 'commands', 'मदद', 'सहायता'],
      action: (c) => c.navigate('/candidate/help'),
      confirmSpeech: isHindi ? 'सहायता खोली जा रही है।' : 'Opening Help.',
    },
  ];

  return {
    id: 'candidate-workspace',
    name: isHindi ? 'अभ्यर्थी वर्कस्पेस' : 'Candidate Workspace',
    introSpeech: isHindi
      ? `अभ्यर्थी वर्कस्पेस। डैशबोर्ड के लिए विकल्प 1, सीखने के लिए विकल्प 2, अभ्यास के लिए विकल्प 3, या सहायता के लिए विकल्प 4 बोलें।`
      : `Candidate Workspace. Say Option 1 for Dashboard, Option 2 for Learn, Option 3 for Practice, or Option 4 for Help.`,
    elementsSummary: isHindi
      ? `विकल्प: 1. डैशबोर्ड, 2. सीखें, 3. अभ्यास, 4. सहायता।`
      : `Options: 1. Dashboard, 2. Learn, 3. Practice, 4. Help.`,
    elements: defaultElements,
  };
}
