import { useState } from "react";
import BottomNav from "../components/BottomNav";
import { FaCheckCircle, FaStar, FaMapMarkerAlt, FaTrophy } from "react-icons/fa";

/**
 * Follow page displaying leaderboard with gamified design
 */
export default function FollowPage() {
  const [tab, setTab] = useState("ALL TIME");

  const traders = [
    {
      rank: 1,
      name: "Alicia Anderson",
      location: "Cape Town",
      rating: 4.8,
      ratio: 4.9,
      followers: 8200,
      profit: 142000,
      badge: "TOP MASTER",
      streak: 7,
      color: "#FACC15",
      bg: "#2A1600",
      verified: true,
    },
    {
      rank: 2,
      name: "Mia Van Staden",
      location: "Johannesburg",
      rating: 4.5,
      ratio: 4.7,
      followers: 5100,
      profit: 98000,
      streak: 5,
      color: "#7C3AED",
      verified: true,
    },
    {
      rank: 3,
      name: "Portia Van Wyk",
      location: "Durban",
      rating: 4.2,
      ratio: 4.5,
      followers: 3400,
      profit: 71000,
      streak: 3,
      color: "#60A5FA",
      verified: false,
    },
    {
      rank: 4,
      name: "Naomi Roberts",
      location: "Pretoria",
      rating: 4.0,
      ratio: 4.3,
      followers: 1900,
      profit: 54000,
      streak: 2,
      color: "#10B981",
      verified: false,
    },
  ];

  const tabs = ["ALL TIME", "THIS WEEK", "THIS MONTH", "STOCKS", "CRYPTO"];

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: "420px",
        margin: "0 auto",
        fontFamily: "'Inter', sans-serif",
        background: "#0D0D20",
        paddingBottom: "90px",
        color: "#A0A0C0",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          textAlign: "center",
          background: "linear-gradient(90deg, #7C3AED 0%, #F472B6 100%)",
          borderBottomLeftRadius: "16px",
          borderBottomRightRadius: "16px",
          color: "#fff",
          marginBottom: "8px",
          boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <FaTrophy size={20} style={{ color: "#FACC15" }} />
        <div
          style={{
            fontSize: "16px",
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          Trader Leaderboard
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: "10px",
          color: "#E0E0FF",
          marginBottom: "12px",
        }}
      >
        Track top traders, follow them, and compete for the top spots!
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 16px 16px 16px",
        }}
      >
        {tabs.map((t) => (
          <div
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontSize: "10px",
              padding: "6px 0",
              borderRadius: "20px",
              cursor: "pointer",
              flex: 1,
              textAlign: "center",
              margin: "0 4px",
              background: tab === t ? "#7C3AED" : "transparent",
              color: tab === t ? "#0D0D20" : "#A0A0C0",
              fontWeight: tab === t ? 600 : 500,
              border: "1px solid #2E2E58",
              transition: "all 0.2s",
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Trader Cards */}
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
        <div style={{ fontSize: "9px", color: "#16a34a", fontWeight: "bold" }}>
          COPY TRADE ALERT
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "#c8facc",
            marginTop: "6px",
          }}
        >
          Alicia Anderson just opened BUY on BTC/USD — 4.9x trader, 4.8★ rating
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
 * Trader leaderboard card with profile image, verified badge, location, and star rating
 */
function TraderCard({ trader }) {
  return (
    <div
      style={{
        background: trader.bg || "#0A0A1A",
        borderRadius: "12px",
        padding: "14px",
        marginBottom: "10px",
        border: `1px solid ${trader.color}33`,
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = `0 6px 12px ${trader.color}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
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

        {/* Profile */}
        <div style={{ position: "relative" }}>
          <img
            src={`https://i.pravatar.cc/150?img=${trader.rank * 5}`}
            alt={trader.name}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
              border: `2px solid ${trader.color}`,
            }}
          />
          {trader.verified && (
            <FaCheckCircle
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                color: "#3B82F6",
                background: "#0D0D20",
                borderRadius: "50%",
              }}
              size={16}
            />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "12px",
              color: "#E8E8FF",
              fontWeight: 600,
            }}
          >
            {trader.name}
          </div>

          {/* Location */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "10px",
              color: "#A0A0C0",
              marginTop: "2px",
              gap: "4px",
            }}
          >
            <FaMapMarkerAlt size={14} color="#60A5FA" />
            {trader.location}
          </div>

          {/* Star rating */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              marginTop: "4px",
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <FaStar
                key={i}
                size={16}
                color={i < Math.round(trader.rating) ? "#FACC15" : "#5050A0"}
                style={{
                  transition: "transform 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              />
            ))}
          </div>

          {trader.badge && (
            <div
              style={{
                fontSize: "8px",
                color: "#FACC15",
                marginTop: "2px",
              }}
            >
              {trader.badge}
            </div>
          )}
          {trader.streak && (
            <div
              style={{
                fontSize: "10px",
                color: "#10B981",
                marginTop: "2px",
                fontWeight: 500,
              }}
            >
              {trader.streak}-day streak
            </div>
          )}
        </div>

        <button
          style={{
            fontSize: "9px",
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
          gridTemplateColumns: "1fr 1fr 1fr",
          marginTop: "12px",
          fontSize: "9px",
          color: "#c8c8ee",
          textAlign: "center",
        }}
      >
        <Stat label="RATIO" value={trader.ratio + "x"} />
        <Stat label="FOLLOWERS" value={trader.followers.toLocaleString()} />
        <Stat label="TOTAL PNL" value={"R" + trader.profit.toLocaleString()} />
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
      <div style={{ fontSize: "7px", color: "#5050A0" }}>{label}</div>
    </div>
  );
}