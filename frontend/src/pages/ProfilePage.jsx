import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { walletAPI, subscriptionAPI } from "../services/api";
import { getUser, COUNTRIES } from "../constants";
import TradeHistory from "../components/TradeHistory";

import {
  User,
  Globe,
  Bell,
  Crown,
  Moon,
  Shield,
  HelpCircle,
  Info,
  Camera,
  LogOut,
  CheckCircle,
  MapPin,
  Star,
} from "lucide-react";

/**
 * Section label
 */
function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: "600",
        color: "#8e8ea0",
        margin: "22px 0 10px",
        textTransform: "uppercase",
        letterSpacing: "1px",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Stat card
 */
function StatBox({ label, value }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <div style={{ fontWeight: "600", fontSize: "16px", color: "#fff" }}>
        {value}
      </div>

      <div style={{ fontSize: "11px", color: "#8e8ea0", marginTop: "3px" }}>
        {label}
      </div>
    </div>
  );
}

/**
 * Settings row
 */
function SettingsRow({ icon: Icon, label, sub }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "14px",
        borderRadius: "12px",
        background: "#0f0f18",
        marginBottom: "10px",
        cursor: "pointer",
      }}
    >
      <Icon size={18} color="#a1a1aa" />

      <div style={{ marginLeft: "12px", flex: 1 }}>
        <div style={{ color: "#e4e4e7", fontSize: "14px" }}>{label}</div>

        {sub && (
          <div style={{ fontSize: "11px", color: "#71717a", marginTop: "2px" }}>
            {sub}
          </div>
        )}
      </div>

      <div style={{ color: "#71717a" }}>›</div>
    </div>
  );
}

/**
 * Level progress card
 */
function LevelCard({ level = 7, xp = 620, next = 1000 }) {
  const progress = (xp / next) * 100;

  return (
    <div
      style={{
        background: "#0f0f18",
        borderRadius: "14px",
        padding: "14px",
        border: "1px solid #1f1f2e",
        marginTop: "16px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#38bdf8",
          fontWeight: "600",
          marginBottom: "6px",
        }}
      >
        LEVEL {level} TRADER
      </div>

      <div
        style={{
          height: "8px",
          background: "#1e1e2e",
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg,#38bdf8,#4ade80)",
          }}
        />
      </div>

      <div style={{ fontSize: "11px", color: "#8e8ea0", marginTop: "6px" }}>
        {next - xp} XP to Level {level + 1}
      </div>
    </div>
  );
}

/**
 * Win streak
 */
function StreakCard({ streak = 9 }) {
  return (
    <div
      style={{
        background: "#0f0f18",
        borderRadius: "14px",
        padding: "14px",
        border: "1px solid #1f1f2e",
        marginTop: "12px",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontSize: "12px", color: "#facc15", fontWeight: "600" }}>
          WIN STREAK
        </div>

        <div style={{ fontSize: "18px", color: "#fff", fontWeight: "600" }}>
          🔥 {streak} wins
        </div>
      </div>

      <div style={{ fontSize: "11px", color: "#8e8ea0" }}>Keep it going</div>
    </div>
  );
}

/**
 * Achievements
 */
