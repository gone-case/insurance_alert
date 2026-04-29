require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const renewalRoutes = require('./routes/renewals');
const alertRoutes = require('./routes/alerts');
const dashboardRoutes = require('./routes/dashboard');
const quickActionRoutes = require('./routes/quickActions');
const smsWebhookRoutes = require('./routes/smsWebhook');
const { runReminderJob } = require('./utils/reminderJob');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/renewals', renewalRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quick-actions', quickActionRoutes);
app.use('/api/sms', smsWebhookRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ── MongoDB + Start ───────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    // ── Cron: Run every day at 8:00 AM ───────────────────────────────────────
    cron.schedule('0 8 * * *', () => {
      console.log('⏰ Running daily reminder job...');
      runReminderJob();
    }, { timezone: 'Asia/Kolkata' });

    // Also run once at startup (optional, remove in prod if noisy)
    if (process.env.NODE_ENV !== 'production') {
      runReminderJob();
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
