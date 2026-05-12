const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema(
  {
    institutionName: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      default: 'NexusMail Institution',
    },
    logoUrl: {
      type: String,
      trim: true,
      default: null,
    },
    globalTimeout: {
      type: Number,
      default: 30,
      min: [1, 'Global timeout must be at least 1 day'],
      comment: 'Default SLA timeout in days if no category is defined',
    },
    allowSelfRegistration: {
      type: Boolean,
      default: false,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Singleton pattern - only one config document
systemConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
