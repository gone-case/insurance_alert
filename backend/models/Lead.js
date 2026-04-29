const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
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
  interestedPolicyType: {
    type: String,
    enum: ['Life', 'Health', 'Motor', 'Home', 'Travel', 'Term', 'ULIP', 'Other'],
    required: true,
  },
  tentativePurchaseDate: { type: Date, required: true },
  premiumAmount: { type: Number, min: 0 },
  notes: { type: String, trim: true },
  status: {
    type: String,
    enum: ['Interested', 'Pending', 'Purchased', 'Not Interested', 'Paused'],
    default: 'Interested',
  },
  pausedUntil: { type: Date },
  lastReminderSent: { type: Date },
  reminderCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

leadSchema.index({ phoneNumber: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ tentativePurchaseDate: 1 });

module.exports = mongoose.model('Lead', leadSchema);
