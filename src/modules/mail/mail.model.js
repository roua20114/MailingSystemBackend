const mongoose = require('mongoose');
const { MAIL_STATUS, MAIL_PRIORITY, MAIL_TYPES } = require('../../utils/constants');

require('../senders/sender.model');

const mailSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sender',
      required: [true, 'Sender is required'],
    },
    type: {
      type: String,
      enum: Object.values(MAIL_TYPES),
      required: [true, 'Mail type is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MailCategory',
      default: null,
    },
    priority: {
      type: String,
      enum: Object.values(MAIL_PRIORITY),
      default: MAIL_PRIORITY.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(MAIL_STATUS),
      default: MAIL_STATUS.REGISTERED,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
    instructions: {
      type: String,
      trim: true,
      default: null,
    },
    pdfUrl: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
    // Auto-generated internal reference  e.g. NM-2026-0001
    referenceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Manual reference typed by the secretary from the physical document
    // e.g. "MIN-2026-123" — kept for administrative traceability
    manualReference: {
      type: String,
      trim: true,
      default: null,
    },
    // Link to the original incoming mail this outgoing mail responds to
    inboxMailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mail',
      default: null,
    },
    // AI-generated fields
    aiSummary: {
      type: String,
      default: null,
    },
    aiSuggestedDepartment: {
      type: String,
      default: null,
    },
    aiConfidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    // SLA
    slaDeadline: {
      type: Date,
      default: null,
    },
    isOverdue: {
      type: Boolean,
      default: false,
    },
    // Tracking
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: all outgoing/internal mails that responded to this mail
mailSchema.virtual('responses', {
  ref: 'Mail',
  localField: '_id',
  foreignField: 'inboxMailId',
});

// Instance method: check overdue in memory (does not persist)
mailSchema.methods.checkOverdue = function () {
  if (this.slaDeadline && new Date() > this.slaDeadline && this.status !== 'Processed') {
    this.isOverdue = true;
  }
};

mailSchema.index({ status: 1 });
mailSchema.index({ type: 1 });
mailSchema.index({ createdBy: 1 });
mailSchema.index({ assignedTo: 1 });
mailSchema.index({ inboxMailId: 1 });
mailSchema.index({ manualReference: 1 });

const Mail = mongoose.model('Mail', mailSchema);

module.exports = Mail;