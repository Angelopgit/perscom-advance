# PERSCOM Advance — Setup Guide

This guide walks you through deploying PERSCOM Advance on your own server.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **npm 9+** installed on your server
- **Git** installed
- A **Linux/Windows/macOS server or VPS** with a public IP address (DigitalOcean, Hetzner, Linode, or Railway are all great choices)
- A valid **PERSCOM Advance license key** — subscribe at [perscomadvance.com](https://perscomadvance.com)
- A **domain name** (optional but recommended for production)
- Minimum specs: **1GB RAM**, **10GB storage**, internet access

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/perscomadvance/perscom-advance.git
cd perscom-advance/perscom
```

---

## Step 2 — Configure Your Environment

Copy the example environment file and fill in your values:

```bash
cd backend
cp .env.example .env
nano .env
```

At minimum, set these values in `.env`:

```env
PERSCOM_LICENSE_KEY=your_license_key_here   # From perscomadvance.com
APP_DOMAIN=https://yourdomain.com           # Your deployment URL
JWT_SECRET=your_random_64_char_secret       # Generate below
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 3 — Configure Your Unit

Edit `backend/unit.config.json` with your unit's details:

```json
{
  "unitName": "1st Battalion, 5th Marines",
  "unitAbbreviation": "1/5",
  "primaryColor": "#c41e3a",
  "discordGuildId": "your_discord_server_id",
  "discordBotToken": "your_discord_bot_token"
}
```

See [CUSTOMIZATION.md](./CUSTOMIZATION.md) for all available options.

---

## Step 4 — Install Dependencies

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies:
```bash
cd ../frontend
npm install
```

---

## Step 5 — Initialize the Database

```bash
cd backend
npm run setup
```

This creates the SQLite database and seeds default data (ranks, roles, initial admin account).

---

## Step 6 — Build the Frontend

```bash
cd ../frontend
npm run build
```

The built files are output to `frontend/dist/` and served by the backend in production.

---

## Step 7 — Start the Server

```bash
cd ../backend
npm start
```

You should see output like:
```
╔════════════════════════════════════════╗
║       PERSCOM Advance is running       ║
╚════════════════════════════════════════╝
  Unit    : 1st Battalion, 5th Marines
  Port    : 3001
  Mode    : production
  License : ✓ Valid
```

Your PERSCOM instance is now running at `http://your-server-ip:3001`.

---

## Step 8 — First Login

Navigate to your deployment URL. The default admin credentials are:

- **Username:** `admin`
- **Password:** `changeme123`

**Change the password immediately** after first login via Settings → Account.

---

## Production Deployment

### Using PM2 (Recommended)

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

Get a free SSL certificate with Certbot:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## Troubleshooting

**License shows "✗ Invalid" at startup:**
- Double-check your `PERSCOM_LICENSE_KEY` in `.env`
- Ensure your server has outbound internet access (port 443)
- Verify your subscription is active at perscomadvance.com

**Port already in use:**
- Change `PORT=3002` in your `.env` file

**Frontend shows blank page:**
- Ensure you ran `npm run build` in the `frontend` directory
- Check that `NODE_ENV=production` is set in `.env`

**Discord bot not connecting:**
- Verify `discordBotToken` and `discordGuildId` in `unit.config.json`
- See [DISCORD_SETUP.md](./DISCORD_SETUP.md) for full instructions

**Database errors:**
- Delete `backend/data/perscom.db` and re-run `npm run setup` (this resets all data)
