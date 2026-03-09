# eQual — Simulation Trading Platform

> A full-stack paper trading platform with real-time candlestick charts, AI-powered trade setups, pending order management, and live P&L tracking. Built for mobile-first use with a FastAPI backend, React frontend, and PostgreSQL persistence.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Platform Mechanics](#2-platform-mechanics)
3. [Trade Lifecycle](#3-trade-lifecycle)
4. [Chart Engine](#4-chart-engine)
5. [Peter AI](#5-peter-ai)
6. [Wallet System](#6-wallet-system)
7. [Tech Stack](#7-tech-stack)
8. [Architecture](#8-architecture)
9. [Project Structure](#9-project-structure)
10. [Database Schema](#10-database-schema)
11. [API Reference](#11-api-reference)
12. [Frontend Components](#12-frontend-components)
13. [Docker Setup](#13-docker-setup)
14. [Environment Variables](#14-environment-variables)
15. [Running the Application](#15-running-the-application)
16. [Testing](#16-testing)
17. [Subscription Plans](#17-subscription-plans)

---

## 1. Project Overview

eQual is a simulation (paper) trading platform designed to teach and practice forex, crypto, and stock trading without risking real money. Users deposit virtual ZAR funds, set entry/take profit/stop loss levels on a live chart, and place pending orders that activate automatically when the market reaches their entry price.

**Key capabilities:**

- Live candlestick charts with pan, zoom (pinch and buttons), and scrollable price history
- Pending order system — trades only go live when the market reaches the entry price
- Real-time P&L tracking with automatic TP/SL hit detection and position close
- Peter AI — an AI assistant that analyses the market and recommends trade setups
- Wallet with deposit, withdraw, position history, and equity tracking
- Subscription tiers with usage-gated AI features
- Mobile-first responsive design built for phone screens

---

## 2. Platform Mechanics

### 2.1 Markets and Symbols

The platform supports three asset classes:

| Market | Symbols |
|--------|---------|
| Crypto | BTC/USD, ETH/USD, SOL/USD, XRP/USD |
| Forex | USD/ZAR, EUR/USD, GBP/USD, USD/JPY |
| Stocks | APPLE, TESLA, NVIDIA, AMAZON |

Users select a market and symbol from dropdown menus. The chart, live price, and pip calculations all update to match the selected instrument.

### 2.2 Lot Sizes

Three lot sizes control the pip value (how much each pip of movement is worth in ZAR):

| Lot Type | Pip Value |
|----------|-----------|
| Macro | R0.10 per pip |
| Mini | R1.00 per pip |
| Standard | R10.00 per pip |

### 2.3 Volume

Volume is a multiplier applied on top of the lot size pip value. Range is 1 to 100. A Standard lot at volume 10 means each pip is worth R100.

### 2.4 Pip Calculation

Pips are calculated based on the instrument price range:

- Instruments priced below 200 (forex pairs, XRP): 1 pip = 0.0001
- Instruments priced above 200 (BTC, stocks): 1 pip = 1.0

ZAR profit or loss per pip:

```
ZAR = pips x lot_pip_value x volume x (1 if ZAR pair, else USD_TO_ZAR rate)
```

### 2.5 Margin

When a trade is placed, a margin amount is reserved from the wallet balance:

```
margin = max(50, pip_value x volume x 20)
```

The margin is returned to the balance when the trade closes, together with realised profit, or minus realised loss.

---

## 3. Trade Lifecycle

Every trade passes through three stages.

### Stage 1 — Set Levels

The user drags three lines on the chart to define their trade:

- **ENTRY** (blue) — the price at which they want to enter the market
- **TAKE PROFIT / TP** (green dashed) — the target price to close at a profit
- **STOP LOSS / SL** (red dashed) — the price at which to cut losses

The direction of the trade is determined automatically:

- If TP is above ENTRY → BUY order (expecting price to rise)
- If TP is below ENTRY → SELL order (expecting price to fall)

The pip and ZAR values for both TP and SL are shown live below the chart as the user adjusts the lines.

### Stage 2 — Place Order (PENDING)

When the user taps BUY or SELL, the order enters a PENDING state:

- Margin is immediately deducted from the wallet balance
- A purple ORDER PENDING toast notification fires
- The order appears on the chart as dimmed ghost lines at 45% opacity with a WAIT label on the entry line
- A pending chip with a waiting indicator appears in the positions strip below the balance row
- The draggable line handles lock and the chart pans freely instead

The order remains in PENDING state, with the backend monitoring the live price every 600ms.

### Stage 3 — Entry Hit (ACTIVE)

The monitor checks whether the live price has crossed the entry level in the correct direction:

- BUY order activates when `live_price >= entry_price`
- SELL order activates when `live_price <= entry_price`

When entry is hit:

- The order moves from pending_orders to open_trades
- A blue TRADE ACTIVATED toast fires with the message "Market reached your entry"
- The ghost lines become full-brightness live position lines on the chart
- A live P&L dot begins tracking the current price relative to entry
- The shaded zone between entry and current price fills green (winning) or red (losing)
- The right-hand price axis shows a live P&L tag updating in real time

### Stage 4 — TP or SL Hit (CLOSED)

The position monitor checks on every 600ms tick:

- TP hit on a BUY: `live_price >= tp_price` → closes with profit
- SL hit on a BUY: `live_price <= sl_price` → closes with loss
- TP hit on a SELL: `live_price <= tp_price` → closes with profit
- SL hit on a SELL: `live_price >= sl_price` → closes with loss

When closed:

- Margin plus realised P&L is returned to the wallet balance
- A result toast slides in from the top of the screen
  - TAKE PROFIT HIT (green) — shows profit in ZAR and pips earned
  - STOP LOSS HIT (red) — shows loss in ZAR and pips lost
- The position and chart overlay clear
- The order form resets for a new trade

Users may also manually close any position at any time from the Wallet modal overview tab.

---

## 4. Chart Engine

### 4.1 Candlestick Rendering

The chart is rendered entirely in SVG, styled to match TradingView's dark theme aesthetic.

| Property | Value |
|----------|-------|
| Viewbox | 430 x 320 |
| History stored | 120 candles |
| Default view | 40 candles visible |
| Tick rate | 800ms per tick |
| New candle every | 10 ticks |
| Bull candle colour | Teal #26a69a |
| Bear candle colour | Red #ef5350 |
| Background | #05050e |

Each candle has open, close, high, and low values. The live (incomplete) candle updates in real time with a subtle glow effect until it is finalised.

### 4.2 Pan

The user drags horizontally on the chart to scroll through the 120-candle history. A HISTORY badge appears when not at the live edge, and a LIVE button snaps back to real time.

### 4.3 Zoom

**Button controls:** Minus and plus buttons in the bottom-right corner of the chart. Each press adjusts the visible candle count by approximately 30 to 40 percent. A counter badge shows the current candle count.

**Pinch-to-zoom on mobile:** Two-finger pinch gesture using incremental delta tracking. Each frame measures how much the finger distance changed since the previous frame rather than from a fixed start point. This gives smooth, precise, continuous zoom that responds exactly to finger speed and position anywhere on the chart.

- Spread fingers → zoom out (more candles, wider view)
- Pinch fingers together → zoom in (fewer candles, larger bodies)
- Range: 8 candles (maximum detail) to 120 candles (full history)

### 4.4 Draggable Level Lines

When no active or pending trade exists on the current symbol, the three level lines (ENTRY, TP, SL) are fully draggable. Touch and drag any line or its grip handle to reposition it. The price, pip count, and ZAR value update live as the line moves.

When a trade is pending or active, the lines lock in place. The grip labels replace the drag icon, hit zones are removed, and the chart pans freely. The open position overlay takes over the visual display.

### 4.5 Open Position Overlay

While a trade is active the chart renders:

- IN line (solid blue) at entry price
- TP line (dashed green) at take profit price
- SL line (dashed red) at stop loss price
- Shaded zone between entry and current price (green when winning, red when losing)
- Live dot tracking current price with a dashed connector from entry
- P&L tag on the right axis showing current gain or loss updating every 600ms

### 4.6 Pending Order Overlay

While an order is pending the chart renders ghost lines at 45% opacity:

- Entry line with a WAIT label
- TP and SL lines both dashed and dimmed
- Right-side tag showing the trade direction and entry price

---

## 5. Peter AI

Peter is an AI trading assistant powered by Claude via the Anthropic API.

### 5.1 Usage Limits

- Free users get 3 requests before hitting the usage limit
- Used requests are tracked with visual dots in the modal header
- When the limit is reached, a lock screen shows with a call to action to subscribe

### 5.2 How It Works

1. User opens the AI modal via the purple AI button in the top-right corner of the dashboard
2. Peter presents three analysis options as checkboxes: look for volatile markets, best forex pairs right now, and surprise me with a scalp setup
3. User selects one or more options and taps ANALYSE
4. The backend calls the Anthropic API with the current symbol, market, and live price as context
5. The API returns a structured JSON recommendation:

```json
{
  "recommendedSymbol": "USD/ZAR",
  "recommendedMarket": "Forex",
  "direction": "BUY",
  "strategy": "Breakout scalp on support level",
  "entry": 18.2500,
  "takeProfit": 18.3200,
  "stopLoss": 18.2100,
  "lotSize": "Mini",
  "volume": 5,
  "reasoning": "Price consolidating above key support..."
}
```

6. Results display with symbol, direction badge, entry/TP/SL grid, lot and volume, and full reasoning text
7. User taps APPLY to write the recommendation directly onto the chart — the symbol switches, lines appear, and lot and volume are set automatically

### 5.3 Subscription Upgrade

The lock screen and results screen both feature a gold upgrade button that opens the Subscription modal.

---

## 6. Wallet System

The wallet modal is accessible via the teal wallet button at the bottom of the dashboard. It contains four tabs.

### Overview Tab

- Account balance (deposited funds minus reserved margin)
- Unrealised P&L from all open positions
- Total equity (balance plus P&L)
- List of all open positions with symbol, direction, entry, TP/SL, current P&L in ZAR and pips, and individual CLOSE buttons
- CLOSE ALL button to exit all positions at once

### Deposit Tab

- Amount input field with a ZAR prefix
- Quick-select chips for R500, R1,000, R2,500, R5,000, and R10,000
- Minimum deposit R100
- Confirms with a success banner

### Withdraw Tab

- Blocked when open trades exist (margin cannot be withdrawn while positions are active)
- Minimum withdrawal R100
- Cannot withdraw more than available (unreserved) balance

### History Tab

- Chronological log of all deposits and withdrawals with timestamps and amounts

---

## 7. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, inline CSS-in-JS, SVG chart engine |
| Backend | Python 3.12, FastAPI, Uvicorn |
| Database | PostgreSQL 15 (Docker volume) |
| ORM | SQLAlchemy 2.0 with async support |
| Migrations | Alembic |
| Auth | JWT via python-jose, bcrypt password hashing |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Cache / Pub-Sub | Redis 7 |
| Real-time | WebSockets (FastAPI native) |
| Containerisation | Docker, Docker Compose |
| Backend Testing | pytest, pytest-asyncio, httpx async test client |
| Frontend Testing | Vitest, React Testing Library |
| CI | GitHub Actions |

---

## 8. Architecture

```
+----------------------------------------------------------+
|                     React Frontend                        |
|  TradingDashboard > LiveChart > WalletModal > PeterModal  |
|              WebSocket client (price feed)                |
+------------------------+---------------------------------+
                         | HTTP REST + WebSocket
+------------------------v---------------------------------+
|                    FastAPI Backend                        |
|                                                          |
|  /api/auth         JWT auth (register, login, refresh)   |
|  /api/wallet       deposit, withdraw, history            |
|  /api/orders       place, cancel, list pending           |
|  /api/trades       open positions, close, P&L            |
|  /api/prices       symbol price feed (REST + WS)         |
|  /api/peter        AI analysis endpoint                  |
|  /api/subs         subscription plans, upgrade           |
+--------+------------------------------+------------------+
         |                              |
+--------v-----------+   +-------------v-----------+
|   PostgreSQL 15     |   |   Redis 7               |
|   (Docker volume)   |   |   price cache           |
|                     |   |   pub/sub for WS        |
|   users             |   |   session cache         |
|   wallets           |   +-------------------------+
|   pending_orders    |
|   open_trades       |   +-------------------------+
|   trade_history     |   |   Anthropic Claude API  |
|   transactions      |   |   (external HTTPS)      |
|   subscriptions     |   +-------------------------+
+---------------------+
```

### Price Feed

In simulation mode the backend generates price drift using a random walk algorithm seeded from real base prices. Redis pub/sub broadcasts each tick to all connected frontend WebSocket clients so every user sees the same simulated market. In production this layer would be replaced with a connection to a live market data provider.

### WebSocket Flow

1. Frontend connects to `ws://api/prices/{symbol}`
2. Backend subscribes to Redis channel for that symbol
3. Price engine publishes to Redis every 400ms
4. All subscribers receive the update and forward it to their connected clients

---

## 9. Project Structure

```
eQual/
|
+-- backend/
|   +-- app/
|   |   +-- main.py                  FastAPI app factory, CORS, startup events
|   |   +-- config.py                Settings loaded from env vars (pydantic-settings)
|   |   +-- database.py              Async SQLAlchemy engine and session factory
|   |   +-- dependencies.py          Shared FastAPI deps: get_db, get_current_user
|   |   |
|   |   +-- models/
|   |   |   +-- user.py              User ORM model
|   |   |   +-- wallet.py            Wallet ORM model
|   |   |   +-- order.py             PendingOrder ORM model
|   |   |   +-- trade.py             OpenTrade and TradeHistory ORM models
|   |   |   +-- transaction.py       Deposit and Withdraw transaction model
|   |   |   +-- subscription.py      Subscription plan and user subscription model
|   |   |
|   |   +-- schemas/
|   |   |   +-- auth.py              RegisterRequest, LoginResponse, TokenData
|   |   |   +-- wallet.py            DepositRequest, WithdrawRequest, WalletResponse
|   |   |   +-- order.py             PlaceOrderRequest, OrderResponse
|   |   |   +-- trade.py             TradeResponse, CloseTradeResponse
|   |   |   +-- peter.py             PeterAnalysisRequest, PeterAnalysisResponse
|   |   |   +-- subscription.py      PlanResponse, UpgradeRequest
|   |   |
|   |   +-- routers/
|   |   |   +-- auth.py              POST /register  POST /login  POST /refresh
|   |   |   +-- users.py             GET /me  PATCH /me
|   |   |   +-- wallet.py            GET /wallet  POST /deposit  POST /withdraw
|   |   |   +-- orders.py            POST /place  DELETE /cancel  GET /pending
|   |   |   +-- trades.py            GET /open  POST /close/{id}  POST /close-all
|   |   |   +-- prices.py            GET /price/{symbol}  WS /prices/{symbol}
|   |   |   +-- peter.py             POST /analyse
|   |   |   +-- subscriptions.py     GET /plans  POST /upgrade
|   |   |
|   |   +-- services/
|   |   |   +-- auth_service.py      JWT creation and validation, password hashing
|   |   |   +-- wallet_service.py    Balance checks, deposit and withdraw logic
|   |   |   +-- order_service.py     Place order, margin reservation
|   |   |   +-- trade_service.py     Activate pending, close trade, P&L calculation
|   |   |   +-- price_service.py     Price drift engine, Redis pub/sub
|   |   |   +-- peter_service.py     Anthropic API call, response parsing
|   |   |
|   |   +-- utils/
|   |       +-- pip_calc.py          Pip value and ZAR P&L calculation functions
|   |       +-- margin.py            Margin formula
|   |
|   +-- migrations/
|   |   +-- env.py
|   |   +-- versions/
|   |       +-- 001_initial_schema.py
|   |
|   +-- tests/
|   |   +-- conftest.py              Fixtures: test DB, client, funded user
|   |   +-- test_auth.py             Register, login, token refresh
|   |   +-- test_wallet.py           Deposit, withdraw, balance checks
|   |   +-- test_orders.py           Place order, margin deduction, cancellation
|   |   +-- test_trades.py           Entry activation, TP/SL close, P&L accuracy
|   |   +-- test_prices.py           Price feed, WebSocket connection
|   |   +-- test_peter.py            AI endpoint, usage limit enforcement
|   |   +-- test_pip_calc.py         Unit tests for pip and ZAR calculations
|   |
|   +-- Dockerfile
|   +-- requirements.txt
|   +-- alembic.ini
|
+-- frontend/
|   +-- src/
|   |   +-- main.jsx                 React root and StrictMode wrapper
|   |   +-- App.jsx                  Route layout and auth gate
|   |   |
|   |   +-- components/
|   |   |   +-- TradingDashboard.jsx Main dashboard shell, owns all state
|   |   |   +-- LiveChart.jsx        SVG candlestick chart with pan, zoom, overlays
|   |   |   +-- WalletModal.jsx      Deposit, withdraw, history, positions overview
|   |   |   +-- PeterModal.jsx       AI analysis modal with usage limit gate
|   |   |   +-- SubscriptionModal.jsx Plans display and upgrade call to action
|   |   |   +-- ToastOverlay.jsx     Centre-screen trade notification toasts
|   |   |   +-- PositionsStrip.jsx   Scrollable pending and active position chips
|   |   |
|   |   +-- hooks/
|   |   |   +-- usePriceSocket.js    WebSocket subscription to live price feed
|   |   |   +-- useOrders.js         Place, cancel, and list pending orders
|   |   |   +-- useTrades.js         Open positions, close, P&L polling
|   |   |   +-- useWallet.js         Balance, deposit, withdraw, transaction history
|   |   |
|   |   +-- api/
|   |   |   +-- client.js            Axios instance with JWT header injection
|   |   |   +-- auth.js              register, login, refreshToken
|   |   |   +-- wallet.js            getWallet, deposit, withdraw
|   |   |   +-- orders.js            placeOrder, cancelOrder, getPending
|   |   |   +-- trades.js            getOpen, closeTrade, closeAll
|   |   |   +-- peter.js             analyseMarket
|   |   |
|   |   +-- constants/
|   |   |   +-- markets.js           SYMBOLS map, BASE_PRICES, LOT_SIZES
|   |   |   +-- colors.js            C color palette and chart color constants
|   |   |
|   |   +-- utils/
|   |       +-- pipCalc.js           Client-side pip and ZAR calculation helpers
|   |
|   +-- tests/
|   |   +-- setup.js                 Vitest and Testing Library global setup
|   |   +-- LiveChart.test.jsx       Chart render, zoom, pan, line drag behaviour
|   |   +-- WalletModal.test.jsx     Deposit input, tab switching, validation
|   |   +-- PeterModal.test.jsx      Usage limit, checkbox flow, apply to chart
|   |   +-- TradingDashboard.test.jsx BUY/SELL state, toast flow, order lifecycle
|   |   +-- pipCalc.test.js          Pure unit tests for pip calculation helpers
|   |
|   +-- index.html
|   +-- vite.config.js
|   +-- package.json
|
+-- docker-compose.yml
+-- docker-compose.test.yml
+-- .env.example
+-- README.md
```

---

## 10. Database Schema

### users

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Auto-generated |
| email | VARCHAR UNIQUE NOT NULL | Login identifier |
| hashed_password | VARCHAR NOT NULL | bcrypt hashed |
| display_name | VARCHAR | Optional display name |
| created_at | TIMESTAMPTZ | Auto set on insert |
| is_active | BOOLEAN | Default true |

### wallets

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | One wallet per user |
| balance | NUMERIC(18,4) | Available (unreserved) funds |
| reserved_margin | NUMERIC(18,4) | Sum of all active trade margins |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Updated on every change |

### pending_orders

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| symbol | VARCHAR | e.g. USD/ZAR |
| market | VARCHAR | Forex / Crypto / Stocks |
| order_type | VARCHAR | BUY or SELL |
| lot_size | VARCHAR | Macro / Mini / Standard |
| volume | INTEGER | 1 to 100 |
| entry_price | NUMERIC(18,6) | Target activation price |
| tp_price | NUMERIC(18,6) | Nullable |
| sl_price | NUMERIC(18,6) | Nullable |
| margin | NUMERIC(18,4) | Reserved from wallet on placement |
| created_at | TIMESTAMPTZ | |

### open_trades

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| order_id | UUID FK → pending_orders | Origin order reference (nullable) |
| symbol | VARCHAR | |
| market | VARCHAR | |
| trade_type | VARCHAR | BUY or SELL |
| lot_size | VARCHAR | |
| volume | INTEGER | |
| entry_price | NUMERIC(18,6) | Actual price at activation |
| tp_price | NUMERIC(18,6) | Nullable |
| sl_price | NUMERIC(18,6) | Nullable |
| margin | NUMERIC(18,4) | |
| activated_at | TIMESTAMPTZ | Timestamp when entry was hit |

### trade_history

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| trade_id | UUID | Original open_trade id |
| symbol | VARCHAR | |
| trade_type | VARCHAR | BUY or SELL |
| lot_size | VARCHAR | |
| volume | INTEGER | |
| entry_price | NUMERIC(18,6) | |
| close_price | NUMERIC(18,6) | Price at close |
| tp_price | NUMERIC(18,6) | Nullable |
| sl_price | NUMERIC(18,6) | Nullable |
| close_reason | VARCHAR | TP / SL / MANUAL |
| pnl | NUMERIC(18,4) | Realised profit or loss in ZAR |
| pips | NUMERIC(10,2) | |
| margin_returned | NUMERIC(18,4) | |
| opened_at | TIMESTAMPTZ | |
| closed_at | TIMESTAMPTZ | |

### transactions

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| tx_type | VARCHAR | DEPOSIT or WITHDRAW |
| amount | NUMERIC(18,4) | |
| balance_after | NUMERIC(18,4) | Balance snapshot after transaction |
| created_at | TIMESTAMPTZ | |

### subscriptions

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | |
| plan | VARCHAR | FREE / WEEKLY / MONTHLY / YEARLY |
| peter_uses_today | INTEGER | Resets at midnight daily |
| peter_limit | INTEGER | 3 free, 5 weekly, unlimited paid |
| started_at | TIMESTAMPTZ | |
| expires_at | TIMESTAMPTZ | Nullable (null = lifetime or free) |

---

## 11. API Reference

All authenticated endpoints require an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Create a new user account |
| POST | `/api/auth/login` | None | Returns access and refresh JWT tokens |
| POST | `/api/auth/refresh` | Refresh token | Returns new access token |

### Wallet

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wallet` | Required | Get balance, reserved margin, and total equity |
| POST | `/api/wallet/deposit` | Required | Add funds — body: `{ "amount": 1000 }` |
| POST | `/api/wallet/withdraw` | Required | Remove funds — body: `{ "amount": 500 }` |
| GET | `/api/wallet/history` | Required | List all deposit and withdraw transactions |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders/place` | Required | Place a pending order, reserves margin |
| GET | `/api/orders/pending` | Required | List all pending orders for current user |
| DELETE | `/api/orders/{id}/cancel` | Required | Cancel pending order, return margin |

### Trades

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trades/open` | Required | List all active open positions |
| POST | `/api/trades/{id}/close` | Required | Manually close a specific trade at current price |
| POST | `/api/trades/close-all` | Required | Close all open positions at current price |
| GET | `/api/trades/history` | Required | Full history of closed trades with P&L |

### Prices

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/prices/{symbol}` | None | Get current simulated price for a symbol |
| WS | `/ws/prices/{symbol}` | None | WebSocket stream, emits price tick every 400ms |

### Peter AI

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/peter/analyse` | Required | Run AI analysis — body: `{ symbol, market, live_price, options[] }` |

### Subscriptions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/subscriptions/plans` | None | List all available plans with pricing and features |
| POST | `/api/subscriptions/upgrade` | Required | Upgrade to a plan — body: `{ "plan": "MONTHLY" }` |

---

## 12. Frontend Components

### TradingDashboard

The root component. Owns all application state including balance, open trades, pending orders, selected symbol and market, chart level prices, toast notifications, and modal visibility flags. Passes state down to all children via props and receives callbacks to mutate state.

### LiveChart

An SVG-based candlestick chart. Manages its own internal candle history array, pan offset, and zoom level state. Receives open trades and pending orders as props and renders the appropriate overlay lines. Handles all touch and mouse events including single-finger pan and two-finger pinch-to-zoom using incremental frame-by-frame delta tracking.

### WalletModal

Full-screen overlay modal with four tabs: Overview, Deposit, Withdraw, and History. The deposit input field is rendered as direct JSX (not a sub-component) to prevent React from unmounting and remounting the input on re-render, which would cause keyboard focus loss on every keystroke.

### PeterModal

AI assistant overlay. Manages its own internal step machine: questions → loading → results → limit. Calls the Peter AI API endpoint through the backend and displays structured recommendations. On apply, invokes the parent handlePeterApply callback which switches the symbol, positions the chart lines, and sets lot size and volume.

### SubscriptionModal

Three-tab plan selector showing Weekly, Monthly, and Yearly options with included features, locked features, and pricing. The CTA button style adapts to each plan's accent colour. Demo only — no payment processing is wired in the current build.

### ToastOverlay

Renders transient notifications centred on screen using fixed positioning:

- NOFUNDS — red, 💸 icon, shows an OPEN WALLET button
- PENDING — purple, ⏳ icon, order waiting for entry
- ENTRY_HIT — blue, 🚀 icon, trade now active in market
- BUY / SELL — green or red, position opened confirmation

### ResultToast

Slides in from the top of the screen when a TP or SL level is hit. Shows hit type with icon (🎯 or 🛑), P&L amount in ZAR, and pip count. Auto-dismisses after 5 seconds with a shrinking progress bar.

---

## 13. Docker Setup

The application runs three containers coordinated by Docker Compose.

### docker-compose.yml

```yaml
version: "3.9"

services:

  postgres:
    image: postgres:15-alpine
    container_name: equal_db
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: equal_redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    build: ./backend
    container_name: equal_api
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
      SECRET_KEY: ${SECRET_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  postgres_data:
```

### Backend Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.test.yml

A mirror of the main compose file pointing to a separate `equal_test` database, used exclusively by the test suite so production data is never touched.

---

## 14. Environment Variables

Copy `.env.example` to `.env` and populate all values before starting.

```env
# PostgreSQL
POSTGRES_USER=equal
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=equal_db

# Backend
DATABASE_URL=postgresql+asyncpg://equal:your_secure_password_here@localhost/equal_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_jwt_secret_key_minimum_32_characters
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Frontend (Vite)
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

---

## 15. Running the Application

### Prerequisites

- Docker Desktop (or Docker Engine with Docker Compose plugin)
- Node.js 20 or higher (for frontend development server)
- Python 3.12 or higher (for backend development outside Docker)

### Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/yourname/equal.git
cd equal

# Copy and configure environment variables
cp .env.example .env
# Edit .env and fill in your values

# Build and start all services (Postgres, Redis, Backend API)
docker compose up -d

# Run database migrations
docker exec equal_api alembic upgrade head

# Start the frontend development server
cd frontend
npm install
npm run dev
```

The application will be available at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Rebuild after code changes

```bash
docker compose up --build -d
```

### View live logs

```bash
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f redis
```

### Stop all services

```bash
docker compose down
```

### Destroy all data (including database volume)

```bash
docker compose down -v
```

---

## 16. Testing

### Backend Tests (pytest)

The backend test suite uses pytest with pytest-asyncio for async tests and httpx for async HTTP client requests against a real test database.

#### Start the test database

```bash
docker compose -f docker-compose.test.yml up -d
```

#### Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Run the test suite

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=app --cov-report=term-missing

# Run a specific test file
pytest tests/test_trades.py

# Run a specific test case
pytest tests/test_trades.py::test_tp_hit_closes_trade_with_profit

# Verbose output
pytest -v

# Stop on first failure
pytest -x
```

#### conftest.py Fixtures

```
db_session     Async database session scoped to each test, rolls back on teardown
auth_client    Async HTTP test client with a pre-authenticated user's JWT header
funded_user    A test user with R5,000 already deposited in their wallet
```

#### Test File Descriptions

**test_auth.py**

Covers the full authentication flow. Verifies that a new user can register with a hashed password stored in the database, that duplicate email registration is rejected with a 409 response, that login returns both an access token and a refresh token, that token refresh produces a valid new access token, and that protected endpoints return 401 when an invalid or expired token is presented.

**test_wallet.py**

Covers all wallet operations. Verifies that a wallet is automatically created with zero balance when a user registers, that deposits add the correct amount and create a transaction record, that deposits below the R100 minimum are rejected with a 422 response, that withdrawals deduct the correct amount and create a transaction record, that withdrawals are blocked when open trades exist (margin is locked), that withdrawals exceeding the available balance are rejected, and that the balance accurately reflects the margin reserved by pending and active orders.

**test_orders.py**

Covers the pending order system. Verifies that placing a BUY order deducts the correct margin from the wallet, that placing a SELL order deducts the correct margin, that an order cannot be placed when the wallet has insufficient balance, that the placed order appears in the pending orders list, that cancelling an order returns the full margin to the wallet, and that the cancelled order is removed from the pending list.

**test_trades.py**

Covers the full trade lifecycle. Verifies that a pending BUY order activates when the price reaches or exceeds the entry, that a pending SELL order activates when the price reaches or falls below the entry, that the activated trade appears in the open trades list, that a TP hit on a BUY closes the trade with the correct ZAR profit, that an SL hit on a BUY closes the trade with the correct ZAR loss, that a TP hit on a SELL closes the trade with the correct ZAR profit, that an SL hit on a SELL closes the trade with the correct ZAR loss, that the realised P&L matches the pip calculation formula, that the margin is correctly returned to the wallet on close, that manual close via the API closes the trade at the current price, that close-all closes every open position, and that closed trades are persisted to the trade_history table.

**test_prices.py**

Covers the price feed. Verifies that the REST endpoint returns a price for a known symbol, that it returns a 404 for an unknown symbol, that a WebSocket connection is accepted and sends at least one price tick, and that the simulated price remains within the defined drift bounds (1.5 percent of base price).

**test_peter.py**

Covers the AI analysis endpoint. Verifies that the endpoint returns all required response fields (recommendedSymbol, direction, entry, takeProfit, stopLoss, reasoning), that the usage counter increments with each successful call, that a free user receives a 402 response after exceeding the 3-request limit, that a subscribed user is not blocked by the usage limit, and that missing required request fields return a 422 validation error.

**test_pip_calc.py**

Pure unit tests for the pip calculation utility functions. Verifies pip size is correct for low-priced instruments (forex), pip size is correct for high-priced instruments (stocks and BTC), ZAR P&L is correct for ZAR-denominated pairs without currency conversion, ZAR P&L is correct for USD-denominated pairs applying the USD/ZAR rate, the margin formula returns the minimum of R50 for very small lot and volume combinations, and negative P&L is calculated correctly for losing BUY and SELL positions.

---

### Frontend Tests (Vitest + React Testing Library)

```bash
cd frontend
npm install

# Run all tests once
npm test

# Run in interactive watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run a specific file
npm test WalletModal
```

#### Test File Descriptions

**pipCalc.test.js**

Pure JavaScript unit tests for the pip calculation helpers. No React rendering involved. Covers pip size per instrument type, ZAR output accuracy for given inputs, and edge cases including zero pips, maximum volume, and symbols not in the base price map.

**TradingDashboard.test.jsx**

Integration tests for the main dashboard component. Verifies that the balance row shows ZAR 0,00 on initial load, that BUY and SELL buttons are disabled when the balance is zero, that placing an order triggers the correct API call with the expected payload, that the NOFUNDS toast appears when BUY is clicked with zero balance, that the OPEN WALLET button inside the NOFUNDS toast opens the wallet modal, that the positions strip shows a pending chip after an order is placed, and that the chip updates to an active state after the entry price is hit.

**LiveChart.test.jsx**

Component tests for the chart. Verifies that the SVG renders with the correct viewBox dimensions, that candles are rendered within the clip region, that level lines appear when entry/TP/SL props have values, that lines do not render when values are null, that the drag grip handle is visible when no active trade exists for the symbol, that the grip handle is hidden and non-interactive when an active trade exists, that the zoom counter badge shows the correct candle count, that the zoom in button decreases the candle count, that the zoom out button increases the candle count, and that pending ghost lines render with reduced opacity.

**WalletModal.test.jsx**

Component tests for the wallet modal. Verifies that all four tabs render and that switching tabs updates the visible content, that the deposit input field accepts a numeric value typed by the user, that tapping a quick chip sets the input to the correct amount, that submitting a deposit below R100 shows a validation error message, that a valid deposit calls the onDeposit handler with the correct numeric amount, that a blocked withdraw message is shown when open trades exist, and that the history tab renders transactions in chronological order.

**PeterModal.test.jsx**

Component tests for the Peter AI modal. Verifies that the questions step renders three checkboxes, that selecting a checkbox marks it as checked, that tapping ANALYSE with options selected calls the API with the selected options in the payload, that a loading spinner is displayed during the API call, that the results step renders the symbol, direction badge, and reasoning text, that tapping APPLY calls the onApply callback with the full recommendation object, that usage indicator dots decrease as requests are consumed, that the limit screen is shown after 3 free requests are used, and that the upgrade button on the limit screen invokes the subscription modal callback.

---

### Continuous Integration

A GitHub Actions workflow runs automatically on every push and pull request to the main branch.

**Steps:**

1. Spin up PostgreSQL 15 and Redis 7 as service containers
2. Install backend dependencies and run pytest with an 80 percent coverage requirement
3. Install frontend dependencies and run Vitest with an 80 percent coverage requirement
4. Run ruff linter on the backend codebase
5. Run ESLint on the frontend codebase
6. Build the frontend production bundle as a smoke test

---

## 17. Subscription Plans

| Feature | Free | Weekly R49 | Monthly R149 | Yearly R999 |
|---------|------|------------|--------------|-------------|
| Peter AI setups | 3 total | 5 per day | Unlimited | Unlimited |
| Live chart | Yes | Yes | Yes | Yes |
| Pending orders | Yes | Yes | Yes | Yes |
| Wallet | Yes | Yes | Yes | Yes |
| Multi-timeframe analysis | No | No | Yes | Yes |
| AI risk sizing | No | No | Yes | Yes |
| Pattern recognition AI | No | No | No | Yes |
| News sentiment feed | No | No | No | Yes |
| Backtesting | No | No | No | Yes |
| Priority support | No | No | No | Yes |

The yearly plan saves R789 compared to paying monthly for 12 months.

> All payments in the current build are simulation-only. No real charges are applied. Payment integration (such as PayFast or Stripe) would be connected through the `/api/subscriptions/upgrade` endpoint when moving to production.

---

*eQual is a simulation platform for educational purposes only. No real money is involved. Trading financial markets carries significant risk. The platform built was assisted using Cladue.AI tool*