function Achievements() {
  const badges = [
    { icon: "🎯", label: "First Trade" },
    { icon: "🔥", label: "10 Wins" },
    { icon: "🏆", label: "Top Trader" },
    { icon: "💰", label: "Profit Master" },
  ];

  return (
    <div style={{ marginTop: "16px" }}>
      <div
        style={{
          fontSize: "12px",
          color: "#38bdf8",
          fontWeight: "600",
          marginBottom: "10px",
        }}
      >
        ACHIEVEMENTS
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "10px",
        }}
      >
        {badges.map((b, i) => (
          <div
            key={i}
            style={{
              background: "#0f0f18",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
              border: "1px solid #1f1f2e",
              fontSize: "11px",
            }}
          >
            <div style={{ fontSize: "20px" }}>{b.icon}</div>
            <div style={{ marginTop: "4px", color: "#8e8ea0" }}>{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Mock trades
 */
const trades = [
  { symbol: "BTC", pnl: 520, date: "2026-03-10" },
  { symbol: "ETH", pnl: -120, date: "2026-03-09" },
  { symbol: "SOL", pnl: 240, date: "2026-03-08" },
  { symbol: "ADA", pnl: -60, date: "2026-03-05" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getUser();
  const fileRef = useRef();

  const [avatar, setAvatar] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    walletAPI.get().then((r) => setWallet(r.data)).catch(() => {});
    subscriptionAPI.me().then((r) => setSubscription(r.data)).catch(() => {});
  }, []);

  const followers = user?.followers ?? 8200;
  const winRate = user?.win_rate ?? 94;
  const starRating = user?.star_rating ?? 4.9;

  const formatFollowers = (n) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n;

  const initials = (user?.display_name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#05050e",
        paddingBottom: "90px",
        maxWidth: "420px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}

      <div style={{ padding: "24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Avatar */}

          <div style={{ position: "relative" }}>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                width: "78px",
                height: "78px",
                borderRadius: "50%",
                overflow: "hidden",
                background: "linear-gradient(135deg,#38bdf8,#0ea5c8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: "600",
                color: "#05050e",
                cursor: "pointer",
              }}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials
              )}
            </div>

            <div
              onClick={() => fileRef.current.click()}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "#0f0f18",
                border: "2px solid #05050e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={13} color="#e4e4e7" />
            </div>

            <input ref={fileRef} hidden type="file" onChange={handleAvatarUpload} />
          </div>

          {/* User Info */}

          <div style={{ marginLeft: "16px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "17px",
                  color: "#ffffff",
                  letterSpacing: "-0.2px",
                }}
              >
                {user?.display_name || "Trader"}
              </div>

              <CheckCircle size={15} color="#38bdf8" />
            </div>

            {/* Location */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginTop: "4px",
                fontSize: "12px",
                color: "#9ca3af",
                fontWeight: "500",
              }}
            >
              <MapPin size={12} />
              {(user?.city || "Johannesburg").toUpperCase()} · ZAR
            </div>

            {/* Reputation Row */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginTop: "8px",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#facc15",
                }}
              >
                <Star size={13} fill="#facc15" stroke="#facc15" />
                {starRating}
              </div>

              <div style={{ color: "#4ade80" }}>{winRate}% Win</div>

              <div style={{ color: "#60a5fa" }}>
                {formatFollowers(followers)} Followers
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            marginTop: "18px",
            borderTop: "1px solid #111827",
            paddingTop: "14px",
          }}
        >
          <StatBox label="Trades" value="142" />
          <StatBox label="PnL" value="R142K" />
          <StatBox label="Rank" value="#1" />
        </div>

        <LevelCard />
        <StreakCard />
        <Achievements />
      </div>

      <TradeHistory trades={trades} />

      {/* SETTINGS */}

      <div style={{ padding: "0 20px" }}>
        <SectionLabel>Account</SectionLabel>

        <SettingsRow icon={User} label="Edit Profile" />
        <SettingsRow icon={Globe} label="Country & Currency" />
        <SettingsRow icon={Bell} label="Notifications" />
        <SettingsRow
          icon={Crown}
          label="Subscription"
          sub={subscription?.plan || "FREE"}
        />

        <SectionLabel>Security</SectionLabel>

        <SettingsRow icon={Shield} label="Security" sub="Password & 2FA" />

        <SectionLabel>Support</SectionLabel>

        <SettingsRow icon={HelpCircle} label="Help Center" />
        <SettingsRow icon={Info} label="About eQual" sub="v1.0.0" />
      </div>

      {/* LOGOUT */}

      <div style={{ padding: "20px" }}>
        <div
          onClick={handleSignOut}
          style={{
            background: "#1a0f13",
            padding: "14px",
            borderRadius: "12px",
            textAlign: "center",
            color: "#f87171",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <LogOut size={16} /> Sign Out
        </div>
      </div>

      <BottomNav />
    </div>
  );
}