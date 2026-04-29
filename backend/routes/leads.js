const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Parser } = require('json2csv');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ── GET /api/leads ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, export: exportCsv } = req.query;
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

    if (status && status !== 'All') filter.status = status;
    if (search) {
      filter.$or = [
        { policyNumber: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    if (exportCsv === 'true') {
      const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
      const fields = ['customerName','phoneNumber','policyNumber','interestedPolicyType',
        'tentativePurchaseDate','premiumAmount','status','notes','createdAt'];
      const parser = new Parser({ fields });
      const csv = parser.parse(leads);
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=leads.csv');
      return res.send(csv);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Lead.countDocuments(filter),
    ]);

    res.json({ leads, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/leads/:id ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
    const lead = await Lead.findOne(query);
    if (!lead) return res.status(404).json({ message: 'Lead not found or unauthorized' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/leads ───────────────────────────────────────────────────────────
router.post('/', [
  body('customerName').notEmpty().trim(),
  body('phoneNumber').matches(/^[6-9]\d{9}$/).withMessage('Invalid 10-digit Indian phone number'),
  body('policyNumber').notEmpty().trim(),
  body('interestedPolicyType').isIn(['Life','Health','Motor','Home','Travel','Term','ULIP','Other']),
  body('tentativePurchaseDate').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const existing = await Lead.findOne({ policyNumber: req.body.policyNumber.toUpperCase() });
    if (existing) return res.status(409).json({ message: 'Policy number already exists' });

    const lead = await Lead.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/leads/:id ────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
    const lead = await Lead.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ message: 'Lead not found or unauthorized' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/leads/:id/action ───────────────────────────────────────────────
router.patch('/:id/action', async (req, res) => {
  try {
    const { action } = req.body;
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
    const lead = await Lead.findOne(query);
    if (!lead) return res.status(404).json({ message: 'Lead not found or unauthorized' });

    switch (action) {
      case 'purchase':
        lead.status = 'Purchased';
        break;
      case 'pause':
        lead.status = 'Paused';
        lead.pausedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'continue':
        lead.status = 'Interested';
        lead.pausedUntil = null;
        break;
      case 'close':
        lead.status = 'Not Interested';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await lead.save();
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/leads/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
    const lead = await Lead.findOneAndDelete(query);
    if (!lead) return res.status(404).json({ message: 'Lead not found or unauthorized' });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
