const mongoose = require('mongoose');
const mailRepository = require('./mail.repository');
const MailCategory = require('../settings/mailCategory.model');
const SystemConfig = require('../settings/systemConfig.model');
const Mail = require('./mail.model');
const User = require('../users/user.model');

// Department est déjà enregistré dans Mongoose via department.routes au démarrage.
// On récupère le modèle depuis le registre Mongoose plutôt que via require()
// pour éviter tout couplage de chemin entre modules.
const getDepartmentModel = () => mongoose.model('Department');
const AppError = require('../../utils/AppError');
const { STATUS_TRANSITIONS, MAIL_STATUS, ROLES, AUDIT_ACTIONS } = require('../../utils/constants');
const { createAuditLog } = require('../../middlewares/audit.middleware');
const aiService = require('./ai.service');
const notifService = require('../notifications/notification.service');

// ── Auto Reference Number Generator ──────────────────────────────────────────
// Format: NM-YYYY-XXXX  (e.g. NM-2026-0001)
// Always generated regardless of manualReference.
const generateReferenceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `NM-${year}-`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const latest = await Mail.findOne(
      { referenceNumber: { $regex: `^${prefix}` } },
      { referenceNumber: 1 },
      { sort: { referenceNumber: -1 } }
    ).lean();

    let nextSeq = 1;
    if (latest?.referenceNumber) {
      const parts = latest.referenceNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }

    const candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    const exists = await Mail.exists({ referenceNumber: candidate });
    if (!exists) return candidate;
  }

  return `${prefix}${Date.now()}`;
};

// ─────────────────────────────────────────────────────────────────────────────

const getAllMails = async (query, currentUser) => {
  const {
    page = 1,
    limit = 10,
    status,
    type,
    priority,
    assignedTo,
    createdBy,
    category,
    isOverdue,
    search,
    from,
    to,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter = {};

  if (currentUser.role === ROLES.PROFESSOR) {
    filter.assignedTo = currentUser._id;
  } else if (currentUser.role === ROLES.SECRETARY) {
    filter.$or = [
      { createdBy: currentUser._id },
      { assignedTo: currentUser._id },
    ];
  } else if (currentUser.role === ROLES.SERVICE_LEAD) {
    // Un Service Lead voit les courriers qui lui sont assignés personnellement
    // OU dont son département fait partie du dispatching
    filter.$or = [
      { assignedTo: currentUser._id },
      { dispatchedTo: currentUser.departmentId },
    ];
  }

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (createdBy) filter.createdBy = createdBy;
  if (category) filter.category = category;
  if (isOverdue !== undefined) filter.isOverdue = isOverdue;

  // REPLACE the entire if (search) block with this:
  if (search) {
    const words = search.trim().split(/\s+/).filter(Boolean);

    const buildWordCondition = (word) => ({
      $or: [
        { subject:         { $regex: word, $options: 'i' } },
        { referenceNumber: { $regex: word, $options: 'i' } },
        { manualReference: { $regex: word, $options: 'i' } },
        { description:     { $regex: word, $options: 'i' } },
        { instructions:    { $regex: word, $options: 'i' } },
      ],
    });

    const wordConditions = words.map(buildWordCondition);

    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, ...wordConditions];
      delete filter.$or;
    } else {
      filter.$and = wordConditions;
    }
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to)   filter.createdAt.$lte = new Date(to);
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  return mailRepository.findAll({ filter, page: parseInt(page), limit: parseInt(limit), sort });
};

const getMailById = async (id, currentUser) => {
  const mail = await mailRepository.findById(id);
  if (!mail) throw new AppError('Mail not found', 404);

  if (
    currentUser.role === ROLES.PROFESSOR &&
    mail.assignedTo?._id.toString() !== currentUser._id.toString()
  ) {
    throw new AppError('You do not have access to this mail', 403);
  }

  mail.checkOverdue();
  return mail;
};

