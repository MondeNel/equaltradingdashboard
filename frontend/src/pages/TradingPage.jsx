import BottomNav from "../components/BottomNav";
// Import your existing TradingDashboard — adjust path if needed
// The existing monolith file should be renamed to TradingDashboard.jsx and placed in components/
import TradingDashboard from "../TradingDashboard";

export default function TradingPage() {
  return (
    <div style={{ paddingBottom: "80px" }}>
      <TradingDashboard />
      <BottomNav />
    </div>
  );
}
