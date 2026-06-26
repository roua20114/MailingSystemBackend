'use strict';

const Notification = require('./notification.model');
const { NOTIFICATION_TYPES } = require('./notification.model');
const User = require('../users/user.model');
const { ROLES } = require('../../utils/constants');
const { sendEmail } = require('../../utils/email_service');
const templates = require('../../utils/email_templates');
const logger = require('../../utils/logger');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Récupère tous les IDs Directors + Admins actifs */
const getDirectorsAndAdmins = async () => {
  const users = await User.find({
    role: { $in: [ROLES.DIRECTOR, ROLES.ADMIN] },
    isActive: true,
  }).select('_id');
  return users.map(u => u._id);
};

/**
 * Récupère { email, name } d'un utilisateur par son ID.
 * Retourne null si introuvable — l'email sera ignoré silencieusement.
 */
const getUserContact = async (userId) => {
  try {
    const user = await User.findById(userId).select('name email').lean();
    return user ? { name: user.name, email: user.email } : null;
  } catch {
    return null;
  }
};

/**
 * Récupère les contacts { name, email } de plusieurs IDs.
 */
const getUserContacts = async (userIds) => {
  try {
    const users = await User.find(
      { _id: { $in: userIds }, isActive: true },
      'name email'
    ).lean();
    return users;
  } catch {
    return [];
  }
};

// ── Fonction centrale de persistance + dispatch email ─────────────────────────

/**
 * Persiste les notifications en base de données et déclenche les emails
 * de façon non-bloquante.
 *
 * @param {string[]}  recipients     - Tableau d'IDs utilisateurs
 * @param {string}    type           - NOTIFICATION_TYPES.*
 * @param {string}    title          - Titre de la notification in-app
 * @param {string}    message        - Message de la notification in-app
 * @param {string}    mailId         - ObjectId du courrier concerné
 * @param {string}    referenceNumber - Référence auto du courrier
 * @param {Function}  emailBuilder   - Fn(contact) → { subject, html } | null
 */
const send = async (
  recipients,
  type,
  title,
  message,
  mailId,
  referenceNumber,
  emailBuilder = null
) => {
  if (!recipients || recipients.length === 0) return;

  const uniqueIds = [...new Set(recipients.map(r => r.toString()))];

  // ── 1. Persistance In-App (bloquant — doit réussir) ──
  const docs = uniqueIds.map(recipientId => ({
    recipientId,
    type,
    title,
    message,
    mailId: mailId || null,
    referenceNumber: referenceNumber || null,
  }));

  await Notification.insertMany(docs, { ordered: false });

  // ── 2. Envoi Email (non-bloquant — erreurs silencieuses) ──
  if (!emailBuilder) return;

  // On ne bloque PAS ici : Promise.allSettled + .catch() global
  Promise.allSettled(
    uniqueIds.map(async (recipientId) => {
      const contact = await getUserContact(recipientId);
      if (!contact?.email) return;

      const emailContent = emailBuilder(contact);
      if (!emailContent) return;

      await sendEmail({
        to:      contact.email,
        subject: emailContent.subject,
        html:    emailContent.html,
      });
    })
  ).catch(err => {
    logger.error(`[NotifService] Erreur inattendue dans le dispatch email : ${err.message}`);
  });
};

// ── Événements métier ─────────────────────────────────────────────────────────

/**
 * Nouveau courrier enregistré → notifie Directors + Admins (in-app + email)
 */
const onMailRegistered = async (mail, createdByUser) => {
  const recipients = await getDirectorsAndAdmins();

  await send(
    recipients,
    NOTIFICATION_TYPES.MAIL_REGISTERED,
    'Nouveau courrier enregistré',
    `${createdByUser.name} a enregistré le courrier "${mail.subject}" (${mail.referenceNumber})`,
    mail._id,
    mail.referenceNumber,
    // emailBuilder — appelé pour chaque directeur/admin
    (contact) => ({
      subject: `[NexusMail] Nouveau courrier à dispatcher — ${mail.referenceNumber}`,
      html: templates.mailRegistered({
        recipientName:    contact.name,
        mailSubject:      mail.subject,
        referenceNumber:  mail.referenceNumber,
        manualReference:  mail.manualReference || null,
        registeredByName: createdByUser.name,
        mailType:         mail.type,
        priority:         mail.priority,
        mailId:           mail._id.toString(),
      }),
    })
  );
};

