import { useNavigate, useLocation } from "react-router-dom";

const TABS = [
  {
    id: "bet",
    label: "BET",
    route: "/bet",
    color: "#f97316",
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke={active ? "#f97316" : "#3a3a60"} strokeWidth="1.4"/>
        <polyline points="5,12 7,8 9,10 12,5" stroke={active ? "#f97316" : "#3a3a60"} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "trade",
    label: "TRADE",
    route: "/trade",
    color: "#4ade80",
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <polyline points="2,13 5,9 8,11 12,5 16,7" stroke={active ? "#4ade80" : "#3a3a60"} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="2" y1="13" x2="16" y2="13" stroke={active ? "#4ade8044" : "#1e1e3a"} strokeWidth="1"/>
      </svg>
    ),
  },
  {
    id: "arb",
    label: "ARB",
    route: "/arb",
    color: "#facc15",
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="4"  cy="9" r="2.5" stroke={active ? "#facc15" : "#3a3a60"} strokeWidth="1.3"/>
        <circle cx="14" cy="9" r="2.5" stroke={active ? "#facc15" : "#3a3a60"} strokeWidth="1.3"/>
        <line x1="6.5" y1="7.5" x2="11.5" y2="6"  stroke={active ? "#facc15" : "#3a3a60"} strokeWidth="1" strokeDasharray="2,1.5"/>
        <line x1="6.5" y1="10.5" x2="11.5" y2="12" stroke={active ? "#facc15" : "#3a3a60"} strokeWidth="1" strokeDasharray="2,1.5"/>
      </svg>
    ),
  },
  {
    id: "follow",
    label: "FOLLOW",
    route: "/follow",
    color: "#f472b6",
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="7" cy="7" r="3" stroke={active ? "#f472b6" : "#3a3a60"} strokeWidth="1.3"/>
        <path d="M2 16c0-2.8 2.2-5 5-5" stroke={active ? "#f472b6" : "#3a3a60"} strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="13" cy="8" r="2" stroke={active ? "#f472b6" : "#3a3a60"} strokeWidth="1.2"/>
        <path d="M10 16c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke={active ? "#f472b6" : "#3a3a60"} strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "profile",
    label: "PROFILE",
    route: "/profile",
    color: "#38bdf8",
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="7" r="3.5" stroke={active ? "#38bdf8" : "#3a3a60"} strokeWidth="1.3"/>
        <path d="M2 17c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={active ? "#38bdf8" : "#3a3a60"} strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function BottomNav({ badges = {} }) {
  const nav      = useNavigate();
  const location = useLocation();
  const current  = location.pathname;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#07070f",
      borderTop: "1px solid #1e1e3a",
      padding: "8px 0 max(12px, env(safe-area-inset-bottom))",
      zIndex: 100,
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      maxWidth: "480px",
      margin: "0 auto",
    }}>
      {TABS.map(tab => {
        const active = current === tab.route || (tab.route === "/home" && current === "/");
        const badge  = badges[tab.id] || 0;
        return (
          <div
            key={tab.id}
            onClick={() => nav(tab.route)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "8px 4px", cursor: "pointer", position: "relative" }}
          >
            {/* Icon wrapper */}
            <div style={{
              width: "32px", height: "32px", borderRadius: "10px",
              background: active ? `${tab.color}22` : "#0d0d20",
              border: `1px solid ${active ? tab.color + "66" : "#2e2e58"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {tab.icon(active)}
            </div>

            {/* Badge */}
            {badge > 0 && (
              <div style={{
                position: "absolute", top: "4px", right: "8px",
                width: "16px", height: "16px", borderRadius: "50%",
                background: tab.color, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "8px", fontWeight: "bold", color: "#05050e",
                fontFamily: "'Courier New', monospace",
              }}>
                {badge > 9 ? "9+" : badge}
              </div>
            )}

            <span style={{ fontSize: "7px", color: active ? tab.color : "#3a3a60", letterSpacing: "0.5px", fontFamily: "'Courier New', monospace", fontWeight: active ? "bold" : "normal" }}>
              {tab.label}
            </span>

            {/* Active underline */}
            {active && (
              <div style={{ position: "absolute", bottom: 0, width: "20px", height: "2px", background: tab.color, borderRadius: "1px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
