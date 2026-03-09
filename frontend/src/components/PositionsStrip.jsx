import { C, LOT_SIZES, USD_TO_ZAR } from '../constants'

function getPipSize(price) {
  return price >= 200 ? 1 : 0.0001
}

function calcPnl(trade, livePrices) {
  const lp   = livePrices[trade.symbol] ?? trade.entry_price
  const diff = trade.trade_type === 'BUY'
    ? lp - trade.entry_price
    : trade.entry_price - lp
  const pip    = getPipSize(trade.entry_price)
  const pips   = diff / pip
  const lotPip = LOT_SIZES.find(l => l.label === trade.lot_size)?.pip ?? 1
  const zar    = pips * lotPip * trade.volume * (trade.symbol.includes('ZAR') ? 1 : USD_TO_ZAR)
  return zar
}

export default function PositionsStrip({ trades, livePrices, onClose, onCloseAll }) {
  if (!trades.length) return (
    <div style={{ borderTop:`1px solid ${C.border}`, padding:'12px 16px' }}>
      <div style={{ color:C.labelDim, fontSize:10, letterSpacing:2, textAlign:'center' }}>NO OPEN POSITIONS</div>
    </div>
  )

  const totalPnl = trades.reduce((sum, t) => sum + calcPnl(t, livePrices), 0)

  return (
    <div style={{ borderTop:`1px solid ${C.border}`, paddingBottom:4 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 16px 4px' }}>
        <div style={{ color:C.labelDim, fontSize:9, letterSpacing:2 }}>
          OPEN POSITIONS ({trades.length})
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color: totalPnl >= 0 ? C.tpCol : C.slCol, fontSize:11, fontWeight:'bold' }}>
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} ZAR
          </span>
          {trades.length > 1 && (
            <button onClick={onCloseAll} style={{
              background:'none', border:`1px solid ${C.slCol}`, borderRadius:4,
              color:C.slCol, fontSize:9, cursor:'pointer', padding:'2px 6px',
            }}>CLOSE ALL</button>
          )}
        </div>
      </div>

      {trades.map(t => {
        const pnl = calcPnl(t, livePrices)
        const col = pnl >= 0 ? C.tpCol : C.slCol
        return (
          <div key={t.id} style={{ display:'flex', alignItems:'center', padding:'4px 16px', gap:8 }}>
            <span style={{
              color: t.trade_type === 'BUY' ? C.activeBuy : C.activeSell,
              fontSize:9, fontWeight:'bold', width:28,
            }}>{t.trade_type}</span>
            <span style={{ color:C.symbolCol, fontSize:10, flex:1 }}>{t.symbol}</span>
            <span style={{ color:C.labelDim, fontSize:9 }}>×{t.volume}</span>
            <span style={{ color:col, fontSize:11, fontWeight:'bold', minWidth:60, textAlign:'right' }}>
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
            </span>
            <button onClick={() => onClose(t.id)} style={{
              background:'none', border:`1px solid ${C.border}`, borderRadius:4,
              color:C.label, fontSize:9, cursor:'pointer', padding:'2px 6px',
            }}>✕</button>
          </div>
        )
      })}
    </div>
  )
}