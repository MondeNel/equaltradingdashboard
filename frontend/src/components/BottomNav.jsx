import { useNavigate, useLocation } from "react-router-dom";

const TABS = [
  {
    id: "bet",
    label: "BET",
    route: "/bet",
    color: "#f97316",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke={active ? "#f97316" : "#6366f1"} strokeWidth="1.6" />
        <polyline points="5,12 7,8 9,10 12,5" stroke={active ? "#f97316" : "#6366f1"} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "trade",
    label: "TRADE",
    route: "/trade",
    color: "#4ade80",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
        <polyline points="2,13 5,9 8,11 12,5 16,7" stroke={active ? "#4ade80" : "#6366f1"} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="2" y1="13" x2="16" y2="13" stroke={active ? "#4ade8044" : "#3b3b7a"} strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: "arb",
    label: "ARB",
    route: "/arb",
    color: "#facc15",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
        <circle cx="4" cy="9" r="2.5" stroke={active ? "#facc15" : "#6366f1"} strokeWidth="1.4" />
        <circle cx="14" cy="9" r="2.5" stroke={active ? "#facc15" : "#6366f1"} strokeWidth="1.4" />
        <line x1="6.5" y1="7.5" x2="11.5" y2="6" stroke={active ? "#facc15" : "#6366f1"} strokeWidth="1.2" strokeDasharray="2,1.5" />
        <line x1="6.5" y1="10.5" x2="11.5" y2="12" stroke={active ? "#facc15" : "#6366f1"} strokeWidth="1.2" strokeDasharray="2,1.5" />
      </svg>
    ),
  },
  {
    id: "follow",
    label: "FOLLOW",
    route: "/follow",
    color: "#f472b6",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
        <circle cx="7" cy="7" r="3" stroke={active ? "#f472b6" : "#6366f1"} strokeWidth="1.4" />
        <path d="M2 16c0-2.8 2.2-5 5-5" stroke={active ? "#f472b6" : "#6366f1"} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="13" cy="8" r="2" stroke={active ? "#f472b6" : "#6366f1"} strokeWidth="1.3" />
        <path d="M10 16c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke={active ? "#f472b6" : "#6366f1"} strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "PROFILE",
    route: "/profile",
    color: "#38bdf8",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="7" r="3.5" stroke={active ? "#38bdf8" : "#6366f1"} strokeWidth="1.4" />
        <path d="M2 17c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={active ? "#38bdf8" : "#6366f1"} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function BottomNav({ badges = {} }) {
  const nav = useNavigate();
  const location = useLocation();
  const current = location.pathname;

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50">
      <div className="w-full max-w-[480px] grid grid-cols-5 bg-[#07070f] border-t border-[#1e1e3a] pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
        {TABS.map((tab) => {
          const active = current === tab.route || (tab.route === "/home" && current === "/");
          const badge = badges[tab.id] || 0;

          return (
            <div
              key={tab.id}
              onClick={() => nav(tab.route)}
              className="flex flex-col items-center gap-1 py-2 relative cursor-pointer"
            >
              {/* ICON BOX */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: active ? `${tab.color}22` : "#0d0d20",
                  border: `1px solid ${active ? tab.color + "66" : "#2e2e58"}`,
                }}
              >
                {tab.icon(active)}
              </div>

              {/* BADGE */}
              {badge > 0 && (
                <div
                  className="absolute top-0 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ background: tab.color, color: "#05050e" }}
                >
                  {badge > 9 ? "9+" : badge}
                </div>
              )}

              {/* LABEL */}
              <span
                className="text-[8px] font-mono tracking-wide"
                style={{
                  color: active ? tab.color : "#6366f1",
                  fontWeight: active ? "bold" : "normal",
                }}
              >
                {tab.label}
              </span>

              {/* ACTIVE LINE */}
              {active && <div className="absolute bottom-0 w-6 h-[2px] rounded" style={{ background: tab.color }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}