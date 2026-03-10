import { useState } from "react";
import { PLANS } from "../constants";

export default function SubscriptionModal({ onClose }) {
  const [selected, setSelected] = useState("monthly");
  const plan = PLANS.find(p => p.id === selected);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:300,
      background:"rgba(2,2,10,0.95)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"12px", backdropFilter:"blur(6px)",
    }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <style>{`@keyframes subIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        width:"100%", maxWidth:"380px", maxHeight:"92vh", overflowY:"auto",
        background:"linear-gradient(160deg,#0a0818,#100d24)",
        border:"1.5px solid #2e2060", borderRadius:18,
        padding:"24px 20px", fontFamily:"'Courier New',monospace",
        boxShadow:"0 0 80px #7c3aed22",
        animation:"subIn 0.3s ease-out",
      }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ color:"#facc15", fontSize:15, fontWeight:"bold", letterSpacing:3 }}>✦ UPGRADE PETER</div>
            <div style={{ color:"#8080b0", fontSize:9, letterSpacing:2, marginTop:3 }}>UNLOCK FULL TRADING INTELLIGENCE</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#7070a0", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        {/* Plan tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:20 }}>
          {PLANS.map(p => (
            <button key={p.id} onClick={() => setSelected(p.id)} style={{
              flex:1, padding:"10px 4px", borderRadius:8, cursor:"pointer",
              fontFamily:"inherit", fontSize:9, fontWeight:"bold", letterSpacing:1,
              border:`1.5px solid ${selected===p.id ? p.color : "#1e1e3a"}`,
              background: selected===p.id ? p.color+"22" : "#0a0a18",
              color: selected===p.id ? p.color : "#5a5a80",
              transition:"all 0.15s", position:"relative",
            }}>
              {p.badge && (
                <div style={{
                  position:"absolute", top:-9, left:"50%", transform:"translateX(-50%)",
                  background:p.color, color:"#000", fontSize:7, fontWeight:"bold",
                  padding:"2px 6px", borderRadius:4, letterSpacing:1, whiteSpace:"nowrap",
                }}>{p.badge}</div>
              )}
              {p.label}
            </button>
          ))}
        </div>

        {/* Price card */}
        <div style={{ textAlign:"center", marginBottom:20, padding:"18px", background:"#06060f", borderRadius:12, border:`1px solid ${plan.color}44` }}>
          <div style={{ color:plan.color, fontSize:36, fontWeight:"bold", letterSpacing:2 }}>{plan.price}</div>
          <div style={{ color:"#7070a8", fontSize:10, letterSpacing:2, marginTop:2 }}>{plan.per}</div>
          {selected==="yearly" && (
            <div style={{ color:"#4ade80", fontSize:9, marginTop:8, letterSpacing:1, background:"#052e1622", padding:"4px 10px", borderRadius:6, display:"inline-block" }}>
              💰 SAVE R 789 vs monthly billing
            </div>
          )}
          {selected==="weekly" && (
            <div style={{ color:"#38bdf8", fontSize:9, marginTop:8, letterSpacing:1 }}>
              Perfect to try before committing
            </div>
          )}
        </div>

        {/* Included features */}
        <div style={{ marginBottom:16 }}>
          <div style={{ color:"#a0a0c8", fontSize:8, letterSpacing:2, marginBottom:10 }}>✓ WHAT'S INCLUDED</div>
          {plan.features.map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
              <div style={{ width:18, height:18, borderRadius:"50%", background:plan.color+"22", border:`1.5px solid ${plan.color}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ color:plan.color, fontSize:10, fontWeight:"bold" }}>✓</span>
              </div>
              <span style={{ color:"#d8d8f0", fontSize:"10.5px", lineHeight:1.4 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Locked features */}
        {plan.locked.length > 0 && (
          <div style={{ marginBottom:20, padding:"12px", background:"#08081a", borderRadius:10, border:"1px solid #1a1a38" }}>
            <div style={{ color:"#6060a0", fontSize:8, letterSpacing:2, marginBottom:10 }}>🔒 UPGRADE TO UNLOCK</div>
            {plan.locked.map((f,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7, opacity:0.6 }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:"#12122a", border:"1px solid #2a2a50", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:9 }}>🔒</span>
                </div>
                <span style={{ color:"#6868a0", fontSize:"10px" }}>{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA button */}
        <button style={{
          width:"100%", padding:"15px", borderRadius:10,
          background:`linear-gradient(135deg,${plan.color}28,${plan.color}44)`,
          border:`2px solid ${plan.color}`,
          color:plan.color, fontSize:13, fontWeight:"bold", letterSpacing:3,
          cursor:"pointer", fontFamily:"inherit",
          boxShadow:`0 0 28px ${plan.color}33`,
          transition:"all 0.2s",
        }}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 44px ${plan.color}55`;e.currentTarget.style.background=`linear-gradient(135deg,${plan.color}38,${plan.color}55)`;}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 0 28px ${plan.color}33`;e.currentTarget.style.background=`linear-gradient(135deg,${plan.color}28,${plan.color}44)`;}}
        >
          SUBSCRIBE — {plan.price}{plan.per}
        </button>

        <div style={{ color:"#3a3a60", fontSize:8, textAlign:"center", marginTop:10, letterSpacing:1 }}>
          DEMO ONLY · NO ACTUAL CHARGES APPLY
        </div>
      </div>
    </div>
  );
}
