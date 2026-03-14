// ─── Chart dimensions ─────────────────────────────────────────────────────────
export const HISTORY = 120;
export const VIEW    = 40;
export const W       = 390;
export const H       = 260;
export const PAD     = { t: 12, r: 55, b: 24, l: 8 };
export const CW      = W - PAD.l - PAD.r;
export const CH      = H - PAD.t - PAD.b;

// ─── Chart colours ────────────────────────────────────────────────────────────
export const CHART_BG     = "#07070f";
export const CHART_BORDER = "#1e1e3a";
export const GRID_COL     = "#1a1a2e";
export const AXIS_TEXT    = "#5050a0";
export const BULL_COL     = "#22c55e";
export const BEAR_COL     = "#ef4444";

// ─── Symbols ──────────────────────────────────────────────────────────────────
export const SYMBOLS = {
  Crypto: ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"],
  Forex:  ["USD/ZAR", "EUR/USD", "GBP/USD", "USD/JPY"],
  Stocks: ["APPLE", "TESLA", "NVIDIA", "AMAZON"],
};

// ─── Lot sizes ────────────────────────────────────────────────────────────────
export const LOT_SIZES = [
  { label: "Macro",    sublabel: "R0.10/pip", pip: 0.10 },
  { label: "Mini",     sublabel: "R1/pip",    pip: 1.0  },
  { label: "Standard", sublabel: "R10/pip",   pip: 10.0 },
];

// ─── Conversion fallback ──────────────────────────────────────────────────────
export const USD_TO_ZAR = 18.02;

// ─── Colour palette ───────────────────────────────────────────────────────────
export const C = {
  bg:           "#05050e",
  panel:        "#0d0d1a",
  border:       "#1e1e3a",
  borderBright: "#2e2e5a",
  label:        "#8888b8",
  labelDim:     "#5050a0",
  balLabel:     "#9898c8",
  balVal:       "#e8e8ff",
  cyan:         "#38bdf8",
  purple:       "#a78bfa",
  green:        "#4ade80",
  red:          "#f87171",
  gold:         "#facc15",
  pink:         "#f472b6",
  orange:       "#f97316",
  entryCol:     "#38bdf8",
  tpCol:        "#4ade80",
  slCol:        "#f87171",
  bullCandle:   "#22c55e",
  bearCandle:   "#ef4444",
  symbolCol:    "#a78bfa",
  priceCol:     "#facc15",
};

// ─── Countries + currency map ─────────────────────────────────────────────────
export const COUNTRIES = [
  { name:"South Africa",   code:"ZA", currency:"ZAR", symbol:"R",   flag:"🇿🇦", popular:true  },
  { name:"Nigeria",        code:"NG", currency:"NGN", symbol:"₦",   flag:"🇳🇬", popular:true  },
  { name:"Kenya",          code:"KE", currency:"KES", symbol:"KSh", flag:"🇰🇪", popular:true  },
  { name:"Ghana",          code:"GH", currency:"GHS", symbol:"₵",   flag:"🇬🇭", popular:true  },
  { name:"Zimbabwe",       code:"ZW", currency:"USD", symbol:"$",   flag:"🇿🇼", popular:false },
  { name:"Tanzania",       code:"TZ", currency:"TZS", symbol:"TSh", flag:"🇹🇿", popular:false },
  { name:"Uganda",         code:"UG", currency:"UGX", symbol:"USh", flag:"🇺🇬", popular:false },
  { name:"Botswana",       code:"BW", currency:"BWP", symbol:"P",   flag:"🇧🇼", popular:false },
  { name:"Namibia",        code:"NA", currency:"NAD", symbol:"N$",  flag:"🇳🇦", popular:false },
  { name:"United Kingdom", code:"GB", currency:"GBP", symbol:"£",   flag:"🇬🇧", popular:true  },
  { name:"United States",  code:"US", currency:"USD", symbol:"$",   flag:"🇺🇸", popular:true  },
  { name:"European Union", code:"EU", currency:"EUR", symbol:"€",   flag:"🇪🇺", popular:false },
  { name:"India",          code:"IN", currency:"INR", symbol:"₹",   flag:"🇮🇳", popular:false },
  { name:"Australia",      code:"AU", currency:"AUD", symbol:"A$",  flag:"🇦🇺", popular:false },
  { name:"Canada",         code:"CA", currency:"CAD", symbol:"C$",  flag:"🇨🇦", popular:false },
  { name:"Japan",          code:"JP", currency:"JPY", symbol:"¥",   flag:"🇯🇵", popular:false },
  { name:"UAE",            code:"AE", currency:"AED", symbol:"د.إ", flag:"🇦🇪", popular:false },
];

// ─── Currency helpers ─────────────────────────────────────────────────────────
export function getCurrencyForCountry(countryName) {
  const found = COUNTRIES.find(c => c.name === countryName);
  return found
    ? { currency: found.currency, symbol: found.symbol, flag: found.flag }
    : { currency: "ZAR", symbol: "R", flag: "🇿🇦" };
}

export function getUser() {
  try { return JSON.parse(localStorage.getItem("equal_user") || "null"); }
  catch { return null; }
}

export function getCurrencySymbol() {
  const user = getUser();
  return user?.currency_symbol || "R";
}

export function formatCurrency(amount, decimals = 2) {
  const sym = getCurrencySymbol();
  const num = Number(amount || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sym} ${num}`;
}

// ─── Subscription plans ───────────────────────────────────────────────────────
export const PLANS = [
  {
    key:        "FREE",
    label:      "Free",
    price:      0,
    period:     "",
    peter:      3,
    features:   ["3 Peter AI requests/day", "Live prices", "Basic trading"],
  },
  {
    key:        "WEEKLY",
    label:      "Weekly",
    price:      49,
    period:     "/ week",
    peter:      20,
    features:   ["20 Peter AI requests/day", "Live prices", "Full trading", "Copy trading"],
  },
  {
    key:        "MONTHLY",
    label:      "Monthly",
    price:      149,
    period:     "/ month",
    peter:      999,
    features:   ["Unlimited Peter AI", "Live prices", "Full trading", "Copy trading", "Arbitrage alerts"],
  },
  {
    key:        "YEARLY",
    label:      "Yearly",
    price:      999,
    period:     "/ year",
    peter:      999,
    features:   ["Unlimited Peter AI", "Live prices", "Full trading", "Copy trading", "Arbitrage alerts", "Priority support"],
  },
];

// ─── Peter AI ─────────────────────────────────────────────────────────────────
export const FREE_LIMIT = 3;