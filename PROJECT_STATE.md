# eQual — Project State Document
> Last updated: March 2026  
> Purpose: Full handoff document for continuing development in any new chat session.  
> Paste this document at the start of a new conversation to give Claude full context instantly.

---

## 1. What Is eQual

eQual is a simulation (paper) trading platform built mobile-first for African markets. Users deposit virtual funds, trade forex/crypto/stocks on a live candlestick chart, copy trades from top-ranked traders, and use Peter AI to find setups. No real money is involved.

**Slogan:** *Complexity is the enemy of execution*

**Core product principle:** Currency is a language. Every price, spread, and P&L figure must display in the user's native currency based on their country selection at registration. South African users see ZAR. Nigerian users see NGN. The app never forces a user to mentally convert dollars.

---

## 2. Current Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, inline CSS-in-JS, SVG chart engine |
| Backend | Python 3.12, FastAPI, Uvicorn |
| Database | PostgreSQL 15 (Docker volume) |
| ORM | SQLAlchemy 2.0 async |
| Auth | JWT via python-jose, bcrypt |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Price data | CoinGecko (crypto) + Frankfurter (forex) |
| Cache | Redis 7 |
| Containers | Docker, Docker Compose |

---

## 3. Local Environment

```
Project root:     ~/equaltradingdashboard/
Frontend:         ~/equaltradingdashboard/frontend/
Backend:          ~/equaltradingdashboard/backend/
Env file:         ~/equaltradingdashboard/.env

Containers:
  equal_db        PostgreSQL 15    port 5432
  equal_redis     Redis 7          port 6379
  equal_api       FastAPI          port 8001 (internal 8000)

Frontend dev:     http://localhost:5173
Backend API:      http://localhost:8001
API docs:         http://localhost:8001/docs
```

### Start the platform
```bash
cd ~/equaltradingdashboard
bash start.sh              # normal start
bash start.sh --build      # force rebuild backend image
bash start.sh --reset      # wipe DB and start fresh (deletes all data)
```

### Deploy backend file changes
```bash
docker cp backend/app/routers/orders.py equal_api:/app/app/routers/orders.py
docker cp backend/app/services/price_service.py equal_api:/app/app/services/price_service.py
docker cp backend/app/main.py equal_api:/app/app/main.py
# Uvicorn --reload detects changes automatically
```

---

## 4. What Is Built and Working

### Backend — complete
- JWT auth (register, login, refresh)
- Wallet (deposit, withdraw, balance, history)
- Pending orders (place, cancel, list, activate)
- Open trades (open, close, close-all, history)
- Real-time prices from CoinGecko + Frankfurter (15s fetch, in-memory cache)
- Peter AI via Anthropic Claude API with usage limits
- Subscriptions (FREE / WEEKLY / MONTHLY / YEARLY) with upgrade + wallet deduction
- `/health` endpoint

### Frontend — complete
- `TradingDashboard.jsx` — main dashboard, owns all state
- `CandleChart.jsx` — SVG candlestick chart, pan, pinch-zoom, draggable level lines
- `PeterModal.jsx` — AI analysis modal with usage gate and subscription prompt
- `WalletModal.jsx` — deposit, withdraw, history, open positions, close all
- `SubscriptionModal.jsx` — plan selector and upgrade flow
- `services/api.js` — axios instance with JWT injection
- `constants.js` — SYMBOLS, LOT_SIZES, C (colour palette), chart dimensions

### Key frontend mechanics confirmed working
- Real-time price polling every 2s from backend → `livePrice` state
- Chart drift (400ms tick): `driftRef` micro-drifts toward real price + noise → `onPriceUpdate` callback → `chartPrice` state in dashboard
- `displayPrice = chartPrice || livePrice` — single source of truth for ALL price displays, P&L, TP/SL checks, entry activation
- `livePriceRef` tracks `displayPrice` so price monitor interval uses smoothed chart price
- Price monitor runs every 400ms — activates pending orders, updates P&L, fires TP/SL auto-close
- `activatingOrdersRef` and `closingTradesRef` — Set-based guards prevent double activation/close
- TP/SL close sends exact hit price + reason to backend
- `release_margin` on backend updates wallet balance and commits on trade close
- Pip-aware chart scaling: 40-pip padding each side so USD/ZAR shows tight range (16.83–16.91)
- `calcPips` uses Mini lot as default when no lot selected so ZAR values show immediately

