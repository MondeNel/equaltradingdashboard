import { useState } from "react";

export default function WalletModal({ balance, openTrades, onDeposit, onWithdraw, onClose, onCloseAll }) {
  const [tab,      setTab]      = useState("overview");
  const [amount,   setAmount]   = useState("");
  const [feedback, setFeedback] = useState(null);
  const [txHistory,setTxHistory]= useState([
    { id:1, type:"DEPOSIT", amount:5000, date:"2026-03-01", note:"Starter deposit" },
  ]);

  const totalPnl   = openTrades.reduce((s,t)=>s+t.pnl,0);
  const currentBal = balance + totalPnl;
  const QUICK = [500,1000,2500,5000,10000];

  const fmt = v => {
    const abs = Math.abs(v).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2});
    return (v<0?"−":"")+`ZAR ${abs}`;
  };

  const doDeposit = () => {
    const n = parseFloat(amount);
    if (!n||n<=0)  { setFeedback({ok:false,msg:"Enter a valid amount"}); return; }
    if (n < 100)   { setFeedback({ok:false,msg:"Minimum deposit is ZAR 100"}); return; }
    onDeposit(n);
    setTxHistory(h=>[{id:Date.now(),type:"DEPOSIT",amount:n,date:new Date().toISOString().slice(0,10),note:"Manual deposit"},...h]);
    setFeedback({ok:true,msg:`ZAR ${n.toLocaleString()} deposited!`});
    setAmount("");
    setTimeout(()=>setFeedback(null),3000);
  };

  const doWithdraw = () => {
    const n = parseFloat(amount);
    if (!n||n<=0)          { setFeedback({ok:false,msg:"Enter a valid amount"}); return; }
    if (n>balance)         { setFeedback({ok:false,msg:"Insufficient available balance"}); return; }
    if (n<100)             { setFeedback({ok:false,msg:"Minimum withdrawal is ZAR 100"}); return; }
    if (openTrades.length) { setFeedback({ok:false,msg:"Close open trades before withdrawing"}); return; }
    onWithdraw(n);
    setTxHistory(h=>[{id:Date.now(),type:"WITHDRAW",amount:n,date:new Date().toISOString().slice(0,10),note:"Manual withdrawal"},...h]);
    setFeedback({ok:true,msg:`ZAR ${n.toLocaleString()} withdrawn!`});
    setAmount("");
    setTimeout(()=>setFeedback(null),3000);
  };

  const AmtInput = null; // replaced inline below

  const TabBtn = ({id,icon,label}) => (
    <button onClick={()=>{setTab(id);setFeedback(null);setAmount("");}} style={{
      flex:1,padding:"11px 2px",background:tab===id?"#0d0d28":"transparent",
      border:"none",borderBottom:`2px solid ${tab===id?"#38bdf8":"transparent"}`,
      color:tab===id?"#38bdf8":"#4a4a7a",fontFamily:"inherit",fontSize:9,
      fontWeight:"bold",letterSpacing:1,cursor:"pointer",transition:"all 0.15s",
    }}>{icon}<br/>{label}</button>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:250,background:"rgba(1,1,8,0.93)",backdropFilter:"blur(6px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:12}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <style>{`
        @keyframes wIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseTeal{0%,100%{box-shadow:0 0 12px #38bdf833}50%{box-shadow:0 0 26px #38bdf866}}
      `}</style>
      <div style={{width:"100%",maxWidth:"390px",maxHeight:"91vh",overflowY:"auto",
        background:"linear-gradient(160deg,#08091a,#0c0a22)",border:"1.5px solid #1c1c44",
        borderRadius:18,fontFamily:"'Courier New',monospace",boxShadow:"0 0 80px #38bdf818",
        animation:"wIn 0.27s ease-out"}}>

        {/* Header */}
        <div style={{padding:"20px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#38bdf8",fontSize:15,fontWeight:"bold",letterSpacing:3}}>⬡ WALLET</div>
            <div style={{color:"#4a4a7a",fontSize:8,letterSpacing:2,marginTop:2}}>SIMULATION ACCOUNT</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#5a5a80",fontSize:18,cursor:"pointer",padding:"4px 8px"}}>✕</button>
        </div>

        {/* Balance cards */}
        <div style={{padding:"16px 20px 10px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{background:"#06060f",border:"1px solid #1a1a38",borderRadius:10,padding:"12px"}}>
            <div style={{color:"#4a4a7a",fontSize:8,letterSpacing:2,marginBottom:5}}>DEPOSITED</div>
            <div style={{color:"#c8c8ff",fontSize:14,fontWeight:"bold",letterSpacing:1}}>{fmt(balance)}</div>
            <div style={{color:"#2a2a50",fontSize:8,marginTop:4}}>Available funds</div>
          </div>
          <div style={{background:"#06060f",border:`1px solid ${totalPnl>=0?"#22c55e28":"#ef444428"}`,borderRadius:10,padding:"12px"}}>
            <div style={{color:"#4a4a7a",fontSize:8,letterSpacing:2,marginBottom:5}}>UNREALISED P&L</div>
            <div style={{color:totalPnl>=0?"#4ade80":"#f87171",fontSize:14,fontWeight:"bold",letterSpacing:1}}>
              {totalPnl>=0?"+":""}{fmt(totalPnl)}
            </div>
            <div style={{color:"#2a2a50",fontSize:8,marginTop:4}}>{openTrades.length} position{openTrades.length!==1?"s":""}</div>
          </div>
        </div>

        {/* Total equity */}
        <div style={{margin:"0 20px 4px",background:"linear-gradient(135deg,#0a1628,#081820)",
          border:"1px solid #1e3a4a",borderRadius:10,padding:"10px 16px",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:"#6070a0",fontSize:9,letterSpacing:2}}>TOTAL EQUITY</span>
          <span style={{color:"#facc15",fontSize:17,fontWeight:"bold"}}>{fmt(currentBal)}</span>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid #131330",margin:"10px 0 0"}}>
          <TabBtn id="overview" icon="◈" label="OVERVIEW"/>
          <TabBtn id="deposit"  icon="↓" label="DEPOSIT"/>
          <TabBtn id="withdraw" icon="↑" label="WITHDRAW"/>
          <TabBtn id="history"  icon="≡" label="HISTORY"/>
        </div>

        <div style={{padding:"18px 20px 26px"}}>

          {/* Feedback banner */}
          {feedback && (
            <div style={{marginBottom:14,padding:"10px 14px",borderRadius:8,
              background:feedback.ok?"#052e1618":"#2d0a0a18",
              border:`1px solid ${feedback.ok?"#22c55e":"#ef4444"}`,
              color:feedback.ok?"#4ade80":"#f87171",fontSize:10,letterSpacing:1}}>
              {feedback.ok?"✓":"✗"} {feedback.msg}
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {tab==="overview" && (
            <div>
              <div style={{color:"#6060a0",fontSize:8,letterSpacing:2,marginBottom:12}}>OPEN POSITIONS</div>

              {openTrades.length===0 ? (
                <div style={{textAlign:"center",padding:"28px 0",color:"#2a2a50",fontSize:10,letterSpacing:1,lineHeight:1.8}}>
                  No open positions<br/>
                  <span style={{fontSize:9,color:"#1a1a38"}}>Place a trade to start simulating</span>
                </div>
              ) : openTrades.map(t=>(
                <div key={t.id} style={{background:"#07071a",border:`1px solid ${t.type==="BUY"?"#22c55e20":"#ef444420"}`,borderRadius:10,padding:"11px 13px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{color:t.type==="BUY"?"#4ade80":"#f87171",fontSize:11,fontWeight:"bold",letterSpacing:1}}>{t.type==="BUY"?"▲":"▼"} {t.type}</span>
                      <span style={{color:"#a78bfa",fontSize:10,letterSpacing:1}}>{t.symbol}</span>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{color:t.pnl>=0?"#4ade80":"#f87171",fontSize:12,fontWeight:"bold"}}>
                        {t.pnl>=0?"+":""}{fmt(t.pnl)}
                      </div>
                      <div style={{color:t.pnl>=0?"#22c55e66":"#ef444466",fontSize:8}}>
                        {t.pips>=0?"+":""}{t.pips} pips
                      </div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,fontSize:8,marginBottom:6}}>
                    <div><span style={{color:"#2a2a50"}}>ENTRY </span><span style={{color:"#38bdf8"}}>{t.entryStr}</span></div>
                    <div><span style={{color:"#2a2a50"}}>TP </span><span style={{color:"#4ade80"}}>{t.tpStr||"–"}</span></div>
                    <div><span style={{color:"#2a2a50"}}>SL </span><span style={{color:"#f87171"}}>{t.slStr||"–"}</span></div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{color:"#2e2e58",fontSize:7.5}}>{t.lot} · Vol {t.vol} · {t.time}</span>
                    <button onClick={()=>onCloseAll(t.id)} style={{background:"#0f0f28",border:"1px solid #3a2a60",color:"#9080c0",
                      fontSize:8,padding:"3px 10px",borderRadius:4,cursor:"pointer",fontFamily:"inherit",letterSpacing:1}}>
                      CLOSE
                    </button>
                  </div>
                </div>
              ))}

              {openTrades.length>0 && (
                <button onClick={()=>onCloseAll("all")} style={{width:"100%",marginTop:6,padding:"9px",borderRadius:8,
                  background:"#0f0f28",border:"1px solid #3a2a60",color:"#c4b5fd",
                  fontFamily:"inherit",fontSize:10,fontWeight:"bold",letterSpacing:2,cursor:"pointer"}}>
                  CLOSE ALL POSITIONS
                </button>
              )}

              <div style={{display:"flex",gap:8,marginTop:14}}>
                <button onClick={()=>setTab("deposit")} style={{flex:1,padding:"11px",borderRadius:8,
                  background:"#06101a",border:"1.5px solid #38bdf8",color:"#38bdf8",
                  fontFamily:"inherit",fontSize:10,fontWeight:"bold",letterSpacing:2,cursor:"pointer"}}>
                  ↓ DEPOSIT
                </button>
                <button onClick={()=>setTab("withdraw")} style={{flex:1,padding:"11px",borderRadius:8,
                  background:"#0e0618",border:"1.5px solid #a78bfa",color:"#a78bfa",
                  fontFamily:"inherit",fontSize:10,fontWeight:"bold",letterSpacing:2,cursor:"pointer"}}>
                  ↑ WITHDRAW
                </button>
              </div>
            </div>
          )}

          {/* ── DEPOSIT ── */}
          {tab==="deposit" && (
            <div>
              <div style={{background:"#060614",border:"1px solid #1a2040",borderRadius:8,padding:"12px 14px",marginBottom:16}}>
                <div style={{color:"#38bdf8",fontSize:9,fontWeight:"bold",letterSpacing:2,marginBottom:5}}>ℹ SIMULATION DEPOSIT</div>
                <div style={{color:"#a0a0c8",fontSize:"9.5px",lineHeight:1.65}}>
                  Deposit virtual ZAR to your simulation account. No real money is involved. Start trading immediately after depositing.
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{color:"#8888b8",fontSize:8,letterSpacing:2,marginBottom:8}}>AMOUNT (ZAR)</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#6060a0",fontSize:13,fontWeight:"bold",pointerEvents:"none"}}>R</span>
                  <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{width:"100%",padding:"12px 12px 12px 30px",borderRadius:8,boxSizing:"border-box",
                      background:"#0a0a1e",border:"1.5px solid #2a2a58",color:"#e8e8ff",
                      fontSize:17,fontFamily:"'Courier New',monospace",outline:"none",
                      WebkitAppearance:"none",MozAppearance:"textfield"}}/>
                </div>
                <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                  {[500,1000,2500,5000,10000].map(q=>(
                    <button key={q} onClick={()=>setAmount(String(q))} style={{
                      padding:"5px 10px",borderRadius:5,cursor:"pointer",fontFamily:"inherit",fontSize:9,
                      border:`1px solid ${amount===String(q)?"#38bdf8":"#2a2a58"}`,
                      background:amount===String(q)?"#38bdf822":"#0a0a1e",
                      color:amount===String(q)?"#38bdf8":"#7070a8",transition:"all 0.1s",
                    }}>R{q.toLocaleString()}</button>
                  ))}
                </div>
              </div>
              <button onClick={doDeposit} style={{width:"100%",padding:"13px",borderRadius:10,
                background:"linear-gradient(135deg,#052e16,#065f2a)",border:"2px solid #22c55e",
                color:"#4ade80",fontFamily:"inherit",fontSize:12,fontWeight:"bold",letterSpacing:3,cursor:"pointer"}}>
                ↓ DEPOSIT FUNDS
              </button>
              <div style={{color:"#2a2a50",fontSize:8,textAlign:"center",marginTop:8,letterSpacing:1}}>MIN R100 · DEMO ONLY · NO REAL FUNDS</div>
            </div>
          )}

          {/* ── WITHDRAW ── */}
          {tab==="withdraw" && (
            <div>
              <div style={{background:"#0e0618",border:`1px solid ${openTrades.length?"#3a1a1a":"#2a1a48"}`,borderRadius:8,padding:"12px 14px",marginBottom:16}}>
                <div style={{color:"#a78bfa",fontSize:9,fontWeight:"bold",letterSpacing:2,marginBottom:4}}>AVAILABLE TO WITHDRAW</div>
                <div style={{color:"#e0d8ff",fontSize:16,fontWeight:"bold"}}>{fmt(balance)}</div>
                {openTrades.length>0 &&
                  <div style={{color:"#f87171",fontSize:9,marginTop:8,letterSpacing:1}}>
                    ⚠ Close your {openTrades.length} open position{openTrades.length>1?"s":""} first
                  </div>
                }
              </div>
              <div style={{marginBottom:16}}>
                <div style={{color:"#8888b8",fontSize:8,letterSpacing:2,marginBottom:8}}>AMOUNT (ZAR)</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#6060a0",fontSize:13,fontWeight:"bold",pointerEvents:"none"}}>R</span>
                  <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{width:"100%",padding:"12px 12px 12px 30px",borderRadius:8,boxSizing:"border-box",
                      background:"#0a0a1e",border:"1.5px solid #2a2a58",color:"#e8e8ff",
                      fontSize:17,fontFamily:"'Courier New',monospace",outline:"none",
                      WebkitAppearance:"none",MozAppearance:"textfield"}}/>
                </div>
                <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                  {[500,1000,2500,5000,10000].map(q=>(
                    <button key={q} onClick={()=>setAmount(String(q))} style={{
                      padding:"5px 10px",borderRadius:5,cursor:"pointer",fontFamily:"inherit",fontSize:9,
                      border:`1px solid ${amount===String(q)?"#38bdf8":"#2a2a58"}`,
                      background:amount===String(q)?"#38bdf822":"#0a0a1e",
                      color:amount===String(q)?"#38bdf8":"#7070a8",transition:"all 0.1s",
                    }}>R{q.toLocaleString()}</button>
                  ))}
                </div>
              </div>
              <button onClick={doWithdraw} disabled={openTrades.length>0} style={{width:"100%",padding:"13px",borderRadius:10,
                background:openTrades.length?"#08081a":"linear-gradient(135deg,#1a054a,#3b0764)",
                border:`2px solid ${openTrades.length?"#2a2a50":"#a78bfa"}`,
                color:openTrades.length?"#3a3a60":"#ddd6fe",
                fontFamily:"inherit",fontSize:12,fontWeight:"bold",letterSpacing:3,
                cursor:openTrades.length?"not-allowed":"pointer",opacity:openTrades.length?0.5:1}}>
                ↑ WITHDRAW FUNDS
              </button>
              <div style={{color:"#2a2a50",fontSize:8,textAlign:"center",marginTop:8,letterSpacing:1}}>MIN R100 · DEMO ONLY · NO REAL FUNDS</div>
            </div>
          )}

          {/* ── HISTORY ── */}
          {tab==="history" && (
            <div>
              <div style={{color:"#6060a0",fontSize:8,letterSpacing:2,marginBottom:14}}>TRANSACTION HISTORY</div>
              {txHistory.length===0 ? (
                <div style={{textAlign:"center",padding:"28px 0",color:"#2a2a50",fontSize:10}}>No transactions yet</div>
              ) : txHistory.map(h=>(
                <div key={h.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #0d0d28"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:28,height:28,borderRadius:"50%",
                      background:h.type==="DEPOSIT"?"#052e1628":"#1a054a28",
                      border:`1px solid ${h.type==="DEPOSIT"?"#22c55e":"#a78bfa"}`,
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>
                      {h.type==="DEPOSIT"?"↓":"↑"}
                    </div>
                    <div>
                      <div style={{color:h.type==="DEPOSIT"?"#4ade80":"#c4b5fd",fontSize:10,fontWeight:"bold",letterSpacing:1}}>{h.type}</div>
                      <div style={{color:"#3a3a60",fontSize:8,marginTop:2}}>{h.date} · {h.note}</div>
                    </div>
                  </div>
                  <div style={{color:h.type==="DEPOSIT"?"#4ade80":"#c4b5fd",fontSize:12,fontWeight:"bold"}}>
                    {h.type==="DEPOSIT"?"+":"-"}{fmt(h.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

