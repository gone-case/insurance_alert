# 🛡️ Smart Insurance Reminder System

A full-stack production-ready web application for insurance agents to manage leads and policy renewals with automated Telegram/Email reminders.

---

## 🏗️ Tech Stack

| Layer        | Technology                |
|--------------|---------------------------|
| Frontend     | React 18 + Tailwind CSS   |
| Backend      | Node.js + Express.js      |
| Database     | MongoDB Atlas (free tier) |
| Auth         | JWT (7-day tokens)        |
| Scheduler    | node-cron (daily 8AM IST) |
| Notifications| Telegram Bot → Email fallback |
| Deployment   | Render (free tier)        |

---

## 📁 Project Structure

```
smart-insurance/
├── backend/
│   ├── models/
│   │   ├── User.js          # Agent/admin schema
│   │   ├── Lead.js          # Insurance lead schema
│   │   ├── Renewal.js       # Renewal schema
│   │   └── NotificationLog.js
│   ├── routes/
│   │   ├── auth.js          # Login, register, me
│   │   ├── leads.js         # CRUD + CSV export
│   │   ├── renewals.js      # CRUD + CSV export
│   │   ├── alerts.js        # Active alerts, manual trigger
│   │   └── dashboard.js     # Stats
│   ├── middleware/
│   │   └── auth.js          # JWT protect + adminOnly
│   ├── utils/
│   │   ├── notify.js        # Telegram + Email sender
│   │   ├── reminderJob.js   # Cron job logic
│   │   └── seed.js          # Create first admin
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── utils/api.js           # Axios instance
│   │   ├── utils/helpers.js       # Date, currency, colors
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Sidebar + topbar
│   │   │   ├── Modal.jsx
│   │   │   ├── LeadForm.jsx
│   │   │   └── RenewalForm.jsx
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── Dashboard.jsx
│   │       ├── LeadsPage.jsx
│   │       ├── RenewalsPage.jsx
│   │       └── AlertsPage.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── render.yaml                    # Render deployment config
└── package.json
```

---

## 🚀 Local Development Setup

### 1. Clone & install

```bash
git clone <your-repo-url>
cd smart-insurance
npm run install:all
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI, Telegram token, etc.

# Frontend
cp frontend/.env.example frontend/.env
# VITE_API_URL=http://localhost:5000/api
```

### 3. Seed the admin user

```bash
npm run seed
# Default: admin@insurance.com / Admin@123
```

### 4. Run dev servers

```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend

# Visit http://localhost:3000
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable             | Description                          | Required |
|----------------------|--------------------------------------|----------|
| `MONGODB_URI`        | MongoDB Atlas connection string      | ✅ Yes   |
| `JWT_SECRET`         | Random secret string (min 32 chars)  | ✅ Yes   |
| `JWT_EXPIRES_IN`     | Token expiry (e.g. `7d`)             | ✅ Yes   |
| `PORT`               | Server port (default: 5000)          | Optional |
| `TWILIO_ACCOUNT_SID`  | From twilio.com console             | Recommended |
| `TWILIO_AUTH_TOKEN`   | From twilio.com console             | Recommended |
| `TWILIO_PHONE_NUMBER` | Your purchased Twilio number        | Recommended |
| `EMAIL_USER`         | Gmail address                        | Fallback |
| `EMAIL_PASS`         | Gmail App Password                   | Fallback |
| `CLIENT_URL`         | Frontend URL for CORS                | ✅ Prod  |

### Frontend (`frontend/.env`)

| Variable         | Description           |
|------------------|-----------------------|
| `VITE_API_URL`   | Backend API base URL  |

---

## 📱 How to Set Up Twilio SMS Notifications

SMS reminders are sent **directly to the customer's phone number** stored on their lead/renewal record.

1. Sign up at [twilio.com](https://twilio.com) — the free trial gives you **$15 credit** (enough for ~500 SMS)
2. From the Twilio Console dashboard, copy your **Account SID** and **Auth Token**
3. Go to **Phone Numbers → Manage → Buy a Number** — get a number with SMS capability (~$1/month)
4. Set the three env vars:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
   ```
5. **Trial account note**: On the free trial, you can only send SMS to verified numbers. Go to **Verified Caller IDs** in the Twilio console and add the customer numbers you want to test with. Upgrade to a paid account to send to any number.

