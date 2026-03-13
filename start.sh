#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  eQual Trading Platform — Start Script
#  Usage: bash start.sh [--build] [--reset] --> Auto build
#  --build  Force rebuild of backend Docker image
#  --reset  Wipe DB volume and start fresh (WARNING: deletes all data)
# ─────────────────────────────────────────────────────────────

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BUILD=false
RESET=false

for arg in "$@"; do
  case $arg in
    --build) BUILD=true ;;
    --reset) RESET=true ;;
  esac
done

echo -e "${CYAN}"
echo "  ███████╗ ██████╗ ██╗   ██╗ █████╗ ██╗"
echo "  ██╔════╝██╔═══██╗██║   ██║██╔══██╗██║"
echo "  █████╗  ██║   ██║██║   ██║███████║██║"
echo "  ██╔══╝  ██║▄▄ ██║██║   ██║██╔══██║██║"
echo "  ███████╗╚██████╔╝╚██████╔╝██║  ██║███████╗"
echo "  ╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝"
echo -e "${NC}"
echo -e "${CYAN}  eQual Trading Platform — Starting up...${NC}"
echo ""

# ── 0. Check dependencies ──────────────────────────────────────
echo -e "${YELLOW}[1/6] Checking dependencies...${NC}"
command -v docker   >/dev/null 2>&1 || { echo -e "${RED}✗ Docker not found. Please install Docker Desktop.${NC}"; exit 1; }
command -v node     >/dev/null 2>&1 || { echo -e "${RED}✗ Node.js not found. Please install Node.js.${NC}"; exit 1; }
command -v npm      >/dev/null 2>&1 || { echo -e "${RED}✗ npm not found.${NC}"; exit 1; }
echo -e "${GREEN}✓ Docker, Node, npm found${NC}"

# ── 1. Check .env ──────────────────────────────────────────────
echo -e "${YELLOW}[2/6] Checking .env file...${NC}"
if [ ! -f ".env" ]; then
  echo -e "${RED}✗ .env file not found in $(pwd)${NC}"
  echo -e "  Create one based on .env.example or ask your team for the file."
  exit 1
fi
echo -e "${GREEN}✓ .env found${NC}"

# ── 2. Reset (optional) ────────────────────────────────────────
if [ "$RESET" = true ]; then
  echo -e "${RED}[!] --reset flag detected — wiping DB volume...${NC}"
  docker compose down -v 2>/dev/null || true
  echo -e "${GREEN}✓ Volumes wiped${NC}"
fi

# ── 3. Start Docker services ───────────────────────────────────
echo -e "${YELLOW}[3/6] Starting Docker services (DB, Redis, API)...${NC}"
if [ "$BUILD" = true ]; then
  docker compose up -d --build
else
  docker compose up -d
fi
echo -e "${GREEN}✓ Docker services started${NC}"

# ── 4. Wait for backend to be healthy ─────────────────────────
echo -e "${YELLOW}[4/6] Waiting for backend to be ready...${NC}"
MAX_WAIT=60
WAITED=0
until curl -sf http://localhost:8001/health >/dev/null 2>&1; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}✗ Backend did not start within ${MAX_WAIT}s${NC}"
    echo -e "  Check logs: docker logs equal_api --tail 30"
    exit 1
  fi
  printf "."
  sleep 2
  WAITED=$((WAITED + 2))
done
echo ""
echo -e "${GREEN}✓ Backend healthy at http://localhost:8001${NC}"

# ── 5. Apply DB fixes ──────────────────────────────────────────
echo -e "${YELLOW}[5/6] Applying DB patches...${NC}"

# pg_hba trust (needed on Windows/asyncpg)
docker exec equal_db sh -c "
  grep -q 'host all all all trust' /var/lib/postgresql/data/pg_hba.conf || \
  echo 'host all all all trust' >> /var/lib/postgresql/data/pg_hba.conf
" 2>/dev/null && \
docker exec equal_db sh -c "su postgres -c 'pg_ctl reload -D /var/lib/postgresql/data'" 2>/dev/null || true

# Subscription column patches
docker exec equal_db psql -U equal -d equal_db -c "
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS peter_limit INTEGER DEFAULT 3;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS peter_uses_today INTEGER DEFAULT 0;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE subscriptions ALTER COLUMN started_at DROP NOT NULL;
" 2>/dev/null && echo -e "${GREEN}✓ DB patches applied${NC}" || echo -e "${YELLOW}⚠ DB patches skipped (table may not exist yet — OK on first run)${NC}"

# ── 6. Install frontend deps + start dev server ────────────────
echo -e "${YELLOW}[6/6] Starting frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
  echo -e "  Installing npm packages..."
  npm install --silent
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ eQual is running!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "  Frontend  → ${CYAN}http://localhost:5173${NC}"
echo -e "  Backend   → ${CYAN}http://localhost:8001${NC}"
echo -e "  API Docs  → ${CYAN}http://localhost:8001/docs${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop the frontend"
echo -e "  To stop everything: ${YELLOW}docker compose down${NC}"
echo ""

npm run dev