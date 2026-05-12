const mongoose = require('mongoose');
const { MAIL_STATUS, MAIL_PRIORITY, MAIL_TYPES } = require('../../utils/constants');

const mailSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    sender: {
      type: String,
      required: [true, 'Sender is required'],
      trim: true,
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
    referenceNumber: {
      type: String,
      unique: true,
      sparse: true,
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
  { timestamps: true }
);

mailSchema.index({ status: 1 });
mailSchema.index({ createdBy: 1 });
mailSchema.index({ assignedTo: 1 });
mailSchema.index({ priority: 1 });
mailSchema.index({ slaDeadline: 1 });

// Auto-generate reference number
mailSchema.pre('save', async function (next) {
  if (this.isNew && !this.referenceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.referenceNumber = `NM-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Check overdue status
mailSchema.methods.checkOverdue = function () {
  if (this.slaDeadline && this.status !== 'Processed') {
    this.isOverdue = new Date() > this.slaDeadline;
  }
  return this.isOverdue;
};

module.exports = mongoose.model('Mail', mailSchema);
