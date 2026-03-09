export const SYMBOLS = {
  Crypto: ["BTC/USD","ETH/USD","SOL/USD","XRP/USD"],
  Forex:  ["USD/ZAR","EUR/USD","GBP/USD","USD/JPY"],
  Stocks: ["APPLE","TESLA","NVIDIA","AMAZON"],
}

export const LOT_SIZES = [
  { label:"Macro",    sublabel:"R0.10/pip", pip:0.10 },
  { label:"Mini",     sublabel:"R1/pip",    pip:1.0  },
  { label:"Standard", sublabel:"R10/pip",   pip:10.0 },
]

export const BASE_PRICES = {
  "BTC/USD": 68420.50,
  "ETH/USD": 3821.10,
  "SOL/USD": 182.40,
  "XRP/USD": 0.62,
  "USD/ZAR": 18.0214,
  "EUR/USD": 1.0842,
  "GBP/USD": 1.2710,
  "USD/JPY": 149.82,
  "APPLE":   189.45,
  "TESLA":   248.90,
  "NVIDIA":  875.60,
  "AMAZON":  182.30,
}

export const USD_TO_ZAR = 18.02
export const HISTORY    = 120
export const VIEW       = 40

export const C = {
  bg:           "#08080f",
  panel:        "#0d0d1a",
  border:       "#1e1e3a",
  borderBright: "#2e2e5a",
  label:        "#8888b8",
  labelDim:     "#5a5a88",
  balLabel:     "#9898c8",
  balVal:       "#e0e0ff",
  symbolCol:    "#a78bfa",
  priceCol:     "#facc15",
  entryCol:     "#38bdf8",
  tpCol:        "#4ade80",
  slCol:        "#f87171",
  bullCandle:   "#22c55e",
  bearCandle:   "#ef4444",
  buyBg:        "linear-gradient(135deg,#052e16,#065f2a)",
  buyBorder:    "#22c55e",
  buyText:      "#4ade80",
  sellBg:       "linear-gradient(135deg,#2d0a0a,#5a1212)",
  sellBorder:   "#ef4444",
  sellText:     "#f87171",
  activeBuy:    "#4ade80",
  activeSell:   "#f87171",
}