const createMail = async (data, req) => {
  const createdBy = req.user._id;

  // Fetch category for SLA if provided
  let categoryMaxDays = null;
  if (data.category) {
    const cat = await MailCategory.findById(data.category);
    if (!cat) throw new AppError('Mail category not found', 404);
    categoryMaxDays = cat.maxProcessingTime;
  }

  // Validate inboxMailId: must exist and must be an Incoming mail
  if (data.inboxMailId) {
    const parentMail = await Mail.findById(data.inboxMailId);
    if (!parentMail) {
      throw new AppError('Referenced inbox mail (inboxMailId) not found', 404);
    }
    if (parentMail.type !== 'Incoming') {
      throw new AppError('inboxMailId must reference an Incoming mail', 400);
    }
  }

  // Always auto-generate the internal reference number (NM-YYYY-XXXX)
  const referenceNumber = await generateReferenceNumber();

  // Keep manualReference as-is (optional, for administrative traceability)
  const manualReference =
    data.manualReference && data.manualReference.trim() !== ''
      ? data.manualReference.trim()
      : null;

  const config = await SystemConfig.getConfig();
  const aiResult = await aiService.processNewMail(data, categoryMaxDays, config.globalTimeout);
  const mailData = {
    subject:               data.subject,
    sender:                data.sender,
    type:                  data.type,
    category:              data.category || null,
    priority:              data.priority || 'Medium',
    description:           data.description || null,
    pdfUrl:                data.pdfUrl || null,
    pdfUrls:               data.pdfUrl ? [data.pdfUrl] : [],
    inboxMailId:           data.inboxMailId || null,
    referenceNumber,
    manualReference,
    createdBy,
    status: MAIL_STATUS.REGISTERED,
    aiSummary:             aiResult.aiSummary,
    aiSuggestedDepartment: aiResult.aiSuggestedDepartment,
    aiConfidenceScore:     aiResult.aiConfidenceScore,
    slaDeadline:           aiResult.slaDeadline,
    statusHistory: [
      {
        status: MAIL_STATUS.REGISTERED,
        changedBy: createdBy,
        changedAt: new Date(),
        note: `Mail registered by ${req.user.role}`,
      },
    ],
  };


  const mail = await mailRepository.create(mailData);

  notifService.onMailRegistered(mail, req.user).catch(() => {});

  await createAuditLog({
    userId:    req.user._id,
    userEmail: req.user.email,
    action:    AUDIT_ACTIONS.CREATE,
    entity:    'Mail',
    entityId:  mail._id,
    changes: {
      subject:         mail.subject,
      type:            mail.type,
      referenceNumber: mail.referenceNumber,
      manualReference: mail.manualReference || null,
      inboxMailId:     mail.inboxMailId || null,
    },
    req,
  });

  return { mail, aiMetadata: aiResult.detectedMetadata };
};

const updateMailStatus = async (id, { status, note }, req) => {
  const mail = await mailRepository.findById(id);
  if (!mail) throw new AppError('Mail not found', 404);

  const currentStatus = mail.status;
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(status)) {
    throw new AppError(
      `Invalid status transition from "${currentStatus}" to "${status}". Allowed: ${
        allowedTransitions.join(', ') || 'none (terminal state)'
      }`,
      400
    );
  }

  if (status === MAIL_STATUS.UNDER_REVIEW && req.user.role !== ROLES.DIRECTOR) {
    throw new AppError('Only a Director can move mail to Under Review', 403);
  }

 // AFTER
  if (status === MAIL_STATUS.IN_PROGRESS) {
    const assignedIds = Array.isArray(mail.assignedTo)
      ? mail.assignedTo.map(u => u._id?.toString() ?? u.toString())
      : mail.assignedTo
        ? [mail.assignedTo._id?.toString() ?? mail.assignedTo.toString()]
        : [];
    const isAssigned = assignedIds.includes(req.user._id.toString());
    const isDirector = req.user.role === ROLES.DIRECTOR;
    const isAdmin    = req.user.role === ROLES.ADMIN;
    if (!isAssigned && !isDirector && !isAdmin) {
      throw new AppError('Only the assigned user or Director can start progress', 403);
    }
  }

  const statusEntry = {
    status,
    changedBy: req.user._id,
    changedAt: new Date(),
    note: note || '',
  };

  const updated = await mailRepository.update(id, {
    status,
    $push: { statusHistory: statusEntry },
  });

  if (status === MAIL_STATUS.UNDER_REVIEW) {
    notifService.onMailUnderReview(mail, req.user).catch(() => {});
  } else if (status === MAIL_STATUS.IN_PROGRESS) {
    notifService.onMailInProgress(mail, req.user).catch(() => {});
  } else if (status === MAIL_STATUS.PROCESSED) {
    notifService.onMailProcessed(mail, req.user).catch(() => {});
  }

  await createAuditLog({
    userId:    req.user._id,
    userEmail: req.user.email,
    action:    AUDIT_ACTIONS.STATUS_CHANGE,
    entity:    'Mail',
    entityId:  id,
    changes:   { from: currentStatus, to: status, note },
    req,
  });

  return updated;
};

