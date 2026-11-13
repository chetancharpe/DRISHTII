/**
 * translator.ts
 *
 * Dedicated bidirectional English <-> Hindi speech and announcement translator
 * for DRISHTI. Ensures that whenever a candidate prefers Hindi or selects Hindi,
 * all system voice prompts, announcements, navigation feedbacks, and section
 * orientations are spoken in natural, clear, polite Hindi without dropping into English.
 */

const EXACT_MAP: Record<string, string> = {
  // Navigation & Sections
  // Dashboard Elements & Telemetry
  'Independent Examination Portal': 'स्वतंत्र परीक्षा पोर्टल',
  'Ready to continue your preparation? Your next practice session is ready below.': 'अपनी तैयारी जारी रखने के लिए तैयार हैं? आपका अगला अभ्यास सत्र नीचे उपलब्ध है।',
  'Next Recommended Step': 'अनुशंसित अगला कदम',
  'Preparation Overview': 'तैयारी का अवलोकन',
  'Updated in real-time as you practice': 'अभ्यास के साथ स्वतः अपडेट होता है',
  'Overall Progress': 'कुल प्रगति',
  'Questions Practiced': 'हल किए गए प्रश्न',
  'Total questions attempted across all topics': 'सभी विषयों में हल किए गए कुल प्रश्न',
  '+32 questions this week': 'इस सप्ताह +32 प्रश्न',
  'Mock Tests': 'मॉक टेस्ट',
  'Full-length timed simulated exams': 'पूर्ण समयबद्ध सिमुलेटेड परीक्षाएं',
  'Next scheduled test in 4 days': 'अगला टेस्ट 4 दिन में',
  'Today\'s Goal': 'आज का लक्ष्य',
  'Questions': 'प्रश्न',
  'Practice Time': 'अध्ययन समय',
  'Topics': 'विषय',
  'Quick Actions': 'त्वरित विकल्प',
  'Explore Curriculum': 'पाठ्यक्रम देखें',
  'Practice Hub': 'अभ्यास केंद्र',
  'Mock Tests Portal': 'मॉक टेस्ट पोर्टल',
  'Official Exams': 'आधिकारिक परीक्षाएं',
  'Scorecards & Analysis': 'स्कोरकार्ड और विश्लेषण',
  'Accessibility Calibration': 'सुलभता सेटिंग्स',
  'Current Study Topic': 'वर्तमान अध्ययन विषय',
  'Recommended Topic': 'अनुशंसित विषय',
  'Start Learning: Quantitative Aptitude & Reasoning': 'पढ़ाई शुरू करें: गणित और रीजनिंग',
  'Continue Learning': 'पढ़ाई जारी रखें',
  'Start Learning': 'पढ़ाई शुरू करें',
  'Adaptive Practice': 'अनुकूली अभ्यास',
  'Targeted Question Practice': 'लक्षित प्रश्न अभ्यास',
  'Practice questions tailored with full audio explanations': 'ऑडियो व्याख्या के साथ लक्षित प्रश्न अभ्यास',
  'Start Practice': 'अभ्यास शुरू करें',
  'Exam Simulation': 'परीक्षा सिमुलेशन',
  'Timed Mock Tests': 'समयबद्ध मॉक टेस्ट',
  'Open Mock Tests': 'मॉक टेस्ट खोलें',
  'Official Examination': 'आधिकारिक परीक्षा',
  'Official Scheduled Exams': 'आधिकारिक निर्धारित परीक्षाएं',
  'View Examinations': 'परीक्षाएं देखें',
  'Progress Analytics': 'प्रगति और विश्लेषण',
  'View Progress': 'प्रगति देखें',
  'View All Practice': 'सभी अभ्यास देखें',
  'Continue your preparation': 'अपनी तैयारी जारी रखें',
  'Start your preparation': 'अपनी तैयारी शुरू करें',
  'First Diagnostic Practice Set': 'पहला नैदानिक अभ्यास सेट',
  'Offline Preview / Local Telemetry Mode': 'ऑफ़लाइन पूर्वावलोकन / स्थानीय टेलीमेट्री मोड',
  'Retry Server Connection': 'सर्वर से पुनः कनेक्ट करें',
  'Simplified High-Focus Mode Active': 'सरल हाई-फोकस मोड सक्रिय',
  'Change in Settings': 'सेटिंग्स में बदलें',
  'Candidate Dashboard': 'कैंडिडेट डैशबोर्ड',
  'Opening Candidate Dashboard.': 'कैंडिडेट डैशबोर्ड खोला जा रहा है।',
  'Returning to Candidate Dashboard.': 'कैंडिडेट डैशबोर्ड पर वापस जा रहे हैं।',
  'Opening Learning Curriculum.': 'पाठ्यक्रम और विषय खोले जा रहे हैं।',
  'Opening Learn curriculum.': 'पाठ्यक्रम और विषय खोले जा रहे हैं।',
  'Returning to Learning Curriculum.': 'पाठ्यक्रम पर वापस जा रहे हैं।',
  'Returning to Mathematics Curriculum.': 'गणित पाठ्यक्रम पर वापस जा रहे हैं।',
  'Returning to Reasoning Curriculum.': 'रीजनिंग पाठ्यक्रम पर वापस जा रहे हैं।',
  'Opening Practice Hub.': 'अभ्यास केंद्र खोला जा रहा है।',
  'Starting Practice Session.': 'अभ्यास सत्र शुरू किया जा रहा है।',
  'Starting practice session.': 'अभ्यास सत्र शुरू किया जा रहा है।',
  'Opening Official Mock Tests Portal.': 'मॉक टेस्ट पोर्टल खोला जा रहा है।',
  'Opening Mock Tests Portal.': 'मॉक टेस्ट पोर्टल खोला जा रहा है।',
  'Returning to Mock Tests catalog.': 'मॉक टेस्ट सूची पर वापस जा रहे हैं।',
  'Opening Mock Test Instructions.': 'मॉक टेस्ट के निर्देश खोले जा रहे हैं।',
  'Opening Mock Test Attempt History.': 'मॉक टेस्ट प्रयास इतिहास खोला जा रहा है।',
  'Opening Scheduled Examinations Portal.': 'आधिकारिक परीक्षा पोर्टल खोला जा रहा है।',
  'Opening Official Examinations Portal.': 'आधिकारिक परीक्षा पोर्टल खोला जा रहा है।',
  'Opening Results and Analytics.': 'परिणाम और स्कोरकार्ड खोले जा रहे हैं।',
  'Opening Sensory Accessibility Settings.': 'सुलभता सेटिंग्स खोली जा रही हैं।',
  'Opening Accessibility Settings.': 'सुलभता सेटिंग्स खोली जा रही हैं।',
  'Opening Accessibility Calibration Wizard.': 'सुलभता कैलिब्रेशन विजार्ड खोला जा रहा है।',
  'Entering exam verification room for Demo Examination.': 'डेमो परीक्षा सत्यापन कक्ष में प्रवेश कर रहे हैं।',

  // Curriculum Subjects & Topics
  'Opening Mathematics Curriculum.': 'गणित पाठ्यक्रम खोला जा रहा है।',
  'Opening Mathematics curriculum.': 'गणित पाठ्यक्रम खोला जा रहा है।',
  'Opening English Language Curriculum.': 'अंग्रेजी भाषा पाठ्यक्रम खोला जा रहा है।',
  'Opening English curriculum.': 'अंग्रेजी पाठ्यक्रम खोला जा रहा है।',
  'Opening General Knowledge Curriculum.': 'सामान्य ज्ञान पाठ्यक्रम खोला जा रहा है।',
  'Opening General Knowledge curriculum.': 'सामान्य ज्ञान पाठ्यक्रम खोला जा रहा है।',
  'Opening Reasoning Ability Curriculum.': 'रीजनिंग पाठ्यक्रम खोला जा रहा है।',
  'Opening Reasoning curriculum.': 'रीजनिंग पाठ्यक्रम खोला जा रहा है।',
  'Opening Percentages study topic.': 'प्रतिशत का अध्याय खोला जा रहा है।',
  'Opening Algebra study topic.': 'बीजगणित का अध्याय खोला जा रहा है।',
  'Opening Geometry study topic.': 'ज्यामिति का अध्याय खोला जा रहा है।',
  'Opening Coding and Decoding study topic.': 'कोडिंग और डिकोडिंग का अध्याय खोला जा रहा है।',
  'Opening Geometry topic in Mathematics.': 'गणित में ज्यामिति का अध्याय खोला जा रहा है।',
  'Opening Reading Comprehension topic in English.': 'अंग्रेजी में रीडिंग कॉम्प्रिहेंशन का अध्याय खोला जा रहा है।',
  'Opening Grammar Rules topic in English.': 'अंग्रेजी में ग्रामर रूल्स का अध्याय खोला जा रहा है।',
  'Opening Vocabulary Building topic in English.': 'अंग्रेजी में वोकैबुलरी का अध्याय खोला जा रहा है।',
  'Opening Modern History topic in General Knowledge.': 'सामान्य ज्ञान में आधुनिक इतिहास खोला जा रहा है।',
  'Opening Indian Polity topic in General Knowledge.': 'सामान्य ज्ञान में भारतीय राजव्यवस्था खोली जा रही है।',
  'Opening Physical Geography topic in General Knowledge.': 'सामान्य ज्ञान में भूगोल खोला जा रहा है।',
  'Opening Coding and Decoding topic in Reasoning.': 'रीजनिंग में कोडिंग-डिकोडिंग खोली जा रही है।',
  'Opening Number Series topic in Reasoning.': 'रीजनिंग में नंबर सीरीज खोली जा रही है।',

  // Subject Mocks
  'Opening Elementary Mathematics Subject Mock Test. Loading question one.':
    'प्रारंभिक गणित मॉक टेस्ट शुरू किया जा रहा है। पहला प्रश्न लोड हो रहा है।',
  'Opening English Language Mock Test. Loading question one.':
    'अंग्रेजी भाषा मॉक टेस्ट शुरू किया जा रहा है। पहला प्रश्न लोड हो रहा है।',
  'Opening General Knowledge and Defense Subject Mock Test. Loading question one.':
    'सामान्य ज्ञान और रक्षा मॉक टेस्ट शुरू किया जा रहा है। पहला प्रश्न लोड हो रहा है।',
  'Opening Reasoning Ability Subject Mock Test. Loading question one.':
    'रीजनिंग मॉक टेस्ट शुरू किया जा रहा है। पहला प्रश्न लोड हो रहा है।',
  'Starting Elementary Mathematics Mock Test. Loading questions.':
    'प्रारंभिक गणित मॉक टेस्ट शुरू किया जा रहा है।',
  'Starting English Language Mock Test. Loading questions.':
    'अंग्रेजी भाषा मॉक टेस्ट शुरू किया जा रहा है।',
  'Starting General Knowledge and Defense Mock Test. Loading questions.':
    'सामान्य ज्ञान और रक्षा मॉक टेस्ट शुरू किया जा रहा है।',
  'Starting Reasoning Ability Mock Test. Loading questions.':
    'रीजनिंग मॉक टेस्ट शुरू किया जा रहा है।',

  // Practice & Questions
  'Next question.': 'अगला प्रश्न।',
  'Previous question.': 'पिछला प्रश्न।',
  'Reading question statement and choices.': 'प्रश्न और विकल्पों को पढ़ा जा रहा है।',
  'Reading question and options.': 'प्रश्न और विकल्पों को पढ़ा जा रहा है।',
  'Reading question statement.': 'प्रश्न पढ़ा जा रहा है।',
  'Option A selected.': 'विकल्प ए चुना गया।',
  'Option B selected.': 'विकल्प बी चुना गया।',
  'Option C selected.': 'विकल्प सी चुना गया।',
  'Option D selected.': 'विकल्प डी चुना गया।',
  'Selected Option A.': 'विकल्प ए चुना गया।',
  'Selected Option B.': 'विकल्प बी चुना गया।',
  'Selected Option C.': 'विकल्प सी चुना गया।',
  'Selected Option D.': 'विकल्प डी चुना गया।',
  'Selecting Option A.': 'विकल्प ए चुना जा रहा है।',
  'Selecting Option B.': 'विकल्प बी चुना जा रहा है।',
  'Selecting Option C.': 'विकल्प सी चुना जा रहा है।',
  'Selecting Option D.': 'विकल्प डी चुना जा रहा है।',
  'Submitting practice session.': 'अभ्यास सत्र सबमिट किया जा रहा है।',
  'Opening submission confirmation dialog.': 'सबमिशन पुष्टि का संवाद खोला जा रहा है।',
  'Starting 5 questions on Percentages.': 'प्रतिशत पर 5 प्रश्न शुरू किए जा रहे हैं।',
  'Starting Coding and Decoding Practice.': 'कोडिंग और डिकोडिंग अभ्यास शुरू किया जा रहा है।',
  'Starting Algebra Practice.': 'बीजगणित अभ्यास शुरू किया जा रहा है।',
  'Starting Geometry Practice.': 'ज्यामिति अभ्यास शुरू किया जा रहा है।',
  'Closed.': 'बंद किया गया।',
  'Dialog closed.': 'संवाद बॉक्स बंद किया गया।',

  // Voice Assistant Status
  'Voice assistant active. Say Learn, Practice, or Dashboard.':
    'दृष्टि वॉयस असिस्टेंट सक्रिय है। आप पढ़ाई, अभ्यास, या डैशबोर्ड बोल सकते हैं।',
  'Voice assistant paused. Press Alt plus V to resume listening.':
    'वॉयस असिस्टेंट रोक दिया गया है। पुनः चालू करने के लिए ऑल्ट और वी दबाएं।',
  'Speech muted.': 'आवाज़ शांत कर दी गई है।',
  'Reading voice commands list.': 'उपलब्ध वॉयस कमांड्स की सूची पढ़ी जा रही है।',
  'Language changed to English. Screen and voice prompts are now in English.':
    'भाषा बदलकर अंग्रेजी कर दी गई है।',
  'Language changed to English.': 'भाषा बदलकर अंग्रेजी कर दी गई है।',
  'Language changed to Hindi.': 'भाषा बदलकर हिन्दी कर दी गई है। अब सभी स्क्रीन और आवाज़ हिन्दी में हैं।',

  // Accessibility Settings
  'High contrast mode enabled.': 'हाई कंट्रास्ट मोड चालू किया गया।',
  'High contrast mode disabled.': 'हाई कंट्रास्ट मोड बंद किया गया।',
  'Text size increased to large.': 'टेक्स्ट का आकार बड़ा किया गया।',
  'Text size increased to extra-large.': 'टेक्स्ट का आकार बहुत बड़ा किया गया।',
  'Text size reset to default.': 'टेक्स्ट का आकार सामान्य कर दिया गया।',
  'Text size scale set to maximum.': 'टेक्स्ट का आकार अधिकतम कर दिया गया।',
  'Audio assistance enabled.': 'ऑडियो सहायता चालू की गई।',
  'Audio assistance disabled.': 'ऑडियो सहायता बंद की गई।',
  'Screen reader optimization mode enabled.': 'स्क्रीन रीडर मोड चालू किया गया।',
  'Standard mode restored.': 'सामान्य मोड बहाल किया गया।',
  'Keyboard-first navigation mode enabled.': 'कीबोर्ड-प्रथम नेविगेशन चालू किया गया।',
  'Standard navigation restored.': 'सामान्य नेविगेशन बहाल किया गया।',

  // Authentication & Assistance
  'Signing you out of Drishti.': 'दृष्टि से साइन आउट किया जा रहा है।',
  'Signing in as Candidate. Loading workspace.': 'कैंडिडेट के रूप में लॉगिन किया जा रहा है।',
  'Registering new Candidate account.': 'नया कैंडिडेट अकाउंट बनाया जा रहा है।',
  'Please say: Email followed by your email address.': 'कृपया अपना ईमेल पता बोलें।',
  'Please say: Password followed by your password.': 'कृपया अपना पासवर्ड बोलें।',
  'Please say: Name followed by your full name.': 'कृपया अपना पूरा नाम बोलें।',
  'Submitting sign in credentials.': 'लॉगिन क्रेडेंशियल सत्यापित किए जा रहे हैं।',
  'Assistance request registered.': 'सहायता का अनुरोध दर्ज कर लिया गया है।',
  'Invalid key. Please select an available option.': 'अमान्य बटन। कृपया उपलब्ध विकल्पों में से चुनें।',
  'Profile and language preferences saved successfully.': 'प्रोफ़ाइल और भाषा प्राथमिकता सहेज ली गई है।',

  // Shortcuts
  'Keyboard shortcuts: Alt plus V toggles voice assistant. Alt plus G speaks page guidance and options. Alt plus D opens Dashboard. Alt plus L opens Learn. Alt plus P opens Practice.':
    'कीबोर्ड शॉर्टकट: ऑल्ट और वी से वॉयस असिस्टेंट, ऑल्ट और जी से पेज निर्देश, ऑल्ट और डी से डैशबोर्ड, ऑल्ट और एल से पढ़ाई, ऑल्ट और पी से अभ्यास।',
};

