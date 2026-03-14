import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { walletAPI, subscriptionAPI } from "../services/api";
import { getUser, COUNTRIES } from "../constants";

/**
 * Section label used for grouping profile settings.
 */
function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: "8px",
        color: "#5050a0",
        letterSpacing: "2px",
        margin: "12px 0 8px",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Small stat display used in the profile hero section.
 */
function StatBox({ label, value, color }) {
  return (
    <div
      style={{
        background: "#0a0a1e",
        padding: "12px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: "bold",
          color,
          letterSpacing: "0.5px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: "7px",
          color: "#5050a0",
          letterSpacing: "1px",
          marginTop: "3px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * Settings row used in the mobile profile page.
 */
function SettingsRow({ icon, label, sub, color, onClick, toggle }) {
  const [on, setOn] = useState(true);

  return (
    <div
      onClick={onClick}
      style={{
        background: "#0d0820",
        border: "1px solid #2e2e58",
        borderRadius: "10px",
        padding: "13px 14px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        marginBottom: "8px",
      }}
    >
      <span style={{ fontSize: "16px", flexShrink: 0 }}>{icon}</span>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "11px",
            color: color || "#c8c8ee",
            letterSpacing: "1px",
          }}
        >
          {label}
        </div>

        {sub && (
          <div
            style={{
              fontSize: "8px",
              color: "#5050a0",
              marginTop: "2px",
            }}
          >
            {sub}
          </div>
        )}
      </div>

      {toggle ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setOn((v) => !v);
          }}
          style={{
            width: "36px",
            height: "20px",
            background: on ? "#22c55e" : "#2e2e58",
            borderRadius: "10px",
            position: "relative",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "2px",
              left: on ? "18px" : "2px",
              width: "16px",
              height: "16px",
              background: "#fff",
              borderRadius: "50%",
            }}
          />
        </div>
      ) : (
        <span style={{ fontSize: "10px", color: "#3a3a60" }}>▶</span>
      )}
    </div>
  );
}

/**
 * Profile page for the trading application.
 * Displays user details, wallet balance, subscription,
 * and settings options.
 */
export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getUser();

  const [wallet, setWallet] = useState(null);
  const [subscription, setSubscription] = useState(null);

  /**
   * Fetch wallet + subscription info
   */
  useEffect(() => {
    walletAPI.get().then((r) => setWallet(r.data)).catch(() => {});
    subscriptionAPI.me().then((r) => setSubscription(r.data)).catch(() => {});
  }, []);

  const sym = user?.currency_symbol || "R";
  const balance = wallet?.balance ?? 0;
  const plan = subscription?.plan || "FREE";

  const country =
    COUNTRIES.find((c) => c.name === user?.country) || COUNTRIES[0];

  /**
   * Create user initials
   */
  const initials = (user?.display_name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
      {/* Profile Header */}
      <div
        style={{
          padding: "24px 20px 16px",
          background: "linear-gradient(180deg,#0a0820 0%,#05050e 100%)",
          borderBottom: "1px solid #1e1e3a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#38bdf8,#0ea5c8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "bold",
              color: "#05050e",
            }}
          >
            {initials}
          </div>

          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#e8e8ff",
              }}
            >
              {user?.display_name || "Trader"}
            </div>

            <div style={{ fontSize: "9px", color: "#5050a0" }}>
              {country.flag} {user?.country || "South Africa"} ·{" "}
              {user?.currency_code || "ZAR"}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1px",
            background: "#1e1e3a",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <StatBox
            label="BALANCE"
            value={`${sym} ${balance.toLocaleString("en-ZA")}`}
            color="#38bdf8"
          />
          <StatBox label="PLAN" value={plan} color="#a78bfa" />
          <StatBox
            label="COUNTRY"
            value={`${country.flag} ${country.code}`}
            color="#facc15"
          />
        </div>
      </div>

      {/* Settings */}
      <div style={{ padding: "16px" }}>
        <SectionLabel>ACCOUNT</SectionLabel>

        <SettingsRow
          icon="✏️"
          label="Edit Profile"
          sub="Name, avatar, bio"
        />

        <SettingsRow
          icon="🔔"
          label="Notifications"
          sub="Trading alerts"
          toggle={true}
        />

        <SectionLabel>PREFERENCES</SectionLabel>

        <SettingsRow icon="🌙" label="Theme" sub="Dark mode" />

        <SettingsRow
          icon="🔐"
          label="Security"
          sub="Password & 2FA"
        />

        <SectionLabel>SUPPORT</SectionLabel>

        <SettingsRow icon="❓" label="Help & FAQ" />

        <SettingsRow icon="ℹ️" label="About eQual" sub="v1.0.0" />
      </div>

      <BottomNav />
    </div>
  );
}
