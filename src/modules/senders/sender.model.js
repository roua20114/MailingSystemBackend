const mongoose = require('mongoose');

const senderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sender name is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Administration', 'Professeur', 'Étudiant', 'Entreprise', 'Autre'],
      default: 'Autre',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

senderSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Sender', senderSchema);
