const express = require('express');
const Lead = require('../models/Lead');
const Renewal = require('../models/Renewal');

const router = express.Router();

// GET /api/quick-actions/:type/:id/:action
// Public route used from SMS links
router.get('/:type/:id/:action', async (req, res) => {
  const { type, id, action } = req.params;
  
  try {
    let item;
    if (type === 'lead') {
      item = await Lead.findById(id);
    } else if (type === 'renewal') {
      item = await Renewal.findById(id);
    }

    if (!item) {
      return res.send(`
        <div style="font-family:sans-serif;text-align:center;padding:50px;">
          <h1 style="color:#ef4444">Entry Not Found</h1>
          <p>This lead or renewal may have been deleted.</p>
        </div>
      `);
    }

    let message = '';
    let success = true;

    switch (action) {
      case 'yes':
        if (type === 'lead') {
          item.status = 'Purchased';
        } else {
          item.renewalStatus = 'Renewed';
        }
        message = '🎉 Success! The policy has been marked as successfully added/renewed.';
        break;

      case 'delay':
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        item.pausedUntil = nextWeek;
        if (type === 'lead') {
          item.status = 'Paused';
        } else {
          item.renewalStatus = 'Paused';
        }
        message = '⏸️ Reminder paused. We will notify you again in 7 days.';
        break;

      case 'not-interested':
        if (type === 'lead') {
          item.status = 'Not Interested';
        } else {
          item.renewalStatus = 'Expired';
        }
        message = '⏹️ Reminders stopped. The customer has been marked as not interested.';
        break;

      default:
        success = false;
        message = 'Invalid action requested.';
    }

    if (success) {
      await item.save();
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; padding: 30px; border-radius: 24px; text-align: center; max-width: 90%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); border: 1px border-slate-700; }
          h1 { margin-bottom: 16px; font-size: 24px; }
          p { color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
          .btn { background: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Quick Action Performed</h1>
          <p>${message}</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">Go to Dashboard</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('An error occurred.');
  }
});

module.exports = router;
