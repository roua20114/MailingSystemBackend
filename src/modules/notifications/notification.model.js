const mongoose = require('mongoose');

const NOTIFICATION_TYPES = {
  MAIL_REGISTERED:   'MAIL_REGISTERED',    // Directors/Admins: new mail arrived
  MAIL_UNDER_REVIEW: 'MAIL_UNDER_REVIEW',  // Secretaries: director took the mail
  MAIL_ASSIGNED:     'MAIL_ASSIGNED',      // Assignee: mail assigned to you
  MAIL_IN_PROGRESS:  'MAIL_IN_PROGRESS',   // Director/Admin + creator: assignee started
  MAIL_PROCESSED:    'MAIL_PROCESSED',     // Director/Admin + creator: mail fully treated
};

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    mailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mail',
      default: null,
    },
    referenceNumber: { type: String, default: null },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;