/**
 * Mail passé en révision → notifie la secrétaire créatrice (in-app + email)
 */
const onMailUnderReview = async (mail, directorUser) => {
  if (!mail.createdBy) return;
  const creatorId = mail.createdBy._id ?? mail.createdBy;

  await send(
    [creatorId],
    NOTIFICATION_TYPES.MAIL_UNDER_REVIEW,
    'Courrier pris en révision',
    `Le directeur ${directorUser.name} a pris en charge votre courrier "${mail.subject}" (${mail.referenceNumber})`,
    mail._id,
    mail.referenceNumber,
    null // Pas d'email pour cet événement (notification in-app suffisante)
  );
};

/**
 * Mail assigné → notifie l'assigné (in-app + email)
 */
const onMailAssigned = async (mail, assigneeId, assigneeName, directorUser) => {
  await send(
    [assigneeId],
    NOTIFICATION_TYPES.MAIL_ASSIGNED,
    'Courrier assigné',
    `${directorUser.name} vous a assigné le courrier "${mail.subject}" (${mail.referenceNumber})`,
    mail._id,
    mail.referenceNumber,
    // emailBuilder
    (contact) => ({
      subject: `[NexusMail] Courrier assigné — ${mail.referenceNumber}`,
      html: templates.mailAssigned({
        recipientName:   contact.name,
        mailSubject:     mail.subject,
        referenceNumber: mail.referenceNumber,
        manualReference: mail.manualReference || null,
        senderName:      typeof mail.sender === 'object'
                           ? mail.sender.name
                           : mail.sender,
        directorName:    directorUser.name,
        instructions:    mail.instructions || null,
        mailId:          mail._id.toString(),
        priority:        mail.priority,
      }),
    })
  );
};

/**
 * Mail en cours de traitement → notifie Directors + Admins + créateur (in-app uniquement)
 */
const onMailInProgress = async (mail, assigneeUser) => {
  const mgmt = await getDirectorsAndAdmins();
  const creatorId = mail.createdBy?._id ?? mail.createdBy;
  const all = [...mgmt.map(id => id.toString())];
  if (creatorId) all.push(creatorId.toString());
  const filtered = all.filter(id => id !== assigneeUser._id.toString());

  await send(
    filtered,
    NOTIFICATION_TYPES.MAIL_IN_PROGRESS,
    'Traitement commencé',
    `${assigneeUser.name} a démarré le traitement du courrier "${mail.subject}" (${mail.referenceNumber})`,
    mail._id,
    mail.referenceNumber,
    null // In-app uniquement
  );
};

/**
 * Mail traité → notifie Directors + Admins + créateur (in-app uniquement)
 */
const onMailProcessed = async (mail, assigneeUser) => {
  const mgmt = await getDirectorsAndAdmins();
  const creatorId = mail.createdBy?._id ?? mail.createdBy;
  const all = [...mgmt.map(id => id.toString())];
  if (creatorId) all.push(creatorId.toString());
  const filtered = all.filter(id => id !== assigneeUser._id.toString());

  await send(
    filtered,
    NOTIFICATION_TYPES.MAIL_PROCESSED,
    'Courrier traité ✓',
    `${assigneeUser.name} a marqué le courrier "${mail.subject}" (${mail.referenceNumber}) comme traité`,
    mail._id,
    mail.referenceNumber,
    null // In-app uniquement
  );
};

// ── Alerte SLA (appelée par un cron job externe) ──────────────────────────────

/**
 * Alerte SLA — courrier proche de l'échéance.
 * À appeler depuis un cron job (ex: toutes les heures).
 *
 * @param {object} mail        - Document Mongoose du courrier
 * @param {string} assigneeId  - ID de l'utilisateur assigné
 */