### Database patches applied (must re-run after --reset)
```sql
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS peter_limit INTEGER DEFAULT 3;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS peter_uses_today INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE subscriptions ALTER COLUMN started_at DROP NOT NULL;
```

### pg_hba fix (Windows / asyncpg — re-run after container restart)
```bash
docker exec equal_db sh -c "echo 'host all all all trust' >> /var/lib/postgresql/data/pg_hba.conf"
docker exec equal_db sh -c "su postgres -c 'pg_ctl reload -D /var/lib/postgresql/data'"
```

---

## 5. Key Architecture Decisions

### Price sync pattern
The chart's internal `driftRef` (400ms) is the source of truth for displayed price. It fires `onPriceUpdate(next)` → `setChartPrice(next)` in the parent. `displayPrice = chartPrice || livePrice`. This means the price header, P&L, current balance, and TP/SL monitor all update at 400ms in sync with candle movement.

### Trade lifecycle
1. User sets ENTRY / TP / SL lines on chart → taps BUY or SELL
2. `ordersAPI.place()` → backend reserves margin → returns order ID
3. Price monitor checks every 400ms: `BUY && cur >= entry` → `ordersAPI.activate()`
4. Trade moves to `openTrades` → P&L tracks live via `displayPrice`
5. TP/SL check every 400ms → `tradesAPI.close(id, hitPrice, reason)` → backend releases margin + commits → `fetchWallet()`

### Deployment pattern
Never use heredocs in Git Bash — they corrupt files. Edit locally in VS Code, then `docker cp` to deploy.

---

## 6. File Inventory — Key Files

```
backend/app/
├── main.py                   FastAPI app, lifespan, realtime_price_updater background task
├── config.py                 Settings from .env (groq_api_key, anthropic, origins)
├── routers/
│   ├── auth.py               /api/auth/register  /api/auth/login  /api/auth/refresh
│   ├── wallet.py             /api/wallet  /api/wallet/deposit  /api/wallet/withdraw
│   ├── orders.py             /api/orders/place  /api/orders/pending  /api/orders/{id}/activate
│   ├── trades.py             /api/trades/open  /api/trades/{id}/close  /api/trades/close-all
│   ├── prices.py             /api/prices/{symbol}  WS /ws/prices/{symbol}
│   ├── peter.py              /api/peter/analyse  (mounted at /api prefix)
│   └── subscriptions.py      /api/subscriptions/plans  /api/subscriptions/upgrade
├── services/
│   ├── price_service.py      CoinGecko + Frankfurter fetch, in-memory cache, realtime_price_updater
│   ├── wallet_service.py     release_margin updates balance + commits
│   ├── trade_service.py      close_trade calls release_margin
│   └── peter_service.py      Anthropic API call
└── models/
    └── subscription.py       PLAN_LIMITS, can_use_peter property

frontend/src/
├── TradingDashboard.jsx      Main dashboard — owns all state
├── constants.js              SYMBOLS, LOT_SIZES, USD_TO_ZAR, C palette, W/H/PAD/CW/CH
├── services/api.js           axios instance, walletAPI, pricesAPI, ordersAPI, tradesAPI, subscriptionAPI
└── components/
    ├── CandleChart.jsx       SVG chart, drift engine, onPriceUpdate callback
    ├── PeterModal.jsx        AI modal
    ├── WalletModal.jsx       Wallet tabs
    └── SubscriptionModal.jsx Plan selector

Root:
├── start.sh                  Single command launch script
├── docker-compose.yml        3 services: equal_db, equal_redis, equal_api
├── .env                      Secrets (not in git)
└── README.md                 Full documentation
```

---

## 7. Colour Palette (Design System)

