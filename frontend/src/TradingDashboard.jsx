import { useState, useEffect, useRef } from 'react'
import { C, BASE_PRICES, HISTORY, LOT_SIZES, USD_TO_ZAR } from './constants'
import { ordersAPI } from './services/api'
import { useWallet } from './hooks/useWallet'
import { useTrades } from './hooks/useTrades'
import { usePrices } from './hooks/usePrices'
import CandleChart     from './components/CandleChart'
import WalletModal     from './components/WalletModal'
import PeterModal      from './components/PeterModal'
import PositionsStrip  from './components/PositionsStrip'
import OrderPanel      from './components/OrderPanel'
import SymbolSelector  from './components/SymbolSelector'

// ─── Seed candle history ──────────────────────────────────────────────────────
function seedCandles(sym) {
  const base  = BASE_PRICES[sym]
  const out   = []
  let   price = base
  for (let i = 0; i < HISTORY; i++) {
    const o    = price
    const move = (Math.random() - 0.485) * base * 0.003
    const c    = Math.max(base * 0.97, Math.min(base * 1.03, o + move))
    const hi   = Math.max(o, c) * (1 + Math.random() * 0.001)
    const lo   = Math.min(o, c) * (1 - Math.random() * 0.001)
    out.push({ o, h: hi, l: lo, c })
    price = c
  }
  return out
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TradingDashboard({ user, onLogout }) {
  const [market,     setMarket]     = useState('Forex')
  const [symbol,     setSymbol]     = useState('USD/ZAR')
  const [lotSize,    setLotSize]    = useState(null)
  const [volume,     setVolume]     = useState(1)
  const [entry,      setEntry]      = useState(null)
  const [takeProfit, setTakeProfit] = useState(null)
  const [stopLoss,   setStopLoss]   = useState(null)
  const [candles,    setCandles]    = useState(() => seedCandles('USD/ZAR'))
  const [toast,      setToast]      = useState(null)
  const [showPeter,  setShowPeter]  = useState(false)
  const [showWallet, setShowWallet] = useState(false)
  const peterApplyingRef = useRef(false)

  const { wallet, fetchWallet, deposit, withdraw } = useWallet()
  const { openTrades, fetchTrades, closeTrade, closeAllTrades } = useTrades()
  const { livePrice, livePrices } = usePrices(symbol)

  const balance = Number(wallet?.balance ?? 0)

  // ── Load data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    fetchWallet()
    fetchTrades()
    const id = setInterval(() => { fetchWallet(); fetchTrades() }, 10000)
    return () => clearInterval(id)
  }, [])

  // ── Update candles with live price ────────────────────────────────────────
  useEffect(() => {
    setCandles(seedCandles(symbol))
  }, [symbol])

  useEffect(() => {
    const id = setInterval(() => {
      setCandles(prev => {
        const last = prev[prev.length - 1]
        const move = (Math.random() - 0.485) * livePrice * 0.001
        const c    = livePrice
        const hi   = Math.max(last.o, c, last.h)
        const lo   = Math.min(last.o, c, last.l)
        const updated = [...prev.slice(0, -1), { ...last, h: hi, l: lo, c }]
        if (Math.random() < 0.15) {
          return [...updated.slice(1), { o: c, h: c, l: c, c }]
        }
        return updated
      })
    }, 1200)
    return () => clearInterval(id)
  }, [livePrice])

  // ── Format helpers ────────────────────────────────────────────────────────
  const zarFmt = v => v != null
    ? `ZAR ${Number(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    : 'ZAR 0,00'

  const priceFmt = v => {
    if (v == null) return '–'
    return livePrice > 10000
      ? v.toLocaleString('en-ZA', { minimumFractionDigits: 2 })
      : livePrice > 100 ? v.toFixed(2) : v.toFixed(4)
  }

  // ── Trade actions ─────────────────────────────────────────────────────────
  const resetOrder = () => {
    setEntry(null); setTakeProfit(null); setStopLoss(null)
    setLotSize(null); setVolume(1)
  }

  const handleTrade = async (type) => {
    if (!lotSize) {
      showToast({ type: 'error', text: 'Select a lot size first' }); return
    }
    if (balance <= 0) {
      showToast({ type: 'error', text: 'Deposit funds to trade' }); return
    }

    try {
      await ordersAPI.place({
        symbol,
        trade_type:  type,
        lot_size:    lotSize.label,
        volume,
        entry_price: entry ?? livePrice,
        take_profit: takeProfit,
        stop_loss:   stopLoss,
      })
      showToast({ type, text: `${type} ${symbol} @ ${priceFmt(entry ?? livePrice)}` })
      resetOrder()
      await fetchTrades()
      await fetchWallet()
    } catch (e) {
      showToast({ type: 'error', text: e.response?.data?.detail || 'Trade failed' })
    }
  }

  const handleClose = async (id) => {
    await closeTrade(id)
    await fetchWallet()
  }

  const handleCloseAll = async () => {
    await closeAllTrades()
    await fetchWallet()
  }

  const showToast = ({ type, text }) => {
    const id = Date.now()
    setToast({ id, type, text })
    setTimeout(() => setToast(t => t?.id === id ? null : t), 3000)
  }

  // ── Peter apply ───────────────────────────────────────────────────────────
  const handlePeterApply = (rec) => {
    const bp  = BASE_PRICES[rec.symbol] ?? livePrice
    const dec = bp > 100 ? 2 : 4
    const snap = v => parseFloat(Number(v).toFixed(dec))

    peterApplyingRef.current = true
    if (rec.market) setMarket(rec.market)
    if (rec.symbol) setSymbol(rec.symbol)

    setTimeout(() => {
      peterApplyingRef.current = false
      if (rec.entry)       setEntry(snap(rec.entry))
      if (rec.take_profit) setTakeProfit(snap(rec.take_profit))
      if (rec.stop_loss)   setStopLoss(snap(rec.stop_loss))
      const found = LOT_SIZES.find(l => l.label === rec.lot_size)
      if (found) setLotSize(found)
      if (rec.volume) setVolume(Number(rec.volume))
    }, 80)
  }

  const handleMarketChange = (m) => {
    if (peterApplyingRef.current) return
    setMarket(m)
    const firstSym = { Crypto:'BTC/USD', Forex:'USD/ZAR', Stocks:'APPLE' }[m]
    setSymbol(firstSym)
    resetOrder()
  }

  const handleSymbolChange = (s) => {
    if (peterApplyingRef.current) return
    setSymbol(s)
    resetOrder()
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:400, background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', position:'relative' }}>

        {/* ── Header ── */}
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ color:'#a78bfa', fontWeight:'bold', fontSize:15, letterSpacing:2 }}>⬡ eQual</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ color:C.labelDim, fontSize:10 }}>{user?.display_name || user?.email}</span>
            <button onClick={onLogout} style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:5, color:C.label, fontSize:10, cursor:'pointer', padding:'3px 8px' }}>
              OUT
            </button>
          </div>
        </div>

        {/* ── Balance row ── */}
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ color:C.balLabel, fontSize:10, letterSpacing:1 }}>ACCOUNT BALANCE</span>
              <span style={{ color:C.balVal, fontSize:13, fontWeight:'bold' }}>{zarFmt(wallet?.balance)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:C.balLabel, fontSize:10, letterSpacing:1 }}>OPEN P&L</span>
              <span style={{ color: openTrades.length ? '#facc15' : C.labelDim, fontSize:13, fontWeight:'bold' }}>
                {openTrades.length ? `${openTrades.length} position${openTrades.length > 1 ? 's' : ''}` : '–'}
              </span>
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { setShowWallet(true); fetchWallet() }} style={{
              padding:'8px 12px', background: balance > 0 ? '#0a1a2a' : 'linear-gradient(135deg,#1a0a00,#3a1a00)',
              border:`1px solid ${balance > 0 ? '#1e3a5a' : '#6a3a00'}`,
              borderRadius:8, color: balance > 0 ? '#38bdf8' : '#facc15',
              fontSize:10, fontWeight:'bold', cursor:'pointer', letterSpacing:1,
            }}>
              {balance > 0 ? '⬡ WALLET' : '+ DEPOSIT'}
            </button>
            <button onClick={() => setShowPeter(true)} style={{
              width:38, height:38, borderRadius:'50%',
              background:'linear-gradient(135deg,#3b0764,#6d28d9)',
              border:'2px solid #a78bfa', color:'#ddd6fe',
              fontSize:10, fontWeight:'bold', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 14px #7c3aed55',
            }}>AI</button>
          </div>
        </div>

        {/* ── Live price ── */}
        <div style={{ padding:'8px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:C.symbolCol, fontSize:11, fontWeight:'bold', letterSpacing:1 }}>{symbol}</span>
          <span style={{ color:C.priceCol, fontSize:16, fontWeight:'bold', fontFamily:'Courier New' }}>
            {priceFmt(livePrice)}
          </span>
        </div>

        {/* ── Chart ── */}
        <div style={{ borderBottom:`1px solid ${C.border}` }}>
          <CandleChart
            candles={candles}
            entry={entry}
            takeProfit={takeProfit}
            stopLoss={stopLoss}
            livePrice={livePrice}
          />
        </div>

        {/* ── Symbol selector ── */}
        <SymbolSelector
          market={market}
          symbol={symbol}
          onMarketChange={handleMarketChange}
          onSymbolChange={handleSymbolChange}
        />

        {/* ── Order panel ── */}
        <OrderPanel
          livePrice={livePrice}
          symbol={symbol}
          lotSize={lotSize}       setLotSize={setLotSize}
          volume={volume}         setVolume={setVolume}
          entry={entry}           setEntry={setEntry}
          takeProfit={takeProfit} setTakeProfit={setTakeProfit}
          stopLoss={stopLoss}     setStopLoss={setStopLoss}
          onTrade={handleTrade}
          onReset={resetOrder}
          balance={balance}
        />

        {/* ── Open positions ── */}
        <PositionsStrip
          trades={openTrades}
          livePrices={livePrices}
          onClose={handleClose}
          onCloseAll={handleCloseAll}
        />

        {/* ── Toast ── */}
        {toast && (
          <div style={{
            position:'absolute', bottom:16, left:16, right:16, zIndex:100,
            padding:'10px 14px', borderRadius:10,
            background: toast.type === 'error' ? '#1a0a0a' : toast.type === 'BUY' ? '#0a1a0a' : '#1a0a0a',
            border:`1px solid ${toast.type === 'error' ? C.slCol : toast.type === 'BUY' ? C.buyBorder : C.sellBorder}`,
            color: toast.type === 'error' ? C.slCol : toast.type === 'BUY' ? C.buyText : C.sellText,
            fontSize:12, fontWeight:'bold', textAlign:'center',
          }}>
            {toast.text}
          </div>
        )}

      </div>

      {/* ── Modals ── */}
      {showWallet && (
        <WalletModal
          wallet={wallet}
          onClose={() => setShowWallet(false)}
          onDeposit={deposit}
          onWithdraw={withdraw}
        />
      )}

      {showPeter && (
        <PeterModal
          onClose={() => setShowPeter(false)}
          onApply={handlePeterApply}
          symbol={symbol}
          market={market}
          livePrice={livePrice}
        />
      )}
    </div>
  )
}