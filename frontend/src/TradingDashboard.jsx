import { useState, useEffect, useRef } from 'react'
import { C, BASE_PRICES, LOT_SIZES } from './constants'
import { ordersAPI } from './services/api'
import { useWallet } from './hooks/useWallet'
import { useTrades } from './hooks/useTrades'
import { usePrices } from './hooks/usePrices'
import LiveChart      from './components/CandleChart'
import WalletModal    from './components/WalletModal'
import PeterModal     from './components/PeterModal'

export default function TradingDashboard({ user, onLogout }) {
  const [market,        setMarket]        = useState('Forex')
  const [symbol,        setSymbol]        = useState('USD/ZAR')
  const [lotSize,       setLotSize]       = useState(null)
  const [volume,        setVolume]        = useState(1)
  const [entry,         setEntry]         = useState(null)
  const [takeProfit,    setTakeProfit]    = useState(null)
  const [stopLoss,      setStopLoss]      = useState(null)
  const [toast,         setToast]         = useState(null)
  const [showPeter,     setShowPeter]     = useState(false)
  const [showWallet,    setShowWallet]    = useState(false)
  const [pendingOrders, setPendingOrders] = useState([])
  const peterApplyingRef = useRef(false)

  const { wallet, fetchWallet, deposit, withdraw } = useWallet()
  const { openTrades, fetchTrades, closeTrade, closeAllTrades } = useTrades()
  const { livePrice } = usePrices(symbol)

  const balance  = Number(wallet?.balance ?? 0)
  const totalPnl = openTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0)

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchWallet()
    fetchTrades()
  }, [])

  // ── Polling — 2s when pending orders exist, 10s otherwise ─────────────────
  useEffect(() => {
    const interval = pendingOrders.length > 0 ? 2000 : 10000
    const id = setInterval(() => { fetchWallet(); fetchTrades() }, interval)
    return () => clearInterval(id)
  }, [pendingOrders.length])

  // ── Refs for use inside intervals ────────────────────────────────────────
  const pendingRef    = useRef(pendingOrders)
  const openTradesRef = useRef(openTrades)
  const livePriceRef  = useRef(livePrice)
  pendingRef.current    = pendingOrders
  openTradesRef.current = openTrades
  livePriceRef.current  = livePrice

  // ── Client-side price monitor (600ms) ────────────────────────────────────
  // Promotes pending → active when livePrice crosses entry (mirrors reference)
  // Also live-updates P&L on open trades so currentBalance is always fresh
  useEffect(() => {
    const id = setInterval(() => {
      const cur = livePriceRef.current

      // Promote pending orders
      setPendingOrders(prev => {
        if (prev.length === 0) return prev
        const stillPending = []
        for (const o of prev) {
          const entryHit =
            (o.order_type === 'BUY'  && cur >= o.entry_price) ||
            (o.order_type === 'SELL' && cur <= o.entry_price) ||
            Math.abs(cur - o.entry_price) / o.entry_price < 0.0003
          if (entryHit) {
            // Move to openTrades locally
            const dec = o.entry_price > 100 ? 2 : 4
            const fmt = v => v == null ? '–' : Number(v).toFixed(dec)
            const toastId = Date.now()
            setOpenTrades(prev => {
              // Avoid duplicates — backend may have already added it
              if (prev.some(t => t.id === o.id)) return prev
              return [...prev, {
                ...o,
                trade_type: o.order_type,
                pnl: 0, pips: 0,
                status: 'active',
                activatedAt: Date.now(),
              }]
            })
            setToast({
              id: toastId, type: 'ENTRY_HIT',
              symbol:    o.symbol,
              tradeType: o.order_type,
              entryStr:  fmt(o.entry_price),
              tpStr:     fmt(o.tpPrice ?? o.tp_price),
              slStr:     fmt(o.slPrice ?? o.sl_price),
              lot:       o.lot_size ?? 'Standard',
              vol:       o.volume   ?? 1,
            })
            setTimeout(() => setToast(t => t?.id === toastId ? null : t), 4000)
          } else {
            stillPending.push(o)
          }
        }
        return stillPending
      })

      // Live P&L update on open trades
      setOpenTrades(prev => {
        if (prev.length === 0) return prev
        return prev.map(t => {
          const pip    = cur < 10 ? 0.0001 : cur < 200 ? 0.0001 : 1
          const diff   = (t.trade_type ?? t.order_type) === 'BUY'
            ? cur - t.entry_price
            : t.entry_price - cur
          const pipVal = LOT_SIZES.find(l => l.label === (t.lot_size ?? t.lot))?.pip ?? 1
          const pnl    = (diff / pip) * pipVal * (t.volume ?? t.vol ?? 1)
          return { ...t, pnl, pips: Math.round(diff / pip) }
        })
      })
    }, 600)
    return () => clearInterval(id)
  }, [])

  // ── Formatters ───────────────────────────────────────────────────────────
  const zarFmt = v => {
    const abs = Math.abs(v).toLocaleString('en-ZA', { minimumFractionDigits:2, maximumFractionDigits:2 })
    return (v < 0 ? '−' : '') + `ZAR ${abs}`
  }

  const priceFmt = v => {
    if (v == null) return '–'
    return livePrice > 10000
      ? v.toLocaleString('en-ZA', { minimumFractionDigits:2 })
      : livePrice > 100 ? v.toFixed(2) : v.toFixed(4)
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  const resetOrder = () => {
    setEntry(null); setTakeProfit(null); setStopLoss(null)
    setLotSize(null); setVolume(1)
  }

  const showToast = ({ type, text, ...rest }) => {
    const id  = Date.now()
    const dur = type === 'ENTRY_HIT' ? 4000 : 3000
    setToast({ id, type, text, ...rest })
    setTimeout(() => setToast(t => t?.id === id ? null : t), dur)
  }

  const handleTrade = async (type) => {
    if (!lotSize) { showToast({ type:'error', text:'Select a lot size first' }); return }
    if (balance <= 0) { showToast({ type:'error', text:'Deposit funds to trade' }); return }
    try {
      const res = await ordersAPI.place({
        symbol, market, order_type:type, lot_size:lotSize.label, volume,
        entry_price: entry ?? livePrice, tp_price:takeProfit, sl_price:stopLoss,
      })
      setPendingOrders(prev => [...prev, {
        id:          res.data.id,
        symbol,
        order_type:  type,
        entry_price: entry ?? livePrice,
        tpPrice:     takeProfit,
        slPrice:     stopLoss,
        lot_size:    lotSize.label,
        volume,
      }])
      showToast({ type, text:`${type} ${symbol} @ ${priceFmt(entry ?? livePrice)}` })
      resetOrder()
      await fetchTrades()
      await fetchWallet()
    } catch (e) {
      const detail = e.response?.data?.detail
      const text = Array.isArray(detail)
        ? detail.map(d => d.msg).join(', ')
        : (typeof detail === 'string' ? detail : 'Trade failed')
      showToast({ type:'error', text })
    }
  }

  const handleClose = async (id) => {
    setPendingOrders(prev => prev.filter(o => o.id !== id))
    await closeTrade(id)
    await fetchWallet()
  }

  const handleCloseAll = async () => {
    setPendingOrders([])
    await closeAllTrades()
    await fetchWallet()
  }

  const handlePeterApply = (rec) => {
    const bp   = BASE_PRICES[rec.symbol] ?? livePrice
    const dec  = bp > 100 ? 2 : 4
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
    setSymbol({ Crypto:'BTC/USD', Forex:'USD/ZAR', Stocks:'APPLE' }[m])
    resetOrder()
  }

  const handleSymbolChange = (s) => {
    if (peterApplyingRef.current) return
    setSymbol(s); resetOrder()
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', justifyContent:'center', fontFamily:"'Courier New',monospace" }}>
      <div style={{ width:'100%', maxWidth:420, minHeight:'100vh', background:`linear-gradient(180deg,${C.panel} 0%,${C.bg} 100%)`, position:'relative' }}>

        {/* Scanlines */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0,
          backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(167,139,250,0.008) 2px,rgba(167,139,250,0.008) 4px)' }}/>

        <div style={{ position:'relative', zIndex:1 }}>

          {/* ── Header + Balance ── */}
          <div style={{ padding:'12px 16px 10px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ flex:1 }}>

              {/* eQual wordmark */}
              <div style={{ marginBottom:8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 44" width="96" height="26">
                  <defs>
                    <linearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%"   stopColor="#38bdf8" stopOpacity="1"/>
                      <stop offset="100%" stopColor="#0ea5c8" stopOpacity="1"/>
                    </linearGradient>
                    <linearGradient id="dotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%"   stopColor="#facc15" stopOpacity="1"/>
                      <stop offset="100%" stopColor="#d97706" stopOpacity="1"/>
                    </linearGradient>
                    <filter id="eGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="1.8" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="dotGlow" x="-80%" y="-80%" width="260%" height="260%">
                      <feGaussianBlur stdDeviation="2.5" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  <text x="2"  y="34" fontFamily="Georgia,'Times New Roman',serif" fontSize="36" fontWeight="400" fontStyle="italic" fill="url(#eGrad)" filter="url(#eGlow)" letterSpacing="-1">e</text>
                  <text x="24" y="34" fontFamily="Georgia,'Times New Roman',serif" fontSize="36" fontWeight="700" fill="#e8e8ff" letterSpacing="-1">Q</text>
                  <text x="55" y="34" fontFamily="Georgia,'Times New Roman',serif" fontSize="36" fontWeight="400" fill="#c8c8ee" letterSpacing="-0.5">ual</text>
                  <circle cx="51" cy="38" r="3.5" fill="url(#dotGrad)" filter="url(#dotGlow)"/>
                  <line x1="2" y1="38.5" x2="22" y2="38.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                </svg>
              </div>

              {/* Account Balance */}
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ color:C.balLabel, fontSize:10, letterSpacing:1 }}>ACCOUNT BALANCE</span>
                <span style={{ color:C.balVal, fontSize:13, fontWeight:'bold', letterSpacing:1 }}>
                  {balance > 0 ? zarFmt(balance) : <span style={{ color:'#4a4a78' }}>ZAR 0,00</span>}
                </span>
              </div>

              {/* Current Balance */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:C.balLabel, fontSize:10, letterSpacing:1 }}>CURRENT BALANCE</span>
                <span style={{ color: totalPnl > 0 ? '#4ade80' : totalPnl < 0 ? '#f87171' : C.balVal, fontSize:13, fontWeight:'bold', letterSpacing:1 }}>
                  {balance > 0 ? zarFmt(balance + totalPnl) : <span style={{ color:'#4a4a78' }}>ZAR 0,00</span>}
                </span>
              </div>

            </div>

            {/* Peter AI button */}
            <button onClick={() => setShowPeter(true)} style={{
              width:34, height:34, borderRadius:'50%', flexShrink:0,
              background:'linear-gradient(135deg,#3b0764,#6d28d9)',
              border:'2px solid #a78bfa', color:'#ddd6fe',
              fontSize:9, fontWeight:'bold', letterSpacing:1, cursor:'pointer',
              fontFamily:'inherit', boxShadow:'0 0 18px #7c3aed55',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>AI</button>
          </div>

          {/* ── Positions strip ── */}
          {(openTrades.length > 0 || pendingOrders.length > 0) && (
            <div style={{ background:'#06060f', borderBottom:`1px solid ${C.border}`, padding:'6px 16px', display:'flex', gap:8, overflowX:'auto' }}>
              {pendingOrders.map(o => (
                <div key={o.id} style={{
                  flexShrink:0, display:'flex', alignItems:'center', gap:6,
                  background:'#0d0820', border:'1px solid #a78bfa44',
                  borderRadius:6, padding:'5px 10px', cursor:'default',
                }}>
                  <span style={{ color:'#a78bfa', fontSize:9 }}>⏳</span>
                  <span style={{ color: o.order_type==='BUY' ? '#4ade80' : '#f87171', fontSize:9, fontWeight:'bold' }}>
                    {o.order_type==='BUY' ? '▲' : '▼'}
                  </span>
                  <span style={{ color:'#7070a8', fontSize:9 }}>{o.symbol}</span>
                  <span style={{ color:'#6060a0', fontSize:8, letterSpacing:1 }}>PENDING</span>
                </div>
              ))}
              {openTrades.map(t => (
                <div key={t.id} onClick={() => setShowWallet(true)} style={{
                  flexShrink:0, display:'flex', alignItems:'center', gap:6,
                  background:'#0a0a1e', border:`1px solid ${(t.pnl??0) >= 0 ? '#22c55e33' : '#ef444433'}`,
                  borderRadius:6, padding:'5px 10px', cursor:'pointer',
                }}>
                  <span style={{ color: t.trade_type==='BUY' ? '#4ade80' : '#f87171', fontSize:9, fontWeight:'bold' }}>
                    {t.trade_type==='BUY' ? '▲' : '▼'}
                  </span>
                  <span style={{ color:'#a78bfa', fontSize:9 }}>{t.symbol}</span>
                  <span style={{ color:(t.pnl??0)>=0 ? '#4ade80' : '#f87171', fontSize:9, fontWeight:'bold' }}>
                    {(t.pnl??0) >= 0 ? '+' : ''}{(t.pnl??0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── Market + Symbol ── */}
          <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', gap:12 }}>
            {[
              { label:'MARKET', val:market, opts:Object.keys({Crypto:1,Forex:1,Stocks:1}), onSelect:handleMarketChange },
              { label:'SYMBOL', val:symbol, opts:{Crypto:['BTC/USD','ETH/USD','SOL/USD','XRP/USD'],Forex:['USD/ZAR','EUR/USD','GBP/USD','USD/JPY'],Stocks:['APPLE','TESLA','NVIDIA','AMAZON']}[market], onSelect:handleSymbolChange },
            ].map(dd => {
              const [open, setOpen] = useState(false)
              return (
                <div key={dd.label} style={{ flex:1, position:'relative' }}>
                  <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2, marginBottom:3 }}>{dd.label}</div>
                  <button onClick={() => setOpen(o => !o)} style={{
                    width:'100%', background:C.panel, border:`1px solid ${open ? C.borderBright : C.border}`,
                    color:C.balVal, padding:'7px 10px', cursor:'pointer',
                    borderRadius: open ? '4px 4px 0 0' : '4px',
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    fontSize:'11px', fontFamily:'inherit', letterSpacing:'1px',
                  }}>
                    {dd.val} <span style={{ fontSize:7, opacity:0.6 }}>▼</span>
                  </button>
                  {open && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:30,
                      background:C.panel, border:`1px solid ${C.borderBright}`, borderTop:'none',
                      borderRadius:'0 0 4px 4px' }}>
                      {dd.opts.map(opt => (
                        <div key={opt} onClick={() => { dd.onSelect(opt); setOpen(false) }}
                          style={{ padding:'7px 10px', color: opt===dd.val ? C.symbolCol : C.label,
                            cursor:'pointer', fontSize:10, letterSpacing:1,
                            borderBottom:`1px solid ${C.border}` }}
                          onMouseEnter={e => e.currentTarget.style.background='#16162a'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}
                        >{opt}</div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Chart ── */}
          <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ color:'#a78bfa', fontSize:13, fontWeight:'bold', letterSpacing:2 }}>{symbol}</span>
              <span style={{ color:'#facc15', fontSize:16, fontWeight:'bold', fontVariantNumeric:'tabular-nums' }}>
                {livePrice.toLocaleString('en-ZA', { minimumFractionDigits:2, maximumFractionDigits: livePrice > 100 ? 2 : 4 })}
              </span>
            </div>
            <LiveChart
              symbol={symbol} livePrice={livePrice}
              entry={entry} takeProfit={takeProfit} stopLoss={stopLoss}
              onEntry={setEntry} onTP={setTakeProfit} onSL={setStopLoss}
              openTrades={openTrades} pendingOrders={pendingOrders}
            />
          </div>

          {/* ── Lot Size ── */}
          <div style={{ padding:'8px 16px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2, marginBottom:5 }}>LOT SIZE</div>
            <div style={{ display:'flex', gap:6 }}>
              {LOT_SIZES.map(ls => {
                const sel = lotSize?.label === ls.label
                return (
                  <button key={ls.label} onClick={() => setLotSize(ls)} style={{
                    flex:1, padding:'5px 3px',
                    background: sel ? '#1a0a3a' : '#0a0a18',
                    border:`1.5px solid ${sel ? '#a78bfa' : C.border}`,
                    borderRadius:5, cursor:'pointer',
                    color: sel ? '#ddd6fe' : C.label,
                    fontFamily:'inherit', transition:'all 0.15s',
                  }}>
                    <div style={{ fontSize:9, fontWeight:'bold', letterSpacing:1 }}>{ls.label}</div>
                    <div style={{ fontSize:8, marginTop:1, opacity:0.65 }}>{ls.sublabel}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Volume ── */}
          <div style={{ padding:'8px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2 }}>VOLUME</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => setVolume(v => Math.max(1, v-1))} style={{ background:'#0a0a18', border:`1px solid ${C.border}`, color:'#ddd6fe', width:26, height:26, borderRadius:4, cursor:'pointer', fontSize:15, fontFamily:'inherit' }}>−</button>
              <div style={{ background:'#0a0a18', border:'1px solid #a78bfa', color:'#ddd6fe', padding:'3px 16px', borderRadius:4, fontSize:13, fontWeight:'bold', minWidth:32, textAlign:'center' }}>{volume}</div>
              <button onClick={() => setVolume(v => Math.min(100, v+1))} style={{ background:'#0a0a18', border:`1px solid ${C.border}`, color:'#ddd6fe', width:26, height:26, borderRadius:4, cursor:'pointer', fontSize:15, fontFamily:'inherit' }}>+</button>
            </div>
          </div>

          {/* ── Set Levels ── */}
          {(() => {
            const isLocked = pendingOrders.some(o => o.symbol === symbol) || openTrades.some(t => t.symbol === symbol)
            return (
              <div style={{ padding:'8px 16px', borderBottom:`1px solid ${C.border}`, background:'#0f0f20', position:'relative' }}>
                <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2, marginBottom:6 }}>SET LEVELS</div>
                <div style={{ display:'flex', gap:8, filter: isLocked ? 'blur(2px)' : 'none', opacity: isLocked ? 0.45 : 1, pointerEvents: isLocked ? 'none' : 'auto', transition:'all 0.3s' }}>
                  {[
                    { key:'entry', label:'ENTRY',       color:'#38bdf8', val:entry      },
                    { key:'tp',    label:'TAKE PROFIT', color:'#4ade80', val:takeProfit },
                    { key:'sl',    label:'STOP LOSS',   color:'#f87171', val:stopLoss   },
                  ].map(b => (
                    <button key={b.key} onClick={() => {
                      const dec  = livePrice > 100 ? 2 : 4
                      const snap = v => parseFloat(v.toFixed(dec))
                      if (b.key === 'entry') setEntry(e      => e  != null ? null : snap(livePrice))
                      if (b.key === 'tp')    setTakeProfit(t => t  != null ? null : snap(livePrice * 1.003))
                      if (b.key === 'sl')    setStopLoss(s   => s  != null ? null : snap(livePrice * 0.997))
                    }} style={{
                      flex:1, padding:'8px 4px',
                      background:  b.val != null ? b.color + '18' : '#0d0d1f',
                      border:     `1.5px solid ${b.val != null ? b.color : b.color + '30'}`,
                      color:       b.val != null ? b.color : b.color + '50',
                      borderRadius:5, cursor:'pointer', fontFamily:'inherit',
                      fontSize:8, letterSpacing:'0.5px', transition:'all 0.15s',
                      fontWeight: b.val != null ? 'bold' : 'normal',
                    }}>
                      <div style={{ fontSize:11, marginBottom:2 }}>{b.val != null ? '✕' : '+'}</div>
                      {b.label}
                    </button>
                  ))}
                </div>
                {isLocked && (
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                    <span style={{ color:'#4a4a78', fontSize:8, letterSpacing:2 }}>POSITION ACTIVE</span>
                  </div>
                )}
                {!isLocked && (
                  <div style={{ color:C.labelDim, fontSize:7, textAlign:'center', marginTop:5, letterSpacing:1 }}>
                    TAP TO PLACE IN CHART CENTRE · DRAG LINE TO ADJUST
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── Level Values ── */}
          <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
              <div>
                <div style={{ color:C.labelDim, fontSize:'7.5px', letterSpacing:1, marginBottom:3 }}>ENTRY</div>
                <div style={{ color: entry != null ? '#38bdf8' : '#1e1e40', fontSize:12, fontWeight:'bold' }}>{priceFmt(entry)}</div>
              </div>
              <div>
                <div style={{ color:C.labelDim, fontSize:'7.5px', letterSpacing:1, marginBottom:3 }}>TAKE PROFIT</div>
                <div style={{ color: takeProfit != null ? '#4ade80' : '#1a2e1a', fontSize:12, fontWeight:'bold' }}>{priceFmt(takeProfit)}</div>
                {takeProfit != null && entry != null && (() => {
                  const pip  = livePrice < 200 ? 0.0001 : 1
                  const pips = Math.round(Math.abs(takeProfit - entry) / pip)
                  const zar  = pips * (lotSize?.pip ?? 1) * volume
                  return <>
                    <div style={{ color:'#4ade8088', fontSize:8, marginTop:2 }}>+{pips} pips</div>
                    <div style={{ color:'#4ade80', fontSize:11, fontWeight:'bold', marginTop:1 }}>ZAR {zar.toFixed(2)}</div>
                  </>
                })()}
              </div>
              <div>
                <div style={{ color:C.labelDim, fontSize:'7.5px', letterSpacing:1, marginBottom:3 }}>STOP LOSS</div>
                <div style={{ color: stopLoss != null ? '#f87171' : '#2e1a1a', fontSize:12, fontWeight:'bold' }}>{priceFmt(stopLoss)}</div>
                {stopLoss != null && entry != null && (() => {
                  const pip  = livePrice < 200 ? 0.0001 : 1
                  const pips = Math.round(Math.abs(stopLoss - entry) / pip)
                  const zar  = pips * (lotSize?.pip ?? 1) * volume
                  return <>
                    <div style={{ color:'#f8717188', fontSize:8, marginTop:2 }}>-{pips} pips</div>
                    <div style={{ color:'#f87171', fontSize:11, fontWeight:'bold', marginTop:1 }}>-ZAR {zar.toFixed(2)}</div>
                  </>
                })()}
              </div>
            </div>
          </div>

          {/* ── BUY / SELL ── */}
          {(() => {
            const tradeDirection = entry != null && takeProfit != null ? (takeProfit > entry ? 'BUY' : 'SELL') : null
            const canBuy  = !tradeDirection || tradeDirection === 'BUY'
            const canSell = !tradeDirection || tradeDirection === 'SELL'
            return (
              <>
                <div style={{ padding:'12px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <button onClick={() => handleTrade('BUY')} disabled={!canBuy} style={{
                    background: canBuy ? 'linear-gradient(135deg,#052e16,#065f2a)' : '#0a0a0a',
                    border:`2px solid ${canBuy ? '#22c55e' : '#1a2a1a'}`,
                    color: canBuy ? '#4ade80' : '#2a3a2a', padding:13, borderRadius:6,
                    cursor: canBuy ? 'pointer' : 'not-allowed', fontFamily:'inherit',
                    fontSize:15, fontWeight:'bold', letterSpacing:3,
                    boxShadow: canBuy ? '0 0 18px #22c55e25' : 'none',
                    opacity: canBuy ? 1 : 0.3, transition:'all 0.2s',
                  }}>▲ BUY</button>
                  <button onClick={() => handleTrade('SELL')} disabled={!canSell} style={{
                    background: canSell ? 'linear-gradient(135deg,#2d0a0a,#5a1212)' : '#0a0a0a',
                    border:`2px solid ${canSell ? '#ef4444' : '#2a1a1a'}`,
                    color: canSell ? '#f87171' : '#3a2a2a', padding:13, borderRadius:6,
                    cursor: canSell ? 'pointer' : 'not-allowed', fontFamily:'inherit',
                    fontSize:15, fontWeight:'bold', letterSpacing:3,
                    boxShadow: canSell ? '0 0 18px #ef444425' : 'none',
                    opacity: canSell ? 1 : 0.3, transition:'all 0.2s',
                  }}>▼ SELL</button>
                </div>
                {tradeDirection && (
                  <div style={{ padding:'2px 16px 8px', textAlign:'center' }}>
                    <span style={{ fontSize:8, letterSpacing:1, color: tradeDirection==='BUY' ? '#4ade8088' : '#f8717188' }}>
                      {tradeDirection==='BUY' ? '▲ TP ABOVE ENTRY — BUY DIRECTION' : '▼ TP BELOW ENTRY — SELL DIRECTION'}
                    </span>
                  </div>
                )}
              </>
            )
          })()}

          {/* ── Wallet Bar ── */}
          <div style={{ borderTop:`1px solid ${C.border}`, padding:'14px 16px' }}>
            <button onClick={() => setShowWallet(true)} style={{
              width:'100%', padding:'14px 20px', borderRadius:10, cursor:'pointer',
              background: balance > 0 ? 'linear-gradient(135deg,#061426,#082040)' : 'linear-gradient(135deg,#140e04,#201a04)',
              border:`2px solid ${balance > 0 ? '#38bdf8' : '#facc15'}`,
              fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'space-between',
              boxShadow:`0 0 22px ${balance > 0 ? '#38bdf822' : '#facc1522'}`, transition:'all 0.2s',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:20, color: balance > 0 ? '#38bdf8' : '#facc15' }}>⬡</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ color: balance > 0 ? '#38bdf8' : '#facc15', fontSize:11, fontWeight:'bold', letterSpacing:2 }}>
                    {balance > 0 ? 'WALLET' : '⬡ DEPOSIT TO TRADE'}
                  </div>
                  <div style={{ color: balance > 0 ? '#5090b8' : '#8a7040', fontSize:9, marginTop:2, letterSpacing:1 }}>
                    {balance > 0 ? `${openTrades.length} open position${openTrades.length !== 1 ? 's' : ''}` : 'Tap to add simulation funds'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ color: balance > 0 ? '#c8e8ff' : '#c8a840', fontSize:13, fontWeight:'bold', letterSpacing:1 }}>
                  {balance > 0 ? zarFmt(balance + totalPnl) : 'ZAR 0,00'}
                </div>
                {balance > 0 && totalPnl !== 0 && (
                  <div style={{ color: totalPnl >= 0 ? '#4ade80' : '#f87171', fontSize:9, marginTop:2 }}>
                    {totalPnl >= 0 ? '▲ +' : '▼ '}{Math.abs(totalPnl).toFixed(2)} P&L
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* ── Toast ── */}
          {toast && (
            <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:150, width:'90%', maxWidth:300, pointerEvents:'none' }}>
              <style>{`
                @keyframes toastIn{from{opacity:0;transform:translate(-50%,-46%) scale(0.9)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
                @keyframes shrink4{from{width:100%}to{width:0%}}
                @keyframes shrink3{from{width:100%}to{width:0%}}
              `}</style>

              {/* ERROR */}
              {toast.type === 'error' && (
                <div style={{ background:'linear-gradient(135deg,#180606,#2d0a0a)', border:'2px solid #ef4444', borderRadius:14, padding:'20px 24px', textAlign:'center', animation:'toastIn 0.25s ease-out', boxShadow:'0 0 40px #ef444433' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>⚠️</div>
                  <div style={{ color:'#f87171', fontSize:13, fontWeight:'bold', letterSpacing:2, marginBottom:6 }}>ERROR</div>
                  <div style={{ color:'#c0a0a0', fontSize:10, lineHeight:1.6 }}>{toast.text}</div>
                </div>
              )}

              {/* 🚀 ENTRY HIT — trade activated */}
              {toast.type === 'ENTRY_HIT' && (
                <div style={{ background:'linear-gradient(135deg,#030f18,#061a30)', border:'2px solid #38bdf8', borderRadius:14, padding:'22px 28px', textAlign:'center', boxShadow:'0 0 50px #38bdf844', animation:'toastIn 0.25s ease-out' }}>
                  <div style={{ fontSize:26, marginBottom:6 }}>🚀</div>
                  <div style={{ color:'#38bdf8', fontSize:13, fontWeight:'bold', letterSpacing:2, marginBottom:4 }}>TRADE ACTIVATED</div>
                  <div style={{ color:'#4080a0', fontSize:9, letterSpacing:2, marginBottom:10 }}>MARKET REACHED YOUR ENTRY</div>
                  <div style={{ width:'100%', height:1, background:'#38bdf833', margin:'6px 0' }}/>
                  <div style={{ fontSize:9, lineHeight:2.1, letterSpacing:1 }}>
                    <div style={{ color:'#8080b0' }}>{toast.symbol} · {toast.lot} × Vol {toast.vol}</div>
                    <div style={{ color: toast.tradeType === 'BUY' ? '#4ade80' : '#f87171', fontWeight:'bold' }}>
                      {toast.tradeType === 'BUY' ? '▲ BUY' : '▼ SELL'} · NOW IN POSITION
                    </div>
                    <div style={{ color:'#38bdf8' }}>ENTRY &nbsp;{toast.entryStr}</div>
                    <div style={{ color:'#4ade80' }}>TP &nbsp;&nbsp;&nbsp;&nbsp;{toast.tpStr}</div>
                    <div style={{ color:'#f87171' }}>SL &nbsp;&nbsp;&nbsp;&nbsp;{toast.slStr}</div>
                  </div>
                  <div style={{ marginTop:12, overflow:'hidden', borderRadius:2, height:3, background:'#38bdf822' }}>
                    <div style={{ height:'100%', background:'#38bdf8', animation:'shrink4 4s linear forwards' }}/>
                  </div>
                </div>
              )}

              {/* BUY / SELL order placed */}
              {(toast.type === 'BUY' || toast.type === 'SELL') && (
                <div style={{
                  background: toast.type==='BUY' ? 'linear-gradient(135deg,#030f07,#051a0c)' : 'linear-gradient(135deg,#0f0303,#1a0505)',
                  border:`2px solid ${toast.type==='BUY' ? '#22c55e' : '#ef4444'}`,
                  borderRadius:14, padding:'22px 28px', textAlign:'center',
                  boxShadow:`0 0 50px ${toast.type==='BUY' ? '#22c55e44' : '#ef444444'}`,
                  animation:'toastIn 0.25s ease-out',
                }}>
                  <div style={{ fontSize:22, fontWeight:'bold', letterSpacing:4, color: toast.type==='BUY' ? '#4ade80' : '#f87171', marginBottom:6 }}>
                    {toast.type==='BUY' ? '▲ BUY' : '▼ SELL'}
                  </div>
                  <div style={{ color:'#ffffff80', fontSize:9, letterSpacing:3, marginBottom:10 }}>ORDER PENDING</div>
                  <div style={{ color: toast.type==='BUY' ? '#4ade80' : '#f87171', fontSize:11 }}>{toast.text}</div>
                  <div style={{ marginTop:12, overflow:'hidden', borderRadius:2, height:3, background: toast.type==='BUY' ? '#22c55e22' : '#ef444422' }}>
                    <div style={{ height:'100%', background: toast.type==='BUY' ? '#22c55e' : '#ef4444', animation:'shrink3 3s linear forwards' }}/>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ── Modals ── */}
        {showWallet && (
          <WalletModal
            wallet={wallet}
            openTrades={openTrades}
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
    </div>
  )
}