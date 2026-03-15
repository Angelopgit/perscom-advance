# PERSCOM Advance — Customization Guide

All visual branding and configuration is controlled through `backend/unit.config.json`. No code changes required.

---

## unit.config.json Reference

```json
{
  "unitName": "Your Unit Name",
  "unitAbbreviation": "YUN",
  "unitLogo": "/uploads/logo.png",
  "primaryColor": "#1e40af",
  "accentColor": "#3b82f6",
  "discordGuildId": "",
  "discordBotToken": "",
  "timezone": "America/New_York",
  "theme": "dark",
  "welcomeMessage": "Welcome to PERSCOM. Please log in to continue.",
  "features": {
    "operations": true,
    "evaluations": true,
    "orbat": true,
    "documents": true,
    "gearLoadouts": true,
    "attendance": true,
    "spotlights": true
  }
}
```

---

## Fields

### `unitName`
Full name of your unit displayed in the header and dashboard.
Example: `"1st Battalion, 5th Marines"`

### `unitAbbreviation`
Short abbreviation used in compact displays.
Example: `"1/5"`

### `unitLogo`
Path to your unit's logo image. Upload your logo via the admin Settings page and the path will update automatically. Supports PNG, JPG, SVG. Recommended size: 200×200px.

### `primaryColor` / `accentColor`
Hex color codes for your unit's brand colors. These apply to buttons, highlights, and active states throughout the UI.

```json
"primaryColor": "#c41e3a",
"accentColor": "#ff6b6b"
```

### `discordGuildId` / `discordBotToken`
Your Discord server's Guild ID and bot token for Discord integration. See [DISCORD_SETUP.md](./DISCORD_SETUP.md).

### `timezone`
Your unit's primary timezone for displaying event times and operation schedules. Uses IANA timezone format.

Common values:
- `"America/New_York"` — US Eastern
- `"America/Chicago"` — US Central
- `"America/Los_Angeles"` — US Pacific
- `"Europe/London"` — UK
- `"Europe/Berlin"` — Central Europe
- `"UTC"` — Universal

### `theme`
UI theme. Currently `"dark"` is the default and recommended.

### `welcomeMessage`
Message displayed on the login page below your unit logo.

### `features`
Toggle individual PERSCOM modules on or off. Disabled modules are hidden from navigation.

| Feature | Description |
|---------|-------------|
| `operations` | Operations planning and tracking |
| `evaluations` | Personnel evaluation system |
| `orbat` | Order of Battle visualization |
| `documents` | Document repository |
| `gearLoadouts` | Equipment loadout management |
| `attendance` | Attendance tracking |
| `spotlights` | Personnel spotlight carousel on dashboard |

---

## Applying Config Changes

Config changes take effect after a server restart, or instantly via the admin API:

```bash
curl -X POST http://localhost:3001/api/settings/reload-config \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Logo Upload

1. Log in as admin
2. Go to **Settings → Unit Branding**
3. Upload your logo (PNG or SVG recommended)
4. It will be saved to `uploads/logo.png` and referenced by the UI automatically

---

## Custom Rank Structure

To define custom ranks, add them to `unit.config.json` (or manage them via the admin Ranks page in the UI):

```json
"ranks": [
  { "name": "Private", "abbreviation": "PVT", "tier": 1 },
  { "name": "Corporal", "abbreviation": "CPL", "tier": 2 },
  { "name": "Sergeant", "abbreviation": "SGT", "tier": 3 }
]
```