The eQual colour system is intentional and psychology-driven. Each colour maps to an emotion and a feature area.

| Colour | Hex | Psychology | Used for |
|--------|-----|-----------|---------|
| Cyan | `#38bdf8` | Trust, technology, clarity | Brand, entry lines, wallet, core UI |
| Purple | `#a78bfa` | Intelligence, premium, mystery | Peter AI, protection, subscription |
| Green | `#4ade80` | Profit, safety, success | TP hit, positive P&L, buy direction |
| Red | `#f87171` | Loss, danger, alert | SL hit, negative P&L, deficit |
| Gold | `#facc15` | Status, wealth, achievement | Leaderboard #1, arbitrage, deposit prompt |
| Pink | `#f472b6` | Social, connection, community | Follow tab, social features |
| Orange | `#f97316` | Urgency, excitement, impulse | Warnings, countdown timers, Bet tab |
| Dark bg | `#05050e` | Focus, premium, seriousness | App background |

**Rule:** Maximum 2-3 accent colours per screen. Each tab owns its colour identity. Within a tab, stay in that colour family.

---

## 8. App Structure — All Screens

### Bottom Navigation (5 tabs)
```
BET (cyan) | TRADE (green) | ARB (gold) | FOLLOW (pink) | WALLET/PROFILE (cyan)
```

### Screen inventory

#### Screens built (code exists)
- Trading dashboard (current main screen)
- Peter AI modal
- Wallet modal (4 tabs: overview, deposit, withdraw, history)
- Subscription modal

#### Screens designed (mockups complete, code not yet started)
- **Landing page** — post login/register, logo + slogan + live stats strip + Peter alert card + bottom nav
- **Register page** — display name, email, password, country selector (sets currency), terms, create account
- **Login page** — email, password, forgot password, sign in button
- **Follow / Leaderboard page** — tabs: Leaderboard, Following, Suggested; filter strip; scrollable trader cards with rank, avatar, verified badge, username, location, star rating, win rate, followers, total P&L, live trade indicator; copy trade alert banner
- **Copy Trade modal** — blurred chart + blurred entry/TP/SL details (COPY TO REVEAL mechanic); user's own lot size + volume selectors; commission notice; COPY TRADE button
- **Arbitrage dashboard** — AI scanning badge; balance row; Peter AI opportunity alert; market + symbol selectors; exchange spread visualiser (BUY AT green / SELL AT red / spread badge in gold); order type toggle; amount input with quick chips; coins + spread value + fees + estimated profit breakdown; window warning; EXECUTE ARBITRAGE button
- **Profile / Settings page** — avatar, verified badge, stats strip (trades/P&L/rank), edit profile, country & currency, notifications toggle, subscription, theme, security, help, about, SIGN OUT button

#### Screens pending design (CryptoOrbit / Bet)
- Bet tab — CryptoOrbit integration, designs to be provided separately

---

## 9. User Registration — New Fields Required

The current registration flow needs these additions:

### New DB columns needed on `users` table
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'ZAR';
ALTER TABLE users ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(5) DEFAULT 'R';
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
```

### Country → Currency mapping (backend)
```python
COUNTRY_CURRENCY = {
    "South Africa": {"code": "ZAR", "symbol": "R", "flag": "🇿🇦"},
    "Nigeria":      {"code": "NGN", "symbol": "₦", "flag": "🇳🇬"},
    "Kenya":        {"code": "KES", "symbol": "KSh", "flag": "🇰🇪"},
    "United Kingdom": {"code": "GBP", "symbol": "£", "flag": "🇬🇧"},
    "United States":  {"code": "USD", "symbol": "$", "flag": "🇺🇸"},
    # expand as needed
}
```

### Currency conversion principle
Every price displayed to the user goes through a conversion layer:
- Fetch USD → user_currency rate from Frankfurter at app start
- Store as `user.currency_rate` in session
- All P&L, spread values, wallet balances display in user currency
- Symbol: use `user.currency_symbol` everywhere `R` or `ZAR` currently appears hardcoded

---

## 10. Social / Follow System — Design Spec

### Trader card data points
- Avatar / initials
- Verified badge (blue checkmark)
- Username
- Location (city, country)
- Star rating (e.g. 4.9★) — calculated from follower reviews
- Win rate percentage (e.g. 94%) — `successful_closes / total_closes`
- Follower count
- Total P&L in user's currency
- Live trade indicator (green dot + symbol + current pips if in active trade)
- Rank position with movement indicator (▲ +2 rising)

### New DB tables needed
```sql
-- follows
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id),
    trader_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, trader_id)
);

