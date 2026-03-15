import { useState } from "react";

/**
 * Trade history component
 * Displays profit and loss trades in two panels
 */
const TradeHistory = ({ trades = [] }) => {
  const [filter, setFilter] = useState("all");

  /**
   * Filter trades based on selected range
   */
  const filterTrades = () => {
    const now = new Date();

    if (filter === "today") {
      return trades.filter((t) => {
        const d = new Date(t.date);
        return d.toDateString() === now.toDateString();
      });
    }

    if (filter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);

      return trades.filter((t) => new Date(t.date) >= weekAgo);
    }

    if (filter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);

      return trades.filter((t) => new Date(t.date) >= monthAgo);
    }

    return trades;
  };

  const filtered = filterTrades();

  const profits = filtered.filter((t) => t.pnl > 0);
  const losses = filtered.filter((t) => t.pnl < 0);

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            color: "#fff",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          Trade History
        </div>

        {/* Filter Dropdown */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            background: "#0f0f18",
            border: "1px solid #27272a",
            color: "#e4e4e7",
            padding: "6px 10px",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        {/* PROFITS */}
        <div
          style={{
            background: "#0f0f18",
            borderRadius: "12px",
            padding: "12px",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              color: "#4ade80",
              fontWeight: "600",
              marginBottom: "8px",
              fontSize: "13px",
            }}
          >
            Profits
          </div>

          {profits.map((trade, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                marginBottom: "6px",
                color: "#e4e4e7",
              }}
            >
              <span>{trade.symbol}</span>

              <span style={{ color: "#4ade80" }}>
                +{trade.pnl}
              </span>
            </div>
          ))}

          {profits.length === 0 && (
            <div style={{ fontSize: "12px", color: "#71717a" }}>
              No profitable trades
            </div>
          )}
        </div>

        {/* LOSSES */}
        <div
          style={{
            background: "#0f0f18",
            borderRadius: "12px",
            padding: "12px",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              color: "#f87171",
              fontWeight: "600",
              marginBottom: "8px",
              fontSize: "13px",
            }}
          >
            Losses
          </div>

          {losses.map((trade, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                marginBottom: "6px",
                color: "#e4e4e7",
              }}
            >
              <span>{trade.symbol}</span>

              <span style={{ color: "#f87171" }}>
                {trade.pnl}
              </span>
            </div>
          ))}

          {losses.length === 0 && (
            <div style={{ fontSize: "12px", color: "#71717a" }}>
              No losing trades
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;