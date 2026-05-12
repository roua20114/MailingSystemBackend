const mongoose = require('mongoose');

const mailCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    maxProcessingTime: {
      type: Number,
      required: [true, 'Max processing time (days) is required'],
      min: [1, 'Max processing time must be at least 1 day'],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MailCategory', mailCategorySchema);
