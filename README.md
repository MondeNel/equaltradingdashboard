# eQual — Simulation Trading Platform

> A full-stack paper trading platform with real-time candlestick charts, AI-powered trade setups, pending order management, and live P&L tracking. Built for mobile-first use with a FastAPI backend, React frontend, and PostgreSQL persistence.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)
4. [Environment Variables](#4-environment-variables)
5. [Quick Start — start.sh](#5-quick-start--startsh)
6. [Manual Setup](#6-manual-setup)
7. [Platform Mechanics](#7-platform-mechanics)
8. [Trade Lifecycle](#8-trade-lifecycle)
9. [Chart Engine](#9-chart-engine)
10. [Peter AI](#10-peter-ai)
11. [Wallet System](#11-wallet-system)
12. [Architecture](#12-architecture)
13. [Project Structure](#13-project-structure)
14. [Database Schema](#14-database-schema)
15. [API Reference](#15-api-reference)
16. [Docker Reference](#16-docker-reference)
17. [Git Workflow](#17-git-workflow)
18. [Testing](#18-testing)
19. [Subscription Plans](#19-subscription-plans)

---

## 1. Project Overview

eQual is a simulation (paper) trading platform designed to teach and practise forex, crypto, and stock trading without risking real money. Users deposit virtual ZAR funds, set entry/take profit/stop loss levels on a live chart, and place pending orders that activate automatically when the market reaches their entry price.

**Key capabilities:**

- Live candlestick charts with pan, zoom (pinch and buttons), and scrollable price history
- Pending order system — trades only go live when the market reaches the entry price
- Real-time P&L tracking with automatic TP/SL hit detection and position close
- Peter AI — an AI assistant powered by Claude that analyses the market and recommends trade setups
- Wallet with deposit, withdraw, position history, and equity tracking
- Subscription tiers with usage-gated AI features
- Mobile-first responsive design built for phone screens

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, inline CSS-in-JS, SVG chart engine |
| Backend | Python 3.12, FastAPI, Uvicorn |
| Database | PostgreSQL 15 (Docker volume) |
| ORM | SQLAlchemy 2.0 with async support |
| Auth | JWT via python-jose, bcrypt password hashing |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Cache / Pub-Sub | Redis 7 |
| Containerisation | Docker, Docker Compose |

---

## 3. Prerequisites

Install the following tools before running the platform:

| Tool | Version | Purpose |
|------|---------|---------|
| Docker Desktop | Latest | Runs PostgreSQL, Redis, and the backend API in containers |
| Node.js | 20+ | Runs the Vite frontend development server |
| npm | Included with Node | Installs frontend JavaScript packages |
| Git | Any | Clone the repository |

> **Note:** Python is not required on your local machine. The backend runs entirely inside Docker.

---

## 4. Environment Variables

Copy `.env.example` to `.env` in the project root and fill in all values before starting.

```env
# PostgreSQL
POSTGRES_USER=equal
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=equal_db

# Backend
DATABASE_URL=postgresql+asyncpg://equal:your_password@localhost/equal_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_jwt_secret_minimum_32_characters
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Anthropic (Peter AI)
ANTHROPIC_API_KEY=sk-ant-...

# CORS origins (comma-separated)
ORIGINS=http://localhost:5173
```

---

## 5. Quick Start — start.sh

The platform ships with a single start script that handles everything: Docker services, database patches, frontend dependency installation, and the Vite dev server. Run it from the project root in Git Bash or any POSIX-compatible terminal.

### 5.1 First-time Setup

```bash
# Clone the repository
git clone https://github.com/yourname/equal.git
cd equal

# Copy and configure environment variables
cp .env.example .env
# Open .env in your editor and fill in your values

# Run the start script
bash start.sh
```

### 5.2 Script Flags

| Flag | Description |
|------|-------------|
| `bash start.sh` | Normal start — brings up Docker services and launches the frontend |
| `bash start.sh --build` | Force rebuild of the backend Docker image after code or dependency changes |
| `bash start.sh --reset` | ⚠️ Wipe the PostgreSQL volume and start with a clean database — **permanently deletes all data** |

### 5.3 What the Script Does

The script runs six steps in sequence:

**Step 1 — Check dependencies**
Verifies that `docker`, `node`, and `npm` are available on the PATH. Exits with an error and instructions if any are missing.

**Step 2 — Verify .env file**
Checks that a `.env` file exists in the project root. Exits with an error if it is missing.

**Step 3 — Start Docker services**
Runs `docker compose up -d` to bring up PostgreSQL, Redis, and the backend API. Uses `--build` flag if passed to rebuild the backend image first.

**Step 4 — Wait for backend health**
Polls `http://localhost:8001/health` every 2 seconds for up to 60 seconds. Exits with a log hint if the backend does not respond in time.

**Step 5 — Apply database patches**
- Adds subscription columns if they are missing (`ALTER TABLE ADD COLUMN IF NOT EXISTS`)
- Drops the `NOT NULL` constraint on `started_at` to allow FREE plan registration
- Applies `pg_hba` trust authentication fix required for asyncpg on Windows

**Step 6 — Start frontend**
Runs `npm install` if `node_modules` is missing, then launches `npm run dev` to start the Vite development server.

### 5.4 Accessing the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8001 |
| Swagger UI | http://localhost:8001/docs |
| ReDoc | http://localhost:8001/redoc |

### 5.5 Stopping the Application

```bash
# Stop the frontend: press Ctrl+C in the terminal running start.sh

# Stop all Docker services (data preserved)
docker compose down

# Stop and wipe all data
docker compose down -v
```

---

## 6. Manual Setup

Use this section if you prefer to run each step manually, need to debug a specific stage, or are setting up a production or CI environment where `start.sh` is not appropriate.

### 6.1 Start Docker Services

```bash
cd ~/equaltradingdashboard

# Start all services in the background
docker compose up -d

# To force rebuild of the backend image
docker compose up -d --build

# Check all three containers are running
docker ps
# You should see: equal_db  equal_redis  equal_api
```

### 6.2 Verify Backend Health

```bash
# Should return: {"status": "ok", "service": "eQual API"}
curl http://localhost:8001/health

# Stream live logs
docker logs equal_api -f

# Check real-time prices loaded
docker logs equal_api 2>&1 | grep -i price
# Expected: Initial prices loaded: BTC=72799, USD/ZAR=16.5417
```

### 6.3 Apply Database Patches

Run these once after first launch, or after wiping the database volume:

```bash
# Fix asyncpg authentication on Windows
docker exec equal_db sh -c \
  "echo 'host all all all trust' >> /var/lib/postgresql/data/pg_hba.conf"
docker exec equal_db sh -c \
  "su postgres -c 'pg_ctl reload -D /var/lib/postgresql/data'"

# Apply subscription table patches
docker exec equal_db psql -U equal -d equal_db -c "
  ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS peter_limit INTEGER DEFAULT 3;
  ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS peter_uses_today INTEGER DEFAULT 0;
  ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
  ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE subscriptions
    ALTER COLUMN started_at DROP NOT NULL;
"
```

### 6.4 Deploy Backend File Changes

When you edit a backend Python file, copy it into the running container. The `--reload` flag in the Uvicorn command will detect the change and restart automatically.

```bash
# Deploy a changed router
docker cp backend/app/routers/orders.py \
  equal_api:/app/app/routers/orders.py

# Deploy a changed service
docker cp backend/app/services/price_service.py \
  equal_api:/app/app/services/price_service.py

# Deploy main.py
docker cp backend/app/main.py equal_api:/app/app/main.py

# Verify the reload happened
docker logs equal_api --tail 5
```

> **Warning:** Never use heredocs in Git Bash to write files. They corrupt binary content. Always edit locally in VS Code and use `docker cp` to deploy.

### 6.5 Install Frontend Dependencies

```bash
cd ~/equaltradingdashboard/frontend
npm install
```

### 6.6 Start Frontend Dev Server

```bash
cd ~/equaltradingdashboard/frontend
npm run dev

# Open in browser: http://localhost:5173
```

### 6.7 Install a New Backend Package

```bash
# Install into the running container
docker exec equal_api pip install httpx

# Add to requirements.txt so it persists on rebuild
echo 'httpx' >> backend/requirements.txt
```

---

## 7. Platform Mechanics

### 7.1 Markets and Symbols

| Market | Symbols |
|--------|---------|
| Crypto | BTC/USD, ETH/USD, SOL/USD, XRP/USD |
| Forex | USD/ZAR, EUR/USD, GBP/USD, USD/JPY |
| Stocks | APPLE, TESLA, NVIDIA, AMAZON |

### 7.2 Lot Sizes

| Lot Type | Pip Value |
|----------|-----------|
| Macro | R0.10 per pip |
| Mini | R1.00 per pip |
| Standard | R10.00 per pip |

### 7.3 Pip Calculation

```
ZAR = pips × lot_pip_value × volume × (1 if ZAR pair, else USD_TO_ZAR rate)
```

- Instruments priced below 200 (forex, XRP): 1 pip = 0.0001
- Instruments priced above 200 (BTC, stocks): 1 pip = 1.0

### 7.4 Margin

```
margin = max(50, pip_value × volume × 20)
```

Margin is reserved on order placement and returned to the balance when the trade closes.

---

## 8. Trade Lifecycle

### Stage 1 — Set Levels

The user drags three lines on the chart:

- **ENTRY** (blue) — the price at which they want to enter the market
- **TAKE PROFIT / TP** (green dashed) — the target price to close at a profit
- **STOP LOSS / SL** (red dashed) — the price at which to cut losses

Trade direction is determined automatically: if TP is above ENTRY → BUY, if TP is below ENTRY → SELL.

### Stage 2 — Place Order (PENDING)

- Margin is immediately deducted from the wallet balance
- A purple ORDER PENDING toast fires
- The order appears on the chart as dimmed ghost lines at 45% opacity with a WAIT label
- A pending chip appears in the positions strip below the balance row

### Stage 3 — Entry Hit (ACTIVE)

- BUY activates when `live_price >= entry_price`
- SELL activates when `live_price <= entry_price`
- A blue TRADE ACTIVATED toast fires
- Live P&L dot begins tracking price relative to entry
- Shaded zone fills green (winning) or red (losing)

### Stage 4 — TP or SL Hit (CLOSED)

- Margin plus realised P&L returned to wallet balance
- Result toast slides in from the top: 🎯 TAKE PROFIT HIT or 🛑 STOP LOSS HIT
- Shows P&L in ZAR and pips, auto-dismisses after 5 seconds

---

## 9. Chart Engine

| Property | Value |
|----------|-------|
| Viewbox | 430 × 320 |
| History stored | 120 candles |
| Default view | 40 candles visible |
| Tick rate | 400ms |
| New candle every | 20 ticks (~8s) |
| Bull candle colour | Teal #26a69a |
| Bear candle colour | Red #ef5350 |
| Background | #05050e |

The chart uses pip-aware vertical scaling so the visible price range stays tight around actual movement — e.g. USD/ZAR shows 16.83–16.91 rather than a huge empty range. The drift engine applies 35% pull toward the real API price plus ±0.03% noise on every 400ms tick so candles move smoothly between real-price updates.

---

## 10. Peter AI

Peter is an AI trading assistant powered by the Anthropic Claude API.

- Free users get 3 requests total
- Weekly subscribers get 5 per day
- Monthly and Yearly subscribers get unlimited access

Peter returns structured JSON recommendations with symbol, direction, entry, TP, SL, lot size, volume, and reasoning. Tapping APPLY writes the recommendation directly onto the chart.

---

## 11. Wallet System

The wallet modal has four tabs:

| Tab | Description |
|-----|-------------|
| Overview | Balance, unrealised P&L, equity, open positions with individual CLOSE buttons, CLOSE ALL |
| Deposit | Amount input, quick chips (R500–R10,000), minimum R100 |
| Withdraw | Blocked when open trades exist, minimum R100, cannot exceed available balance |
| History | Chronological log of all deposits and withdrawals |

---

## 12. Architecture

```
+----------------------------------------------------------+
|                     React Frontend                        |
|  TradingDashboard > CandleChart > WalletModal > PeterModal|
+------------------------+---------------------------------+
                         | HTTP REST
+------------------------v---------------------------------+
|                    FastAPI Backend                        |
|  /api/auth     /api/wallet    /api/orders                |
|  /api/trades   /api/prices    /api/peter                 |
|  /api/subscriptions                                      |
+--------+------------------------------+------------------+
         |                              |
+--------v-----------+   +-------------v-----------+
|   PostgreSQL 15     |   |   Redis 7               |
|   (Docker volume)   |   |   price cache           |
+---------------------+   +-------------------------+
                              |
                    +---------v-----------+
                    |  Anthropic Claude   |
                    |  (external HTTPS)   |
                    +---------------------+
```

---

## 13. Project Structure

```
eQual/
├── backend/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── models/
│       │   ├── user.py
│       │   ├── wallet.py
│       │   ├── order.py
│       │   ├── trade.py
│       │   ├── transaction.py
│       │   └── subscription.py
│       ├── schemas/
│       ├── routers/
│       │   ├── auth.py
│       │   ├── wallet.py
│       │   ├── orders.py
│       │   ├── trades.py
│       │   ├── prices.py
│       │   ├── peter.py
│       │   └── subscriptions.py
│       └── services/
│           ├── auth_service.py
│           ├── wallet_service.py
│           ├── order_service.py
│           ├── trade_service.py
│           ├── price_service.py
│           └── peter_service.py
│
├── frontend/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── TradingDashboard.jsx
│       ├── constants.js
│       ├── services/
│       │   └── api.js
│       └── components/
│           ├── CandleChart.jsx
│           ├── PeterModal.jsx
│           ├── WalletModal.jsx
│           └── SubscriptionModal.jsx
│
├── docker-compose.yml
├── start.sh
├── .env.example
└── README.md
```

---

## 14. Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Auto-generated |
| email | VARCHAR UNIQUE NOT NULL | Login identifier |
| hashed_password | VARCHAR NOT NULL | bcrypt hashed |
| display_name | VARCHAR | Optional |
| created_at | TIMESTAMPTZ | Auto set |
| is_active | BOOLEAN | Default true |

### wallets
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | One wallet per user |
| balance | NUMERIC(18,4) | Available (unreserved) funds |
| reserved_margin | NUMERIC(18,4) | Sum of active trade margins |
| updated_at | TIMESTAMPTZ | Updated on every change |

### pending_orders
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| symbol | VARCHAR | e.g. USD/ZAR |
| order_type | VARCHAR | BUY or SELL |
| lot_size | VARCHAR | Macro / Mini / Standard |
| volume | INTEGER | 1–100 |
| entry_price | NUMERIC(18,6) | Target activation price |
| tp_price | NUMERIC(18,6) | Nullable |
| sl_price | NUMERIC(18,6) | Nullable |
| margin | NUMERIC(18,4) | Reserved from wallet |

### open_trades
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| symbol | VARCHAR | |
| trade_type | VARCHAR | BUY or SELL |
| entry_price | NUMERIC(18,6) | Actual activation price |
| tp_price | NUMERIC(18,6) | Nullable |
| sl_price | NUMERIC(18,6) | Nullable |
| margin | NUMERIC(18,4) | |
| activated_at | TIMESTAMPTZ | |

### trade_history
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| symbol | VARCHAR | |
| trade_type | VARCHAR | BUY or SELL |
| entry_price | NUMERIC(18,6) | |
| close_price | NUMERIC(18,6) | |
| close_reason | VARCHAR | TP / SL / MANUAL |
| pnl | NUMERIC(18,4) | Realised profit or loss in ZAR |
| pips | NUMERIC(10,2) | |
| opened_at | TIMESTAMPTZ | |
| closed_at | TIMESTAMPTZ | |

### subscriptions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| plan | VARCHAR | FREE / WEEKLY / MONTHLY / YEARLY |
| peter_uses_today | INTEGER | Resets daily |
| peter_limit | INTEGER | 3 free, 5 weekly, unlimited paid |
| started_at | TIMESTAMPTZ | Nullable |
| expires_at | TIMESTAMPTZ | Nullable |

---

## 15. API Reference

All authenticated endpoints require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Create new user account |
| POST | `/api/auth/login` | None | Returns access and refresh tokens |
| POST | `/api/auth/refresh` | Refresh token | Returns new access token |

### Wallet
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wallet` | Required | Balance, reserved margin, equity |
| POST | `/api/wallet/deposit` | Required | Add funds — `{ "amount": 1000 }` |
| POST | `/api/wallet/withdraw` | Required | Remove funds — `{ "amount": 500 }` |
| GET | `/api/wallet/history` | Required | All transactions |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders/place` | Required | Place pending order, reserve margin |
| GET | `/api/orders/pending` | Required | List all pending orders |
| DELETE | `/api/orders/{id}/cancel` | Required | Cancel order, return margin |

### Trades
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trades/open` | Required | All active open positions |
| POST | `/api/trades/{id}/close` | Required | Manually close a trade |
| POST | `/api/trades/close-all` | Required | Close all open positions |
| GET | `/api/trades/history` | Required | Closed trade history with P&L |

### Prices
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/prices/{symbol}` | None | Current price for a symbol |

### Peter AI
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/peter/analyse` | Required | AI market analysis |

### Subscriptions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/subscriptions/plans` | None | All available plans |
| POST | `/api/subscriptions/upgrade` | Required | Upgrade plan — `{ "plan": "MONTHLY" }` |

---

## 16. Docker Reference

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all services in background |
| `docker compose up -d --build` | Rebuild backend image and start |
| `docker compose down` | Stop all services (data preserved) |
| `docker compose down -v` | Stop and wipe all volumes |
| `docker compose logs -f backend` | Stream backend logs |
| `docker ps` | List running containers |
| `docker logs equal_api --tail 30` | Last 30 lines of API logs |
| `docker exec equal_db psql -U equal -d equal_db` | Open psql shell |
| `docker restart equal_api` | Restart backend container |

### Container Names and Ports

| Container | Service | Internal Port | External Port |
|-----------|---------|---------------|---------------|
| equal_db | PostgreSQL 15 | 5432 | 5432 |
| equal_redis | Redis 7 | 6379 | 6379 |
| equal_api | FastAPI / Uvicorn | 8000 | 8001 |

---

## 17. Git Workflow

```bash
# Stage specific files
git add frontend/src/components/CandleChart.jsx
git add frontend/src/TradingDashboard.jsx
git add backend/app/services/price_service.py

# Commit with a descriptive message
git commit -m "feat: describe what changed and why"

# Push to remote
git push

# Stage everything
git add -A
git commit -m "fix: describe the fix"
git push
```

---

## 18. Testing

### Backend (pytest)

```bash
# Start test database
docker compose -f docker-compose.test.yml up -d

# Run all tests
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=term-missing

# Specific file
pytest tests/test_trades.py -v
```

### Frontend (Vitest)

```bash
cd frontend

# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

---

## 19. Subscription Plans

| Feature | Free | Weekly R49 | Monthly R149 | Yearly R999 |
|---------|------|------------|--------------|-------------|
| Peter AI setups | 3 total | 5 per day | Unlimited | Unlimited |
| Live chart | ✓ | ✓ | ✓ | ✓ |
| Pending orders | ✓ | ✓ | ✓ | ✓ |
| Wallet | ✓ | ✓ | ✓ | ✓ |
| Multi-timeframe analysis | — | — | ✓ | ✓ |
| AI risk sizing | — | — | ✓ | ✓ |
| Pattern recognition AI | — | — | — | ✓ |
| News sentiment feed | — | — | — | ✓ |
| Backtesting | — | — | — | ✓ |
| Priority support | — | — | — | ✓ |

The yearly plan saves R789 compared to paying monthly for 12 months.

> All payments in the current build are simulation-only. No real charges are applied. Payment integration (PayFast or Stripe) would connect through `/api/subscriptions/upgrade` when moving to production.

---

*eQual is a simulation platform for educational purposes only. No real money is involved. Built with assistance from Claude AI.*