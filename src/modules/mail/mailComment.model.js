const mongoose = require('mongoose');

const mailCommentSchema = new mongoose.Schema(
  {
    mailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mail',
      required: [true, 'Mail ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    message: {
      type: String,
      required: [true, 'Comment message is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isInternal: {
      type: Boolean,
      default: false,
      comment: 'If true, only staff can see this comment',
    },
  },
  { timestamps: true }
);

mailCommentSchema.index({ mailId: 1 });
mailCommentSchema.index({ userId: 1 });

module.exports = mongoose.model('MailComment', mailCommentSchema);
