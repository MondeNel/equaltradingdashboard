import React, { useState } from 'react'
import { C, SYMBOLS } from '../constants'

const dropStyle = (open) => ({
  width:'100%', padding:'7px 10px',
  background: open ? '#1a1a2e' : '#08080f',
  border:`1px solid ${open ? '#2e2e5a' : '#1e1e3a'}`,
  borderRadius:6, color:'#e0e0ff', fontSize:12,
  cursor:'pointer', textAlign:'left',
  display:'flex', justifyContent:'space-between', alignItems:'center',
})

export default function SymbolSelector({ market, symbol, onMarketChange, onSymbolChange }) {
  const [marketOpen, setMarketOpen] = React.useState(false)
  const [symbolOpen, setSymbolOpen] = React.useState(false)

  const changeMarket = (m) => { onMarketChange(m); setMarketOpen(false); setSymbolOpen(false) }
  const changeSymbol = (s) => { onSymbolChange(s); setSymbolOpen(false) }

  return (
    <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', gap:12 }}>
      {[
        { label:'MARKET', open:marketOpen, toggle:() => { setMarketOpen(o=>!o); setSymbolOpen(false) }, val:market, opts:Object.keys(SYMBOLS), onSelect:changeMarket },
        { label:'SYMBOL', open:symbolOpen, toggle:() => { setSymbolOpen(o=>!o); setMarketOpen(false) }, val:symbol, opts:SYMBOLS[market], onSelect:changeSymbol },
      ].map(dd => (
        <div key={dd.label} style={{ flex:1, position:'relative' }}>
          <div style={{ color:C.labelDim, fontSize:8, letterSpacing:2, marginBottom:3 }}>{dd.label}</div>
          <button onClick={dd.toggle} style={dropStyle(dd.open)}>
            {dd.val} <span style={{ fontSize:7, opacity:0.6 }}>▼</span>
          </button>
          {dd.open && (
            <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50,
              background:'#0d0d1a', border:`1px solid ${C.borderBright}`, borderRadius:6,
              marginTop:2, overflow:'hidden' }}>
              {dd.opts.map(o => (
                <button key={o} onClick={() => dd.onSelect(o)} style={{
                  display:'block', width:'100%', padding:'8px 10px',
                  background: o === dd.val ? C.border : 'transparent',
                  border:'none', color: o === dd.val ? '#e0e0ff' : C.label,
                  fontSize:12, cursor:'pointer', textAlign:'left',
                }}>{o}</button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}