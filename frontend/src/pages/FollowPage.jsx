import { useState } from "react";
import BottomNav from "../components/BottomNav";

/**
 * Follow page displaying trader leaderboard and copy trade alerts
 */
export default function FollowPage() {
  const [tab, setTab] = useState("ALL TIME");

  const traders = [
    {
      rank: 1,
      name: "TheboKing",
      initials: "TK",
      win: "94%",
      ratio: "4.9x",
      followers: "8.2K",
      profit: "+R142K",
      badge: "TOP MASTER",
      color: "#facc15",
      bg: "#2a1600",
    },
    {
      rank: 2,
      name: "ZaneleM",
      initials: "ZN",
      win: "88%",
      ratio: "4.7x",
      followers: "5.1K",
      profit: "+R98K",
      color: "#60a5fa",
    },
    {
      rank: 3,
      name: "MokoenaP",
      initials: "MP",
      win: "82%",
      ratio: "4.5x",
      followers: "3.4K",
      profit: "+R71K",
      color: "#f472b6",
    },
    {
      rank: 4,
      name: "SiphoK",
      initials: "SK",
      win: "79%",
      ratio: "4.3x",
      followers: "1.9K",
      profit: "+R54K",
      color: "#34d399",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#05050e",
        fontFamily: "'Courier New', monospace",
        paddingBottom: "90px",
        maxWidth: "420px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #1e1e3a",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            color: "#ff66cc",
            letterSpacing: "2px",
          }}
        >
          FOLLOW
        </div>

        <div
          style={{
            fontSize: "8px",
            color: "#5050a0",
            marginTop: "4px",
          }}
        >
          COPY TOP TRADERS · EARN COMMISSION
        </div>

        <div
          style={{
            marginTop: "10px",
            fontSize: "9px",
            color: "#38bdf8",
          }}
        >
          12 FOLLOWING
        </div>
      </div>

      {/* Leaderboard Tabs */}
      <div style={{ padding: "16px" }}>
        <div
          style={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
          }}
        >
          {["ALL TIME", "THIS WEEK", "THIS MONTH", "STOCKS", "CRYPTO"].map(
            (t) => (
              <div
                key={t}
                onClick={() => setTab(t)}
                style={{
                  fontSize: "8px",
                  padding: "6px 10px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  border: "1px solid #2e2e58",
                  background: tab === t ? "#ff66cc" : "transparent",
                  color: tab === t ? "#05050e" : "#c8c8ee",
                  whiteSpace: "nowrap",
                }}
              >
                {t}
              </div>
            )
          )}
        </div>
      </div>

      {/* Traders */}
      <div style={{ padding: "0 16px" }}>
        {traders.map((t) => (
          <TraderCard key={t.rank} trader={t} />
        ))}
      </div>

      {/* Copy Trade Alert */}
      <div
        style={{
          margin: "16px",
          padding: "14px",
          background: "#00210f",
          border: "1px solid #16a34a",
          borderRadius: "10px",
        }}
      >
        <div style={{ fontSize: "9px", color: "#16a34a" }}>
          COPY TRADE ALERT
        </div>

        <div
          style={{
            fontSize: "10px",
            color: "#c8facc",
            marginTop: "6px",
          }}
        >
          TheboKing just opened BUY on BTC/USD — 4.9x trader, 94% win rate
        </div>

        <button
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            background: "#16a34a",
            border: "none",
            fontSize: "10px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          COPY THIS TRADE
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

/**
 * Trader leaderboard card
 */
function TraderCard({ trader }) {
  return (
    <div
      style={{
        background: trader.bg || "#0d0820",
        border: `1px solid ${trader.color}33`,
        borderRadius: "12px",
        padding: "14px",
        marginBottom: "10px",
      }}
    >
      {/* Top */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: trader.color,
          }}
        >
          #{trader.rank}
        </div>

        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: trader.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "bold",
            color: "#05050e",
          }}
        >
          {trader.initials}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "11px",
              color: "#e8e8ff",
            }}
          >
            {trader.name}
          </div>

          {trader.badge && (
            <div
              style={{
                fontSize: "7px",
                color: "#facc15",
                marginTop: "2px",
              }}
            >
              {trader.badge}
            </div>
          )}
        </div>

        <button
          style={{
            fontSize: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            border: `1px solid ${trader.color}`,
            background: "transparent",
            color: trader.color,
            cursor: "pointer",
          }}
        >
          FOLLOW
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          marginTop: "12px",
          fontSize: "9px",
          color: "#c8c8ee",
          textAlign: "center",
        }}
      >
        <Stat label="WIN RATE" value={trader.win} />
        <Stat label="RATIO" value={trader.ratio} />
        <Stat label="FOLLOWERS" value={trader.followers} />
        <Stat label="TOTAL PNL" value={trader.profit} />
      </div>
    </div>
  );
}

/**
 * Stat column inside trader card
 */
function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontWeight: "bold" }}>{value}</div>
      <div style={{ fontSize: "7px", color: "#5050a0" }}>{label}</div>
    </div>
  );
}
