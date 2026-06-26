const mongoose = require('mongoose');
const { DEMAND_STATUS } = require('../../utils/constants');

const demandSchema = new mongoose.Schema(
  {
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['Congé', 'Problème technique', 'Demande de document', 'Réclamation', 'Autre'],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(DEMAND_STATUS),
      default: DEMAND_STATUS.PENDING,
    },
    adminNote: {
      type: String,
      default: null,
    },
    forwardedToDirector: {
      type: Boolean,
      default: false,
    },
    statusHistory: [
      {
        status:    { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note:      { type: String },
      },
    ],
    directorResponse: {
        type: String,
        default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Demand', demandSchema);