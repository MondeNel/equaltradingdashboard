import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { walletAPI, subscriptionAPI } from "../services/api";
import { getUser, COUNTRIES } from "../constants";

export default function ProfilePage() {
  const nav  = useNavigate();
  const user = getUser();

  const [wallet,       setWallet]       = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showLogout,   setShowLogout]   = useState(false);

  useEffect(() => {
    walletAPI.get().then(r => setWallet(r.data)).catch(() => {});
    subscriptionAPI.me().then(r => setSubscription(r.data)).catch(() => {});
  }, []);

  function handleLogout() {
    localStorage.removeItem("equal_token");
    localStorage.removeItem("equal_user");
    nav("/login");
  }

  const sym     = user?.currency_symbol || "R";
  const balance = wallet?.balance ?? 0;
  const plan    = subscription?.plan || "FREE";
  const country = COUNTRIES.find(c => c.name === user?.country) || COUNTRIES[0];

  const initials = (user?.display_name || user?.email || "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: "100vh", background: "#05050e", fontFamily: "'Courier New', monospace", paddingBottom: "90px" }}>

      {/* Profile hero */}
      <div style={{ padding: "24px 20px 16px", background: "linear-gradient(180deg,#0a0820 0%,#05050e 100%)", borderBottom: "1px solid #1e1e3a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg,#38bdf8,#0ea5c8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "bold", color: "#05050e", border: "2px solid #38bdf8", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "18px", fontWeight: "bold", color: "#e8e8ff", letterSpacing: "1px" }}>
                {user?.display_name || user?.email?.split("@")[0] || "Trader"}
              </span>
            </div>
            <div style={{ fontSize: "9px", color: "#5050a0", letterSpacing: "1px", marginBottom: "4px" }}>
              📍 {user?.country || "South Africa"} · {user?.currency_code || "ZAR"}
            </div>
            <div style={{ fontSize: "9px", color: "#3a3a60", letterSpacing: "0.5px" }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: "#1e1e3a", borderRadius: "10px", overflow: "hidden" }}>
          <StatBox label="BALANCE" value={`${sym} ${balance.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="#38bdf8" />
          <StatBox label="PLAN" value={plan} color={plan === "FREE" ? "#5050a0" : "#a78bfa"} />
          <StatBox label="COUNTRY" value={`${country.flag} ${country.code}`} color="#facc15" />
        </div>
      </div>

      {/* Settings */}
      <div style={{ padding: "16px" }}>

        <SectionLabel>ACCOUNT</SectionLabel>

        <SettingsRow icon="✏️" label="Edit Profile" sub="Name, avatar, bio" onClick={() => {}} />
        <SettingsRow
          icon={country.flag}
          label="Country & Currency"
          sub={`${country.name} · ${country.currency} (${country.symbol})`}
          color="#38bdf8"
          onClick={() => {}}
        />
        <SettingsRow icon="🔔" label="Notifications" sub="Peter AI alerts · Copy trades · TP/SL" toggle={true} />

        <div
          onClick={() => nav("/profile")}
          style={{ background: "#1a0a3a", border: "1px solid #a78bfa44", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", marginBottom: "8px" }}
        >
          <span style={{ fontSize: "16px" }}>⭐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", color: "#a78bfa", letterSpacing: "1px" }}>Subscription</div>
            <div style={{ fontSize: "8px", color: "#7050a0", marginTop: "2px" }}>
              {plan} PLAN · {plan === "FREE" ? "Upgrade for unlimited Peter AI" : "Active subscription"}
            </div>
          </div>
          {plan === "FREE" && (
            <div style={{ background: "#a78bfa22", border: "1px solid #a78bfa44", borderRadius: "6px", padding: "3px 10px" }}>
              <span style={{ fontSize: "8px", color: "#a78bfa", letterSpacing: "1px" }}>UPGRADE</span>
            </div>
          )}
        </div>

        <SectionLabel>PREFERENCES</SectionLabel>

        <SettingsRow icon="🌙" label="Theme" sub="Dark mode · Always on" onClick={() => {}} />
        <SettingsRow icon="🔐" label="Security" sub="Change password · 2FA" onClick={() => {}} />

        <SectionLabel>SUPPORT</SectionLabel>

        <SettingsRow icon="❓" label="Help & FAQ" onClick={() => {}} />
        <SettingsRow icon="ℹ️" label="About eQual" sub="v1.0.0 · Simulation platform" onClick={() => {}} />

        {/* Spacer */}
        <div style={{ height: "16px" }} />

        {/* Logout */}
        {!showLogout ? (
          <div
            onClick={() => setShowLogout(true)}
            style={{ background: "#1a0606", border: "1px solid #ef444466", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round"/>
              <polyline points="10,5 14,8 10,11" stroke="#ef4444" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="14" y1="8" x2="6" y2="8" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#ef4444", letterSpacing: "2px" }}>SIGN OUT</span>
          </div>
        ) : (
          /* Confirm dialog */
          <div style={{ background: "#1a0606", border: "1px solid #ef4444", borderRadius: "10px", padding: "16px" }}>
            <div style={{ fontSize: "11px", color: "#e8e8ff", letterSpacing: "1px", marginBottom: "4px", textAlign: "center" }}>Are you sure you want to sign out?</div>
            <div style={{ fontSize: "9px", color: "#5050a0", textAlign: "center", marginBottom: "14px" }}>Your data will be saved.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                onClick={() => setShowLogout(false)}
                style={{ background: "transparent", border: "1px solid #2e2e58", borderRadius: "8px", padding: "10px", cursor: "pointer", fontFamily: "'Courier New', monospace", fontSize: "10px", color: "#5050a0", letterSpacing: "1px" }}
              >CANCEL</button>
              <button
                onClick={handleLogout}
                style={{ background: "#1a0606", border: "1px solid #ef4444", borderRadius: "8px", padding: "10px", cursor: "pointer", fontFamily: "'Courier New', monospace", fontSize: "10px", fontWeight: "bold", color: "#ef4444", letterSpacing: "1px" }}
              >SIGN OUT</button>
            </div>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  );
}

// ── Sub components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return <div style={{ fontSize: "8px", color: "#5050a0", letterSpacing: "2px", margin: "12px 0 8px" }}>{children}</div>;
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: "#0a0a1e", padding: "12px", textAlign: "center" }}>
      <div style={{ fontSize: "13px", fontWeight: "bold", color, letterSpacing: "0.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      <div style={{ fontSize: "7px", color: "#5050a0", letterSpacing: "1px", marginTop: "3px" }}>{label}</div>
    </div>
  );
}

function SettingsRow({ icon, label, sub, color, onClick, toggle }) {
  const [on, setOn] = useState(true);
  return (
    <div
      onClick={onClick}
      style={{ background: "#0d0820", border: "1px solid #2e2e58", borderRadius: "10px", padding: "13px 14px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", marginBottom: "8px" }}
    >
      <span style={{ fontSize: "16px", flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "11px", color: color || "#c8c8ee", letterSpacing: "1px" }}>{label}</div>
        {sub && <div style={{ fontSize: "8px", color: "#5050a0", marginTop: "2px" }}>{sub}</div>}
      </div>
      {toggle ? (
        <div
          onClick={e => { e.stopPropagation(); setOn(v => !v); }}
          style={{ width: "36px", height: "20px", background: on ? "#22c55e" : "#2e2e58", borderRadius: "10px", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}
        >
          <div style={{ position: "absolute", top: "2px", left: on ? "18px" : "2px", width: "16px", height: "16px", background: "#fff", borderRadius: "50%", transition: "left 0.2s" }} />
        </div>
      ) : (
        <span style={{ fontSize: "10px", color: "#3a3a60" }}>▶</span>
      )}
    </div>
  );
}
