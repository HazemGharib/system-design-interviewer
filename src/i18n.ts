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
} as const;

export function t(key: keyof typeof UI_STRINGS, lang: Lang): string {
  return UI_STRINGS[key][lang];
}

export function localizedText(text: { ar: string; en: string }, lang: Lang): string {
  return text[lang];
}