-- trader_stats (materialised or updated on trade close)
CREATE TABLE trader_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    win_rate NUMERIC(5,2) DEFAULT 0,
    total_pnl NUMERIC(18,4) DEFAULT 0,
    star_rating NUMERIC(3,2) DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- copy_trades
CREATE TABLE copy_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id),
    trader_id UUID REFERENCES users(id),
    original_trade_id UUID REFERENCES open_trades(id),
    lot_size VARCHAR,
    volume INTEGER,
    commission_rate NUMERIC(5,4) DEFAULT 0.05,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Copy trade mechanic
1. Trader opens a trade → backend checks if trader has followers
2. Push notification sent to all followers: "TheboKing opened BUY BTC/USD"
3. Follower taps notification → Copy Trade modal opens
4. Chart and entry/TP/SL blurred — follower selects their own lot size + volume
5. Follower taps COPY → new order placed in their account at same entry/TP/SL
6. When original trade closes (TP/SL/manual) → all copied trades close at same price
7. Commission deducted from follower P&L → credited to trader wallet (5% default)

### Blurred details — protection mechanic
The blur prevents followers from screenshotting and executing manually on another platform. This keeps all execution on eQual and ensures the trader earns commission. Technically: trade details stored in DB, only served to user after `copy_trade` record is created.

---

## 11. Arbitrage System — Design Spec

### What it does
Compares the price of the same asset across different exchanges. If BTC is R2,000 cheaper on Luno than on Binance, the user buys on Luno and sells on Binance, pocketing the spread minus fees.

### Exchange list (South Africa focus)
- **Local:** Luno, VALR, AltCoinTrader
- **Global:** Binance, Kraken, Coinbase

### Peter AI arbitrage scanner
- Runs as a background task alongside the price service
- Fetches prices from multiple exchange APIs every 30s
- Calculates spread for each pair across exchange combinations
- When spread > fee threshold → stores as opportunity → triggers push notification
- Notification: "BTC/USD: R1,240 spread between Luno and Binance — window closing"

### Estimated profit calculation
```
gross_spread = sell_price - buy_price
buy_fee = buy_price × exchange_a_fee_rate
sell_fee = sell_price × exchange_b_fee_rate
transfer_fee = fixed_network_fee (per coin)
estimated_profit = (gross_spread - buy_fee - sell_fee - transfer_fee) × coin_quantity
```

