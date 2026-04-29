const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const Lead = require('../models/Lead');
const Renewal = require('../models/Renewal');

const router = express.Router();

// POST /api/sms/webhook
// This is the endpoint Twilio calls when an SMS is received
router.post('/webhook', async (req, res) => {
  const { Body, From } = req.body;
  const twiml = new MessagingResponse();
  
  if (!Body || !From) {
    return res.status(400).send('Invalid request');
  }

  // Body format expected: "ACTION POLICY_NUMBER" e.g., "YES LP-1001"
  const parts = Body.trim().split(/\s+/);
  if (parts.length < 2) {
    twiml.message('Invalid format. Please reply with: YES/DELAY/STOP [PolicyNumber]');
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  const action = parts[0].toUpperCase();
  const policyNumber = parts[1].toUpperCase();

  try {
    // Try finding in Leads first
    let item = await Lead.findOne({ policyNumber });
    let type = 'lead';

    if (!item) {
      item = await Renewal.findOne({ policyNumber });
      type = 'renewal';
    }

    if (!item) {
      twiml.message(`Could not find a policy with ID: ${policyNumber}`);
    } else {
      let responseMsg = '';
      
      if (action === 'YES') {
        if (type === 'lead') item.status = 'Purchased';
        else item.renewalStatus = 'Renewed';
        responseMsg = `✅ Confirmed! Policy ${policyNumber} has been marked as successful.`;
      } 
      else if (action === 'DELAY') {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        item.pausedUntil = nextWeek;
        if (type === 'lead') item.status = 'Paused';
        else item.renewalStatus = 'Paused';
        responseMsg = `⏸️ OK. Reminders for ${policyNumber} are paused for 7 days.`;
      } 
      else if (action === 'STOP') {
        if (type === 'lead') item.status = 'Not Interested';
        else item.renewalStatus = 'Expired';
        responseMsg = `⏹️ Understood. Reminders for ${policyNumber} have been stopped.`;
      } 
      else {
        responseMsg = '❌ Invalid action. Use YES, DELAY, or STOP.';
      }

      await item.save();
      twiml.message(responseMsg);
    }
  } catch (err) {
    console.error('Webhook error:', err);
    twiml.message('⚠️ An error occurred while processing your request.');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

module.exports = router;
