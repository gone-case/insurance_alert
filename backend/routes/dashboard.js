const express = require('express');
const Lead = require('../models/Lead');
const Renewal = require('../models/Renewal');
const NotificationLog = require('../models/NotificationLog');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const in7Days = new Date(today); in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date(today); in30Days.setDate(in30Days.getDate() + 30);

    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin ? {} : { createdBy: req.user._id };
    const logFilter = isAdmin ? {} : { agentId: req.user._id };

    const [
      totalLeads,
      pendingLeads,
      purchasedLeads,
      notInterestedLeads,
      todayLeadAlerts,
      upcomingLeads,

      totalRenewals,
      pendingRenewals,
      renewedRenewals,
      expiredRenewals,
      todayRenewalAlerts,
      upcomingRenewals,

      recentLogs,
    ] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.countDocuments({ ...filter, status: { $in: ['Interested', 'Pending'] } }),
      Lead.countDocuments({ ...filter, status: 'Purchased' }),
      Lead.countDocuments({ ...filter, status: 'Not Interested' }),
      Lead.countDocuments({ ...filter, status: { $in: ['Interested','Pending'] }, tentativePurchaseDate: { $gte: today, $lt: tomorrow } }),
      Lead.countDocuments({ ...filter, status: { $in: ['Interested','Pending'] }, tentativePurchaseDate: { $gte: today, $lte: in7Days } }),

      Renewal.countDocuments(filter),
      Renewal.countDocuments({ ...filter, renewalStatus: 'Pending' }),
      Renewal.countDocuments({ ...filter, renewalStatus: 'Renewed' }),
      Renewal.countDocuments({ ...filter, renewalStatus: 'Expired' }),
      Renewal.countDocuments({ ...filter, renewalStatus: 'Pending', renewalDueDate: { $gte: today, $lt: tomorrow } }),
      Renewal.countDocuments({ ...filter, renewalStatus: 'Pending', renewalDueDate: { $gte: today, $lte: in7Days } }),

      NotificationLog.find(logFilter).sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      leads: {
        total: totalLeads,
        pending: pendingLeads,
        purchased: purchasedLeads,
        closed: notInterestedLeads,
        todayAlerts: todayLeadAlerts,
        upcoming7Days: upcomingLeads,
      },
      renewals: {
        total: totalRenewals,
        pending: pendingRenewals,
        renewed: renewedRenewals,
        expired: expiredRenewals,
        todayAlerts: todayRenewalAlerts,
        upcoming7Days: upcomingRenewals,
      },
      totalAlerts: todayLeadAlerts + todayRenewalAlerts,
      recentActivity: recentLogs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
