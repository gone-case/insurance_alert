const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { sendSMS } = require('../utils/notify');

const router = express.Router();

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// POST /api/auth/login
router.post('/login', [
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { emailOrPhone, email, password } = req.body;
    const identifier = emailOrPhone || email; // Handle both variable names

    console.log(`🔑 Login attempt for: ${identifier}`);

    const user = await User.findOne({ 
      $or: [{ email: identifier }, { phone: identifier }] 
    });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

    user.lastLogin = new Date();
    await user.save();

    res.json({ token: signToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json(req.user));

// POST /api/auth/register (Public for signup)
router.post('/register', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid 10-digit Indian phone number'),
  body('role').optional().isIn(['admin', 'agent']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'agent'
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/forgot-password (SMS)
router.post('/forgot-password', [
  body('phone').notEmpty(),
], async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User with this phone number not found' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = code;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    await sendSMS(phone, `Your Smart Insurance password reset code is: ${code}. It expires in 10 minutes.`);

    res.json({ message: 'Reset code sent to your phone' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('phone').notEmpty(),
  body('code').notEmpty(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const { phone, code, password } = req.body;
  try {
    const user = await User.findOne({
      phone,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset code' });

    user.password = password;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, [
  body('name').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().notEmpty().trim(),
], async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user.id);

    if (updates.name) user.name = updates.name;
    if (updates.email) user.email = updates.email;
    if (updates.phone) user.phone = updates.phone;

    if (updates.password) {
      if (updates.password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 chars' });
      user.password = updates.password;
    }

    await user.save();
    res.json(user);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Email or phone already in use' });
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/users (admin only)
router.get('/users', protect, adminOnly, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// POST /api/auth/users (admin only - create user)
router.post('/users', protect, adminOnly, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid 10-digit Indian phone number'),
  body('role').optional().isIn(['admin', 'agent']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password, phone, role } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) return res.status(409).json({ message: 'Email or phone already exists' });

    const user = await User.create({ name, email, password, phone, role: role || 'agent' });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/auth/users/:id/status (admin only)
router.patch('/users/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/auth/users/:id (admin only)
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;