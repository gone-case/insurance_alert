const express = require('express');
const Lead = require('../models/Lead');
const Renewal = require('../models/Renewal');
const NotificationLog = require('../models/NotificationLog');
const { protect } = require('../middleware/auth');
const { runReminderJob } = require('../utils/reminderJob');

const router = express.Router();
router.use(protect);

function daysDiff(date) {
  const now = new Date(); now.setHours(0,0,0,0);
  const t = new Date(date); t.setHours(0,0,0,0);
  return Math.ceil((t - now) / (1000*60*60*24));
}

// GET /api/alerts — today's alerts (due within 30 days or overdue)
router.get('/', async (req, res) => {
  try {
    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [leads, renewals] = await Promise.all([
      Lead.find({
        ...(req.user.role !== 'admin' && { createdBy: req.user._id }),
        status: { $in: ['Interested', 'Pending'] },
        tentativePurchaseDate: { $lte: thirtyDaysAhead },
      }).sort({ tentativePurchaseDate: 1 }),
      Renewal.find({
        ...(req.user.role !== 'admin' && { createdBy: req.user._id }),
        renewalStatus: 'Pending',
        renewalDueDate: { $lte: thirtyDaysAhead },
      }).sort({ renewalDueDate: 1 }),
    ]);

    const alerts = [
      ...leads.map(l => ({
        _id: l._id,
        type: 'lead',
        customerName: l.customerName,
        phoneNumber: l.phoneNumber,
        policyNumber: l.policyNumber,
        policyType: l.interestedPolicyType,
        dueDate: l.tentativePurchaseDate,
        daysUntilDue: daysDiff(l.tentativePurchaseDate),
        status: l.status,
        premiumAmount: l.premiumAmount,
        pausedUntil: l.pausedUntil,
      })),
      ...renewals.map(r => ({
        _id: r._id,
        type: 'renewal',
        customerName: r.customerName,
        phoneNumber: r.phoneNumber,
        policyNumber: r.policyNumber,
        policyType: r.policyType,
        dueDate: r.renewalDueDate,
        daysUntilDue: daysDiff(r.renewalDueDate),
        status: r.renewalStatus,
        premiumAmount: r.lastPremiumPaid,
        pausedUntil: r.pausedUntil,
      })),
    ].sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/alerts/logs — notification history
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = req.user.role === 'admin' ? {} : { agentId: req.user._id };
    const [logs, total] = await Promise.all([
      NotificationLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      NotificationLog.countDocuments(filter),
    ]);
    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/alerts/trigger — manually trigger reminders
router.post('/trigger', async (req, res) => {
  try {
    res.json({ message: 'Reminder job triggered' });
    runReminderJob(req.user._id); // run async for current agent
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
