# PERSCOM Advance — Discord Bot Setup

PERSCOM Advance includes a Discord bot that syncs ranks, roles, and announcements between your PERSCOM instance and your Discord server.

---

## Step 1 — Create a Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → name it (e.g., "PERSCOM Bot")
3. Go to the **Bot** tab → click **Add Bot**
4. Under Token, click **Reset Token** → copy and save it securely

---

## Step 2 — Set Bot Permissions

In the **Bot** tab, enable these **Privileged Gateway Intents**:
- ✓ Server Members Intent
- ✓ Message Content Intent

Under **OAuth2 → URL Generator**, select:
- Scopes: `bot`, `applications.commands`
- Bot Permissions:
  - Manage Roles
  - Send Messages
  - Read Messages/View Channels
  - Embed Links
  - Use Slash Commands

---

## Step 3 — Invite Bot to Your Server

1. Copy the generated OAuth2 URL
2. Paste it in your browser and authorize it to your Discord server
3. Confirm the bot has appeared in your server's member list

---

## Step 4 — Get Your Server ID

1. In Discord, go to **User Settings → Advanced** → enable **Developer Mode**
2. Right-click your server name → **Copy Server ID**

---

## Step 5 — Configure PERSCOM Advance

Add the following to `backend/unit.config.json`:

```json
"discordGuildId": "YOUR_SERVER_ID_HERE",
"discordBotToken": "YOUR_BOT_TOKEN_HERE"
```

Or set them in your `.env`:
```env
DISCORD_GUILD_ID=your_server_id
DISCORD_BOT_TOKEN=your_bot_token
```

---

## Features

### Automatic Role Sync
When a personnel member's rank is updated in PERSCOM, the bot automatically updates their Discord role to match.

**Setup:** In the admin panel, go to **Settings → Discord** and map PERSCOM ranks to Discord roles.

### Announcement Sync
Announcements posted in PERSCOM can be automatically forwarded to a designated Discord channel.

**Setup:** Set an `announcementsChannelId` in the Discord settings panel.

### Promotion Notifications
When a marine is promoted, the bot posts a promotion message in a designated channel.

### Available Bot Commands
| Command | Description |
|---------|-------------|
| `/perscom roster` | Shows current active roster |
| `/perscom profile @user` | Shows a member's PERSCOM profile |
| `/perscom ops` | Lists upcoming operations |

---

## Troubleshooting

**Bot doesn't come online:**
- Double-check the bot token in `unit.config.json`
- Ensure the token hasn't been reset in the Discord Developer Portal

**Role sync not working:**
- Ensure the bot's role is positioned **above** the roles it needs to manage in Discord's role hierarchy
- Verify the Guild ID is correct

**Missing permissions error:**
- Re-invite the bot using a fresh OAuth2 URL with all required permissions