/**
 * dispatchMail — Réservé au Directeur.
 *
 * Enregistre la liste des départements destinataires (`dispatchedTo`),
 * les instructions optionnelles et la priorité, puis fait passer le statut
 * de "Under Review" → "Assigned".
 *
 * Body attendu :
 *   {
 *     dispatchedTo:  ["<deptId1>", "<deptId2>", ...],  // tableau, min 1 élément
 *     assignedTo:    "<userId>",                        // utilisateur principal (facultatif)
 *     instructions:  "...",                             // texte libre (facultatif)
 *     priority:      "High"                             // (facultatif)
 *   }
 */
const dispatchMail = async (
  id,
  { dispatchedTo, assignedTo, instructions, priority },
  req
) => {
  // ── 1. Récupération et vérifications préalables ───────────────────────────
  const mail = await mailRepository.findById(id);
  if (!mail) throw new AppError('Mail not found', 404);

  if (mail.status !== MAIL_STATUS.UNDER_REVIEW) {
    throw new AppError(
      `Le courrier doit être en statut "Under Review" pour être dispatché. Statut actuel : "${mail.status}"`,
      400
    );
  }

  // ── 2. Validation du tableau dispatchedTo ─────────────────────────────────
  if (!Array.isArray(dispatchedTo) || dispatchedTo.length === 0) {
    throw new AppError('dispatchedTo doit être un tableau non vide d\'identifiants de départements', 400);
  }

  // Vérification de l'existence de chaque département
  const Department = getDepartmentModel();
  const departments = await Department.find({ _id: { $in: dispatchedTo } }).lean();
  if (departments.length !== dispatchedTo.length) {
    const foundIds = departments.map((d) => d._id.toString());
    const missing  = dispatchedTo.filter((id) => !foundIds.includes(id.toString()));
    throw new AppError(`Département(s) introuvable(s) : ${missing.join(', ')}`, 404);
  }

  // ── 3. Vérification de l'utilisateur assigné (facultatif) ────────────────
 let assignees = [];
  if (Array.isArray(assignedTo) && assignedTo.length > 0) {
    assignees = await User.find({ _id: { $in: assignedTo }, isActive: true }).lean();
    if (assignees.length !== assignedTo.length) {
      throw new AppError('One or more assigned users not found or inactive', 404);
    }
  }

  // ── 4. Construction du patch ──────────────────────────────────────────────
  const deptNames = departments.map((d) => d.name).join(', ');
  const assigneeNames = assignees.map((u) => u.name).join(', ');

  const updateData = {
    dispatchedTo,
    instructions: instructions || null,
    status: MAIL_STATUS.ASSIGNED,
    ...(assignees.length > 0 && { assignedTo: assignees.map(u => u._id) }),
    ...(priority   && { priority }),
    $push: {
      statusHistory: {
        status:    MAIL_STATUS.ASSIGNED,
        changedBy: req.user._id,
        changedAt: new Date(),
        note: `Dispatché vers : ${deptNames}${
          assigneeNames ? ` — responsables : ${assigneeNames}` : ''
        }${instructions ? ' (avec instructions)' : ''}`,
      },
    },
  };

  const updated = await mailRepository.update(id, updateData);

  // ── 5. Notifications (non-bloquantes) ─────────────────────────────────────
  assignees.forEach((u) => {
    notifService.onMailAssigned(mail, u._id, u.name, req.user).catch(() => {});
  });

  // ── 6. Audit log ──────────────────────────────────────────────────────────
  await createAuditLog({
    userId:    req.user._id,
    userEmail: req.user.email,
    action:    AUDIT_ACTIONS.ASSIGN,
    entity:    'Mail',
    entityId:  id,
    changes: {
      dispatchedTo: deptNames,
      assignedTo:   assignees.map((u) => u.email).join(', ') || null,
      instructions: instructions ? instructions.substring(0, 100) : '',
    },
    req,
  });

  return updated;
};

