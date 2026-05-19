const Notification = require('./notification.model');
const { NOTIFICATION_TYPES } = require('./notification.model');
const User = require('../users/user.model');
const { ROLES } = require('../../utils/constants');

// Get all Director + Admin user IDs
const getDirectorsAndAdmins = async () => {
  const users = await User.find({
    role: { $in: [ROLES.DIRECTOR, ROLES.ADMIN] },
    isActive: true,
  }).select('_id');
  return users.map(u => u._id);
};

// Bulk-insert notifications (skip duplicates silently)
const send = async (recipients, type, title, message, mailId, referenceNumber) => {
  if (!recipients || recipients.length === 0) return;
  const docs = [...new Set(recipients.map(r => r.toString()))].map(recipientId => ({
    recipientId,
    type,
    title,
    message,
    mailId: mailId || null,
    referenceNumber: referenceNumber || null,
  }));
  await Notification.insertMany(docs, { ordered: false });
};

// ── Triggered from mail.service.js ──────────────────────────────────────────

/**
 * New mail registered → notify Directors + Admins
 */
const onMailRegistered = async (mail, createdByUser) => {
  const recipients = await getDirectorsAndAdmins();
  await send(
    recipients,
    NOTIFICATION_TYPES.MAIL_REGISTERED,
    'Nouveau courrier enregistré',
    `${createdByUser.name} a enregistré le courrier "${mail.subject}" (${mail.referenceNumber})`,
    mail._id,
    mail.referenceNumber
  );
};

/**
 * Mail moved to Under Review → notify Secretary who created it
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
    mail.referenceNumber
  );
};

/**
 * Mail assigned → notify the assignee
 */
const onMailAssigned = async (mail, assigneeId, assigneeName, directorUser) => {
  await send(
    [assigneeId],
    NOTIFICATION_TYPES.MAIL_ASSIGNED,
    'Courrier assigné',
    `${directorUser.name} vous a assigné le courrier "${mail.subject}" (${mail.referenceNumber})`,
    mail._id,
    mail.referenceNumber
  );
};

/**
 * Mail In Progress → notify Directors + Admins + creator
 */
const onMailInProgress = async (mail, assigneeUser) => {
  const mgmt = await getDirectorsAndAdmins();
  const creatorId = mail.createdBy?._id ?? mail.createdBy;
  const all = [...mgmt.map(id => id.toString())];
  if (creatorId) all.push(creatorId.toString());
  // Remove the person who triggered it so they don't notify themselves
  const filtered = all.filter(id => id !== assigneeUser._id.toString());
  await send(
    filtered,
    NOTIFICATION_TYPES.MAIL_IN_PROGRESS,
    'Traitement commencé',
    `${assigneeUser.name} a démarré le traitement du courrier "${mail.subject}" (${mail.referenceNumber})`,
    mail._id,
    mail.referenceNumber
  );
};

/**
 * Mail Processed → notify Directors + Admins + creator
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
    mail.referenceNumber
  );
};

module.exports = {
  onMailRegistered,
  onMailUnderReview,
  onMailAssigned,
  onMailInProgress,
  onMailProcessed,
};