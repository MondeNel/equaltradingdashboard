import { useState, useEffect, useRef } from "react";
import { HISTORY, VIEW, W, H, PAD, CW, CH, CHART_BG, CHART_BORDER, GRID_COL, AXIS_TEXT, BULL_COL, BEAR_COL, C } from "../constants";

function seedCandles(startPrice) {
  const out = [];
  let p = startPrice * 0.97;
  for (let i = 0; i < HISTORY - 1; i++) {
    const o = p, c = p + (Math.random() - 0.48) * p * 0.007;
    out.push({ open:o, close:c, high:Math.max(o,c)+Math.random()*p*0.003, low:Math.min(o,c)-Math.random()*p*0.003, done:true });
    p = c;
  }
  out.push({ open:p, close:p, high:p, low:p, done:false });
  return out;
}

export default function CandleChart({ symbol, livePrice, entry, takeProfit, stopLoss, onEntry, onTP, onSL, openTrades = [], pendingOrders = [], onPriceUpdate }) {
  const svgRef      = useRef(null);
  const interactRef = useRef(null);
  const scaleRef    = useRef({ minP:0, maxP:1, range:1 });
  const lpRef       = useRef(livePrice);
  lpRef.current     = livePrice;
  const tickRef     = useRef(0);
  const candlesRef  = useRef(null);
  const pinchRef    = useRef(null);

  const driftRef   = useRef(livePrice > 0 ? livePrice : 0);
  const prevSymRef = useRef(symbol);
  const seededRef  = useRef(false);

  const [candles,   setCandles]   = useState(() => seedCandles(livePrice > 0 ? livePrice : 1));
  const [panOffset, setPanOffset] = useState(0);
  const [zoomView,  setZoomView]  = useState(VIEW);
  const [vOffset,   setVOffset]   = useState(0);
  const panRef   = useRef(0);
  const zoomRef  = useRef(VIEW);
  const vOffRef  = useRef(0);
  panRef.current  = panOffset;
  zoomRef.current = zoomView;
  vOffRef.current = vOffset;
  candlesRef.current = candles;

  const MIN_VIEW = 8;
  const MAX_VIEW = HISTORY;
  const zoomIn  = () => setZoomView(v => Math.max(MIN_VIEW, Math.round(v * 0.7)));
  const zoomOut = () => setZoomView(v => Math.min(MAX_VIEW, Math.round(v * 1.4)));

  // Reset seed when symbol changes
  useEffect(() => {
    if (prevSymRef.current !== symbol) {
      prevSymRef.current = symbol;
      seededRef.current  = false;
      driftRef.current   = 0;
    }
  }, [symbol]);

  // Seed chart once per symbol when real price arrives
  useEffect(() => {
    if (livePrice <= 0) return;
    lpRef.current = livePrice;
    if (!seededRef.current) {
      seededRef.current = true;
      driftRef.current  = livePrice;
      setCandles(seedCandles(livePrice));
      setPanOffset(0);
      setVOffset(0);
    }
  }, [livePrice]);

  // 400ms tick — micro-drift toward real price
  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current++;
      const realPrice = lpRef.current;
      if (realPrice <= 0 || !seededRef.current) return;

      const prev  = driftRef.current > 0 ? driftRef.current : realPrice;
      const noise = (Math.random() - 0.49) * realPrice * 0.0003;
      const pull  = (realPrice - prev) * 0.35;
      const next  = prev + pull + noise;
      driftRef.current = next;

      if (onPriceUpdate) onPriceUpdate(next);

      setCandles(prev => {
        const cs   = [...prev];
        const last = { ...cs[cs.length - 1] };
        last.close = next;
        last.high  = Math.max(last.high, next);
        last.low   = Math.min(last.low,  next);
        cs[cs.length - 1] = last;
        if (tickRef.current % 20 === 0) {
          last.done = true;
          cs.push({ open:next, close:next, high:next, low:next, done:false });
          if (cs.length > HISTORY) cs.shift();
        }
        return cs;
      });
    }, 400);
    return () => clearInterval(id);
  }, []);

  // Visible slice
  const total   = candles.length;
  const offset  = Math.min(panOffset, Math.max(0, total - zoomView));
  const start   = Math.max(0, total - zoomView - offset);
  const visible = candles.slice(start, start + zoomView);
  const isLive  = offset === 0;

  // ── displayPrice must be declared BEFORE scale so pip padding can use it ──
  const displayPrice = driftRef.current > 0 ? driftRef.current : livePrice;

  // ── Scale — pip-aware padding so axis shows a tight, meaningful range ──────
  const allP      = visible.flatMap(c => [c.high, c.low]);
  const dataMin   = Math.min(...allP);
  const dataMax   = Math.max(...allP);
  const dataRange = dataMax - dataMin || 1;

  // Pip size by price magnitude
  const pip    = displayPrice > 10000 ? 1 : displayPrice > 100 ? 0.01 : 0.0001;
  // 40 pips each side, but at least 15% of candle range so bodies never overflow
  const pipPad   = Math.max(40 * pip, dataRange * 0.15);
  const rawMin   = dataMin - pipPad;
  const rawMax   = dataMax + pipPad;
  const rawRange = rawMax - rawMin || 1;
  const minP     = rawMin - vOffset * rawRange;
  const maxP     = rawMax - vOffset * rawRange;
  const range    = maxP - minP || 1;
  scaleRef.current = { minP, maxP, range };

  const toY     = v => PAD.t + CH - ((v - minP) / range) * CH;
  const toX     = i => PAD.l + (i + 0.5) * (CW / zoomView);
  const toPrice = y => { const { minP:mn, range:rng } = scaleRef.current; return mn + ((PAD.t+CH-y)/CH)*rng; };
  const cW      = Math.max(2, CW / zoomView - 1.5);
  const slotPx  = CW / zoomView;

  const svgXY = e => {
    const r  = svgRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x:(cx-r.left)*(W/r.width), y:(cy-r.top)*(H/r.height) };
  };

  const hitLine = svgY => {
    for (const { key, val } of [{ key:"entry",val:entry },{ key:"tp",val:takeProfit },{ key:"sl",val:stopLoss }]) {
      if (val != null && Math.abs(svgY - toY(val)) < 16) return key;
    }
    return null;
  };

  useEffect(() => {
    const getDist = t => Math.sqrt(Math.pow(t[0].clientX-t[1].clientX,2)+Math.pow(t[0].clientY-t[1].clientY,2));
    const onMove = e => {
      if (!svgRef.current) return;
      if (e.touches && e.touches.length === 2) {
        e.preventDefault();
        if (!pinchRef.current) return;
        const newDist = getDist(e.touches);
        const delta   = pinchRef.current.lastDist - newDist;
        pinchRef.current.lastDist = newDist;
        pinchRef.current.acc = (pinchRef.current.acc||0) + delta * 0.06;
        const steps = Math.trunc(pinchRef.current.acc);
        if (steps !== 0) { pinchRef.current.acc -= steps; setZoomView(v => Math.max(8, Math.min(HISTORY, v+steps))); }
        return;
      }
      if (!interactRef.current) return;
      e.preventDefault();
      const { x, y } = svgXY(e);
      const ia = interactRef.current;
      if (ia.type === "pan") {
        const dx  = x - ia.startX;
        const max = Math.max(0, candlesRef.current.length - zoomRef.current);
        setPanOffset(Math.max(0, Math.min(ia.startOffset - Math.round(dx/slotPx), max)));
        setVOffset(ia.startVOffset - (y - ia.startY) / CH);
        return;
      }
      const { minP:mn, maxP:mx } = scaleRef.current;
      const lp  = lpRef.current;
      const dec = lp > 10000 ? 2 : lp > 100 ? 2 : 4;
      const val = parseFloat(Math.max(mn, Math.min(mx, toPrice(y))).toFixed(dec));
      if (ia.key === "entry") onEntry(val);
      if (ia.key === "tp")    onTP(val);
      if (ia.key === "sl")    onSL(val);
    };
    const onUp = e => {
      if (e?.touches !== undefined && e.touches.length < 2) pinchRef.current = null;
      if (!e?.touches || e.touches.length === 0) interactRef.current = null;
    };
    window.addEventListener("mousemove",   onMove);
    window.addEventListener("mouseup",     onUp);
    window.addEventListener("touchmove",   onMove, { passive:false });
    window.addEventListener("touchend",    onUp);
    window.addEventListener("touchcancel", onUp);
    return () => {
      window.removeEventListener("mousemove",   onMove);
      window.removeEventListener("mouseup",     onUp);
      window.removeEventListener("touchmove",   onMove);
      window.removeEventListener("touchend",    onUp);
      window.removeEventListener("touchcancel", onUp);
    };
  }, [onEntry, onTP, onSL, slotPx]);

  const onBgDown = e => {
    if (e.touches && e.touches.length === 2) {
      e.preventDefault();
      pinchRef.current = { lastDist: Math.sqrt(Math.pow(e.touches[0].clientX-e.touches[1].clientX,2)+Math.pow(e.touches[0].clientY-e.touches[1].clientY,2)), acc:0 };
      interactRef.current = null;
      return;
    }
    if (interactRef.current) return;
    e.preventDefault();
    const { x, y } = svgXY(e);
    if (!openTrades.some(t => t.symbol === symbol)) {
      const hit = hitLine(y);
      if (hit) { interactRef.current = { type:"line", key:hit }; return; }
    }
    interactRef.current = { type:"pan", startX:x, startY:y, startOffset:panRef.current, startVOffset:vOffRef.current };
  };

  const onLineDown = (key, e) => { e.preventDefault(); e.stopPropagation(); interactRef.current = { type:"line", key }; };

  const fmt = v => {
    if (v == null) return "";
    return displayPrice > 10000 ? v.toFixed(0) : displayPrice > 100 ? v.toFixed(2) : v.toFixed(4);
  };

  const lastY = toY(displayPrice);
  const lines = [
    { key:"entry", val:entry,      color:C.entryCol, label:"ENTRY", dash:"none" },
    { key:"tp",    val:takeProfit, color:C.tpCol,    label:"TP",    dash:"5,3"  },
    { key:"sl",    val:stopLoss,   color:C.slCol,    label:"SL",    dash:"5,3"  },
  ];

  return (
    <div style={{ position:"relative" }}>
      {!isLive && (
        <div style={{ position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",
          background:"#1a1a30cc",border:"1px solid #3a3a60",borderRadius:10,
          padding:"2px 10px",fontSize:8,color:C.symbolCol,letterSpacing:1,zIndex:5,pointerEvents:"none" }}>
          ◀ HISTORY · DRAG TO SCROLL
        </div>
      )}
      {!isLive && (
        <button onClick={() => setPanOffset(0)} style={{
          position:"absolute",bottom:14,right:106,background:"#1a1a30",
          border:`1px solid ${C.symbolCol}`,borderRadius:8,padding:"3px 8px",
          fontSize:8,color:C.symbolCol,letterSpacing:1,cursor:"pointer",zIndex:5,fontFamily:"inherit" }}>
          LIVE ▶
        </button>
      )}
      {vOffset !== 0 && (
        <button onClick={() => setVOffset(0)} style={{
          position:"absolute",top:14,right:8,background:"#1a1a30",
          border:"1px solid #3a3a60",borderRadius:8,padding:"3px 8px",
          fontSize:8,color:"#7070a8",letterSpacing:1,cursor:"pointer",zIndex:5,fontFamily:"inherit" }}>
          ⌖ CENTRE
        </button>
      )}
      <div style={{ position:"absolute",bottom:10,right:8,zIndex:5,display:"flex",alignItems:"center",gap:3 }}>
        <button onClick={zoomOut} style={{ width:22,height:22,borderRadius:4,cursor:"pointer",background:"#12122a",border:"1px solid #2e2e58",color:"#8888c0",fontSize:14,fontWeight:"bold",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit" }}>−</button>
        <div style={{ padding:"2px 6px",borderRadius:4,background:"#0a0a1e",border:"1px solid #1e1e3a",color:"#5858a0",fontSize:8,letterSpacing:1,minWidth:28,textAlign:"center" }}>{zoomView}c</div>
        <button onClick={zoomIn}  style={{ width:22,height:22,borderRadius:4,cursor:"pointer",background:"#12122a",border:"1px solid #2e2e58",color:"#8888c0",fontSize:14,fontWeight:"bold",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit" }}>+</button>
      </div>

      <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`}
        style={{ display:"block",userSelect:"none",touchAction:"none",
          cursor:interactRef.current?.type==="pan"?"grabbing":"grab",
          borderRadius:"6px",border:`1px solid ${CHART_BORDER}` }}
        onMouseDown={onBgDown} onTouchStart={onBgDown}>

        <defs><clipPath id="cc"><rect x={PAD.l} y={PAD.t} width={CW} height={CH}/></clipPath></defs>
        <rect x="0" y="0" width={W} height={H} fill={CHART_BG} rx="5"/>
        <rect x={PAD.l} y={PAD.t} width={CW} height={CH} fill={CHART_BG}/>

        {[0,0.2,0.4,0.6,0.8,1].map((pct, i) => {
          const yy = PAD.t + CH * pct;
          return (
            <g key={i}>
              <line x1={PAD.l} y1={yy} x2={PAD.l+CW} y2={yy} stroke={pct===0||pct===1?CHART_BORDER:GRID_COL} strokeWidth="1"/>
              <text x={PAD.l+CW+5} y={yy+3.5} fill={AXIS_TEXT} fontSize="8" fontFamily="'Helvetica Neue',Arial,sans-serif">{fmt(maxP - pct * range)}</text>
            </g>
          );
        })}

        <g clipPath="url(#cc)">
          {visible.map((c, i) => {
            const x   = toX(i);
            const up  = c.close >= c.open;
            const col = up ? BULL_COL : BEAR_COL;
            const bT  = toY(Math.max(c.open, c.close));
            const bH  = Math.max(1, Math.abs(toY(c.open) - toY(c.close)));
            return (
              <g key={i}>
                <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={col} strokeWidth="1.2"/>
                <rect x={x-cW/2} y={bT} width={cW} height={bH} fill={col} style={!c.done?{filter:`drop-shadow(0 0 2px ${col}88)`}:{}}/>
              </g>
            );
          })}
        </g>

        <line x1={PAD.l+CW} y1={PAD.t} x2={PAD.l+CW} y2={PAD.t+CH} stroke={CHART_BORDER} strokeWidth="1"/>

        {isLive && displayPrice > 0 && <>
          <line x1={PAD.l} y1={lastY} x2={PAD.l+CW} y2={lastY} stroke={C.priceCol} strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
          <rect x={PAD.l+CW+1} y={lastY-9} width={68} height={18} fill={C.priceCol} rx="3"/>
          <text x={PAD.l+CW+35} y={lastY+4.5} fill="#000" fontSize="8.5" fontFamily="'Courier New',monospace" textAnchor="middle" fontWeight="bold">{fmt(displayPrice)}</text>
        </>}

        {(() => {
          const hasActiveTrade = openTrades.some(t => t.symbol === symbol);
          return lines.map(({ key, val, color, label, dash }) => {
            if (val == null) return null;
            const y = toY(val);
            return (
              <g key={key}>
                {!hasActiveTrade && <rect x={PAD.l} y={y-14} width={CW} height={28} fill="transparent" style={{cursor:"ns-resize"}} onMouseDown={e=>onLineDown(key,e)} onTouchStart={e=>onLineDown(key,e)}/>}
                <line x1={PAD.l} y1={y} x2={PAD.l+CW} y2={y} stroke={color} strokeWidth="1.5" strokeDasharray={dash} opacity="0.85"/>
                <rect x={PAD.l+2} y={y-7} width={28} height={14} fill={color+(hasActiveTrade?"18":"30")} stroke={color} strokeWidth="1" rx="3"
                  style={!hasActiveTrade?{cursor:"ns-resize"}:{}}
                  onMouseDown={!hasActiveTrade?e=>onLineDown(key,e):undefined}
                  onTouchStart={!hasActiveTrade?e=>onLineDown(key,e):undefined}/>
                <text x={PAD.l+16} y={y+4.5} fill={color} fontSize="7.5" fontFamily="'Courier New',monospace" textAnchor="middle" fontWeight="bold">{hasActiveTrade?label:"⠿"}</text>
                <rect x={PAD.l+CW+1} y={y-9} width={68} height={18} fill={color} rx="3"/>
                <text x={PAD.l+CW+35} y={y+4.5} fill="#fff" fontSize="8" fontFamily="'Courier New',monospace" textAnchor="middle" fontWeight="bold">{label} {fmt(val)}</text>
              </g>
            );
          });
        })()}

        {pendingOrders.filter(o => o.symbol === symbol).map(o => {
          const eY  = toY(o.entryPrice);
          const tpY = o.tpPrice != null ? toY(o.tpPrice) : null;
          const slY = o.slPrice != null ? toY(o.slPrice) : null;
          const col = o.type==="BUY" ? "#4ade80" : "#f87171";
          return (
            <g key={o.id} opacity="0.45">
              {tpY != null && <><line x1={PAD.l} y1={tpY} x2={PAD.l+CW} y2={tpY} stroke="#4ade80" strokeWidth="1" strokeDasharray="4,4"/><rect x={PAD.l+2} y={tpY-6} width={22} height={12} fill="#4ade8010" stroke="#4ade80" strokeWidth="0.8" rx="2"/><text x={PAD.l+13} y={tpY+3.5} fill="#4ade80" fontSize="6.5" fontFamily="'Courier New',monospace" textAnchor="middle">TP</text></>}
              {slY != null && <><line x1={PAD.l} y1={slY} x2={PAD.l+CW} y2={slY} stroke="#f87171" strokeWidth="1" strokeDasharray="4,4"/><rect x={PAD.l+2} y={slY-6} width={22} height={12} fill="#f8717110" stroke="#f87171" strokeWidth="0.8" rx="2"/><text x={PAD.l+13} y={slY+3.5} fill="#f87171" fontSize="6.5" fontFamily="'Courier New',monospace" textAnchor="middle">SL</text></>}
              <line x1={PAD.l} y1={eY} x2={PAD.l+CW} y2={eY} stroke={col} strokeWidth="1.2" strokeDasharray="6,3"/>
              <rect x={PAD.l+2} y={eY-7} width={36} height={14} fill={col+"10"} stroke={col} strokeWidth="0.8" rx="3"/>
              <text x={PAD.l+20} y={eY+4} fill={col} fontSize="6.5" fontFamily="'Courier New',monospace" textAnchor="middle">WAIT</text>
              <rect x={PAD.l+CW+1} y={eY-9} width={68} height={18} fill={col+"50"} rx="3"/>
              <text x={PAD.l+CW+35} y={eY+4.5} fill="#fff" fontSize="7.5" fontFamily="'Courier New',monospace" textAnchor="middle" fontWeight="bold">{o.type} {fmt(o.entryPrice)}</text>
            </g>
          );
        })}

        {openTrades.filter(t => t.symbol === symbol).map((t, idx) => {
          const entryY = toY(t.entryPrice);
          const curY   = toY(displayPrice);
          const tpY    = t.tpPrice != null ? toY(t.tpPrice) : null;
          const slY    = t.slPrice != null ? toY(t.slPrice) : null;
          const isWin  = t.pnl >= 0;
          const pnlCol = isWin ? "#4ade80" : "#f87171";
          const tagX   = PAD.l + 32 + idx * 2;
          return (
            <g key={t.id} opacity="0.92">
              {tpY != null && <><line x1={PAD.l} y1={tpY} x2={PAD.l+CW} y2={tpY} stroke="#4ade80" strokeWidth="1.2" strokeDasharray="6,3"/><rect x={PAD.l+2} y={tpY-7} width={22} height={13} fill="#4ade8018" stroke="#4ade80" strokeWidth="1" rx="3"/><text x={PAD.l+13} y={tpY+4} fill="#4ade80" fontSize="7" fontFamily="'Courier New',monospace" textAnchor="middle" fontWeight="bold">TP</text></>}
              {slY != null && <><line x1={PAD.l} y1={slY} x2={PAD.l+CW} y2={slY} stroke="#f87171" strokeWidth="1.2" strokeDasharray="6,3"/><rect x={PAD.l+2} y={slY-7} width={22} height={13} fill="#f8717118" stroke="#f87171" strokeWidth="1" rx="3"/><text x={PAD.l+13} y={slY+4} fill="#f87171" fontSize="7" fontFamily="'Courier New',monospace" textAnchor="middle" fontWeight="bold">SL</text></>}
              {entryY !== curY && <rect x={PAD.l} y={Math.min(entryY,curY)} width={CW} height={Math.abs(entryY-curY)} fill={pnlCol} opacity="0.04"/>}
              <line x1={PAD.l} y1={entryY} x2={PAD.l+CW} y2={entryY} stroke="#38bdf8" strokeWidth="1.5"/>
              <rect x={PAD.l+2} y={entryY-7} width={28} height={13} fill="#38bdf818" stroke="#38bdf8" strokeWidth="1" rx="3"/>
              <text x={PAD.l+16} y={entryY+4} fill="#38bdf8" fontSize="7" fontFamily="'Courier New',monospace" textAnchor="middle" fontWeight="bold">IN</text>
              {(() => {
                const arrowY  = Math.max(PAD.t+10, Math.min(PAD.t+CH-10, curY));
                const goingUp = t.type==="BUY" ? displayPrice > t.entryPrice : displayPrice < t.entryPrice;
                const col     = isWin ? "#4ade80" : "#f87171";
                return (
                  <g>
                    <line x1={tagX} y1={entryY} x2={tagX} y2={arrowY} stroke={col} strokeWidth="1" strokeDasharray="2,2" opacity="0.6"/>
                    <circle cx={tagX} cy={arrowY} r="4" fill={col} opacity="0.9"/>
                    <rect x={PAD.l+CW+1} y={arrowY-9} width={68} height={18} fill={col+"cc"} rx="3"/>
                    <text x={PAD.l+CW+35} y={arrowY+4.5} fill="#000" fontSize="7.5" fontFamily="'Courier New',monospace" textAnchor="middle" fontWeight="bold">
                      {goingUp?"▲":"▼"} {t.pnl>=0?"+":""}{t.pnl.toFixed(2)}
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
}