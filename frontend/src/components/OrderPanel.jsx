import { C, LOT_SIZES, USD_TO_ZAR } from '../constants'

function getPipSize(price) { return price >= 200 ? 1 : 0.0001 }

export default function OrderPanel({
  livePrice, symbol, lotSize, setLotSize,
  volume, setVolume, entry, setEntry,
  takeProfit, setTakeProfit, stopLoss, setStopLoss,
  onTrade, onReset, balance,
}) {
  const priceFmt = v => {
    if (v == null) return '–'
    return livePrice > 10000
      ? v.toLocaleString('en-ZA', { minimumFractionDigits:2 })
      : livePrice > 100 ? v.toFixed(2) : v.toFixed(4)
  }

  const calcPips = (a, b) => {
    if (a == null || b == null || !lotSize) return null
    const diff = Math.abs(a - b)
    if (!diff) return null
    const pip  = getPipSize(livePrice)
    const pips = diff / pip
    const zar  = pips * lotSize.pip * volume * (symbol.includes('ZAR') ? 1 : USD_TO_ZAR)
    return { pips: Math.round(pips), zar }
  }

  const profitCalc = calcPips(entry, takeProfit)
  const lossCalc   = calcPips(entry, stopLoss)
  const zarFmt     = v => v != null ? `ZAR ${v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : 'ZAR 0,00'

  const tradeDirection = entry != null && takeProfit != null
    ? (takeProfit > entry ? 'BUY' : 'SELL') : null
  const canBuy  = !tradeDirection || tradeDirection === 'BUY'
  const canSell = !tradeDirection || tradeDirection === 'SELL'
  const hasBalance = balance > 0

  const levelBtn = (label, color, value, setter) => (
    <div style={{ flex:1 }}>
      <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2, marginBottom:3 }}>{label}</div>
      <div style={{ display:'flex', gap:4 }}>
        <button onClick={() => setter(value != null ? null : livePrice)} style={{
          flex:1, padding:'6px 4px', background: value != null ? '#0f0f20' : C.bg,
          border:`1px solid ${value != null ? color : C.border}`, borderRadius:5,
          color: value != null ? color : C.labelDim, fontSize:10, cursor:'pointer',
        }}>
          {value != null ? priceFmt(value) : 'SET'}
        </button>
        {value != null && (
          <button onClick={() => setter(null)} style={{
            padding:'6px 7px', background:C.bg, border:`1px solid ${C.border}`,
            borderRadius:5, color:C.labelDim, fontSize:10, cursor:'pointer',
          }}>×</button>
        )}
      </div>
    </div>
  )

  return (
    <div>
      {/* Lot sizes */}
      <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2, marginBottom:6 }}>LOT SIZE</div>
        <div style={{ display:'flex', gap:6 }}>
          {LOT_SIZES.map(ls => (
            <button key={ls.label} onClick={() => setLotSize(ls)} style={{
              flex:1, padding:'7px 4px', borderRadius:6,
              background: lotSize?.label === ls.label ? '#1a0a2e' : C.bg,
              border:`1px solid ${lotSize?.label === ls.label ? '#a78bfa' : C.border}`,
              color: lotSize?.label === ls.label ? '#ddd6fe' : C.label,
              cursor:'pointer', fontSize:10,
            }}>
              <div style={{ fontWeight:'bold' }}>{ls.label}</div>
              <div style={{ fontSize:8, marginTop:1, opacity:0.7 }}>{ls.sublabel}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Volume */}
      <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2, marginBottom:6 }}>VOLUME (LOTS)</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setVolume(v => Math.max(1, v - 1))} style={{
            width:30, height:30, borderRadius:6, background:C.bg,
            border:`1px solid ${C.border}`, color:'#e0e0ff', fontSize:16, cursor:'pointer',
          }}>−</button>
          <div style={{ flex:1, textAlign:'center', color:'#e0e0ff', fontSize:16, fontWeight:'bold' }}>{volume}</div>
          <button onClick={() => setVolume(v => Math.min(100, v + 1))} style={{
            width:30, height:30, borderRadius:6, background:C.bg,
            border:`1px solid ${C.border}`, color:'#e0e0ff', fontSize:16, cursor:'pointer',
          }}>+</button>
        </div>
      </div>

      {/* Entry / TP / SL */}
      <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          {levelBtn('ENTRY', C.entryCol, entry, setEntry)}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {levelBtn('TAKE PROFIT', C.tpCol, takeProfit, setTakeProfit)}
          {levelBtn('STOP LOSS',   C.slCol, stopLoss,   setStopLoss)}
        </div>

        {(profitCalc || lossCalc) && (
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            {profitCalc && (
              <div style={{ flex:1, background:'#0a1a0a', border:`1px solid #1a3a1a`, borderRadius:6, padding:'6px 8px' }}>
                <div style={{ color:C.labelDim, fontSize:8 }}>PROFIT</div>
                <div style={{ color:C.tpCol, fontSize:11, fontWeight:'bold' }}>{zarFmt(profitCalc.zar)}</div>
                <div style={{ color:C.labelDim, fontSize:8 }}>{profitCalc.pips} pips</div>
              </div>
            )}
            {lossCalc && (
              <div style={{ flex:1, background:'#1a0a0a', border:`1px solid #3a1a1a`, borderRadius:6, padding:'6px 8px' }}>
                <div style={{ color:C.labelDim, fontSize:8 }}>RISK</div>
                <div style={{ color:C.slCol, fontSize:11, fontWeight:'bold' }}>{zarFmt(lossCalc.zar)}</div>
                <div style={{ color:C.labelDim, fontSize:8 }}>{lossCalc.pips} pips</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BUY / SELL */}
      <div style={{ padding:'12px 16px', display:'flex', gap:10 }}>
        <button onClick={() => onTrade('BUY')} disabled={!canBuy || !hasBalance} style={{
          flex:1, padding:'14px 0', borderRadius:8,
          background: canBuy && hasBalance ? C.buyBg : '#0a0a0a',
          border:`1px solid ${canBuy && hasBalance ? C.buyBorder : C.border}`,
          color: canBuy && hasBalance ? C.buyText : C.labelDim,
          fontSize:14, fontWeight:'bold', cursor: canBuy && hasBalance ? 'pointer' : 'not-allowed',
          letterSpacing:2,
        }}>BUY</button>
        <button onClick={() => onTrade('SELL')} disabled={!canSell || !hasBalance} style={{
          flex:1, padding:'14px 0', borderRadius:8,
          background: canSell && hasBalance ? C.sellBg : '#0a0a0a',
          border:`1px solid ${canSell && hasBalance ? C.sellBorder : C.border}`,
          color: canSell && hasBalance ? C.sellText : C.labelDim,
          fontSize:14, fontWeight:'bold', cursor: canSell && hasBalance ? 'pointer' : 'not-allowed',
          letterSpacing:2,
        }}>SELL</button>
      </div>

      {!hasBalance && (
        <div style={{ textAlign:'center', color:C.labelDim, fontSize:10, paddingBottom:12 }}>
          Deposit funds to start trading
        </div>
      )}
    </div>
  )
}