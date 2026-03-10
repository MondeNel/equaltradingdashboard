import { useState, useEffect } from "react";
import { C, FREE_LIMIT } from "../constants";
import { peterAPI } from "../services/api";
import SubscriptionModal from "./SubscriptionModal";

export default function PeterModal({ onClose, onApply, livePrice, symbol, market, usageCount, onUseRequest }) {
  const remaining = Math.max(0, FREE_LIMIT - usageCount);
  const [step,    setStep]    = useState(usageCount >= FREE_LIMIT ? "limit" : "intro");
  const [answers, setAnswers] = useState({ volatile:false, topForex:false, surpriseMe:false });
  const [aiResult,setAiResult]= useState(null);
  const [typed,   setTyped]   = useState("");
  const [showSub, setShowSub] = useState(false);
  const fullText = "Hi there, I'm Peter...\nyour trading assistant tool.";

  useEffect(() => {
    if (step !== "intro") return;
    let i = 0; setTyped("");
    const id = setInterval(() => { i++; setTyped(fullText.slice(0,i)); if(i>=fullText.length) clearInterval(id); }, 38);
    return () => clearInterval(id);
  }, [step]);

  const handleNext = async () => {
    if (step==="intro") { setStep("questions"); return; }
    if (step==="questions") {
      onUseRequest();
      setStep("loading");
      const wants = [];
      if (answers.volatile)   wants.push("volatile market opportunities");
      if (answers.topForex)   wants.push("top forex pairs currently trading");
      if (answers.surpriseMe) wants.push("a surprise scalp setup");
      if (!wants.length)      wants.push("a general scalp trade setup");

      const symList = [
        "BTC/USD (Crypto, ~68420)","ETH/USD (Crypto, ~3821)","SOL/USD (Crypto, ~182)","XRP/USD (Crypto, ~0.62)",
        "USD/ZAR (Forex, ~18021)","EUR/USD (Forex, ~1.08)","GBP/USD (Forex, ~1.27)","USD/JPY (Forex, ~149)",
        "APPLE (Stocks, ~189)","TESLA (Stocks, ~248)","NVIDIA (Stocks, ~875)","AMAZON (Stocks, ~182)",
      ].join(", ");

      const prompt = `You are Peter, a scalp trading AI assistant. Use ONLY these platform symbols: ${symList}.
User viewing: ${symbol} (${market}), live price ~${livePrice.toFixed(2)}.
User wants: ${wants.join(", ")}.
Set entry VERY close to the symbol base price shown. TP/SL within 0.2-0.8% of entry for scalping.
Return ONLY raw JSON, no markdown:
{"recommendedSymbol":"","recommendedMarket":"Crypto or Forex or Stocks","direction":"BUY or SELL","strategy":"one sentence","entry":0,"takeProfit":0,"stopLoss":0,"lotSize":"Macro or Mini or Standard","volume":1,"reasoning":"2-3 sentences"}`;

      try {
        const res  = await peterAPI.analyse({ symbol, market, live_price: livePrice, options: wants });
        const data = res.data;
        // Normalise snake_case → camelCase for display + handlePeterApply
        if (data && !data.error) {
          setAiResult({
            recommendedSymbol: data.recommended_symbol,
            recommendedMarket: data.recommended_market,
            direction:         data.direction,
            strategy:          data.strategy,
            entry:             Number(data.entry),
            takeProfit:        Number(data.take_profit),
            stopLoss:          Number(data.stop_loss),
            lotSize:           data.lot_size,
            volume:            data.volume,
            reasoning:         data.reasoning,
            // keep snake_case too so handlePeterApply can find them
            take_profit:       Number(data.take_profit),
            stop_loss:         Number(data.stop_loss),
          });
        } else {
          setAiResult({ error:true, reasoning: data?.detail || "Peter couldn't connect right now. Please try again." });
        }
        setStep("results");
      } catch(e) {
        const detail = e.response?.data?.detail || "Peter couldn't connect right now. Please try again.";
        setAiResult({ error:true, reasoning: detail });
        setStep("results");
      }
    }
  };

  const handleApply = () => { if(aiResult&&!aiResult.error) onApply(aiResult); onClose(); };

  const overlay = { position:"fixed",inset:0,zIndex:200,background:"rgba(4,4,14,0.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",backdropFilter:"blur(4px)" };
  const box     = { width:"100%",maxWidth:"360px",maxHeight:"90vh",overflowY:"auto",background:"linear-gradient(145deg,#0d0d20,#12102a)",border:"1.5px solid #3b2f6e",borderRadius:"16px",padding:"28px 24px 22px",boxShadow:"0 0 60px #7c3aed33",fontFamily:"'Courier New',monospace" };

  const PBtn = ({ onClick, children, disabled, variant="primary" }) => (
    <button onClick={onClick} disabled={disabled} style={{
      background:variant==="primary"?"linear-gradient(135deg,#4c1d95,#6d28d9)":variant==="green"?"linear-gradient(135deg,#052e16,#065f2a)":variant==="gold"?"linear-gradient(135deg,#451a03,#78350f)":"#1a1a30",
      border:`1.5px solid ${variant==="primary"?"#a78bfa":variant==="green"?"#22c55e":variant==="gold"?"#facc15":"#2e2e5a"}`,
      color:variant==="primary"?"#ddd6fe":variant==="green"?"#4ade80":variant==="gold"?"#facc15":"#9090c0",
      padding:"10px 18px",borderRadius:"8px",cursor:disabled?"not-allowed":"pointer",
      fontFamily:"inherit",fontSize:"11px",fontWeight:"bold",letterSpacing:"1.5px",
      opacity:disabled?0.4:1,transition:"all 0.15s",
    }}>{children}</button>
  );

  const Check = ({ label, checked, onChange }) => (
    <label style={{ display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",marginBottom:14 }}>
      <div onClick={onChange} style={{ width:18,height:18,borderRadius:4,flexShrink:0,marginTop:1,border:`2px solid ${checked?"#a78bfa":"#3b3b6e"}`,background:checked?"#6d28d9":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.15s" }}>
        {checked && <span style={{ color:"#fff",fontSize:11,lineHeight:1 }}>✓</span>}
      </div>
      <span style={{ color:"#c8c0f0",fontSize:"11px",lineHeight:"1.5" }}>{label}</span>
    </label>
  );

  // Usage dots
  const UsageDots = () => (
    <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:16 }}>
      {Array.from({length:FREE_LIMIT}).map((_,i) => (
        <div key={i} style={{ width:8,height:8,borderRadius:"50%",background:i<usageCount?"#3a3a60":"#a78bfa",border:`1px solid ${i<usageCount?"#2a2a50":"#7c3aed"}`,transition:"all 0.2s" }} />
      ))}
      <span style={{ color:"#8080b0",fontSize:9,marginLeft:4,letterSpacing:1 }}>{remaining} FREE REQUEST{remaining!==1?"S":""} LEFT</span>
    </div>
  );

  return (
    <div style={overlay} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      {showSub && <SubscriptionModal onClose={()=>setShowSub(false)} />}
      <style>{`
        @keyframes peterIn{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulseGold{0%,100%{box-shadow:0 0 16px #facc1533}50%{box-shadow:0 0 30px #facc1566}}
      `}</style>
      <div style={{ ...box, animation:"peterIn 0.3s ease-out" }}>

        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#3b0764,#6d28d9)",border:"2px solid #a78bfa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:"bold",color:"#ddd6fe",letterSpacing:1,boxShadow:"0 0 12px #7c3aed66" }}>AI</div>
            <div>
              <div style={{ color:"#a78bfa",fontSize:13,fontWeight:"bold",letterSpacing:2 }}>PETER</div>
              <div style={{ color:"#a0a0cc",fontSize:8,letterSpacing:1 }}>TRADING ASSISTANT</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#9090bb",fontSize:18,cursor:"pointer",padding:"4px 8px" }}>✕</button>
        </div>

        {/* ── LIMIT REACHED ── */}
        {step==="limit" && (
          <div>
            <div style={{ textAlign:"center",padding:"10px 0 18px" }}>
              <div style={{ fontSize:36,marginBottom:10 }}>🔒</div>
              <div style={{ color:"#facc15",fontSize:14,fontWeight:"bold",letterSpacing:2,marginBottom:8 }}>FREE LIMIT REACHED</div>
              <div style={{ color:"#c0c0e0",fontSize:"10.5px",lineHeight:1.7,marginBottom:16 }}>
                You've used all {FREE_LIMIT} free AI requests.<br/>
                Upgrade to keep getting Peter's trade setups, market analysis, and auto-filled levels.
              </div>
              {/* Mini feature teaser */}
              <div style={{ background:"#08081a",border:"1px solid #2a2a50",borderRadius:10,padding:"12px 14px",marginBottom:18,textAlign:"left" }}>
                <div style={{ color:"#8080b8",fontSize:8,letterSpacing:2,marginBottom:10 }}>WITH A SUBSCRIPTION YOU GET</div>
                {["Unlimited AI trade setups","Volatile market scanner","Multi-timeframe analysis","Pattern recognition AI","Risk-adjusted position sizing"].map((f,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:7 }}>
                    <span style={{ color:"#a78bfa",fontSize:11 }}>✦</span>
                    <span style={{ color:"#c8c8e8",fontSize:"10px" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>setShowSub(true)} style={{
                width:"100%",padding:"14px",borderRadius:10,
                background:"linear-gradient(135deg,#451a03,#92400e)",
                border:"2px solid #facc15",color:"#facc15",
                fontSize:13,fontWeight:"bold",letterSpacing:3,
                cursor:"pointer",fontFamily:"inherit",
                animation:"pulseGold 2s ease-in-out infinite",
              }}>✦ VIEW PLANS & SUBSCRIBE</button>
            </div>
          </div>
        )}

        {/* ── INTRO ── */}
        {step==="intro" && (
          <div>
            <UsageDots />
            <div style={{ minHeight:70,color:"#f0ecff",fontSize:"13px",lineHeight:"1.7",marginBottom:20,whiteSpace:"pre-line" }}>
              {typed}<span style={{ animation:"blink 0.8s infinite",color:"#a78bfa" }}>|</span>
            </div>
            <div style={{ background:"#0a0a1e",border:"1px solid #2e2e50",borderRadius:8,padding:"12px 14px",marginBottom:20 }}>
              <div style={{ color:"#f87171",fontSize:"9px",fontWeight:"bold",letterSpacing:2,marginBottom:6 }}>⚠ DISCLAIMER</div>
              <div style={{ color:"#c8c8e8",fontSize:"9.5px",lineHeight:"1.6" }}>I'm an AI tool. I can make mistakes. I'm not a financial advisor. Always do your own research before trading.</div>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <button onClick={()=>setShowSub(true)} style={{ background:"none",border:"none",color:"#facc15",fontSize:9,cursor:"pointer",fontFamily:"inherit",letterSpacing:1,textDecoration:"underline" }}>✦ Subscribe for unlimited</button>
              <PBtn onClick={handleNext}>NEXT →</PBtn>
            </div>
          </div>
        )}

        {/* ── QUESTIONS ── */}
        {step==="questions" && (
          <div>
            <UsageDots />
            <div style={{ color:"#b0b0d8",fontSize:"9px",letterSpacing:2,marginBottom:16 }}>WHAT WOULD YOU LIKE TO KNOW?</div>
            <Check checked={answers.volatile}   onChange={()=>setAnswers(a=>({...a,volatile:!a.volatile}))}   label="Show me volatile markets right now" />
            <Check checked={answers.topForex}   onChange={()=>setAnswers(a=>({...a,topForex:!a.topForex}))}   label="Which forex pairs are best to trade currently?" />
            <Check checked={answers.surpriseMe} onChange={()=>setAnswers(a=>({...a,surpriseMe:!a.surpriseMe}))} label="Surprise me — give me your best scalp setup" />
            <div style={{ color:"#7070a0",fontSize:"8px",letterSpacing:1,marginBottom:18,marginTop:4 }}>SELECT ONE OR MORE · MAX 3</div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <button onClick={()=>setStep("intro")} style={{ background:"none",border:"none",color:"#9090bb",fontSize:10,cursor:"pointer",fontFamily:"inherit",letterSpacing:1 }}>← BACK</button>
              <PBtn onClick={handleNext} disabled={!answers.volatile&&!answers.topForex&&!answers.surpriseMe}>ASK PETER →</PBtn>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {step==="loading" && (
          <div style={{ textAlign:"center",padding:"20px 0" }}>
            <div style={{ width:44,height:44,borderRadius:"50%",border:"3px solid #1e1e40",borderTop:"3px solid #a78bfa",animation:"spin 0.8s linear infinite",margin:"0 auto 18px" }} />
            <div style={{ color:"#c8b8ff",fontSize:11,letterSpacing:2 }}>PETER IS ANALYSING...</div>
            <div style={{ color:"#8888b8",fontSize:9,marginTop:8,letterSpacing:1 }}>Scanning market data</div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step==="results" && aiResult && (
          <div>
            {aiResult.error ? (
              <div style={{ color:"#f87171",fontSize:11,lineHeight:1.6,marginBottom:20 }}>{aiResult.reasoning}</div>
            ) : (
              <>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                  <div style={{ flex:1,paddingRight:10 }}>
                    <div style={{ color:"#c4b5fd",fontSize:13,fontWeight:"bold",letterSpacing:2 }}>{aiResult.recommendedSymbol}</div>
                    <div style={{ color:"#a0a0cc",fontSize:8,letterSpacing:1,marginTop:2 }}>{aiResult.strategy}</div>
                  </div>
                  <div style={{ background:aiResult.direction==="BUY"?"linear-gradient(135deg,#052e16,#065f2a)":"linear-gradient(135deg,#2d0a0a,#5a1212)",border:`2px solid ${aiResult.direction==="BUY"?"#22c55e":"#ef4444"}`,color:aiResult.direction==="BUY"?"#4ade80":"#f87171",padding:"6px 14px",borderRadius:6,fontSize:12,fontWeight:"bold",letterSpacing:2,flexShrink:0 }}>{aiResult.direction==="BUY"?"▲ BUY":"▼ SELL"}</div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14 }}>
                  {[{label:"ENTRY",val:aiResult.entry,col:C.entryCol},{label:"TAKE PROFIT",val:aiResult.takeProfit,col:C.tpCol},{label:"STOP LOSS",val:aiResult.stopLoss,col:C.slCol}].map(r=>(
                    <div key={r.label} style={{ background:"#08081a",borderRadius:6,padding:"8px 6px",border:`1px solid ${r.col}44` }}>
                      <div style={{ color:"#9090b8",fontSize:"7px",letterSpacing:1,marginBottom:4 }}>{r.label}</div>
                      <div style={{ color:r.col,fontSize:11,fontWeight:"bold" }}>{r.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14 }}>
                  {[{label:"LOT SIZE",val:aiResult.lotSize},{label:"VOLUME",val:aiResult.volume}].map(r=>(
                    <div key={r.label} style={{ background:"#08081a",borderRadius:6,padding:"8px 8px",border:"1px solid #2a2a50" }}>
                      <div style={{ color:"#9090b8",fontSize:"7px",letterSpacing:1,marginBottom:4 }}>{r.label}</div>
                      <div style={{ color:"#e2d9f3",fontSize:11,fontWeight:"bold" }}>{r.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#08081a",border:"1px solid #2a2a50",borderRadius:8,padding:"10px 12px",marginBottom:18 }}>
                  <div style={{ color:"#9090b8",fontSize:"8px",letterSpacing:1,marginBottom:5 }}>PETER'S ANALYSIS</div>
                  <div style={{ color:"#d0d0ee",fontSize:"9.5px",lineHeight:"1.65" }}>{aiResult.reasoning}</div>
                </div>
              </>
            )}
            <div style={{ display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap" }}>
              <PBtn onClick={()=>setStep("questions")} variant="secondary">← RETRY</PBtn>
              <div style={{ display:"flex",gap:8 }}>
                <PBtn onClick={()=>setShowSub(true)} variant="gold">✦ UPGRADE</PBtn>
                {!aiResult.error && <PBtn onClick={handleApply} variant="green">APPLY ✓</PBtn>}
                {aiResult.error  && <PBtn onClick={onClose} variant="secondary">CLOSE</PBtn>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
