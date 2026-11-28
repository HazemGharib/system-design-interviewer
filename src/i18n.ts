import type { Lang } from './types';

export const UI_STRINGS = {
  appTitle: { ar: 'تمرين مقابلة System Design', en: 'System Design Interview Practice' },
  appShortTitle: { ar: 'سيستم ديزاين', en: 'System Design' },
  appTagline: { ar: 'تمرين مقابلات لمهندسين ومبرمجين', en: 'Interview practice for engineers and developers' },
  appDescription: {
    ar: 'اتدرّب على تصميم الأنظمة خطوة بخطوة، واكشف النقط بعد ما تجاوب، وقيّم مستواك في الآخر.',
    en: 'Practice system design step by step, reveal the key points after you answer, and assess your level at the end.'
  },
  chooseScenario: { ar: 'اختار السيناريو', en: 'Choose a Scenario' },
  chooseScenarioDesc: {
    ar: 'اختار مسألة من المسائل التالية، كل واحدة بمستوى صعوبة ووقت مقدر.',
    en: 'Choose one of the following problems, each with its own difficulty level and estimated time.'
  },
  difficulty: { ar: 'الصعوبة', en: 'Difficulty' },
  estimatedTime: { ar: 'الوقت المقدر', en: 'Estimated Time' },
  startScenario: { ar: 'ابدأ', en: 'Start' },
  backToScenarios: { ar: 'ارجع للمسائل', en: 'Back to Scenarios' },
  problem: { ar: 'المسألة', en: 'The Problem' },
  timer: { ar: 'الميقات', en: 'Timer' },
  timerOptional: { ar: 'اختياري، 45 دقيقة للمقابلة كلها', en: 'Optional, 45 minutes for the whole interview' },
  startTimer: { ar: 'ابدأ الميقات', en: 'Start Timer' },
  pauseTimer: { ar: 'وقّف', en: 'Pause' },
  resumeTimer: { ar: 'كمّل', en: 'Resume' },
  resetTimer: { ar: 'صفّر الميقات', en: 'Reset Timer' },
  stageOf: { ar: 'المرحلة', en: 'Stage' },
  of: { ar: 'من', en: 'of' },
  writeAnswerPlaceholder: { ar: 'اكتب إجابتك هنا…', en: 'Write your answer here…' },
  revealPoints: { ar: 'اكشف نقط الإجابة القوية', en: 'Reveal Strong Answer Points' },
  hidePoints: { ar: 'خبّي النقط', en: 'Hide Points' },
  checklistInstruction: {
    ar: 'علّم كل نقطة غطّيتها في كلامك. القائمة دي مرجعية، مش لازم تبقى زي الإجابة حرف بحرف.',
    en: 'Check each point you covered in your answer. This is a reference list, not a word-for-word answer.'
  },
  coveredPoints: { ar: 'غطّيت', en: 'Covered' },
  pointsInStage: { ar: 'نقط في المرحلة دي', en: 'points in this stage' },
  previous: { ar: 'السابق', en: 'Previous' },
  next: { ar: 'اللي بعده', en: 'Next' },
  viewResults: { ar: 'شوف النتيجة', en: 'View Results' },
  results: { ar: 'النتيجة', en: 'Results' },
  yourAssessment: { ar: 'تقييمك', en: 'Your Assessment' },
  total: { ar: 'المجموع', en: 'Total' },
  percentage: { ar: 'النسبة', en: 'Percentage' },
  markedStages: { ar: 'مراحل معلّمة', en: 'Marked Stages' },
  writtenStages: { ar: 'مراحل مكتوبة', en: 'Written Stages' },
  strongAnswerPoints: { ar: 'نقط الإجابة القوية', en: 'Strong answer points' },
  stage: { ar: 'المرحلة', en: 'Stage' },
  points: { ar: 'النقط', en: 'Points' },
  ratio: { ar: 'النسبة', en: 'Ratio' },
  backToLastStage: { ar: 'ارجع لآخر مرحلة', en: 'Back to Last Stage' },
  startOver: { ar: 'ابدأ من جديد', en: 'Start Over' },
  confirmReset: { ar: 'أيوه، امسح كل حاجة', en: 'Yes, Clear Everything' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  resetWarning: {
    ar: 'هتمسح الإجابات والعلامات والميقات، ومش هتقدر ترجّعهم بعد كده.',
    en: 'This will delete your answers, marks, and timer. You cannot undo this.'
  },
  answerFirstTip: { ar: 'جاوب الأول', en: 'Answer First' },
  answerFirstDesc: {
    ar: 'اكتب إجابتك في كل مرحلة قبل ما تكشف النقط. بعد الكشف، علّم اللي غطّيته عشان تقيّم نفسك. الإجابات بتتحفظ في المتصفح. الميقات اختياري: 45 دقيقة للمقابلة كلها، ابدأه لما تكون جاهز.',
    en: 'Write your answer in each stage before revealing the points. After revealing, check what you covered to assess yourself. Answers are saved in the browser. The timer is optional: 45 minutes for the whole interview, start it when ready.'
  },
  noPointsMarked: {
    ar: 'لسه معلّمتش نقط. اكشف النقط في كل مرحلة وعلّم اللي غطّيته، وبعدين ارجع هنا.',
    en: 'No points marked yet. Reveal points in each stage, mark what you covered, then come back here.'
  },
  strongAssessment: {
    ar: 'تقييم قوي. غطّيت معظم النقط اللي الإنترفيور بيكون مستنّيها.',
    en: 'Strong assessment. You covered most of the points an interviewer would expect.'
  },
  goodStart: {
    ar: 'بداية كويسة. راجع المراحل اللي نسبتها أقل، وحاول تكمّل النقط الناقصة.',
    en: 'Good start. Review stages with lower scores and try to cover the missing points.'
  },
  keepGoing: {
    ar: 'كمّل التمرين وارجع للمراحل الناقصة. التقييم بيتحسّن كل ما تعلّم نقط أكتر بعد ما تجاوب.',
    en: 'Continue the exercise and review missing stages. Your assessment improves as you mark more points after answering.'
  },
  goToTop: { ar: 'رجوع لفوق', en: 'Go to Top' },
  whyItMatters: { ar: 'ليه مهم', en: 'Why It Matters' },
  howItWorks: { ar: 'إزاي بيشتغل', en: 'How It Works' },
  tradeoffs: { ar: 'الـ Trade-offs', en: 'Trade-offs' },
  examples: { ar: 'أمثلة وأرقام', en: 'Examples & Numbers' },
  commonMistakes: { ar: 'أخطاء شائعة', en: 'Common Mistakes' },
  architectureDiagram: { ar: 'الرسم التخطيطي للأركيتكتشر', en: 'Architecture Diagram' },
  level: { ar: 'المستوى', en: 'Level' },
  senior: { ar: 'سينيور', en: 'Senior' },
  staff: { ar: 'ستاف', en: 'Staff' },
  staffDescription: {
    ar: 'أسئلة إضافية عن التكلفة، الـ DR، الأمان، النمو 10x، والنضج التشغيلي',
    en: 'Extra questions on cost, DR, security, 10x growth, and operational maturity'
  },
  jumpToStage: { ar: 'انتقل بين المراحل', en: 'Jump to Stage' },
  expandDetails: { ar: 'تفاصيل أكتر', en: 'More Details' },
  collapseDetails: { ar: 'إخفاء التفاصيل', en: 'Hide Details' },

  // Drawing board
  drawingBoard: { ar: 'لوحة رسم الأركيتكتشر', en: 'Architecture Drawing Board' },
  drawingHint: {
    ar: 'اختَر مكوّنًا ثم اضغط على اللوحة لوضعه. استخدم توصيل، الحاويات، والتكبير. اضغط مطوّل للتحديد.',
    en: 'Pick a component, then tap the canvas to place it. Use Connect, containers, and zoom. Long-press to select.'
  },
  palette: { ar: 'المكوّنات', en: 'Components' },
  paletteRecent: { ar: 'الأخيرة', en: 'Recent' },
  paletteMore: { ar: 'المزيد', en: 'More' },
  paletteSearch: { ar: 'ابحث عن مكوّن…', en: 'Search components…' },
  paletteArmed: { ar: 'جاهز للوضع — اضغط على اللوحة', en: 'Armed — tap the canvas to place' },
  toolSelect: { ar: 'تحديد', en: 'Select' },
  toolConnect: { ar: 'توصيل', en: 'Connect' },
  toolContainer: { ar: 'حاوية', en: 'Container' },
  toolDelete: { ar: 'حذف', en: 'Delete' },
  toolUndo: { ar: 'تراجع', en: 'Undo' },
  toolRedo: { ar: 'إعادة', en: 'Redo' },
  toolZoomIn: { ar: 'تكبير', en: 'Zoom in' },
  toolZoomOut: { ar: 'تصغير', en: 'Zoom out' },
  toolFit: { ar: 'ملاءمة', en: 'Fit' },
  edgeLabel: { ar: 'تسمية الوصلة', en: 'Connector label' },
  edgeDirection: { ar: 'اتجاه السهم', en: 'Arrow direction' },
  containerLabel: { ar: 'اسم الحاوية', en: 'Container label' },
  defaultContainerLabel: { ar: 'Region', en: 'Region' },
  connectMode: { ar: 'توصيل', en: 'Connect' },
  deleteSelected: { ar: 'احذف المحدد', en: 'Delete selected' },
  clearBoard: { ar: 'امسح اللوحة', en: 'Clear board' },
  compareDesign: { ar: 'قارن بالتصميم المقترح', en: 'Compare with proposed design' },
  yourDrawing: { ar: 'رسمك', en: 'Your drawing' },
  proposedDesign: { ar: 'التصميم المقترح', en: 'Proposed design' },
  matchedComponents: { ar: 'مكوّنات موجودة', en: 'Matched components' },
  missedComponents: { ar: 'مكوّنات ناقصة', en: 'Missed components' },
  matchedEdges: { ar: 'وصلات صحيحة', en: 'Matched connections' },
  missedEdges: { ar: 'وصلات ناقصة', en: 'Missed connections' },
  drawingScore: { ar: 'درجة الرسم', en: 'Drawing score' },
  collapsePalette: { ar: 'طي القائمة', en: 'Collapse palette' },
  expandPalette: { ar: 'توسيع القائمة', en: 'Expand palette' },
  closeSheet: { ar: 'إغلاق', en: 'Close' },
  startFromTemplate: { ar: 'ابدأ من قالب', en: 'Start from template' },
  templateGeneric: { ar: 'قوالب عامة', en: 'Generic templates' },
  templateScenario: { ar: 'بداية هذا السيناريو', en: 'Scenario starter' },
  templateReplaceConfirm: {
    ar: 'اللوحة مش فاضية. استبدال الرسم الحالي بالقالب؟',
    en: 'The board is not empty. Replace the current drawing with this template?',
  },

  // Scenario picker
  searchScenarios: { ar: 'ابحث في المسائل…', en: 'Search scenarios…' },
  filterAll: { ar: 'الكل', en: 'All' },
  filterEasy: { ar: 'سهل', en: 'Easy' },
  filterMedium: { ar: 'متوسط', en: 'Medium' },
  filterHard: { ar: 'صعب', en: 'Hard' },
  noScenariosMatch: { ar: 'مفيش مسائل مطابقة.', en: 'No matching scenarios.' },

  // Solution walkthrough
  walkthroughControls: { ar: 'تحكم العرض', en: 'Walkthrough controls' },
  walkthroughFlow: { ar: 'المسار', en: 'Flow' },
  walkthroughPlay: { ar: 'تشغيل', en: 'Play' },
  walkthroughPause: { ar: 'إيقاف', en: 'Pause' },
  walkthroughPrev: { ar: 'السابق', en: 'Previous step' },
  walkthroughNext: { ar: 'التالي', en: 'Next step' },
  walkthroughSpeed: { ar: 'السرعة', en: 'Speed' },
  walkthroughScrubber: { ar: 'شريط الخطوات', en: 'Step scrubber' },
  walkthroughStep: { ar: 'خطوة', en: 'Step' },
  walkthroughNoDrawing: {
    ar: 'مفيش رسم مرجعي للسيناريو ده.',
    en: 'No reference drawing for this scenario.',
  },

  // Capacity calculator
  capacityCalculator: { ar: 'حاسبة تقدير السعة', en: 'Capacity Estimation Calculator' },
  capacityHint: {
    ar: 'ادخل تقديراتك. استخدم المساعدات لو حابب، بعدين اضغط تحقق.',
    en: 'Enter your estimates. Use helpers if you want, then press Check.'
  },
  capacityHintAuto: {
    ar: 'اكتب أرقام المسألة والافتراضات، وبعدين اضغط تحقق. القيم المشتقة بتتحسب لوحدها.',
    en: 'Enter problem numbers and assumptions, then tap Check. Derived values compute live.'
  },
  capacityHintPractice: {
    ar: 'اكتب تقديراتك للقيم المشتقة، بعدين اضغط تحقق. تقدر تستخدم نفس المدخلات لو حابب.',
    en: 'Type your estimates for derived values, then press Check. You can use the same inputs if you want.'
  },
  capacityMode: { ar: 'وضع الحاسبة', en: 'Calculator mode' },
  capacityModeAuto: { ar: 'تلقائي', en: 'Auto' },
  capacityModePractice: { ar: 'تمرين', en: 'Practice' },
  capacityVariables: { ar: 'المدخلات', en: 'Inputs' },
  capacityAssumptions: { ar: 'افتراضات قابلة للتعديل', en: 'Editable assumptions' },
  capacityDerived: { ar: 'قيم محسوبة', en: 'Derived values' },
  capacityClear: { ar: 'مسح', en: 'Clear' },
  capacityCheckInputs: { ar: 'تحقق من المدخلات', en: 'Check inputs' },
  capacityFeedbackGood: { ar: '✓ صح', en: '✓ Correct' },
  capacityFeedbackOk: { ar: '~ مقبول', en: '~ Acceptable' },
  capacityFeedbackMissing: { ar: '✗ فاضي — اكتب الرقم من المسألة', en: '✗ Missing — enter the number from the problem' },
  capacityFeedbackInputOff: {
    ar: '✗ راجع نص المسألة (الوحدة: {unit})',
    en: '✗ Check the problem statement (unit: {unit})',
  },
  capacityFeedbackAssumptionOff: {
    ar: '✗ خارج النطاق المعتاد',
    en: '✗ Outside the typical range',
  },
  capacityAutoSummary: {
    ar: 'المدخلات: {inputsOk}/{inputsTotal} صح · الافتراضات: {assumptionsOk}/{assumptionsTotal} معقولة',
    en: 'Inputs: {inputsOk}/{inputsTotal} correct · Assumptions: {assumptionsOk}/{assumptionsTotal} reasonable',
  },
  helpers: { ar: 'مدخلات مساعدة', en: 'Helper inputs' },
  yourEstimates: { ar: 'تقديراتك', en: 'Your estimates' },
  checkEstimates: { ar: 'تحقق', en: 'Check' },
  referenceValue: { ar: 'المرجع', en: 'Reference' },
  verdictGood: { ar: 'كويس (خلال ×2)', en: 'Good (within 2×)' },
  verdictOk: { ar: 'مقبول (نفس الـ order)', en: 'OK (same order)' },
  verdictOff: { ar: 'بعيد', en: 'Off' },
  workedSteps: { ar: 'الحسبة خطوة بخطوة', en: 'Worked calculation steps' },

  // Chaos mode
  chaosMode: { ar: 'وضع الفوضى (Chaos)', en: 'Chaos Mode' },
  chaosModeDesc: {
    ar: 'خلال الجلسة هتظهر حوادث مفاجئة. جاوب بسرعة وقيّم نفسك.',
    en: 'Surprise incidents appear during the session. Answer quickly and self-score.'
  },
  enableChaos: { ar: 'تفعيل Chaos Mode', en: 'Enable Chaos Mode' },
  disableChaos: { ar: 'إيقاف Chaos Mode', en: 'Disable Chaos Mode' },
  chaosIncident: { ar: 'حادثة مفاجئة!', en: 'Surprise incident!' },
  chaosRespond: { ar: 'إزاي هتتعامل؟', en: 'How would you respond?' },
  chaosSubmit: { ar: 'سلّم الرد', en: 'Submit response' },
  chaosReveal: { ar: 'اكشف الرد المتوقع', en: 'Reveal expected response' },
  chaosTimeLeft: { ar: 'الوقت المتبقي', en: 'Time left' },
  chaosTimedOut: { ar: 'الوقت خلص — سلّم اللي كتبتُه', en: 'Time is up — submit what you wrote' },
  chaosScoreHint: { ar: 'علّم النقط اللي غطّيتها في ردك', en: 'Check the points you covered in your response' },

  // Trade-off cards
  tradeoffCards: { ar: 'كروت الـ Trade-offs', en: 'Trade-off Cards' },
  tradeoffHint: {
    ar: 'اختار خيار واكتب تبرير في سطر، بعدين اكشف اللي الإنترفيور مستنيه.',
    en: 'Pick an option, write a one-line justification, then reveal what the interviewer expects.'
  },
  yourChoice: { ar: 'اختيارك', en: 'Your choice' },
  justification: { ar: 'التبرير (سطر واحد)', en: 'Justification (one line)' },
  revealTradeoff: { ar: 'اكشف التقييم', en: 'Reveal evaluation' },
  interviewerExpects: { ar: 'الإنترفيور مستني', en: 'Interviewer expects' },
  pros: { ar: 'المميزات', en: 'Pros' },
  cons: { ar: 'العيوب', en: 'Cons' },
  whenOtherWins: { ar: 'امتى الخيار التاني يفوز', en: 'When the other option wins' },
  iGotThis: { ar: 'غطّيت النقطة دي', en: 'I covered this' },
  tradeoffCardOf: { ar: 'كارت', en: 'Card' },

  // Radar
  radarReport: { ar: 'تقرير الرادار', en: 'Radar Report' },
  strengths: { ar: 'نقاط قوة', en: 'Strengths' },
  weaknesses: { ar: 'نقاط ضعف', en: 'Weaknesses' },
  attemptHistory: { ar: 'سجل المحاولات', en: 'Attempt history' },
  saveAttempt: { ar: 'احفظ المحاولة دي', en: 'Save this attempt' },
  previousAttempt: { ar: 'محاولة سابقة', en: 'Previous attempt' },
  noHistory: { ar: 'مفيش محاولات محفوظة لسه.', en: 'No saved attempts yet.' },
  overallScore: { ar: 'النتيجة الكلية', en: 'Overall score' },
  interactiveExtras: { ar: 'أدوات تفاعلية', en: 'Interactive tools' },
} as const;

export function t(key: keyof typeof UI_STRINGS, lang: Lang): string {
  return UI_STRINGS[key][lang];
}

export function tf(
  key: keyof typeof UI_STRINGS,
  lang: Lang,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    t(key, lang),
  );
}

export function localizedText(text: { ar: string; en: string }, lang: Lang): string {
  return text[lang];
}
