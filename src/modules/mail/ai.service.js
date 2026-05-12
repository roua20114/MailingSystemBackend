/**
 * AI Service — Simulates OCR, summarization, and department suggestion.
 * In production, replace these with real AI/ML API calls (OpenAI, AWS Textract, etc.)
 */

const DEPARTMENT_POOL = [
  'Human Resources',
  'Finance & Accounting',
  'Legal Affairs',
  'IT & Systems',
  'Academic Affairs',
  'Student Services',
  'Research & Development',
  'Operations',
  'External Relations',
  'Procurement',
];

const SUMMARY_TEMPLATES = [
  (subject, sender) =>
    `This correspondence from ${sender} concerns "${subject}". The matter requires prompt attention and appropriate departmental action.`,
  (subject, sender) =>
    `Received from ${sender}, this mail addresses "${subject}". Review and routing to the relevant department is recommended.`,
  (subject, sender) =>
    `Communication from ${sender} regarding "${subject}". The content has been analyzed and action is pending review by the Director.`,
];

/**
 * Simulates OCR metadata extraction from uploaded PDFs.
 */
const extractMetadata = (mailData) => {
  const keywords = mailData.subject.toLowerCase();
  let detectedPriority = 'Medium';

  if (/urgent|immediate|emergency|critical/.test(keywords)) detectedPriority = 'Urgent';
  else if (/high|important|priority/.test(keywords)) detectedPriority = 'High';
  else if (/low|minor|routine/.test(keywords)) detectedPriority = 'Low';

  return {
    detectedPriority,
    detectedType: mailData.type,
    wordCount: mailData.description ? mailData.description.split(' ').length : 0,
    hasAttachment: !!mailData.pdfUrl,
  };
};

/**
 * Generates a 2-sentence AI summary of the mail.
 */
const generateSummary = (mailData) => {
  const templateFn = SUMMARY_TEMPLATES[Math.floor(Math.random() * SUMMARY_TEMPLATES.length)];
  return templateFn(mailData.subject, mailData.sender);
};

/**
 * Suggests a department based on subject keywords with a confidence score.
 */
const suggestDepartment = (mailData) => {
  const subject = mailData.subject.toLowerCase();
  const description = (mailData.description || '').toLowerCase();
  const text = `${subject} ${description}`;

  const keywordMap = {
    'Human Resources': ['hr', 'employee', 'recruitment', 'payroll', 'leave', 'staff', 'personnel'],
    'Finance & Accounting': ['invoice', 'payment', 'budget', 'finance', 'accounting', 'expense', 'audit'],
    'Legal Affairs': ['contract', 'legal', 'agreement', 'lawsuit', 'compliance', 'regulation'],
    'IT & Systems': ['software', 'hardware', 'network', 'server', 'system', 'security', 'database', 'it'],
    'Academic Affairs': ['course', 'curriculum', 'exam', 'grade', 'academic', 'professor', 'lecture'],
    'Student Services': ['student', 'enrollment', 'scholarship', 'admission', 'campus'],
    Procurement: ['purchase', 'order', 'supplier', 'vendor', 'procurement', 'supply'],
    'Research & Development': ['research', 'development', 'innovation', 'project', 'study'],
    Operations: ['operations', 'logistics', 'maintenance', 'facility', 'infrastructure'],
    'External Relations': ['partner', 'external', 'collaboration', 'media', 'public', 'press'],
  };

  let bestMatch = null;
  let bestScore = 0;

  for (const [dept, keywords] of Object.entries(keywordMap)) {
    const matches = keywords.filter((kw) => text.includes(kw)).length;
    const score = matches / keywords.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = dept;
    }
  }

  if (!bestMatch) {
    bestMatch = DEPARTMENT_POOL[Math.floor(Math.random() * DEPARTMENT_POOL.length)];
    bestScore = 0.3 + Math.random() * 0.2;
  } else {
    bestScore = Math.min(0.95, bestScore + 0.4 + Math.random() * 0.2);
  }

  return {
    suggestedDepartment: bestMatch,
    confidenceScore: parseFloat(bestScore.toFixed(2)),
  };
};

/**
 * Calculates SLA deadline from category maxProcessingTime.
 */
const calculateSlaDeadline = (categoryMaxDays, globalTimeoutDays = 30) => {
  const days = categoryMaxDays || globalTimeoutDays;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return deadline;
};

/**
 * Full AI processing pipeline for a new mail.
 */
const processNewMail = (mailData, categoryMaxDays, globalTimeoutDays) => {
  const metadata = extractMetadata(mailData);
  const aiSummary = generateSummary(mailData);
  const { suggestedDepartment, confidenceScore } = suggestDepartment(mailData);
  const slaDeadline = calculateSlaDeadline(categoryMaxDays, globalTimeoutDays);

  return {
    aiSummary,
    aiSuggestedDepartment: suggestedDepartment,
    aiConfidenceScore: confidenceScore,
    slaDeadline,
    detectedMetadata: metadata,
  };
};

module.exports = { processNewMail, generateSummary, suggestDepartment, calculateSlaDeadline };
