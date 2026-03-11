import { useState, useEffect, useRef } from "react";
import { SYMBOLS, LOT_SIZES, BASE_PRICES, USD_TO_ZAR, C } from "./constants";
import CandleChart from "./components/CandleChart";
import PeterModal from "./components/PeterModal";
import WalletModal from "./components/WalletModal";
import { walletAPI, ordersAPI, tradesAPI, pricesAPI, peterAPI } from './services/api'

export default function TradingDashboard() {
  const [market,     setMarket]     = useState("Forex");
  const [symbol,     setSymbol]     = useState("USD/ZAR");
  const [marketOpen, setMarketOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [lotSize,    setLotSize]    = useState(null);
  const [volume,     setVolume]     = useState(1);
  const [entry,      setEntry]      = useState(null);
  const [takeProfit, setTakeProfit] = useState(null);
  const [stopLoss,   setStopLoss]   = useState(null);
  const [livePrice,  setLivePrice]  = useState(BASE_PRICES["USD/ZAR"]);
  const [toast,      setToast]      = useState(null);
  const [showPeter,  setShowPeter]  = useState(false);
  const [peterUsage, setPeterUsage] = useState(0);
  const [showWallet, setShowWallet] = useState(false);
  const [balance,    setBalance]    = useState(0);
  const [openTrades, setOpenTrades] = useState([]);
  const peterApplyingRef = useRef(false);
  const livePriceRef     = useRef(BASE_PRICES["USD/ZAR"]);

  // Keep ref in sync for use inside setInterval callbacks
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);

useEffect(() => {
  walletAPI.get().then(r => setBalance(parseFloat(r.data.available_balance ?? 0))).catch(()=>{});
}, []);

  // Live price drift
  useEffect(() => { setLivePrice(BASE_PRICES[symbol]); }, [symbol]);
  useEffect(() => {
    const id = setInterval(() => {
      setLivePrice(prev => {
        const base  = BASE_PRICES[symbol];
        const drift = (Math.random()-0.49)*base*0.0004;
        return Math.max(base*0.985, Math.min(base*1.015, prev+drift));
      });
    }, 400);
    return () => clearInterval(id);
  }, [symbol]);

  const [resultToast,  setResultToast]  = useState(null);
  const [pendingOrders,setPendingOrders] = useState([]); // waiting for price to hit entry

  // Main price monitor — activates pending orders + updates P&L + auto-closes on TP/SL
  useEffect(() => {
    const id = setInterval(() => {
      const cur = livePriceRef.current;

      // ── Activate pending orders when market reaches entry ──
      setPendingOrders(prev => {
        if (prev.length === 0) return prev;
        const stillPending = [];
        for (const o of prev) {
          const entryHit =
            (o.type==="BUY"  && cur >= o.entryPrice) ||
            (o.type==="SELL" && cur <= o.entryPrice);
          if (entryHit) {
            setOpenTrades(t => [...t, { ...o, status:"active", activatedAt: Date.now() }]);
            setToast({ type:"ENTRY_HIT", id:Date.now(), symbol:o.symbol, tradeType:o.type, entryStr:o.entryStr, tpStr:o.tpStr||"–", slStr:o.slStr||"–", lot:o.lot, vol:o.vol });
            setTimeout(()=>setToast(p=>p?.type==="ENTRY_HIT"?null:p), 4000);
          } else {
            stillPending.push(o);
          }
        }
        return stillPending;
      });

      // ── Update P&L + auto-close on TP/SL ──
      setOpenTrades(prev => {
        const remaining = [];
        for (const t of prev) {
          const pip    = cur < 10 ? 0.0001 : cur < 200 ? 0.0001 : 1;
          const diff   = t.type==="BUY" ? cur - t.entryPrice : t.entryPrice - cur;
          const pips   = Math.round(diff / pip);
          const pipVal = LOT_SIZES.find(l=>l.label===t.lot)?.pip ?? 1;
          const pnl    = (diff/pip) * pipVal * t.vol * (t.symbol.includes("ZAR")?1:USD_TO_ZAR);
          const updated = { ...t, pnl, pips };

          const tpHit = t.tpPrice != null && (
            (t.type==="BUY"  && cur >= t.tpPrice) ||
            (t.type==="SELL" && cur <= t.tpPrice)
          );
          const slHit = t.slPrice != null && (
            (t.type==="BUY"  && cur <= t.slPrice) ||
            (t.type==="SELL" && cur >= t.slPrice)
          );

          if (tpHit || slHit) {
            const pip2   = t.tpPrice != null ? Math.abs(Math.round((t.tpPrice - t.entryPrice)/pip)) : Math.abs(Math.round((t.slPrice - t.entryPrice)/pip));
            const realPnl = tpHit ? Math.abs(pnl) : -Math.abs(pnl);
            setBalance(b => b + t.margin + realPnl);
            setResultToast({ id:Date.now(), hit:tpHit?"TP":"SL", pnl:realPnl, symbol:t.symbol, tradeType:t.type, pips:pip2 });
            setTimeout(()=>setResultToast(null), 5000);
          } else {
            remaining.push(updated);
          }
        }
        return remaining;
      });
    }, 600);
    return () => clearInterval(id);
  }, []);

  // Derived balances
  const totalPnl       = openTrades.reduce((s,t)=>s+t.pnl,0);
  const currentBalance = balance + totalPnl;

  // Formatters
  const balFmt = v => {
    const abs = Math.abs(v).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2});
    return (v<0?"−":"")+`ZAR ${abs}`;
  };
  const zarFmt = v => v!=null ? `ZAR ${Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}` : "ZAR 0,00";
  const priceFmt = v => {
    if (v==null) return "–";
    return livePrice>10000 ? v.toLocaleString("en-ZA",{minimumFractionDigits:2}) : livePrice>100 ? v.toFixed(2) : v.toFixed(4);
  };

  // Pip / ZAR calc for display
  const calcPips = (a, b) => {
    if (a==null||b==null||!lotSize) return null;
    const diff = Math.abs(a-b); if (!diff) return null;
    const pip  = livePrice<10 ? 0.0001 : livePrice<200 ? 0.0001 : 1;
    const pips = diff/pip;
    const zar  = pips*lotSize.pip*volume*(symbol.includes("ZAR")?1:USD_TO_ZAR);
    return { pips:Math.round(pips), zar };
  };
  const profitCalc = calcPips(entry, takeProfit);
  const lossCalc   = calcPips(entry, stopLoss);

  const tradeDirection = entry!=null&&takeProfit!=null ? (takeProfit>entry?"BUY":"SELL") : null;
  const canBuy  = tradeDirection===null||tradeDirection==="BUY";
  const canSell = tradeDirection===null||tradeDirection==="SELL";

  const resetOrder = () => { setEntry(null); setTakeProfit(null); setStopLoss(null); setLotSize(null); setVolume(1); };

  // Close one or all active trades — realise P&L back into balance
  const handleCloseTrade = (idOrAll) => {
    // Cancel pending orders too
    setPendingOrders(prev => {
      const toCancel = idOrAll==="all" ? prev : prev.filter(o=>o.id===idOrAll);
      const margin   = toCancel.reduce((s,o)=>s+o.margin,0);
      if (margin>0) setBalance(b => b + margin);
      return idOrAll==="all" ? [] : prev.filter(o=>o.id!==idOrAll);
    });
    // Close active trades
    setOpenTrades(prev => {
      const toClose  = idOrAll==="all" ? prev : prev.filter(t=>t.id===idOrAll);
      const realised = toClose.reduce((s,t)=>s+t.pnl,0);
      const margin   = toClose.reduce((s,t)=>s+t.margin,0);
      setBalance(b => b + margin + realised);
      return idOrAll==="all" ? [] : prev.filter(t=>t.id!==idOrAll);
    });
  };

  // Place a limit order — waits for market to reach entry price
  const handleTrade = type => {
    if (type==="BUY"&&!canBuy)   return;
    if (type==="SELL"&&!canSell) return;

    if (balance <= 0) {
      setToast({type:"NOFUNDS", id:Date.now()});
      setTimeout(()=>setToast(null),3000);
      return;
    }

    const id     = Date.now();
    const lot    = lotSize?.label ?? "Mini";
    const vol    = volume;
    const pipVal = LOT_SIZES.find(l=>l.label===lot)?.pip ?? 1;
    const margin = Math.max(50, pipVal * vol * 20);
    const cur    = livePriceRef.current;
    // If no entry set, place entry slightly ahead of current price in trade direction
    const dec    = cur > 10000 ? 2 : cur > 100 ? 2 : 4;
    const defaultEntry = type==="BUY"
      ? parseFloat((cur * 1.002).toFixed(dec))   // BUY stop: slightly above current
      : parseFloat((cur * 0.998).toFixed(dec));   // SELL stop: slightly below current
    const entryP = entry ?? defaultEntry;
    const tpP    = takeProfit;
    const slP    = stopLoss;

    const order = {
      id, type, symbol, lot, vol, margin,
      entryPrice:    entryP,
      placedAtPrice: cur,
      entryStr:   priceFmt(entryP),
      tpStr:      tpP!=null ? priceFmt(tpP) : null,
      slStr:      slP!=null ? priceFmt(slP) : null,
      tpPrice: tpP, slPrice: slP,
      time: new Date().toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"}),
      pnl: 0, pips: 0, status:"pending",
    };

    setPendingOrders(prev=>[...prev, order]);
    setBalance(b => b - margin);
    setToast({ type:"PENDING", id, symbol, tradeType:type, entryStr:order.entryStr, tpStr:order.tpStr||"–", slStr:order.slStr||"–", lot, vol });
    setTimeout(()=>setToast(p=>p?.id===id?null:p), 4000);
    resetOrder();
  };

  const handlePeterApply = (rec) => {
    const BASE = {"BTC/USD":68420,"ETH/USD":3821,"SOL/USD":182,"XRP/USD":0.62,"USD/ZAR":18021,"EUR/USD":1.08,"GBP/USD":1.27,"USD/JPY":149,"APPLE":189,"TESLA":248,"NVIDIA":875,"AMAZON":182};
    const bp  = BASE[rec.recommendedSymbol] ?? livePrice;
    const dec = bp>100?2:4;
    const snap = v => parseFloat(Number(v).toFixed(dec));
    peterApplyingRef.current = true;
    if (rec.recommendedMarket) setMarket(rec.recommendedMarket);
    if (rec.recommendedSymbol) setSymbol(rec.recommendedSymbol);
    setTimeout(()=>{
      peterApplyingRef.current = false;
      if (rec.entry)      setEntry(snap(rec.entry));
      if (rec.takeProfit) setTakeProfit(snap(rec.takeProfit));
      if (rec.stopLoss)   setStopLoss(snap(rec.stopLoss));
      const found = LOT_SIZES.find(l=>l.label===rec.lotSize);
      if (found) setLotSize(found);
      if (rec.volume) setVolume(Number(rec.volume));
    }, 80);
  };

  const changeMarket = m => { if(peterApplyingRef.current)return; setMarket(m); setSymbol(SYMBOLS[m][0]); setMarketOpen(false); setSymbolOpen(false); resetOrder(); };
  const changeSymbol = s => { if(peterApplyingRef.current)return; setSymbol(s); setSymbolOpen(false); resetOrder(); };

  const handleLineBtn = key => {
    const dec = livePrice>100?2:4;
    const mid = livePrice;
    const snap = v => parseFloat(v.toFixed(dec));
    if (key==="entry") setEntry(e  => e!=null?null:snap(mid));
    if (key==="tp")    setTakeProfit(t=>t!=null?null:snap(mid*1.003));
    if (key==="sl")    setStopLoss(s =>s!=null?null:snap(mid*0.997));
  };

  const dropStyle = open => ({
    width:"100%",background:C.panel,border:`1px solid ${open?C.borderBright:C.border}`,
    color:C.balVal,padding:"7px 10px",cursor:"pointer",
    borderRadius:open?"4px 4px 0 0":"4px",
    display:"flex",justifyContent:"space-between",alignItems:"center",
    fontSize:"11px",fontFamily:"inherit",letterSpacing:"1px",
  });

  const lineButtons = [
    { key:"entry", label:"ENTRY",       color:C.entryCol, val:entry      },
    { key:"tp",    label:"TAKE PROFIT", color:C.tpCol,    val:takeProfit },
    { key:"sl",    label:"STOP LOSS",   color:C.slCol,    val:stopLoss   },
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",justifyContent:"center",fontFamily:"'Courier New',monospace"}}>
      <div style={{width:"100%",maxWidth:"420px",minHeight:"100vh",background:`linear-gradient(180deg,${C.panel} 0%,${C.bg} 100%)`,position:"relative"}}>

        {/* Scanlines */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0,
          backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(167,139,250,0.008) 2px,rgba(167,139,250,0.008) 4px)"}}/>

        {/* ── Toast ── */}
        {toast && (
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:150,width:"90%",maxWidth:280,pointerEvents:"none"}}>
            <style>{`
              @keyframes toastIn{from{opacity:0;transform:translate(-50%,-46%) scale(0.9)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
              @keyframes shrink4{from{width:100%}to{width:0%}}
            `}</style>
            {toast.type==="NOFUNDS" ? (
              <div style={{pointerEvents:"all",background:"linear-gradient(135deg,#180606,#2d0a0a)",border:"2px solid #ef4444",
                borderRadius:14,padding:"20px 24px",textAlign:"center",animation:"toastIn 0.25s ease-out",
                boxShadow:"0 0 40px #ef444433"}}>
                <div style={{fontSize:28,marginBottom:8}}>💸</div>
                <div style={{color:"#f87171",fontSize:13,fontWeight:"bold",letterSpacing:2,marginBottom:6}}>NO FUNDS</div>
                <div style={{color:"#c0a0a0",fontSize:10,marginBottom:14,lineHeight:1.6}}>
                  Deposit to start trading simulations
                </div>
                <button onClick={()=>{setToast(null);setShowWallet(true);}} style={{
                  pointerEvents:"all",background:"linear-gradient(135deg,#06101a,#0a2040)",
                  border:"1.5px solid #38bdf8",color:"#38bdf8",
                  padding:"8px 20px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:"bold",letterSpacing:2}}>
                  ⬡ OPEN WALLET
                </button>
              </div>
            ) : toast.type==="PENDING" ? (
              <div style={{background:"linear-gradient(135deg,#0a0820,#120a30)",
                border:"2px solid #a78bfa",borderRadius:14,padding:"22px 28px",textAlign:"center",
                boxShadow:"0 0 50px #a78bfa33",animation:"toastIn 0.25s ease-out"}}>
                <div style={{fontSize:22,marginBottom:6}}>⏳</div>
                <div style={{color:"#a78bfa",fontSize:13,fontWeight:"bold",letterSpacing:2,marginBottom:4}}>
                  ORDER PENDING
                </div>
                <div style={{color:"#6060a0",fontSize:9,letterSpacing:2,marginBottom:10}}>WAITING FOR MARKET TO REACH ENTRY</div>
                <div style={{width:"100%",height:1,background:"#a78bfa33",margin:"6px 0"}}/>
                <div style={{fontSize:9,lineHeight:2.1,letterSpacing:1}}>
                  <div style={{color:C.label}}>{toast.symbol} · {toast.lot} × Vol {toast.vol}</div>
                  <div style={{color:toast.tradeType==="BUY"?C.buyText:C.sellText,fontWeight:"bold"}}>
                    {toast.tradeType==="BUY"?"▲ BUY":"▼ SELL"}
                  </div>
                  <div style={{color:C.entryCol}}>ENTRY &nbsp;{toast.entryStr}</div>
                  <div style={{color:C.tpCol}}>TP &nbsp;&nbsp;&nbsp;&nbsp;{toast.tpStr}</div>
                  <div style={{color:C.slCol}}>SL &nbsp;&nbsp;&nbsp;&nbsp;{toast.slStr}</div>
                </div>
                <div style={{marginTop:12,overflow:"hidden",borderRadius:2,height:3,background:"#a78bfa22"}}>
                  <div style={{height:"100%",background:"#a78bfa",animation:"shrink4 4s linear forwards"}}/>
                </div>
              </div>
            ) : toast.type==="ENTRY_HIT" ? (
              <div style={{background:"linear-gradient(135deg,#030f18,#061a30)",
                border:"2px solid #38bdf8",borderRadius:14,padding:"22px 28px",textAlign:"center",
                boxShadow:"0 0 50px #38bdf844",animation:"toastIn 0.25s ease-out"}}>
                <div style={{fontSize:26,marginBottom:6}}>🚀</div>
                <div style={{color:"#38bdf8",fontSize:13,fontWeight:"bold",letterSpacing:2,marginBottom:4}}>
                  TRADE ACTIVATED
                </div>
                <div style={{color:"#4080a0",fontSize:9,letterSpacing:2,marginBottom:10}}>MARKET REACHED YOUR ENTRY</div>
                <div style={{width:"100%",height:1,background:"#38bdf833",margin:"6px 0"}}/>
                <div style={{fontSize:9,lineHeight:2.1,letterSpacing:1}}>
                  <div style={{color:C.label}}>{toast.symbol} · {toast.lot} × Vol {toast.vol}</div>
                  <div style={{color:toast.tradeType==="BUY"?C.buyText:C.sellText,fontWeight:"bold"}}>
                    {toast.tradeType==="BUY"?"▲ BUY":"▼ SELL"} · NOW IN POSITION
                  </div>
                  <div style={{color:C.entryCol}}>ENTRY &nbsp;{toast.entryStr}</div>
                  <div style={{color:C.tpCol}}>TP &nbsp;&nbsp;&nbsp;&nbsp;{toast.tpStr}</div>
                  <div style={{color:C.slCol}}>SL &nbsp;&nbsp;&nbsp;&nbsp;{toast.slStr}</div>
                </div>
                <div style={{marginTop:12,overflow:"hidden",borderRadius:2,height:3,background:"#38bdf822"}}>
                  <div style={{height:"100%",background:"#38bdf8",animation:"shrink4 4s linear forwards"}}/>
                </div>
              </div>
            ) : (
              <div style={{background:toast.tradeType==="BUY"||toast.type==="BUY"?"linear-gradient(135deg,#030f07,#051a0c)":"linear-gradient(135deg,#0f0303,#1a0505)",
                border:`2px solid ${toast.tradeType==="BUY"||toast.type==="BUY"?C.buyBorder:C.sellBorder}`,
                borderRadius:14,padding:"22px 28px",textAlign:"center",
                boxShadow:toast.tradeType==="BUY"||toast.type==="BUY"?`0 0 50px ${C.buyBorder}44`:`0 0 50px ${C.sellBorder}44`,
                animation:"toastIn 0.25s ease-out"}}>
                <div style={{fontSize:22,fontWeight:"bold",letterSpacing:4,color:toast.tradeType==="BUY"||toast.type==="BUY"?C.buyText:C.sellText,marginBottom:6}}>
                  {toast.tradeType==="BUY"||toast.type==="BUY"?"▲ BUY":"▼ SELL"}
                </div>
                <div style={{color:"#ffffff80",fontSize:9,letterSpacing:3,marginBottom:10}}>POSITION OPENED</div>
                <div style={{width:"100%",height:1,background:toast.tradeType==="BUY"||toast.type==="BUY"?C.buyBorder+"33":C.sellBorder+"33",margin:"6px 0"}}/>
                <div style={{fontSize:9,lineHeight:2.1,letterSpacing:1}}>
                  <div style={{color:C.label}}>{symbol} · {toast.lot} × Vol {toast.vol}</div>
                  <div style={{color:C.entryCol}}>ENTRY &nbsp;{toast.entryStr}</div>
                  <div style={{color:C.tpCol}}>TP &nbsp;&nbsp;&nbsp;&nbsp;{toast.tpStr}</div>
                  <div style={{color:C.slCol}}>SL &nbsp;&nbsp;&nbsp;&nbsp;{toast.slStr}</div>
                </div>
                <div style={{marginTop:12,overflow:"hidden",borderRadius:2,height:3,background:toast.tradeType==="BUY"||toast.type==="BUY"?C.buyBorder+"22":C.sellBorder+"22"}}>
                  <div style={{height:"100%",background:toast.tradeType==="BUY"||toast.type==="BUY"?C.buyBorder:C.sellBorder,animation:"shrink4 4s linear forwards"}}/>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Result Toast (TP / SL hit) ── */}
        {resultToast && (
          <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",zIndex:160,width:"92%",maxWidth:360,padding:"12px 0 0",pointerEvents:"none"}}>
            <style>{`
              @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
              @keyframes shrink5{from{width:100%}to{width:0%}}
            `}</style>
            <div style={{
              background: resultToast.hit==="TP"
                ? "linear-gradient(135deg,#011a0a,#032e14)"
                : "linear-gradient(135deg,#1a0101,#2e0808)",
              border:`2px solid ${resultToast.hit==="TP"?"#22c55e":"#ef4444"}`,
              borderRadius:14,padding:"18px 22px",
              boxShadow: resultToast.hit==="TP" ? "0 0 50px #22c55e44" : "0 0 50px #ef444444",
              animation:"slideDown 0.3s ease-out",
            }}>
              {/* Icon + title */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <div style={{
                  width:44,height:44,borderRadius:"50%",flexShrink:0,
                  background: resultToast.hit==="TP" ? "#22c55e22" : "#ef444422",
                  border:`2px solid ${resultToast.hit==="TP"?"#22c55e":"#ef4444"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,
                }}>{resultToast.hit==="TP" ? "🎯" : "🛑"}</div>
                <div>
                  <div style={{color: resultToast.hit==="TP"?"#4ade80":"#f87171", fontSize:14,fontWeight:"bold",letterSpacing:2}}>
                    {resultToast.hit==="TP" ? "TAKE PROFIT HIT" : "STOP LOSS HIT"}
                  </div>
                  <div style={{color:"#6060a0",fontSize:9,letterSpacing:1,marginTop:2}}>
                    {resultToast.tradeType} · {resultToast.symbol}
                  </div>
                </div>
              </div>

              {/* P&L display */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                background: resultToast.hit==="TP" ? "#022010" : "#1a0505",
                borderRadius:8,padding:"10px 14px",marginBottom:10}}>
                <div>
                  <div style={{color:"#5050a0",fontSize:8,letterSpacing:2,marginBottom:3}}>
                    {resultToast.hit==="TP" ? "PROFIT REALISED" : "LOSS REALISED"}
                  </div>
                  <div style={{color: resultToast.pnl>=0?"#4ade80":"#f87171", fontSize:22,fontWeight:"bold",letterSpacing:1}}>
                    {resultToast.pnl>=0?"+":""}{Math.abs(resultToast.pnl).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})} ZAR
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{color:"#5050a0",fontSize:8,letterSpacing:1,marginBottom:3}}>PIPS</div>
                  <div style={{color: resultToast.pnl>=0?"#4ade80":"#f87171",fontSize:18,fontWeight:"bold"}}>
                    {resultToast.pnl>=0?"+":"-"}{resultToast.pips}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{overflow:"hidden",borderRadius:2,height:3,background: resultToast.hit==="TP"?"#22c55e22":"#ef444422"}}>
                <div style={{height:"100%",background:resultToast.hit==="TP"?"#22c55e":"#ef4444",animation:"shrink5 5s linear forwards"}}/>
              </div>
            </div>
          </div>
        )}
        {showWallet && (
          <WalletModal balance={balance} openTrades={openTrades}
            onDeposit={async n => { await walletAPI.deposit(n); const r = await walletAPI.get(); setBalance(parseFloat(r.data.available_balance)); }}
            onWithdraw={async n => { await walletAPI.withdraw(n); const r = await walletAPI.get(); setBalance(parseFloat(r.data.available_balance)); }}
            onCloseAll={handleCloseTrade}
            onClose={()=>setShowWallet(false)}/>
        )}
        {showPeter && (
          <PeterModal onClose={()=>setShowPeter(false)} onApply={handlePeterApply}
            livePrice={livePrice} symbol={symbol} market={market}
            usageCount={peterUsage} onUseRequest={()=>setPeterUsage(n=>n+1)}/>
        )}

        <div style={{position:"relative",zIndex:1}}>

          {/* ① Balance row */}
          <div style={{padding:"12px 16px 10px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              {/* eQual wordmark — top left */}
              <div style={{marginBottom:8}}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 44" width="96" height="26">
                  <defs>
                    <linearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="1"/>
                      <stop offset="100%" stopColor="#0ea5c8" stopOpacity="1"/>
                    </linearGradient>
                    <linearGradient id="dotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#facc15" stopOpacity="1"/>
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
                  <text x="2" y="34" fontFamily="Georgia,'Times New Roman',serif" fontSize="36" fontWeight="400" fontStyle="italic" fill="url(#eGrad)" filter="url(#eGlow)" letterSpacing="-1">e</text>
                  <text x="24" y="34" fontFamily="Georgia,'Times New Roman',serif" fontSize="36" fontWeight="700" fill="#e8e8ff" letterSpacing="-1">Q</text>
                  <text x="55" y="34" fontFamily="Georgia,'Times New Roman',serif" fontSize="36" fontWeight="400" fill="#c8c8ee" letterSpacing="-0.5">ual</text>
                  <circle cx="51" cy="38" r="3.5" fill="url(#dotGrad)" filter="url(#dotGlow)"/>
                  <line x1="2" y1="38.5" x2="22" y2="38.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                </svg>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:C.balLabel,fontSize:10,letterSpacing:1}}>ACCOUNT BALANCE</span>
                <span style={{color:C.balVal,fontSize:13,fontWeight:"bold",letterSpacing:1}}>
                  {balance>0 ? balFmt(balance) : <span style={{color:"#4a4a78"}}>ZAR 0,00</span>}
                </span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:C.balLabel,fontSize:10,letterSpacing:1}}>CURRENT BALANCE</span>
                <span style={{color:currentBalance>balance?"#4ade80":currentBalance<balance?"#f87171":C.balVal,fontSize:13,fontWeight:"bold",letterSpacing:1}}>
                  {balance>0 ? balFmt(currentBalance) : <span style={{color:"#4a4a78"}}>ZAR 0,00</span>}
                </span>
              </div>
            </div>
            {/* Peter AI button */}
            <button onClick={()=>setShowPeter(true)} style={{
              width:42,height:42,borderRadius:"50%",flexShrink:0,
              background:"linear-gradient(135deg,#3b0764,#6d28d9)",
              border:"2px solid #a78bfa",color:"#ddd6fe",
              fontSize:11,fontWeight:"bold",letterSpacing:1,cursor:"pointer",fontFamily:"inherit",
              boxShadow:"0 0 18px #7c3aed55",display:"flex",alignItems:"center",justifyContent:"center",
            }}>AI</button>
          </div>

          {/* Positions strip — pending + active */}
          {(openTrades.length > 0 || pendingOrders.length > 0) && (
            <div style={{background:"#06060f",borderBottom:`1px solid ${C.border}`,padding:"6px 16px",display:"flex",gap:8,overflowX:"auto"}}>
              {pendingOrders.map(o=>(
                <div key={o.id} onClick={()=>setShowWallet(true)} style={{
                  flexShrink:0,display:"flex",alignItems:"center",gap:6,
                  background:"#0d0820",border:"1px solid #a78bfa44",
                  borderRadius:6,padding:"5px 10px",cursor:"pointer",
                }}>
                  <span style={{color:"#a78bfa",fontSize:9}}>⏳</span>
                  <span style={{color:o.type==="BUY"?"#4ade80":"#f87171",fontSize:9,fontWeight:"bold"}}>{o.type==="BUY"?"▲":"▼"}</span>
                  <span style={{color:"#7070a8",fontSize:9}}>{o.symbol}</span>
                  <span style={{color:"#6060a0",fontSize:8,letterSpacing:1}}>PENDING</span>
                </div>
              ))}
              {openTrades.map(t=>(
                <div key={t.id} onClick={()=>setShowWallet(true)} style={{
                  flexShrink:0,display:"flex",alignItems:"center",gap:6,
                  background:"#0a0a1e",border:`1px solid ${t.pnl>=0?"#22c55e33":"#ef444433"}`,
                  borderRadius:6,padding:"5px 10px",cursor:"pointer",
                }}>
                  <span style={{color:t.type==="BUY"?"#4ade80":"#f87171",fontSize:9,fontWeight:"bold"}}>{t.type==="BUY"?"▲":"▼"}</span>
                  <span style={{color:"#a78bfa",fontSize:9}}>{t.symbol}</span>
                  <span style={{color:t.pnl>=0?"#4ade80":"#f87171",fontSize:9,fontWeight:"bold"}}>
                    {t.pnl>=0?"+":""}{t.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ② Market + Symbol */}
          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:12 }}>
            {[
              { label:"MARKET", open:marketOpen, toggle:()=>{setMarketOpen(o=>!o);setSymbolOpen(false)}, val:market, opts:Object.keys(SYMBOLS), onSelect:changeMarket },
              { label:"SYMBOL", open:symbolOpen, toggle:()=>{setSymbolOpen(o=>!o);setMarketOpen(false)}, val:symbol, opts:SYMBOLS[market], onSelect:changeSymbol },
            ].map(dd => (
              <div key={dd.label} style={{ flex:1, position:"relative" }}>
                <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2, marginBottom:3 }}>{dd.label}</div>
                <button onClick={dd.toggle} style={dropStyle(dd.open)}>
                  {dd.val} <span style={{ fontSize:7, opacity:0.6 }}>▼</span>
                </button>
                {dd.open && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:30, background:C.panel, border:`1px solid ${C.borderBright}`, borderTop:"none", borderRadius:"0 0 4px 4px" }}>
                    {dd.opts.map(opt => (
                      <div key={opt} onClick={()=>dd.onSelect(opt)}
                        style={{ padding:"7px 10px", color:opt===dd.val?C.symbolCol:C.label, cursor:"pointer", fontSize:10, letterSpacing:1, borderBottom:`1px solid ${C.border}` }}
                        onMouseEnter={e=>e.currentTarget.style.background="#16162a"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >{opt}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ③ Chart */}
          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ color:C.symbolCol, fontSize:13, fontWeight:"bold", letterSpacing:2 }}>{symbol}</span>
              <span style={{ color:C.priceCol,  fontSize:16, fontWeight:"bold", fontVariantNumeric:"tabular-nums" }}>
                {livePrice.toLocaleString("en-ZA",{ minimumFractionDigits:2, maximumFractionDigits:livePrice>100?2:4 })}
              </span>
            </div>
            <CandleChart
              symbol={symbol} livePrice={livePrice}
              entry={entry} takeProfit={takeProfit} stopLoss={stopLoss}
              onEntry={setEntry} onTP={setTakeProfit} onSL={setStopLoss}
              openTrades={openTrades}
              pendingOrders={pendingOrders}
            />
          </div>

          {/* ④ Lot Size */}
          <div style={{ padding:"8px 16px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2, marginBottom:5 }}>LOT SIZE</div>
            <div style={{ display:"flex", gap:6 }}>
              {LOT_SIZES.map(ls => {
                const sel = lotSize?.label===ls.label;
                return (
                  <button key={ls.label} onClick={()=>setLotSize(ls)} style={{
                    flex:1, padding:"5px 3px",
                    background: sel?"#1a0a3a":"#0a0a18",
                    border:`1.5px solid ${sel?C.lotSelBorder:C.border}`,
                    borderRadius:5, cursor:"pointer",
                    color:sel?C.lotSelText:C.label,
                    fontFamily:"inherit", transition:"all 0.15s",
                  }}>
                    <div style={{ fontSize:9, fontWeight:"bold", letterSpacing:1 }}>{ls.label}</div>
                    <div style={{ fontSize:8, marginTop:1, opacity:0.65 }}>{ls.sublabel}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ⑤ Volume */}
          <div style={{ padding:"8px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2 }}>VOLUME</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={()=>setVolume(v=>Math.max(1,v-1))} style={{ background:"#0a0a18", border:`1px solid ${C.border}`, color:C.volText, width:26, height:26, borderRadius:4, cursor:"pointer", fontSize:15, fontFamily:"inherit" }}>−</button>
              <div style={{ background:"#0a0a18", border:`1px solid ${C.volBorder}`, color:C.volText, padding:"3px 16px", borderRadius:4, fontSize:13, fontWeight:"bold", minWidth:32, textAlign:"center" }}>{volume}</div>
              <button onClick={()=>setVolume(v=>Math.min(100,v+1))} style={{ background:"#0a0a18", border:`1px solid ${C.border}`, color:C.volText, width:26, height:26, borderRadius:4, cursor:"pointer", fontSize:15, fontFamily:"inherit" }}>+</button>
            </div>
          </div>

          {/* ⑥ Set Levels */}
          <div style={{ padding:"8px 16px", borderBottom:`1px solid ${C.border}`, background:C.setLvlBg }}>
            <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2, marginBottom:6 }}>SET LEVELS</div>
            <div style={{ display:"flex", gap:8 }}>
              {lineButtons.map(b => (
                <button key={b.key} onClick={()=>handleLineBtn(b.key)} style={{
                  flex:1, padding:"8px 4px",
                  background:   b.val!=null ? b.color+"18" : "#0d0d1f",
                  border:      `1.5px solid ${b.val!=null ? b.color : b.color+"30"}`,
                  color:        b.val!=null ? b.color : b.color+"50",
                  borderRadius:5, cursor:"pointer", fontFamily:"inherit",
                  fontSize:8, letterSpacing:"0.5px", transition:"all 0.15s",
                  fontWeight:b.val!=null?"bold":"normal",
                }}>
                  <div style={{ fontSize:11, marginBottom:2 }}>{b.val!=null?"✕":"+"}</div>
                  {b.label}
                </button>
              ))}
            </div>
            <div style={{ color:C.labelDim, fontSize:7, textAlign:"center", marginTop:5, letterSpacing:1 }}>
              TAP TO PLACE IN CHART CENTRE · DRAG LINE TO ADJUST
            </div>
          </div>

          {/* ⑦ Values */}
          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4 }}>
              <div>
                <div style={{ color:C.labelDim, fontSize:"7.5px", letterSpacing:1, marginBottom:3 }}>ENTRY</div>
                <div style={{ color:entry!=null?C.entryCol:"#1e1e40", fontSize:12, fontWeight:"bold" }}>{priceFmt(entry)}</div>
              </div>
              <div>
                <div style={{ color:C.labelDim, fontSize:"7.5px", letterSpacing:1, marginBottom:3 }}>TAKE PROFIT</div>
                <div style={{ color:takeProfit!=null?C.tpCol:"#1a2e1a", fontSize:12, fontWeight:"bold" }}>{priceFmt(takeProfit)}</div>
                {profitCalc
                  ? <><div style={{ color:C.tpCol+"88", fontSize:8, marginTop:2 }}>+{profitCalc.pips} pips</div>
                      <div style={{ color:C.tpCol, fontSize:11, fontWeight:"bold", marginTop:1 }}>{zarFmt(profitCalc.zar)}</div></>
                  : <div style={{ color:C.labelDim, fontSize:10, marginTop:2 }}>ZAR 0,00</div>
                }
              </div>
              <div>
                <div style={{ color:C.labelDim, fontSize:"7.5px", letterSpacing:1, marginBottom:3 }}>STOP LOSS</div>
                <div style={{ color:stopLoss!=null?C.slCol:"#2e1a1a", fontSize:12, fontWeight:"bold" }}>{priceFmt(stopLoss)}</div>
                {lossCalc
                  ? <><div style={{ color:C.slCol+"88", fontSize:8, marginTop:2 }}>-{lossCalc.pips} pips</div>
                      <div style={{ color:C.slCol, fontSize:11, fontWeight:"bold", marginTop:1 }}>-{zarFmt(lossCalc.zar)}</div></>
                  : <div style={{ color:C.labelDim, fontSize:10, marginTop:2 }}>ZAR 0,00</div>
                }
              </div>
            </div>
          </div>

          {/* ⑧ BUY / SELL */}
          <div style={{ padding:"12px 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <button onClick={()=>handleTrade("BUY")} disabled={!canBuy} style={{
              background:canBuy?C.buyBg:"#0a0a0a", border:`2px solid ${canBuy?C.buyBorder:"#1a2a1a"}`,
              color:canBuy?C.buyText:"#2a3a2a", padding:13, borderRadius:6,
              cursor:canBuy?"pointer":"not-allowed", fontFamily:"inherit", fontSize:15, fontWeight:"bold", letterSpacing:3,
              boxShadow:canBuy?`0 0 18px ${C.buyBorder}25`:"none", opacity:canBuy?1:0.3, transition:"all 0.2s",
            }}>▲ BUY</button>
            <button onClick={()=>handleTrade("SELL")} disabled={!canSell} style={{
              background:canSell?C.sellBg:"#0a0a0a", border:`2px solid ${canSell?C.sellBorder:"#2a1a1a"}`,
              color:canSell?C.sellText:"#3a2a2a", padding:13, borderRadius:6,
              cursor:canSell?"pointer":"not-allowed", fontFamily:"inherit", fontSize:15, fontWeight:"bold", letterSpacing:3,
              boxShadow:canSell?`0 0 18px ${C.sellBorder}25`:"none", opacity:canSell?1:0.3, transition:"all 0.2s",
            }}>▼ SELL</button>
          </div>

          {tradeDirection && (
            <div style={{ padding:"2px 16px 8px", textAlign:"center" }}>
              <span style={{ fontSize:8, letterSpacing:1, color:tradeDirection==="BUY"?C.buyText+"88":C.sellText+"88" }}>
                {tradeDirection==="BUY"?"▲ TP ABOVE ENTRY — BUY DIRECTION":"▼ TP BELOW ENTRY — SELL DIRECTION"}
              </span>
            </div>
          )}


          {/* ⑨ Wallet Bar */}
          <div style={{ borderTop:`1px solid ${C.border}`, padding:"14px 16px" }}>
            <button onClick={()=>setShowWallet(true)} style={{
              width:"100%", padding:"14px 20px", borderRadius:10, cursor:"pointer",
              background: balance>0
                ? "linear-gradient(135deg,#061426,#082040)"
                : "linear-gradient(135deg,#140e04,#201a04)",
              border:`2px solid ${balance>0?"#38bdf8":"#facc15"}`,
              fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"space-between",
              boxShadow:`0 0 22px ${balance>0?"#38bdf822":"#facc1522"}`,
              transition:"all 0.2s",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:20, color:balance>0?"#38bdf8":"#facc15" }}>⬡</span>
                <div style={{ textAlign:"left" }}>
                  <div style={{ color:balance>0?"#38bdf8":"#facc15", fontSize:11, fontWeight:"bold", letterSpacing:2 }}>
                    {balance>0 ? "WALLET" : "⬡ DEPOSIT TO TRADE"}
                  </div>
                  <div style={{ color:balance>0?"#5090b8":"#8a7040", fontSize:9, marginTop:2, letterSpacing:1 }}>
                    {balance>0 ? `${openTrades.length} open position${openTrades.length!==1?"s":""}` : "Tap to add simulation funds"}
                  </div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ color:balance>0?"#c8e8ff":"#c8a840", fontSize:13, fontWeight:"bold", letterSpacing:1 }}>
                  {balance>0 ? balFmt(currentBalance) : "ZAR 0,00"}
                </div>
                {balance>0 && totalPnl!==0 && (
                  <div style={{ color:totalPnl>=0?"#4ade80":"#f87171", fontSize:9, marginTop:2 }}>
                    {totalPnl>=0?"▲ +":"▼ "}{Math.abs(totalPnl).toFixed(2)} P&L
                  </div>
                )}
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
