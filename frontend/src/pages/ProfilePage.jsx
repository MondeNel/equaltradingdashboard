import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { walletAPI, subscriptionAPI } from "../services/api";
import { getUser } from "../constants";
import TradeHistory from "../components/TradeHistory";

import {
  User,
  Globe,
  Bell,
  Crown,
  Shield,
  HelpCircle,
  Info,
  Camera,
  LogOut,
  MapPin,
  Star,
} from "lucide-react";

const trades = [
  { symbol: "BTC", pnl: 520, date: "2026-03-10" },
  { symbol: "ETH", pnl: -120, date: "2026-03-09" },
  { symbol: "SOL", pnl: 240, date: "2026-03-08" },
  { symbol: "ADA", pnl: -60, date: "2026-03-05" },
];

/**
 * Returns formatted PnL with + or - sign in local currency
 */
function formatPnL(amount, currency = "ZAR") {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return amount >= 0 ? `+${formatter.format(amount)}` : `${formatter.format(amount)}`;
}

// Example usage in JSX
trades.map((trade, index) => (
  <div key={index} className="flex justify-between py-2 border-b border-gray-700">
    <div className="text-white font-medium">{trade.symbol}/USD</div>
    <div
      className={`font-semibold ${
        trade.pnl >= 0 ? "text-green-400" : "text-red-500"
      }`}
    >
      {formatPnL(trade.pnl, "ZAR")}
    </div>
    <div className="text-gray-400 text-xs">{trade.date}</div>
  </div>
));

function SectionLabel({ children }) {
  return <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider my-5">{children}</div>;
}

function StatBox({ label, value }) {
  return (
    <div className="text-center py-2">
      <div className="text-white font-semibold text-base">{value}</div>
      <div className="text-gray-400 text-[11px] mt-1">{label}</div>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, sub }) {
  return (
    <div className="flex items-center p-4 rounded-xl bg-gray-800 mb-2 cursor-pointer">
      <Icon size={18} color="#a1a1aa" />
      <div className="ml-3 flex-1">
        <div className="text-gray-100 text-sm">{label}</div>
        {sub && <div className="text-gray-500 text-[11px] mt-1">{sub}</div>}
      </div>
      <div className="text-gray-500">›</div>
    </div>
  );
}

function LevelCard({ level = 77, xp = 620, next = 1000 }) {
  const progress = (xp / next) * 100;
  return (
    <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 mt-4">
      <div className="text-[12px] font-semibold text-sky-400 mb-1">LEVEL {level} TRADER</div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-sky-400 to-green-400" style={{ width: `${progress}%` }} />
      </div>
      <div className="text-gray-400 text-[11px] mt-1">{next - xp} XP to Level {level + 1}</div>
    </div>
  );
}

function StreakCard({ streak = 3 }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 mt-3 flex justify-between">
      <div>
        <div className="text-[12px] font-semibold text-yellow-400">WIN STREAK</div>
        <div className="text-white text-lg font-semibold">{streak} Wins</div>
      </div>
      <div className="text-gray-400 text-[11px] self-center">Keep it going</div>
    </div>
  );
}

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
  const starRating = user?.star_rating ?? 4.9;
  const initials = (user?.display_name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatFollowers = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n);

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

  const handleGetVerified = () => {
    alert("Redirect to payment/verification flow");
  };

  return (
    <div className="min-h-screen font-sans">
      <div className="bg-[#05050e] pb-24 max-w-md mx-auto">
        {/* HEADER */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  onClick={() => fileRef.current.click()}
                  className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-sky-400 to-cyan-600 flex items-center justify-center text-lg font-semibold text-[#05050e] cursor-pointer"
                >
                  {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : initials}
                </div>
                <div
                  onClick={() => fileRef.current.click()}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-gray-900 border-2 border-[#05050e] flex items-center justify-center"
                >
                  <Camera size={12} color="#e4e4e7" />
                </div>
                <input ref={fileRef} hidden type="file" onChange={handleAvatarUpload} />
              </div>

              <div className="flex-1">
                <div className="text-white font-semibold text-base">{user?.display_name || "Trader"}</div>
                <div className="flex items-center gap-1 mt-1 text-gray-400 text-xs">
                  <MapPin size={8} />
                  {(user?.city || "Cape Town").toUpperCase()} · ZAR
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={8} fill="#facc15" stroke="#facc15" />
                    {starRating}
                  </div>
                  <div className="text-blue-400">{formatFollowers(followers)} Followers</div>
                </div>
              </div>
            </div>

            {/* Get Verified Button */}
            <button
              onClick={handleGetVerified}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition"
            >
              Get Verified
            </button>
          </div>

          <div className="grid grid-cols-3 mt-4 border-t border-gray-800 pt-3">
            <StatBox label="Trades" value="142" />
            <StatBox label="PnL" value="R142K" />
            <StatBox label="Rank" value="#77" />
          </div>

          <LevelCard />
          <StreakCard />
        </div>

        <TradeHistory trades={trades} />

        {/* SETTINGS */}
        <div className="px-5">
          <SectionLabel>Account</SectionLabel>
          <SettingsRow icon={User} label="Edit Profile" />
          <SettingsRow icon={Globe} label="Country & Currency" />
          <SettingsRow icon={Bell} label="Notifications" />
          <SettingsRow icon={Crown} label="Subscription" sub={subscription?.plan || "FREE"} />

          <SectionLabel>Security</SectionLabel>
          <SettingsRow icon={Shield} label="Security" sub="Password & 2FA" />

          <SectionLabel>Support</SectionLabel>
          <SettingsRow icon={HelpCircle} label="Help Center" />
          <SettingsRow icon={Info} label="About eQual" sub="v1.0.0" />
        </div>

        <div className="px-5 mt-4">
          <div
            onClick={handleSignOut}
            className="bg-red-900 p-4 rounded-xl text-center text-red-400 font-semibold cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Sign Out
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}