/**
 * assignMail — Affectation à un utilisateur individuel (inchangé).
 * Conservé pour les cas où le Directeur affecte à une personne précise
 * sans passer par le dispatching multi-département.
 */
const assignMail = async (
  id,
  { assignedTo, instructions, dispatchedTo, priority },
  req
) => {
  const mail = await mailRepository.findById(id);
  if (!mail) throw new AppError('Mail not found', 404);

  if (mail.status !== MAIL_STATUS.UNDER_REVIEW) {
    throw new AppError(
      `Mail must be in "Under Review" status to be assigned. Current status: "${mail.status}"`,
      400
    );
  }

  const assignee = await User.findById(assignedTo);
  if (!assignee) throw new AppError('Assigned user not found', 404);
  if (!assignee.isActive) throw new AppError('Cannot assign to an inactive user', 400);

  const updateData = {
    assignedTo,
    instructions: instructions || null,
    status: MAIL_STATUS.ASSIGNED,
    ...(priority && { priority }),
    // Si des départements sont également passés ici, on les accepte
    ...(Array.isArray(dispatchedTo) && dispatchedTo.length > 0 && { dispatchedTo }),
    $push: {
      statusHistory: {
        status:    MAIL_STATUS.ASSIGNED,
        changedBy: req.user._id,
        changedAt: new Date(),
        note: `Assigned to ${assignee.name}${instructions ? ' with instructions' : ''}`,
      },
    },
  };

  const updated = await mailRepository.update(id, updateData);

  notifService.onMailAssigned(mail, assignee._id, assignee.name, req.user).catch(() => {});

  await createAuditLog({
    userId:    req.user._id,
    userEmail: req.user.email,
    action:    AUDIT_ACTIONS.ASSIGN,
    entity:    'Mail',
    entityId:  id,
    changes: {
      assignedTo:   assignee.email,
      instructions: instructions ? instructions.substring(0, 100) : '',
    },
    req,
  });

  return updated;
};

const getMailsByUser = async (userId, query) => {
  return mailRepository.findByUser(userId, {
    page:  parseInt(query.page  || 1),
    limit: parseInt(query.limit || 10),
  });
};

const addComment = async (mailId, userId, { message, isInternal }) => {
  const mail = await mailRepository.findById(mailId);
  if (!mail) throw new AppError('Mail not found', 404);
  return mailRepository.addComment({ mailId, userId, message, isInternal: isInternal || false });
};

const getComments = async (mailId) => {
  const mail = await mailRepository.findById(mailId);
  if (!mail) throw new AppError('Mail not found', 404);
  return mailRepository.getComments(mailId);
};

const getMailStats = async () => {
  const stats = await mailRepository.getStats();
  const result = {};
  stats.forEach(({ _id, count }) => {
    result[_id] = count;
  });
  return result;
};

const markMail = async (id) => {
  const mail = await mailRepository.findById(id);
  if (!mail) throw new AppError('Mail not found', 404);
  if (mail.isMarked) throw new AppError('Ce courrier est déjà marqué', 400);
  return await mailRepository.update(id, { isMarked: true });
};

// add to exports:


module.exports = {
  getAllMails,
  getMailById,
  createMail,
  updateMailStatus,
  dispatchMail,
  assignMail,
  getMailsByUser,
  addComment,
  getComments,
  getMailStats,
  markMail,
};