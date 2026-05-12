const mongoose = require('mongoose');

const mailTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mail type name is required'],
      trim: true,
      unique: true,
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

module.exports = mongoose.model('MailType', mailTypeSchema);