/**
 * Translates an English system prompt, confirmation, or navigation speech to natural Hindi.
 * If text already contains Devanagari characters, returns it untouched.
 */
export function translateToHindi(text: string): string {
  if (!text || !text.trim()) return text;

  // Already in Devanagari
  if (/[\u0900-\u097F]/.test(text)) {
    return text;
  }

  const clean = text.trim();

  // 1. Direct dictionary match
  if (EXACT_MAP[clean]) {
    return EXACT_MAP[clean];
  }

  // Also check without trailing punctuation
  const stripped = clean.replace(/[.]+$/, '');
  if (EXACT_MAP[stripped + '.']) {
    return EXACT_MAP[stripped + '.'];
  }
  if (EXACT_MAP[stripped]) {
    return EXACT_MAP[stripped];
  }

  // 2. Dynamic regex pattern matching
  // Pattern: "Welcome to Candidate Dashboard..."
  if (/^Welcome to Candidate Dashboard/i.test(clean)) {
    return 'कैंडिडेट डैशबोर्ड का पूरा विवरण। आपकी समग्र तैयारी 78 प्रतिशत पूर्ण है और 7 दिन का दैनिक अध्ययन सिलसिला सक्रिय है। आज का लक्ष्य: 45 में से 30 मिनट पूर्ण। अभ्यास जारी रखने के लिए विकल्प 1 बोलें, या पाठ्यक्रम के लिए विकल्प 2 बोलें।';
  }

  // Pattern: "Good morning/afternoon/evening, Name"
  if (/^Good (morning|afternoon|evening)/i.test(clean)) {
    const timeMatch = clean.match(/^Good (morning|afternoon|evening)[,]?\s*(.*)$/i);
    const greeting = timeMatch?.[1].toLowerCase() === 'morning' ? 'शुभ प्रभात' : timeMatch?.[1].toLowerCase() === 'afternoon' ? 'शुभ दोपहर' : 'शुभ संध्या';
    const candidate = timeMatch?.[2]?.trim();
    return candidate ? `${greeting}, ${candidate}।` : `${greeting}।`;
  }
  // Pattern: "Selected Option X: Label"
  const optLabelMatch = clean.match(/^Selected Option (\d+)[:]?\s*(.+)$/i);
  if (optLabelMatch) {
    return `विकल्प ${optLabelMatch[1]} चुना गया: ${optLabelMatch[2]}`;
  }

  // Pattern: "Option X selected."
  const optSelectedMatch = clean.match(/^(?:Selected )?Option ([A-D1-7]) selected\.?$/i);
  if (optSelectedMatch) {
    return `विकल्प ${optSelectedMatch[1]} चुना गया।`;
  }

  // Pattern: "Selecting Option X."
  const optSelectingMatch = clean.match(/^Selecting Option ([A-D1-7])\.?$/i);
  if (optSelectingMatch) {
    return `विकल्प ${optSelectingMatch[1]} चुना जा रहा है।`;
  }

  // Pattern: "Question X of Y: Statement..."
  const qMatch = clean.match(/^Question (\d+) of (\d+)[:.]?\s*(.*)$/i);
  if (qMatch) {
    return `प्रश्न ${qMatch[1]} कुल ${qMatch[2]} में से। ${qMatch[3]}`;
  }

  // Pattern: "Launching X Practice questions/session."
  const launchMatch = clean.match(/^Launching (.+) Practice (?:session|questions)\.?$/i);
  if (launchMatch) {
    return `${launchMatch[1]} अभ्यास शुरू किया जा रहा है।`;
  }

  // Pattern: "Reading concept notes for X."
  const conceptMatch = clean.match(/^Reading Concept Notes for (.+)\.?$/i);
  if (conceptMatch) {
    return `${conceptMatch[1]} के नोट्स पढ़े जा रहे हैं।`;
  }

  // Pattern: "Opening X."
  const openMatch = clean.match(/^Opening (.+)\.?$/i);
  if (openMatch) {
    return `${openMatch[1]} खोला जा रहा है।`;
  }

  // Pattern: "Navigating to X."
  const navMatch = clean.match(/^Navigating to (.+)\.?$/i);
  if (navMatch) {
    return `${navMatch[1]} पर जा रहे हैं।`;
  }

  // Fallback: If no match is found, return original text
  return text;
}