const onSlaAlert = async (mail, assigneeId) => {
  if (!assigneeId) return;

  const hoursRemaining = mail.slaDeadline
    ? Math.max(0, (new Date(mail.slaDeadline) - Date.now()) / 3_600_000)
    : undefined;

  await send(
    [assigneeId],
    NOTIFICATION_TYPES.MAIL_ASSIGNED, // Réutilise le type existant
    '⚠️ Alerte SLA — Échéance proche',
    `Le délai de traitement pour le courrier "${mail.subject}" (${mail.referenceNumber}) arrive à échéance`,
    mail._id,
    mail.referenceNumber,
    // emailBuilder
    (contact) => ({
      subject: `[NexusMail] ⚠️ Alerte SLA — ${mail.referenceNumber} arrive à échéance`,
      html: templates.slaAlert({
        recipientName:   contact.name,
        mailSubject:     mail.subject,
        referenceNumber: mail.referenceNumber,
        manualReference: mail.manualReference || null,
        slaDeadline:     mail.slaDeadline,
        mailId:          mail._id.toString(),
        hoursRemaining,
      }),
    })
  );
};

/**
 * New demand created by professor → notify all Admins
 */
const onDemandCreated = async (demand, professor) => {
  const admins = await User.find({ role: ROLES.ADMIN, isActive: true }).select('_id').lean();
  const adminIds = admins.map(u => u._id);
  if (adminIds.length === 0) return;

  await send(
    adminIds,
    NOTIFICATION_TYPES.DEMAND_CREATED,
    'Nouvelle demande professeur',
    `${professor.name} a soumis une nouvelle demande : "${demand.subject}"`,
    demand._id,
    null,
    (contact) => ({
      subject: `[NexusMail] Nouvelle demande de ${professor.name}`,
      html: `<p>Bonjour ${contact.name},</p>
             <p><strong>${professor.name}</strong> a soumis une nouvelle demande.</p>
             <p><strong>Type :</strong> ${demand.type}</p>
             <p><strong>Objet :</strong> ${demand.subject}</p>
             <p><strong>Description :</strong> ${demand.description}</p>
             <p>Connectez-vous à NexusMail pour la traiter.</p>`,
    })
  );
};

/**
 * Demand forwarded to director by admin → notify all Directors
 */
const onDemandForwarded = async (demand, professor, adminUser) => {
  const directors = await User.find({ role: ROLES.DIRECTOR, isActive: true }).select('_id').lean();
  const directorIds = directors.map(u => u._id);
  if (directorIds.length === 0) return;

  await send(
    directorIds,
    NOTIFICATION_TYPES.DEMAND_FORWARDED,
    'Demande transmise par l\'administrateur',
    `${adminUser.name} vous a transmis la demande de ${professor?.name ?? 'un professeur'} : "${demand.subject}"`,
    demand._id,
    null,
    (contact) => ({
      subject: `[NexusMail] Demande transmise — ${demand.subject}`,
      html: `<p>Bonjour ${contact.name},</p>
             <p><strong>${adminUser.name}</strong> vous a transmis une demande professeur.</p>
             <p><strong>Professeur :</strong> ${professor?.name ?? '—'}</p>
             <p><strong>Type :</strong> ${demand.type}</p>
             <p><strong>Objet :</strong> ${demand.subject}</p>
             <p>Connectez-vous à NexusMail pour y répondre.</p>`,
    })
  );
};

/**
 * Director answered demand → notify the professor
 */
const onDemandAnswered = async (demand, professor, directorUser) => {
  if (!professor?._id) return;
  const isAccepted = demand.status === 'Resolved';

  await send(
    [professor._id],
    NOTIFICATION_TYPES.DEMAND_ANSWERED,
    isAccepted ? '✓ Votre demande a été acceptée' : '✗ Votre demande a été rejetée',
    `Le Directeur ${directorUser.name} a ${isAccepted ? 'accepté' : 'rejeté'} votre demande : "${demand.subject}"`,
    demand._id,
    null,
    (contact) => ({
      subject: `[NexusMail] Réponse à votre demande — ${demand.subject}`,
      html: `<p>Bonjour ${contact.name},</p>
             <p>Le Directeur <strong>${directorUser.name}</strong> a 
             <strong>${isAccepted ? 'accepté ✓' : 'rejeté ✗'}</strong> 
             votre demande "<strong>${demand.subject}</strong>".</p>
             ${demand.directorResponse
               ? `<p><strong>Réponse :</strong> ${demand.directorResponse}</p>`
               : ''}
             <p>Connectez-vous à NexusMail pour consulter les détails.</p>`,
    })
  );
};

module.exports = {
  onMailRegistered,
  onMailUnderReview,
  onMailAssigned,
  onMailInProgress,
  onMailProcessed,
  onSlaAlert,
  onDemandCreated,
  onDemandForwarded,
  onDemandAnswered,
};