If SMS fails for any reason (invalid number, Twilio not configured, etc.), the system **automatically falls back to Email** and logs the failure.

---

## ☁️ Deploy on Render (Free)

### Step 1 — MongoDB Atlas (Free)
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free M0 cluster
2. Create a database user with password
3. Whitelist `0.0.0.0/0` in Network Access
4. Copy the connection string

### Step 2 — Push to GitHub
```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/smart-insurance.git
git push -u origin main
```

### Step 3 — Deploy Backend on Render
1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. Add Environment Variables (from your `.env`)
5. Deploy → copy the backend URL (e.g. `https://smart-insurance-api.onrender.com`)

### Step 4 — Seed admin (run once)
After first deploy, in Render's **Shell** tab:
```bash
npm run seed
```

### Step 5 — Deploy Frontend on Render
1. New → **Static Site**
2. Connect same GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add env var: `VITE_API_URL=https://smart-insurance-api.onrender.com/api`
5. Add a **Rewrite Rule**: `/*` → `/index.html` (for React Router)
6. Deploy → your app is live!

### Step 6 — Set CORS
Back in backend service → Add env var:
```
CLIENT_URL=https://your-frontend-name.onrender.com
```
Redeploy the backend.

---

## ⚠️ Render Free Tier Notes

| Feature              | Free Plan | Paid Plan |
|----------------------|-----------|-----------|
| Instances            | 1 only    | Multiple  |
| Auto-scaling         | ❌ No     | ✅ Yes    |
| Sleep after inactivity| ✅ Yes (15min) | ❌ No |
| Custom domain        | ✅ Yes    | ✅ Yes    |
| Cron job uptime      | Limited   | Reliable  |

**Important**: On the free plan, your backend will **spin down after 15 minutes of inactivity**. The first request after sleep takes ~30 seconds. For production use, upgrade to the **Starter plan ($7/month)** or use a free uptime monitor like [UptimeRobot](https://uptimerobot.com) to ping your API every 14 minutes.

---

## 🔔 Reminder Schedule

### Leads
| Days Before Purchase | Action |
|----------------------|--------|
| 30 days              | Single reminder |
| 15 days              | Single reminder |
| 7 days               | Single reminder |
| ≤ 0 days (daily)     | Daily until purchased/closed |

### Renewals
| Days Before Due Date | Action |
|----------------------|--------|
| 30 days              | Single reminder |
| 15 days              | Single reminder |
| 7 days               | Single reminder |
| 3 days               | Single reminder |
| ≤ 0 days (daily)     | Daily until renewed/expired |

---

## 🔑 Default Login
```
Email: admin@insurance.com
Password: Admin@123
```
**Change this immediately after first login!**

---

## 📡 API Reference

| Method | Endpoint                     | Description            |
|--------|------------------------------|------------------------|
| POST   | /api/auth/login              | Login                  |
| GET    | /api/auth/me                 | Current user           |
| POST   | /api/auth/register           | Create agent (admin)   |
| GET    | /api/dashboard               | Dashboard stats        |
| GET    | /api/leads                   | List leads             |
| POST   | /api/leads                   | Create lead            |
| PUT    | /api/leads/:id               | Update lead            |
| PATCH  | /api/leads/:id/action        | Quick action           |
| DELETE | /api/leads/:id               | Delete lead            |
| GET    | /api/renewals                | List renewals          |
| POST   | /api/renewals                | Create renewal         |
| PUT    | /api/renewals/:id            | Update renewal         |
| PATCH  | /api/renewals/:id/action     | Quick action           |
| DELETE | /api/renewals/:id            | Delete renewal         |
| GET    | /api/alerts                  | Active alerts          |
| POST   | /api/alerts/trigger          | Manually send reminders|
| GET    | /api/alerts/logs             | Notification history   |

---

## 🔒 Security Best Practices

- Change `JWT_SECRET` to a random 64-char string in production
- Change default admin password immediately
- Use MongoDB Atlas IP allowlist instead of `0.0.0.0/0` if possible
- Enable Gmail 2FA and use App Passwords (not main password)
- Keep `NODE_ENV=production` in deployment

---

Built with ❤️ for insurance professionals.
