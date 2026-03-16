# PERSCOM Advance — Update Guide

PERSCOM Advance updates are delivered via the public GitHub repository. When a new version is released, your PERSCOM instance will log a notification in the console.

---

## Checking Your Current Version

```bash
cat perscom/backend/package.json | grep version
```

Or check the `/api/health` endpoint:
```bash
curl http://localhost:3001/api/health
# Returns: { "version": "1.0.0", ... }
```

---

## How to Update

1. **Pull the latest changes:**
   ```bash
   cd perscom-advance
   git pull origin main
   ```

2. **Install any new dependencies:**
   ```bash
   cd perscom/backend
   npm install
   ```

3. **Rebuild the frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

4. **Restart the server:**
   ```bash
   # If using PM2:
   pm2 restart perscom-advance

   # If running directly:
   # Stop the process (Ctrl+C) and run npm start again
   ```

---

## Update Notifications

PERSCOM Advance checks for updates automatically at startup by querying the GitHub releases API. When an update is available, you'll see a message like this in your server logs:

```
┌─────────────────────────────────────────┐
│  PERSCOM Advance Update Available        │
│  Current: v1.0.0    Latest: v1.1.0      │
│  Run: git pull && npm install            │
│  then rebuild frontend and restart.      │
└─────────────────────────────────────────┘
```

---

## What NOT to Modify

To ensure smooth updates, avoid modifying core files. Instead:

- ✅ Edit `unit.config.json` for all unit customization
- ✅ Edit `.env` for environment configuration
- ✅ Upload logos and assets via the admin panel
- ❌ Do not modify files in `src/` directly — your changes will be overwritten on `git pull`

If you need custom behavior beyond what the config provides, open a feature request at [github.com/Angelopgit/perscom-advance/issues](https://github.com/Angelopgit/perscom-advance/issues).

---

## Staying on a Specific Version

If you need to pin to a specific version:

```bash
git checkout v1.0.0
```

To return to the latest:
```bash
git checkout main && git pull
```