### New DB table
```sql
CREATE TABLE arbitrage_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR NOT NULL,
    buy_exchange VARCHAR NOT NULL,
    sell_exchange VARCHAR NOT NULL,
    buy_price NUMERIC(18,6),
    sell_price NUMERIC(18,6),
    spread NUMERIC(18,6),
    estimated_profit_zar NUMERIC(18,4),
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 12. Peter AI — Notification System (Planned)

### Current state
Peter is on-demand only. User opens the modal, selects analysis type, gets a recommendation.

### Planned: background scanner
- Background task in FastAPI (alongside `realtime_price_updater`)
- Runs every 5 minutes
- Scans current prices for: RSI conditions, breakout patterns, support/resistance touches, volatility spikes
- When setup meets quality threshold → creates notification record for eligible users
- Push notification: "Peter AI: USD/ZAR breakout forming — 89 pip opportunity"

### FOMO follow-up notification
- If user receives notification but does not act within 30 minutes
- If the trade would have been profitable → send follow-up: "You missed that USD/ZAR setup — it hit TP, +89 pips. Don't miss the next one."
- Uses `trade_history` data to calculate what would have happened

### Notification DB table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR NOT NULL, -- PETER_SIGNAL, COPY_TRADE, TP_HIT, SL_HIT, ARB_OPPORTUNITY, FOMO_FOLLOWUP
    title VARCHAR NOT NULL,
    body TEXT,
    data JSONB, -- trade details, symbol, entry, tp, sl etc
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 13. Habit-Forming Mechanics Summary

### Already in the app
- Variable reward loop — TP/SL toast with suspense → dopamine hit or loss aversion trigger
- Sunk cost hook — margin reservation means users return to check pending orders
- Incompletion tension (Zeigarnik) — pending order chips in the strip = open loop in user's mind
- AI scarcity — 3 free Peter requests creates urgency to subscribe
- Positions strip — constant visual reminder something is waiting

### Designed but not yet built
- Live stats on landing page — "1,247 active traders today" — social proof
- Peter AI alert on landing page — immediate hook on every app open
- Notification badges on nav tabs — unread count creates obligation to clear
- Live trade indicator on Follow page — "TheboKing is in the market RIGHT NOW"
- Rank movement indicators — ▲ +2 creates anticipation, drives return visits
- Copy trade time pressure — entry price expires, forces fast decisions
- Arbitrage countdown — spread windows close, highest urgency mechanic in the app
- FOMO follow-up notification — "you missed +89 pips" — most powerful re-engagement
- Trader commission — top traders motivated to keep trading well, self-sustaining quality

---

## 14. Build Roadmap

### Phase 1 — Foundation (next to build)
- [ ] Register page with country selection + currency mapping
- [ ] Login page
- [ ] Landing page (post login) with live stats + Peter alert + bottom nav
- [ ] Profile / Settings page with logout
- [ ] Add `country`, `currency_code`, `currency_symbol`, `display_name` to users table
- [ ] Currency conversion layer in frontend (replace hardcoded ZAR with user currency)
- [ ] Bottom navigation shell with all 5 tabs routing to correct screens

### Phase 2 — Social
- [ ] Follow / Leaderboard page
- [ ] Trader stats calculation (win rate, total P&L, star rating)
- [ ] Follow / unfollow API endpoints
- [ ] Copy Trade modal with blur mechanic
- [ ] Copy trade execution + commission logic
- [ ] Push notifications for copy trade alerts

### Phase 3 — Arbitrage
- [ ] Arbitrage dashboard UI
- [ ] Exchange price fetching service (Luno, VALR, Binance)
- [ ] Spread calculation + fee estimation
- [ ] Peter AI arbitrage scanner background task
- [ ] Push notifications for arbitrage opportunities

### Phase 4 — Peter Notifications
- [ ] Background market scanner
- [ ] Notification DB table + API endpoints
- [ ] In-app notification centre
- [ ] FOMO follow-up notification logic

### Phase 5 — CryptoOrbit (Bet)
- [ ] Designs to be provided
- [ ] Integration with eQual wallet
- [ ] Bet tab in bottom navigation

---

## 15. Test Account

```
Email:    sara@example.com
Password: Khazimla@2015
Balance:  ~R2,875,101 (from test trades)
```

---

## 16. Git

```bash
# Standard commit pattern
git add -A
git commit -m "feat: description of what was built"
git push

# Specific file commit
git add frontend/src/components/CandleChart.jsx frontend/src/TradingDashboard.jsx
git commit -m "fix: description of what was fixed"
git push
```

---

## 17. How to Continue in a New Chat

1. Paste this entire document at the start of the new conversation
2. State what phase you are working on (e.g. "Phase 1 — Register page")
3. Attach any relevant design images
4. Claude will have full context of the project, stack, decisions, and roadmap

**The most important things to remind Claude:**
- Backend runs on port 8001 (not 8000)
- Deploy backend changes via `docker cp`, not by editing inside the container
- `displayPrice = chartPrice || livePrice` — never use raw `livePrice` for display
- Currency is a language — all amounts must display in user's native currency
- No heredocs in Git Bash — always edit in VS Code then docker cp

---

*eQual — Complexity is the enemy of execution*
