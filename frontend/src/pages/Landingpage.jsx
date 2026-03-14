import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { walletAPI, subscriptionAPI } from "../services/api";
import { getUser, formatCurrency } from "../constants";

function SimCounter({ base, step = 3, interval = 900 }) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setVal(v => v + Math.floor(Math.random() * step * 2) - Math.floor(step * 0.4)), interval);
    return () => clearInterval(id);
  }, []);
  return <span>{val.toLocaleString()}</span>;
}

export default function LandingPage() {
  const nav  = useNavigate();
  const user = getUser();

  const [wallet,       setWallet]       = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [w, s] = await Promise.all([walletAPI.get(), subscriptionAPI.me()]);
        setWallet(w.data);
        setSubscription(s.data);
      } catch (e) {
        console.error("Landing load error", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const balance = wallet?.balance ?? 0;
  const sym     = user?.currency_symbol || "R";
  const plan    = subscription?.plan || "FREE";

  return (
    <div style={{ minHeight: "100vh", background: "#05050e", fontFamily: "'Courier New', monospace", paddingBottom: "80px" }}>

      {/* Header */}
      <div style={{ padding: "20px 20px 16px", background: "linear-gradient(180deg,#0a0820 0%,#05050e 100%)", borderBottom: "1px solid #1e1e3a" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <svg viewBox="0 0 160 44" width="72" height="20">
            <defs><linearGradient id="hlg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0ea5c8"/></linearGradient></defs>
            <text x="2"  y="34" fontFamily="Georgia,serif" fontSize="36" fontWeight="400" fontStyle="italic" fill="url(#hlg)">e</text>
            <text x="24" y="34" fontFamily="Georgia,serif" fontSize="36" fontWeight="700" fill="#e8e8ff">Q</text>
            <text x="55" y="34" fontFamily="Georgia,serif" fontSize="36" fontWeight="400" fill="#c8c8ee">ual</text>
          </svg>

          {/* User greeting + plan badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {plan !== "FREE" && (
              <div style={{ background: "#1a0a3a", border: "1px solid #a78bfa66", borderRadius: "12px", padding: "3px 10px" }}>
                <span style={{ fontSize: "8px", color: "#a78bfa", letterSpacing: "1px" }}>{plan}</span>
              </div>
            )}
            <div
              onClick={() => nav("/profile")}
              style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#38bdf8,#0ea5c8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", color: "#05050e", cursor: "pointer" }}
            >
              {(user?.display_name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ fontSize: "11px", color: "#5050a0", letterSpacing: "1px", marginBottom: "2px" }}>
            GOOD {getGreeting()},
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#e8e8ff", letterSpacing: "1px" }}>
            {user?.display_name || user?.email?.split("@")[0] || "Trader"}
          </div>
        </div>
      </div>

      {/* Balance card */}
      <div style={{ margin: "20px 16px 0", background: "linear-gradient(135deg,#061426,#082040)", border: "1px solid #38bdf844", borderRadius: "16px", padding: "20px" }}>
        <div style={{ fontSize: "9px", color: "#38bdf888", letterSpacing: "2px", marginBottom: "6px" }}>SIMULATED BALANCE</div>
        <div style={{ fontSize: "32px", fontWeight: "bold", color: "#38bdf8", letterSpacing: "1px", marginBottom: "4px" }}>
          {loading ? "..." : `${sym} ${balance.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>
        <div style={{ fontSize: "9px", color: "#5050a0", letterSpacing: "1px" }}>
          {user?.country || "South Africa"} · {user?.currency_code || "ZAR"}
        </div>

        {/* Quick action buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button
            onClick={() => nav("/trade")}
            style={{ flex: 1, background: "#38bdf822", border: "1px solid #38bdf866", borderRadius: "8px", padding: "10px", cursor: "pointer", fontFamily: "'Courier New', monospace", fontSize: "10px", color: "#38bdf8", letterSpacing: "1px", fontWeight: "bold" }}
          >
            ▶ TRADE
          </button>
          <button
            onClick={() => nav("/arb")}
            style={{ flex: 1, background: "#facc1522", border: "1px solid #facc1566", borderRadius: "8px", padding: "10px", cursor: "pointer", fontFamily: "'Courier New', monospace", fontSize: "10px", color: "#facc15", letterSpacing: "1px", fontWeight: "bold" }}
          >
            ⚡ ARB
          </button>
          <button
            onClick={() => nav("/follow")}
            style={{ flex: 1, background: "#f472b622", border: "1px solid #f472b666", borderRadius: "8px", padding: "10px", cursor: "pointer", fontFamily: "'Courier New', monospace", fontSize: "10px", color: "#f472b6", letterSpacing: "1px", fontWeight: "bold" }}
          >
            👥 FOLLOW
          </button>
        </div>
      </div>

      {/* Live platform stats strip */}
      <div style={{ margin: "16px 16px 0", background: "#0a0a1e", border: "1px solid #1e1e3a", borderRadius: "12px", padding: "14px 16px" }}>
        <div style={{ fontSize: "8px", color: "#5050a0", letterSpacing: "2px", marginBottom: "12px" }}>PLATFORM · LIVE</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <StatPill label="ACTIVE TRADERS" value={<SimCounter base={1247} step={5} interval={800} />} color="#4ade80" />
          <StatPill label="TODAY'S TRADES" value={<SimCounter base={8392} step={12} interval={600} />} color="#38bdf8" />
          <StatPill label="TOP P&L TODAY" value={`${sym}142K`} color="#facc15" />
        </div>
      </div>

      {/* Peter AI alert card */}
      <div
        onClick={() => nav("/trade")}
        style={{ margin: "16px 16px 0", background: "#0a0820", border: "1px solid #a78bfa44", borderRadius: "12px", padding: "14px 16px", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#3b0764,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold", color: "#ddd6fe", flexShrink: 0 }}>AI</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "9px", color: "#a78bfa", letterSpacing: "1px", marginBottom: "4px" }}>PETER AI · MARKET ALERT</div>
            <div style={{ fontSize: "11px", color: "#c8c8ee", lineHeight: "1.5" }}>
              USD/ZAR is approaching key resistance. Potential breakout setup forming — 68 pip opportunity.
            </div>
          </div>
          <span style={{ fontSize: "14px", color: "#a78bfa" }}>▶</span>
        </div>
        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa" }} />
          <span style={{ fontSize: "8px", color: "#5050a0", letterSpacing: "1px" }}>TAP TO ANALYSE WITH PETER</span>
        </div>
      </div>

      {/* Market snapshot */}
      <div style={{ margin: "16px 16px 0" }}>
        <div style={{ fontSize: "8px", color: "#5050a0", letterSpacing: "2px", marginBottom: "10px" }}>MARKET SNAPSHOT</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <MarketRow symbol="BTC/USD" change="+2.4%" up={true}  sym={sym} />
          <MarketRow symbol="USD/ZAR" change="-0.3%" up={false} sym={sym} />
          <MarketRow symbol="ETH/USD" change="+1.1%" up={true}  sym={sym} />
          <MarketRow symbol="APPLE"   change="+0.8%" up={true}  sym={sym} />
        </div>
      </div>

      {/* Leaderboard teaser */}
      <div style={{ margin: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ fontSize: "8px", color: "#5050a0", letterSpacing: "2px" }}>TOP TRADERS TODAY</div>
          <span onClick={() => nav("/follow")} style={{ fontSize: "8px", color: "#f472b6", letterSpacing: "1px", cursor: "pointer" }}>SEE ALL ▶</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <LeaderRow rank={1} name="TheboKing"  pnl={`+${sym}14,200`} rate="94%" />
          <LeaderRow rank={2} name="ForexFundi" pnl={`+${sym}9,800`}  rate="88%" />
          <LeaderRow rank={3} name="CryptoZA"   pnl={`+${sym}7,400`}  rate="81%" />
        </div>
      </div>

    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "MORNING";
  if (h < 17) return "AFTERNOON";
  return "EVENING";
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "16px", fontWeight: "bold", color, letterSpacing: "0.5px" }}>{value}</div>
      <div style={{ fontSize: "7px", color: "#5050a0", letterSpacing: "1px", marginTop: "3px" }}>{label}</div>
    </div>
  );
}

function MarketRow({ symbol, change, up, sym }) {
  return (
    <div
      style={{ background: "#0d0d1a", border: "1px solid #1e1e3a", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
    >
      <span style={{ fontSize: "11px", color: "#c8c8ee", letterSpacing: "1px" }}>{symbol}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "10px", color: up ? "#4ade80" : "#f87171", fontWeight: "bold" }}>{change}</span>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: up ? "#4ade80" : "#f87171" }} />
      </div>
    </div>
  );
}

function LeaderRow({ rank, name, pnl, rate }) {
  const rankColor = rank === 1 ? "#facc15" : rank === 2 ? "#c0c0c0" : "#cd7f32";
  return (
    <div style={{ background: "#0d0d1a", border: "1px solid #1e1e3a", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: `${rankColor}22`, border: `1px solid ${rankColor}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold", color: rankColor, flexShrink: 0 }}>
        {rank}
      </div>
      <div style={{ flex: 1, fontSize: "11px", color: "#c8c8ee", letterSpacing: "1px" }}>{name}</div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "11px", color: "#4ade80", fontWeight: "bold" }}>{pnl}</div>
        <div style={{ fontSize: "8px", color: "#5050a0", marginTop: "1px" }}>{rate} WIN</div>
      </div>
    </div>
  );
}
