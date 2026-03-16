# PERSCOM Advance — Setup Guide

This guide walks you through deploying PERSCOM Advance on your own server.

> **Tip:** Run `install.sh` at the repo root to automate Steps 1–6 in a single command.
> Manual steps are documented below for those who prefer full control.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **npm 9+** installed ([nodejs.org](https://nodejs.org))
- **Git** installed
- A **Linux/Windows/macOS server or VPS** with a public IP address (DigitalOcean, Hetzner, Linode, or Railway are all great choices)
- A valid **PERSCOM Advance license key** — subscribe at [perscomadvance.com](https://perscomadvance.com)
- A **domain name** (optional but recommended for production)
- Minimum specs: **1GB RAM**, **10GB storage**, internet access

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/Angelopgit/perscom-advance.git
cd perscom-advance
```

---

## Step 2 — Configure Your Environment

```bash
cd perscom/backend
cp .env.example .env
nano .env
```

Set these three values at minimum:

```env
PERSCOM_LICENSE_KEY=PCMA-XXXX-XXXX-XXXX-XXXX   # From perscomadvance.com
APP_DOMAIN=https://yourdomain.com               # Your deployment URL (no trailing slash)
JWT_SECRET=<64-char hex string>                 # Generate with command below
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> **CORS note:** `APP_DOMAIN` must exactly match the URL users open in their browser — including `https://` and without a trailing slash.

---

## Step 3 — Configure Your Unit

From `perscom/backend/`, edit `unit.config.json` with your unit's details:

```json
{
  "unitName": "1st Battalion, 5th Marines",
  "unitAbbreviation": "1/5",
  "primaryColor": "#c41e3a",
  "accentColor": "#e63950"
}
```

> **Discord note:** If you use the Discord bot, set `discordBotToken` and `discordGuildId` here. Do **not** commit this file to a public repo with a real bot token — move it to `.env` via `DISCORD_BOT_TOKEN` instead.

See [CUSTOMIZATION.md](./CUSTOMIZATION.md) for all available options.

---

## Step 4 — Install Dependencies

From the repo root:

```bash
cd perscom/backend && npm install
cd ../frontend && npm install
```

---

## Step 5 — Initialize the Database

```bash
cd perscom/backend
npm run setup
```

This creates the SQLite database and seeds default data (ranks, roles, initial admin account).

---

## Step 6 — Build the Frontend

```bash
cd perscom/frontend
npm run build
```

Built files are output to `frontend/dist/` and served automatically by the backend.

---

## Step 7 — Start the Server

```bash
cd perscom/backend
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║       PERSCOM Advance is running       ║
╚════════════════════════════════════════╝
  Unit    : 1st Battalion, 5th Marines
  Port    : 3001
  Mode    : production
  License : ✓ Valid
```

Your instance is now available at `http://your-server-ip:3001`.

---

## Step 8 — First Login

Navigate to your deployment URL. Default admin credentials:

- **Username:** `admin`
- **Password:** `changeme123`

**Change the password immediately** after first login via Settings → Account.

---

## Production Deployment

### Keep It Running with PM2

```bash
npm install -g pm2
cd perscom/backend
pm2 start src/server.js --name perscom-advance
pm2 save
pm2 startup
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Free SSL certificate via Certbot:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| License shows "✗ Invalid" | Check `PERSCOM_LICENSE_KEY` in `.env`, verify internet access (port 443 outbound), confirm subscription is active |
| CORS errors in browser | Ensure `APP_DOMAIN` in `.env` exactly matches the URL in the browser (no trailing slash) |
| Port already in use | Set `PORT=3002` in `.env` |
| Frontend shows blank page | Run `npm run build` in `frontend/`, confirm `NODE_ENV=production` in `.env` |
| Discord bot not connecting | Verify `discordBotToken` and `discordGuildId` in `unit.config.json` or `.env` |
| Database errors | Delete `backend/data/perscom.db` and re-run `npm run setup` (resets all data) |
| Update notifications on startup | Run `git pull && npm install`, rebuild frontend, restart server |
