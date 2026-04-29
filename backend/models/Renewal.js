const mongoose = require('mongoose');

const renewalSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  phoneNumber: { 
    type: String, 
    required: true, 
    trim: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit Indian phone number!`
    }
  },
  policyNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  policyType: {
    type: String,
    enum: ['Life', 'Health', 'Motor', 'Home', 'Travel', 'Term', 'ULIP', 'Other'],
    required: true,
  },
  renewalDueDate: { type: Date, required: true },
  lastPremiumPaid: { type: Number, min: 0 },
  renewalStatus: {
    type: String,
    enum: ['Pending', 'Renewed', 'Expired', 'Paused'],
    default: 'Pending',
  },
  pausedUntil: { type: Date },
  lastReminderSent: { type: Date },
  reminderCount: { type: Number, default: 0 },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

renewalSchema.index({ phoneNumber: 1 });
renewalSchema.index({ renewalStatus: 1 });
renewalSchema.index({ renewalDueDate: 1 });

module.exports = mongoose.model('Renewal', renewalSchema);
