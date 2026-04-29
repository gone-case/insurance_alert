const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['lead', 'renewal'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String },
  policyNumber: { type: String },
  channel: { type: String, enum: ['sms', 'email', 'system'], required: true },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  message: { type: String, required: true },
  twilioSid: { type: String },
  errorDetails: { type: String },
  daysUntilDue: { type: Number },
}, { timestamps: true });

notificationLogSchema.index({ referenceId: 1 });
notificationLogSchema.index({ createdAt: -1 });
notificationLogSchema.index({ status: 1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
