#!/usr/bin/env bash
# ============================================================
#  PERSCOM Advance — Automated Installer
#  Usage: bash install.sh
# ============================================================
set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo ""
echo -e "${BOLD}╔════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║     PERSCOM Advance — Installer        ║${RESET}"
echo -e "${BOLD}╚════════════════════════════════════════╝${RESET}"
echo ""

# ── Node version check ────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js is not installed. Install Node.js 18+ from https://nodejs.org${RESET}"
  exit 1
fi

NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "${RED}✗ Node.js 18+ required (found $NODE_VER). Please upgrade.${RESET}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $NODE_VER${RESET}"

# ── npm check ─────────────────────────────────────────────────
if ! command -v npm &>/dev/null; then
  echo -e "${RED}✗ npm is not installed.${RESET}"
  exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${RESET}"

echo ""

# ── Backend setup ─────────────────────────────────────────────
echo -e "${CYAN}▸ Installing backend dependencies...${RESET}"
cd "$(dirname "$0")/perscom/backend"
npm install --silent
echo -e "${GREEN}✓ Backend dependencies installed${RESET}"

# ── .env setup ────────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  # Generate a random JWT secret automatically
  JWT_SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(64).toString('hex'))")
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  else
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  fi
  echo -e "${GREEN}✓ .env created with auto-generated JWT_SECRET${RESET}"
  echo -e "${YELLOW}  → Open perscom/backend/.env and set your PERSCOM_LICENSE_KEY and APP_DOMAIN${RESET}"
else
  echo -e "${GREEN}✓ .env already exists — skipping${RESET}"
fi

# ── Ensure data/uploads dirs ──────────────────────────────────
mkdir -p uploads data
echo -e "${GREEN}✓ uploads/ and data/ directories ready${RESET}"

# ── Frontend setup ────────────────────────────────────────────
echo ""
echo -e "${CYAN}▸ Installing frontend dependencies...${RESET}"
cd ../frontend
npm install --silent
echo -e "${GREEN}✓ Frontend dependencies installed${RESET}"

echo ""
echo -e "${CYAN}▸ Building frontend...${RESET}"
npm run build --silent
echo -e "${GREEN}✓ Frontend built${RESET}"

# ── Database init ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}▸ Initializing database...${RESET}"
cd ../backend
if npm run setup --silent 2>/dev/null; then
  echo -e "${GREEN}✓ Database initialized${RESET}"
else
  echo -e "${YELLOW}  → Could not run 'npm run setup' — you may need to initialize manually${RESET}"
fi

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║  Installation complete!                                ║${RESET}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}Next steps:${RESET}"
echo -e "  1. Edit ${CYAN}perscom/backend/.env${RESET} — set PERSCOM_LICENSE_KEY and APP_DOMAIN"
echo -e "  2. Edit ${CYAN}perscom/backend/unit.config.json${RESET} — set your unit name and colors"
echo -e "  3. Run ${CYAN}cd perscom/backend && npm start${RESET}"
echo -e "  4. Open ${CYAN}http://localhost:3001${RESET} and log in with admin / changeme123"
echo ""
echo -e "  See ${CYAN}docs/SETUP.md${RESET} for full documentation."
echo ""
