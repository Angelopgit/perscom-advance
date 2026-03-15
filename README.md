<div align="center">

# PERSCOM Advance

**The professional personnel management platform built for serious Milsim units.**

[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)](https://github.com/perscomadvance/perscom-advance/releases)
[![License](https://img.shields.io/badge/license-Commercial-red?style=flat-square)](./docs/LICENSING.md)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square)](https://nodejs.org)
[![Discord](https://img.shields.io/badge/Discord-Integration-5865F2?style=flat-square&logo=discord)](./docs/DISCORD_SETUP.md)

[**Get a License →**](https://perscomadvance.com) · [Documentation](./docs/SETUP.md) · [Changelog](./CHANGELOG.md)

</div>

---

## What is PERSCOM Advance?

PERSCOM Advance is a self-hosted personnel and operations management platform designed for serious Milsim (military simulation) communities. It gives your unit a professional, centralized hub for tracking personnel, planning operations, managing evaluations, and syncing with Discord — all branded as your own.

You host it. You own your data. No vendor lock-in.

---

## ✦ Features

| | Feature | Description |
|---|---|---|
| 🎖️ | **Personnel Management** | Full roster with ranks, roles, MOS/specialty, join dates, and service records |
| 📋 | **Operations Center** | Plan, track, and debrief operations with attendance and AAR reports |
| ⭐ | **Evaluation System** | Structured performance evaluations with scoring and promotion readiness |
| 🤖 | **Discord Integration** | Automatic role sync, rank updates, and announcements to your Discord server |
| 🗺️ | **Live ORBAT** | Dynamic Order of Battle showing your unit's structure and chain of command |
| 📄 | **Document Repository** | SOPs, training guides, unit policies, and reference materials |
| 🎽 | **Gear Loadouts** | Track and standardize equipment configurations |
| 📊 | **Analytics Dashboard** | Personnel trends, activity metrics, and a live countdown to next op |
| 🔧 | **Full Customization** | Your name, logo, colors, and Discord — configured in a single JSON file |

---

## ⚡ Quick Start

```bash
# 1. Clone
git clone https://github.com/perscomadvance/perscom-advance.git
cd perscom-advance/perscom

# 2. Configure
cd backend && cp .env.example .env
# → Add your PERSCOM_LICENSE_KEY to .env
# → Edit unit.config.json with your unit details

# 3. Install & build
npm install
cd ../frontend && npm install && npm run build

# 4. Initialize database
cd ../backend && npm run setup

# 5. Launch
npm start
```

Full instructions: [docs/SETUP.md](./docs/SETUP.md)

---

## 📋 Requirements

> A valid PERSCOM Advance license is required. [Subscribe at perscomadvance.com →](https://perscomadvance.com)

| Requirement | Version / Notes |
|---|---|
| **Node.js** | 18.0.0 or higher |
| **npm** | 9.0.0 or higher |
| **Server** | Linux, Windows, or macOS VPS with public internet access |
| **RAM** | 1 GB minimum |
| **Storage** | 10 GB minimum |
| **License Key** | Required — issued after subscribing at [perscomadvance.com](https://perscomadvance.com) |
| **Discord Bot** | Optional — for Discord integration features |

---

## 📚 Documentation

| Guide | Description |
|---|---|
| [Setup Guide](./docs/SETUP.md) | Full installation and deployment walkthrough |
| [Customization](./docs/CUSTOMIZATION.md) | Unit branding, colors, features, and rank structure |
| [Discord Setup](./docs/DISCORD_SETUP.md) | Discord bot configuration and role sync |
| [Updates](./docs/UPDATES.md) | How to pull and apply updates |
| [Licensing](./docs/LICENSING.md) | License terms, validation, and renewal |

---

## 🔄 Updates

PERSCOM Advance updates are delivered through this repository. When an update is available, your instance will log a notification. To update:

```bash
git pull origin main
cd perscom/backend && npm install
cd ../frontend && npm run build
pm2 restart perscom-advance
```

---

## 📜 License

PERSCOM Advance is **commercial software**. A valid active subscription is required to use it.
By deploying this software you agree to the [Terms of Service](https://perscomadvance.com/terms).

© 2026 PERSCOM Advance. All rights reserved.

---

<div align="center">
  <strong>Built for units that take their game seriously.</strong><br/>
  <a href="https://perscomadvance.com">perscomadvance.com</a>
</div>
