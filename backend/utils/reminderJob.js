const Lead = require('../models/Lead');
const Renewal = require('../models/Renewal');
const User = require('../models/User');
const { notify } = require('./notify');

function daysDiff(date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function shouldNotify(days) {
  // Notify at 30, 15 days, and daily from 7 days before (days <= 7)
  return [30, 15].includes(days) || days <= 7;
}

function shouldNotifyLead(days) {
  // Notify at 30, 15 days, and daily from 7 days before (days <= 7)
  return [30, 15].includes(days) || days <= 7;
}

async function processLeads(agentId) {
  const query = {
    status: { $in: ['Interested', 'Pending'] },
    tentativePurchaseDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  };
  if (agentId) query.createdBy = agentId;
  const leads = await Lead.find(query).populate('createdBy');

  for (const lead of leads) {
    // Skip if paused
    if (lead.pausedUntil && new Date() < lead.pausedUntil) continue;

    const days = daysDiff(lead.tentativePurchaseDate);
    if (!shouldNotifyLead(days)) continue;

    const daysLabel = days > 0 ? `in ${days} day(s)` : days === 0 ? 'TODAY' : `${Math.abs(days)} day(s) ago (OVERDUE)`;
    const urgency = days <= 0 ? '!!!' : '(!) ';
    
    const message = `${urgency} LEAD: ${lead.customerName}
Pol: ${lead.policyNumber}
Type: ${lead.interestedPolicyType}
Due: ${daysLabel}
REPLY:
YES ${lead.policyNumber}
DELAY ${lead.policyNumber}
STOP ${lead.policyNumber}`;

    await notify({
      type: 'lead',
      referenceId: lead._id,
      agentId: lead.createdBy._id,
      customerName: lead.customerName,
      policyNumber: lead.policyNumber,
      phoneNumber: lead.createdBy.phone, // Send to Agent
      message,
      daysUntilDue: days,
    });

    lead.lastReminderSent = new Date();
    lead.reminderCount = (lead.reminderCount || 0) + 1;
    await lead.save();
  }
}

async function processRenewals(agentId) {
  const query = {
    renewalStatus: { $in: ['Pending'] },
    renewalDueDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  };
  if (agentId) query.createdBy = agentId;
  const renewals = await Renewal.find(query).populate('createdBy');

  for (const renewal of renewals) {
    if (renewal.pausedUntil && new Date() < renewal.pausedUntil) continue;

    const days = daysDiff(renewal.renewalDueDate);
    if (!shouldNotify(days)) continue;

    const daysLabel = days > 0 ? `in ${days} day(s)` : days === 0 ? 'TODAY' : `${Math.abs(days)} day(s) ago (EXPIRED)`;
    const urgency = days <= 0 ? '!!!' : '(!) ';

    const message = `${urgency} RENEWAL: ${renewal.customerName}
Pol: ${renewal.policyNumber}
Type: ${renewal.policyType}
Due: ${daysLabel}
REPLY:
YES ${renewal.policyNumber}
DELAY ${renewal.policyNumber}
STOP ${renewal.policyNumber}`;

    await notify({
      type: 'renewal',
      referenceId: renewal._id,
      agentId: renewal.createdBy._id,
      customerName: renewal.customerName,
      policyNumber: renewal.policyNumber,
      phoneNumber: renewal.createdBy.phone, // Send to Agent
      message,
      daysUntilDue: days,
    });

    renewal.lastReminderSent = new Date();
    renewal.reminderCount = (renewal.reminderCount || 0) + 1;
    await renewal.save();
  }
}

async function runReminderJob(agentId) {
  try {
    console.log(`🔔 Processing ${agentId ? 'agent-specific' : 'global'} reminders...`);
    await processLeads(agentId);
    await processRenewals(agentId);
    console.log('✅ Reminder job completed');
  } catch (err) {
    console.error('❌ Reminder job error:', err);
  }
}

module.exports = { runReminderJob };
