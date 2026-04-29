const express = require('express');
const { body, validationResult } = require('express-validator');
const { Parser } = require('json2csv');
const Renewal = require('../models/Renewal');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ── GET /api/renewals ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, export: exportCsv } = req.query;
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

    if (status && status !== 'All') filter.renewalStatus = status;
    if (search) {
      filter.$or = [
        { policyNumber: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    if (exportCsv === 'true') {
      const renewals = await Renewal.find(filter).sort({ renewalDueDate: 1 }).lean();
      const fields = ['customerName','phoneNumber','policyNumber','policyType',
        'renewalDueDate','lastPremiumPaid','renewalStatus','notes','createdAt'];
      const parser = new Parser({ fields });
      const csv = parser.parse(renewals);
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=renewals.csv');
      return res.send(csv);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [renewals, total] = await Promise.all([
      Renewal.find(filter).sort({ renewalDueDate: 1 }).skip(skip).limit(parseInt(limit)),
      Renewal.countDocuments(filter),
    ]);

    res.json({ renewals, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/renewals/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
    const renewal = await Renewal.findOne(query);
    if (!renewal) return res.status(404).json({ message: 'Renewal not found or unauthorized' });
    res.json(renewal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/renewals ────────────────────────────────────────────────────────
router.post('/', [
  body('customerName').notEmpty().trim(),
  body('phoneNumber').matches(/^[6-9]\d{9}$/).withMessage('Invalid 10-digit Indian phone number'),
  body('policyNumber').notEmpty().trim(),
  body('policyType').isIn(['Life','Health','Motor','Home','Travel','Term','ULIP','Other']),
  body('renewalDueDate').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const existing = await Renewal.findOne({ policyNumber: req.body.policyNumber.toUpperCase() });
    if (existing) return res.status(409).json({ message: 'Policy number already exists' });

    const renewal = await Renewal.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(renewal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/renewals/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
    const renewal = await Renewal.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    );
    if (!renewal) return res.status(404).json({ message: 'Renewal not found or unauthorized' });
    res.json(renewal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/renewals/:id/action ────────────────────────────────────────────
router.patch('/:id/action', async (req, res) => {
  try {
    const { action } = req.body;
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
    const renewal = await Renewal.findOne(query);
    if (!renewal) return res.status(404).json({ message: 'Renewal not found or unauthorized' });

    switch (action) {
      case 'renew':
        renewal.renewalStatus = 'Renewed';
        break;
      case 'pause':
        renewal.renewalStatus = 'Paused';
        renewal.pausedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'continue':
        renewal.renewalStatus = 'Pending';
        renewal.pausedUntil = null;
        break;
      case 'expire':
        renewal.renewalStatus = 'Expired';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await renewal.save();
    res.json(renewal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/renewals/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
    const renewal = await Renewal.findOneAndDelete(query);
    if (!renewal) return res.status(404).json({ message: 'Renewal not found or unauthorized' });
    res.json({ message: 'Renewal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
