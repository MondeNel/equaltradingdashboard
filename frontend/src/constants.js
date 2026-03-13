export const SYMBOLS = {
  Crypto: ["BTC/USD","ETH/USD","SOL/USD","XRP/USD"],
  Forex:  ["USD/ZAR","EUR/USD","GBP/USD","USD/JPY"],
  Stocks: ["APPLE","TESLA","NVIDIA","AMAZON"],
};

export const LOT_SIZES = [
  { label:"Macro",    sublabel:"$0.10", pip:0.10 },
  { label:"Mini",     sublabel:"$1",    pip:1.0  },
  { label:"Standard", sublabel:"$10",   pip:10.0 },
];

export const BASE_PRICES = {
  "BTC/USD":68420.50, "ETH/USD":3821.10, "SOL/USD":182.40, "XRP/USD":0.62,
  "USD/ZAR":18.02,    "EUR/USD":1.0842,  "GBP/USD":1.2710, "USD/JPY":149.82,
  "APPLE":189.45, "TESLA":248.90, "NVIDIA":875.60, "AMAZON":182.30,
};

export const USD_TO_ZAR = 18.02;
export const HISTORY    = 120;
export const VIEW       = 40;

export const C = {
  bg:"#08080f", panel:"#0d0d1a", border:"#1e1e3a", borderBright:"#2e2e5a",
  label:"#8888b8", labelDim:"#5a5a88",
  balLabel:"#9898c8", balVal:"#e0e0ff",
  symbolCol:"#a78bfa", priceCol:"#facc15",
  entryCol:"#38bdf8", tpCol:"#4ade80", slCol:"#f87171",
  bullCandle:"#22c55e", bearCandle:"#ef4444",
  buyBg:"linear-gradient(135deg,#052e16,#065f2a)", buyBorder:"#22c55e", buyText:"#4ade80",
  sellBg:"linear-gradient(135deg,#2d0a0a,#5a1212)", sellBorder:"#ef4444", sellText:"#f87171",
  lotSelBorder:"#a78bfa", lotSelText:"#ddd6fe",
  volBorder:"#a78bfa", volText:"#ddd6fe",
  activeBuy:"#4ade80", activeSell:"#f87171",
  setLvlBg:"#0f0f20",
};

export const W   = 430;
export const H   = 320;
export const PAD = { l:6, r:72, t:12, b:28 };
export const CW  = W - PAD.l - PAD.r;
export const CH  = H - PAD.t - PAD.b;

export const CHART_BG     = "#05050e";
export const CHART_BORDER = "#1e1e3a";
export const GRID_COL     = "#12122a";
export const AXIS_TEXT    = "#4a4a7a";
export const BULL_COL     = "#26a69a";
export const BEAR_COL     = "#ef5350";

export const PLANS = [
  {
    id:"WEEKLY", label:"WEEKLY", price:"R 49", per:"/week", color:"#38bdf8", badge:null,
    features:["5 AI trade setups per day","Volatile market scanner","Best forex pair alerts","Entry / TP / SL auto-fill","Basic scalp strategies"],
    locked:["Multi-timeframe analysis","Risk-adjusted sizing","Pattern recognition AI","Priority support"],
  },
  {
    id:"MONTHLY", label:"MONTHLY", price:"R 149", per:"/month", color:"#a78bfa", badge:"POPULAR",
    features:["Unlimited AI trade setups","Volatile market scanner","Best forex pair alerts","Entry / TP / SL auto-fill","Multi-timeframe analysis","Risk-adjusted position sizing","Basic scalp strategies"],
    locked:["Pattern recognition AI","Priority support"],
  },
  {
    id:"YEARLY", label:"YEARLY", price:"R 999", per:"/year", color:"#facc15", badge:"BEST VALUE",
    features:["Everything in Monthly","Pattern recognition AI","Real-time news sentiment","Custom strategy builder","Advanced risk management","Backtesting (30-day history)","Priority 24/7 support","Early access to new features"],
    locked:[],
  },
];

export const FREE_LIMIT = 3;