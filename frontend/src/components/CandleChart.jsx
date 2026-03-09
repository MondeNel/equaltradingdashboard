import { C, VIEW } from '../constants'

export default function CandleChart({ candles, entry, takeProfit, stopLoss, livePrice }) {
  const W = 320, H = 180
  const visible = candles.slice(-VIEW)
  if (!visible.length) return null

  const allH   = visible.map(c => c.h)
  const allL   = visible.map(c => c.l)
  const levels = [entry, takeProfit, stopLoss, livePrice].filter(Boolean)
  const dataMax = Math.max(...allH, ...levels)
  const dataMin = Math.min(...allL, ...levels)
  const pad  = (dataMax - dataMin) * 0.1 || 1
  const hi   = dataMax + pad
  const lo   = dataMin - pad
  const yScale = v => H - ((v - lo) / (hi - lo)) * H
  const cw   = W / VIEW
  const gap  = cw * 0.15
  const bw   = Math.max(1, cw - gap * 2)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
      <rect width={W} height={H} fill={C.bg} />

      {visible.map((c, i) => {
        const x    = i * cw + cw / 2
        const bull = c.c >= c.o
        const col  = bull ? C.bullCandle : C.bearCandle
        const oy   = yScale(Math.max(c.o, c.c))
        const cy   = Math.max(1, Math.abs(yScale(c.o) - yScale(c.c)))
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={yScale(c.h)} y2={yScale(c.l)} stroke={col} strokeWidth={0.7} />
            <rect x={x - bw / 2} y={oy} width={bw} height={cy} fill={col} rx={0.5} />
          </g>
        )
      })}

      {entry      && <line x1={0} x2={W} y1={yScale(entry)}      y2={yScale(entry)}      stroke={C.entryCol} strokeWidth={1}   strokeDasharray="4,3" />}
      {takeProfit && <line x1={0} x2={W} y1={yScale(takeProfit)} y2={yScale(takeProfit)} stroke={C.tpCol}    strokeWidth={1}   strokeDasharray="4,3" />}
      {stopLoss   && <line x1={0} x2={W} y1={yScale(stopLoss)}   y2={yScale(stopLoss)}   stroke={C.slCol}    strokeWidth={1}   strokeDasharray="4,3" />}
      {livePrice  && <line x1={0} x2={W} y1={yScale(livePrice)}  y2={yScale(livePrice)}  stroke={C.priceCol} strokeWidth={1.5} opacity={0.8} />}
    </svg>
  )
}