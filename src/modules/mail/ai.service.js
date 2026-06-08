/**
 * AI Service — Real summarization via Claude (Anthropic API).
 * Keeps all existing functions signatures intact so nothing else breaks.
 */

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../../config');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

// ── Department suggestion (kept as keyword-based, no need for AI here) ────────
const DEPARTMENT_POOL = [
  'Human Resources', 'Finance & Accounting', 'Legal Affairs',
  'IT & Systems', 'Academic Affairs', 'Student Services',
  'Research & Development', 'Operations', 'External Relations', 'Procurement',
];

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
    'Procurement': ['purchase', 'order', 'supplier', 'vendor', 'procurement', 'supply'],
    'Research & Development': ['research', 'development', 'innovation', 'project', 'study'],
    'Operations': ['operations', 'logistics', 'maintenance', 'facility', 'infrastructure'],
    'External Relations': ['partner', 'external', 'collaboration', 'media', 'public', 'press'],
  };

  let bestMatch = null;
  let bestScore = 0;

  for (const [dept, keywords] of Object.entries(keywordMap)) {
    const matches = keywords.filter((kw) => text.includes(kw)).length;
    const score = matches / keywords.length;
    if (score > bestScore) { bestScore = score; bestMatch = dept; }
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

// ── Metadata extraction (kept as-is, no AI needed) ────────────────────────────
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

// ── SLA deadline ──────────────────────────────────────────────────────────────
const calculateSlaDeadline = (categoryMaxDays, globalTimeoutDays = 30) => {
  const days = categoryMaxDays || globalTimeoutDays;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return deadline;
};

// ── Real AI summary via Claude ────────────────────────────────────────────────
const generateSummary = async (mailData) => {
  // Fallback if no API key configured
  if (!config.anthropic.apiKey) {
    return `Mail from ${mailData.sender} regarding "${mailData.subject}". Pending review.`;
  }

  const prompt = `You are an administrative assistant in an institutional mail management system.
Summarize the following mail in 2-3 concise sentences. Focus on: who sent it, what it's about, and what action might be needed.
Be professional and neutral. Do not add any preamble.

Subject: ${mailData.subject}
Type: ${mailData.type}
${mailData.description ? `Content: ${mailData.description}` : ''}
${mailData.pdfUrl ? '(The mail includes an attached document.)' : ''}`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', // Fast & cheap, perfect for summaries
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content[0].text.trim();
  } catch (err) {
    console.error('[AI Service] Claude API error:', err.message);
    // Graceful fallback — system still works even if AI fails
    return `Mail regarding "${mailData.subject}" received. Manual review required.`;
  }
};

// ── Full pipeline ─────────────────────────────────────────────────────────────
const processNewMail = async (mailData, categoryMaxDays, globalTimeoutDays) => {
  const metadata = extractMetadata(mailData);
  const aiSummary = await generateSummary(mailData); // now async
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