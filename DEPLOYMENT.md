# Subsync — Build, Test & Deploy Guide

**Stack:** React (Vite) → Nginx | Node.js → PM2 | MySQL | Redis  
**Platform:** VPS (no Docker)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Local Development Setup](#2-local-development-setup)
3. [Testing](#3-testing)
4. [Building for Production](#4-building-for-production)
5. [VPS Production Deployment (First Time)](#5-vps-production-deployment-first-time)
6. [Deploying Updates (Subsequent Deploys)](#6-deploying-updates-subsequent-deploys)
7. [Mobile APK Build & Distribution](#7-mobile-apk-build--distribution)
8. [Monitoring & Maintenance](#8-monitoring--maintenance)
9. [Rollback Procedure](#9-rollback-procedure)
10. [Environment Variables Reference](#10-environment-variables-reference)

---

## 1. Project Structure

```
subsync/
├── server/          ← Node.js backend (Express) — runs on PM2
│   ├── index.js     ← Entry point (port 3000)
│   ├── .env         ← Server secrets (never commit)
│   └── migrations/  ← DB migration files
│
├── subsync/         ← React frontend (Vite)
│   ├── .env         ← Frontend env (VITE_API_URL etc.)
│   ├── src/         ← React source code
│   ├── dist/        ← Built output → copied to Nginx
│   └── android/     ← Capacitor Android project
│
└── DEPLOYMENT.md    ← This file
```

---

## 2. Local Development Setup

### Prerequisites (first time only)

- Node.js 18+
- MySQL running locally
- Redis running locally (`redis-server`)

### Start Backend

```bash
cd d:\RMS\subsync\server

# Copy and fill in your env
copy .env.example .env

# Install dependencies (first time)
npm install

# Start with nodemon (auto-restarts on changes)
npm start
# Server runs at http://localhost:3000
```

### Start Frontend

```bash
cd d:\RMS\subsync\subsync

# Copy and fill in your env
copy .env.example .env
# Set VITE_API_URL=http://localhost:3000/api

# Install dependencies (first time)
npm install

# Start Vite dev server
npm run dev
# Frontend runs at http://localhost:5173
```

### Local `.env` values

```env
# subsync/subsync/.env
VITE_API_URL=http://localhost:3000/api
VITE_JWT_EXPIRY=86400
```

```env
# subsync/server/.env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=ocs_srms
JWT_SECRET=your_dev_secret
NODE_PORT=3000
CLIENT_PORT=5173
HOME_IP=localhost
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 3. Testing

### 3.1 Test Backend API (Health Check)

```bash
curl http://localhost:3000/api/health
# or open in browser
```

### 3.2 Test DCR / Call Log Feature (Browser Simulation)

Open browser DevTools Console while on the app and run:

```javascript
window.dispatchEvent(
  new CustomEvent("callEnded", {
    detail: {
      phoneNumber: "9994418145",
      duration: 180,
      callType: "incoming",
      timestamp: Date.now(),
    },
  }),
);
```

**Expected:** Post-call modal appears with contact lookup.

### 3.3 Test on Real Android Device (LAN)

1. Find your PC's LAN IP (e.g. `192.168.0.27`)
2. Update `subsync/subsync/.env`:
   ```env
   VITE_API_URL=http://192.168.0.27:3000/api
   ```
3. Build and install debug APK (see [Section 7](#7-mobile-apk-build--distribution))
4. Make/receive a real call → modal should appear within 2 seconds

### 3.4 Verify Database Entry After Call Log

```sql
SELECT * FROM dcr_entries ORDER BY created_at DESC LIMIT 5;
```

Should show: `call_duration`, `call_type`, `contact_phone_number`, `customer_id`

### 3.5 Test Email Reports

```bash
# Trigger the DCR daily report manually via Bull Board
# Open: http://localhost:3000/admin/queues
# Or test via a direct API call (if route exists)
```

---

## 4. Building for Production

> **Always build on your local machine, then transfer to VPS.**  
> Never build directly on the VPS (it's slow and risky).

### Step 1 — Set Production Environment

Update `subsync/subsync/.env` to point to your **VPS**:

```env
VITE_API_URL=https://yourdomain.com/api
# OR if no domain yet:
VITE_API_URL=http://YOUR_VPS_IP:3000/api

VITE_JWT_EXPIRY=86400
```

### Step 2 — Build the Frontend

```bash
cd d:\RMS\subsync\subsync
npm run build
```

Output: `subsync/subsync/dist/` — this is what Nginx will serve.

### Step 3 — Transfer Built Files to VPS

```bash
# Option A: SCP (direct copy)
scp -r dist/* root@YOUR_VPS_IP:/var/www/subsync/

# Option B: rsync (faster for updates, skips unchanged files)
rsync -avz --delete dist/ root@YOUR_VPS_IP:/var/www/subsync/
```

### Step 4 — Transfer Backend to VPS (if backend changed)

```bash
# Sync backend files (exclude node_modules and .env)
rsync -avz --exclude='node_modules' --exclude='.env' \
  d:\RMS\subsync\server/ root@YOUR_VPS_IP:/var/www/subsync-server/
```

---

## 5. VPS Production Deployment (First Time)

SSH into your VPS and do this **once**:

### 5.1 Install System Dependencies

```bash
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 (global process manager)
npm install -g pm2

# Nginx
sudo apt install -y nginx

# Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# MySQL (if not installed)
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### 5.2 Set Up Directories

```bash
sudo mkdir -p /var/www/subsync          # Frontend static files
sudo mkdir -p /var/www/subsync-server   # Backend Node.js app
sudo mkdir -p /var/www/downloads        # APK download folder
sudo chown -R $USER:$USER /var/www/
```

### 5.3 Set Up MySQL Database

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE ocs_srms;
CREATE USER 'subsync'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON ocs_srms.* TO 'subsync'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5.4 Deploy Backend

```bash
# Files should already be transferred (Step 4 above)
cd /var/www/subsync-server

# Create production .env
nano .env
```

Fill in your production `.env` (see [Section 10](#10-environment-variables-reference)):

```env
DB_HOST=localhost
DB_USER=subsync
DB_PASS=your_strong_password
DB_NAME=ocs_srms
JWT_SECRET=a_very_long_random_string_here
NODE_PORT=3000
CLIENT_PORT=80
HOME_IP=YOUR_VPS_IP
REDIS_HOST=localhost
REDIS_PORT=6379
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hathish113@gmail.com
SMTP_PASS=sihk xthp mekn havc
SMTP_FROM=hathish113@gmail.com
APP_BASE_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,http://yourdomain.com,capacitor://localhost
BULL_BOARD_AUTH=admin:CHANGE_ME_NOW
ADMIN_EMAILS=hari@ocsindia.net
NODE_ENV=production
```

```bash
# Install backend dependencies
npm install --omit=dev

# Test it runs before handing to PM2
node index.js
# Verify: "Server is running at http://localhost:3000"
# Press Ctrl+C once confirmed
```

### 5.5 Start Backend with PM2

```bash
cd /var/www/subsync-server

# Start with PM2
pm2 start index.js --name "subsync-backend" --interpreter node

# Make PM2 auto-start on server reboot
pm2 startup
# ↑ Copy and run the command it outputs (starts with: sudo env PATH=...)

pm2 save

# Verify running
pm2 status
pm2 logs subsync-backend --lines 30
```

### 5.6 Deploy Frontend to Nginx

```bash
# Files should already be in /var/www/subsync/ (from Step 3)
# If not, upload them now

ls /var/www/subsync/
# Should see: index.html, assets/, etc.
```

### 5.7 Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/subsync
```

Paste this config:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # or YOUR_VPS_IP

    # Frontend — serve built React app
    root /var/www/subsync;
    index index.html;

    # SPA routing — always return index.html for client-side routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy — forward /api requests to Node.js
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        client_max_body_size 50M;
    }

    # Bull Board (queue monitoring) — proxy
    location /admin/queues {
        proxy_pass http://localhost:3000/admin/queues;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # APK Download
    location /download/app {
        alias /var/www/downloads/;
        add_header Content-Disposition 'attachment; filename="Subsync.apk"';
        add_header Content-Type application/vnd.android.package-archive;
        try_files /subsync.apk =404;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    error_log /var/log/nginx/subsync_error.log warn;
    access_log /var/log/nginx/subsync_access.log combined;
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/subsync /etc/nginx/sites-enabled/

# Remove default site (if conflicting)
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
sudo systemctl enable nginx
```

### 5.8 Verify Everything is Running

```bash
# Backend
pm2 status
curl http://localhost:3000/api/

# Frontend via Nginx
curl -I http://localhost/

# Full stack test (API through Nginx)
curl http://localhost/api/

# APK download (after uploading subsync.apk)
curl -I http://localhost/download/app
```

---

## 6. Deploying Updates (Subsequent Deploys)

This is your regular deploy flow every time you make changes.

### Frontend-Only Changes

```bash
# --- On LOCAL machine ---

# 1. Make your code changes

# 2. Build
cd d:\RMS\subsync\subsync
npm run build

# 3. Transfer to VPS (rsync is fast — only syncs changed files)
rsync -avz --delete dist/ root@YOUR_VPS_IP:/var/www/subsync/

# --- That's it! Nginx serves static files directly, no restart needed ---
```

### Backend-Only Changes

```bash
# --- On LOCAL machine ---

# 1. Transfer changed backend files
rsync -avz --exclude='node_modules' --exclude='.env' \
  d:\RMS\subsync\server/ root@YOUR_VPS_IP:/var/www/subsync-server/

# --- On VPS (SSH in) ---

cd /var/www/subsync-server

# 2. Install any new dependencies (skip if package.json didn't change)
npm install --omit=dev

# 3. Restart backend with PM2 (zero-downtime reload)
pm2 reload subsync-backend

# 4. Verify restart
pm2 status
pm2 logs subsync-backend --lines 20
```

### Both Frontend + Backend Changed

```bash
# --- On LOCAL machine ---

# Build frontend
cd d:\RMS\subsync\subsync
npm run build

# Transfer frontend
rsync -avz --delete dist/ root@YOUR_VPS_IP:/var/www/subsync/

# Transfer backend
rsync -avz --exclude='node_modules' --exclude='.env' \
  d:\RMS\subsync\server/ root@YOUR_VPS_IP:/var/www/subsync-server/

# --- On VPS ---
cd /var/www/subsync-server
npm install --omit=dev
pm2 reload subsync-backend
pm2 logs subsync-backend --lines 30
```

### After Adding New npm Packages to Backend

```bash
# On VPS
cd /var/www/subsync-server
npm install --omit=dev
pm2 reload subsync-backend
```

---

## 7. Mobile APK Build & Distribution

### 7.1 Building a Debug APK (For Testing)

```bash
# --- On LOCAL machine ---

# 1. Set LAN or VPS API URL in frontend .env
# subsync/subsync/.env
VITE_API_URL=http://192.168.0.27:3000/api  # use your PC's LAN IP for device testing

# 2. Build frontend
cd d:\RMS\subsync\subsync
npm run build

# 3. Sync to Android project
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```

In Android Studio:

- **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- APK output: `android/app/build/outputs/apk/debug/app-debug.apk`
- Transfer to phone and install (enable "Install from unknown sources")

### 7.2 Building a Release APK (For Distribution)

```bash
# 1. Set production API URL
# subsync/subsync/.env
VITE_API_URL=https://yourdomain.com/api

# 2. Build
cd d:\RMS\subsync\subsync
npm run build

# 3. Sync
npx cap sync android

# 4. Open Android Studio
npx cap open android
```

In Android Studio:

- **Build → Generate Signed Bundle / APK**
- Choose **APK**
- Select or create a **keystore** (keep this file safe — you need it for updates!)
  - Store as `subsync-release.jks` in a safe location
  - Remember the key alias and passwords
- Select **Release** build variant
- Click **Finish**
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### 7.3 Upload APK to VPS for Download

```bash
# Upload APK from local to VPS
scp d:\RMS\subsync\subsync\android\app\build\outputs\apk\release\app-release.apk \
    root@YOUR_VPS_IP:/var/www/downloads/subsync.apk
```

Users can now download from:

```
http://yourdomain.com/download/app
```

### 7.4 Testing Call Detection on Device

1. Install APK → open app → login
2. Grant all permissions (Phone state, Call log, Notifications)
3. Make or receive a real call, talk ~30 seconds, hang up
4. **Expected:** Modal appears within 2 seconds showing number, duration, customer match
5. Click "Log DCR" → verify entry in DB:
   ```sql
   SELECT * FROM dcr_entries ORDER BY created_at DESC LIMIT 1;
   ```

**Debugging failed detection:**

```
Android Studio → Logcat → Filter by tag: CallDetector
```

**Xiaomi / Oppo / Vivo battery issue:**
Settings → Apps → Subsync → Battery → set to "Unrestricted" (or "No restrictions")

---

## 8. Monitoring & Maintenance

### PM2 Commands

```bash
pm2 status                          # View all processes
pm2 logs subsync-backend            # Live logs
pm2 logs subsync-backend --lines 100  # Last 100 log lines
pm2 reload subsync-backend          # Zero-downtime restart
pm2 restart subsync-backend         # Hard restart
pm2 stop subsync-backend            # Stop
pm2 monit                           # Real-time CPU/memory dashboard
```

### Nginx Commands

```bash
sudo nginx -t                       # Test config syntax
sudo systemctl reload nginx         # Reload config (no downtime)
sudo systemctl restart nginx        # Full restart
sudo tail -f /var/log/nginx/subsync_error.log    # Error logs
sudo tail -f /var/log/nginx/subsync_access.log   # Access logs
```

### MySQL Commands

```bash
sudo mysql -u subsync -p ocs_srms   # Connect to DB
SHOW TABLES;                         # List tables
```

### Redis Commands

```bash
redis-cli ping                      # Should reply PONG
redis-cli info                      # Stats
sudo systemctl status redis-server  # Service status
```

### Bull Board (Queue Monitoring)

```
http://yourdomain.com/admin/queues
# Login with BULL_BOARD_AUTH from your .env (format: user:password)
```

---

## 9. Rollback Procedure

### Frontend Rollback

```bash
# On LOCAL: keep a backup of the previous dist folder before deploying
# If something breaks, rsync the old dist back:
rsync -avz --delete old-dist/ root@YOUR_VPS_IP:/var/www/subsync/
```

### Backend Rollback

```bash
# Option A: Keep previous version in a backup folder on VPS
cp -r /var/www/subsync-server /var/www/subsync-server-backup-$(date +%Y%m%d)

# Option B: Use PM2 to revert
pm2 logs subsync-backend    # identify the error first
pm2 reload subsync-backend  # try a reload first
```

---

## 10. Environment Variables Reference

### `server/.env` — Production Values

| Variable          | Example                                        | Description                            |
| ----------------- | ---------------------------------------------- | -------------------------------------- |
| `DB_HOST`         | `localhost`                                    | MySQL host                             |
| `DB_USER`         | `subsync`                                      | MySQL user                             |
| `DB_PASS`         | `yourpassword`                                 | MySQL password                         |
| `DB_NAME`         | `ocs_srms`                                     | Database name                          |
| `JWT_SECRET`      | `a_very_long_random_string`                    | JWT signing secret — keep this secret! |
| `NODE_PORT`       | `3000`                                         | Backend port                           |
| `CLIENT_PORT`     | `80`                                           | Frontend port (80 = Nginx)             |
| `REDIS_HOST`      | `localhost`                                    | Redis host                             |
| `REDIS_PORT`      | `6379`                                         | Redis port                             |
| `EMAIL_PROVIDER`  | `smtp`                                         | Email method                           |
| `SMTP_HOST`       | `smtp.gmail.com`                               | SMTP server                            |
| `SMTP_PORT`       | `587`                                          | SMTP port                              |
| `SMTP_USER`       | `hathish113@gmail.com`                         | SMTP login                             |
| `SMTP_PASS`       | `app password`                                 | Gmail app password                     |
| `APP_BASE_URL`    | `https://yourdomain.com`                       | Used in email links                    |
| `ALLOWED_ORIGINS` | `https://yourdomain.com,capacitor://localhost` | CORS origins                           |
| `BULL_BOARD_AUTH` | `admin:strongpassword`                         | Queue monitor login                    |
| `ADMIN_EMAILS`    | `hari@ocsindia.net`                            | Alert recipients                       |
| `NODE_ENV`        | `production`                                   | Environment flag                       |

### `subsync/subsync/.env` — Production Values

| Variable          | Example                      | Description                              |
| ----------------- | ---------------------------- | ---------------------------------------- |
| `VITE_API_URL`    | `https://yourdomain.com/api` | Backend API URL (baked in at build time) |
| `VITE_JWT_EXPIRY` | `86400`                      | Token expiry in seconds (24h)            |

> ⚠️ **`VITE_API_URL` is baked into the frontend bundle at build time.** If you change it, you must rebuild and redeploy the frontend.

---

## Quick Cheatsheet

```bash
# ── LOCAL ──────────────────────────────────────────────────
npm run dev              # Start frontend dev server (subsync/)
npm start                # Start backend dev server (server/)

npm run build            # Build frontend for production (subsync/)
npx cap sync android     # Push built web to Android project
npx cap open android     # Open Android Studio

# ── DEPLOY ─────────────────────────────────────────────────
# Transfer frontend
rsync -avz --delete dist/ root@VPS:/var/www/subsync/

# Transfer backend
rsync -avz --exclude='node_modules' --exclude='.env' server/ root@VPS:/var/www/subsync-server/

# ── VPS ────────────────────────────────────────────────────
pm2 reload subsync-backend      # Restart backend (zero-downtime)
pm2 logs subsync-backend        # Live backend logs
pm2 status                      # Check process status
sudo nginx -t && sudo systemctl reload nginx  # Reload nginx
```
