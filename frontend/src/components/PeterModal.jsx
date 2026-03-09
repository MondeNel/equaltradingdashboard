import { useState } from 'react'
import { C } from '../constants'
import { peterAPI } from '../services/api'

export default function PeterModal({ onClose, onApply, symbol, market, livePrice }) {
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [response, setResponse] = useState(null)
  const [error,    setError]    = useState(null)

  const analyse = async () => {
    if (!input.trim()) return
    setLoading(true); setError(null); setResponse(null)
    try {
      const res = await peterAPI.analyse({
        user_message:  input,
        symbol,
        market,
        current_price: livePrice,
      })
      setResponse(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Analysis failed')
    }
    setLoading(false)
  }

  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200,
               display:'flex', alignItems:'flex-end', justifyContent:'center' }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background:C.panel, border:`1px solid ${C.borderBright}`,
        borderTopLeftRadius:20, borderTopRightRadius:20,
        padding:24, width:'100%', maxWidth:480, maxHeight:'80vh', overflowY:'auto',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ color:'#ddd6fe', fontWeight:'bold', fontSize:15, letterSpacing:1 }}>⬡ PETER AI</div>
            <div style={{ color:C.labelDim, fontSize:10, marginTop:2 }}>Your trading assistant</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.label, cursor:'pointer', fontSize:20 }}>×</button>
        </div>

        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          placeholder={`Ask Peter about ${symbol}...\ne.g. "Should I buy now? What levels do you suggest?"`}
          style={{ width:'100%', minHeight:80, padding:'10px 14px', background:C.bg,
            border:`1px solid ${C.border}`, borderRadius:10, color:'#e0e0ff',
            fontSize:13, resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}
        />

        <button onClick={analyse} disabled={loading || !input.trim()} style={{
          width:'100%', marginTop:10, padding:'11px 0',
          background:'linear-gradient(135deg,#3b0764,#6d28d9)',
          border:'2px solid #a78bfa', borderRadius:8,
          color:'#ddd6fe', fontSize:13, fontWeight:'bold', cursor:'pointer', letterSpacing:1,
        }}>
          {loading ? 'Analysing...' : 'ASK PETER'}
        </button>

        {error && (
          <div style={{ color:C.slCol, fontSize:12, marginTop:10, textAlign:'center' }}>{error}</div>
        )}

        {response && (
          <div style={{ marginTop:16 }}>
            <div style={{ background:C.bg, borderRadius:10, padding:14, marginBottom:12 }}>
              <div style={{ color:C.labelDim, fontSize:10, letterSpacing:2, marginBottom:8 }}>ANALYSIS</div>
              <div style={{ color:'#c4b5fd', fontSize:13, lineHeight:1.6 }}>{response.analysis}</div>
            </div>

            {response.recommendation && (
              <div style={{ background:'#0f0f20', border:`1px solid ${C.borderBright}`, borderRadius:10, padding:14, marginBottom:12 }}>
                <div style={{ color:C.labelDim, fontSize:10, letterSpacing:2, marginBottom:8 }}>RECOMMENDATION</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    ['Symbol',      response.recommendation.symbol],
                    ['Direction',   response.recommendation.direction],
                    ['Entry',       response.recommendation.entry],
                    ['Take Profit', response.recommendation.take_profit],
                    ['Stop Loss',   response.recommendation.stop_loss],
                    ['Lot Size',    response.recommendation.lot_size],
                  ].map(([k, v]) => v && (
                    <div key={k}>
                      <div style={{ color:C.labelDim, fontSize:9, letterSpacing:1 }}>{k}</div>
                      <div style={{ color:'#e0e0ff', fontSize:13, fontWeight:'bold' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {response.recommendation.entry && (
                  <button onClick={() => { onApply(response.recommendation); onClose() }} style={{
                    width:'100%', marginTop:12, padding:'9px 0',
                    background:C.buyBg, border:`1px solid ${C.buyBorder}`,
                    borderRadius:8, color:C.buyText, fontSize:12, fontWeight:'bold', cursor:'pointer',
                  }}>
                    APPLY TO CHART
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}