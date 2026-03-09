import { useState } from 'react'
import { C } from '../constants'

export default function WalletModal({ wallet, onClose, onDeposit, onWithdraw }) {
  const [tab,     setTab]     = useState('deposit')
  const [amount,  setAmount]  = useState('')
  const [msg,     setMsg]     = useState(null)
  const [loading, setLoading] = useState(false)

  const balFmt = v => v != null
    ? `ZAR ${Number(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    : 'ZAR 0,00'

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setMsg({ err: true, text: 'Enter a valid amount' }); return }
    setLoading(true)
    const fn  = tab === 'deposit' ? onDeposit : onWithdraw
    const res = await fn(amt)
    if (res.ok) {
      setMsg({ err: false, text: `${tab === 'deposit' ? 'Deposited' : 'Withdrew'} ZAR ${amt.toFixed(2)}` })
      setAmount('')
    } else {
      setMsg({ err: true, text: res.error })
    }
    setLoading(false)
  }

  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200,
               display:'flex', alignItems:'center', justifyContent:'center' }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background:C.panel, border:`1px solid ${C.borderBright}`,
        borderRadius:16, padding:24, width:320,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
          <span style={{ color:'#e0e0ff', fontWeight:'bold', fontSize:15, letterSpacing:1 }}>⬡ WALLET</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.label, cursor:'pointer', fontSize:18 }}>×</button>
        </div>

        <div style={{ background:C.bg, borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
          <div style={{ color:C.balLabel, fontSize:10, letterSpacing:2, marginBottom:4 }}>AVAILABLE BALANCE</div>
          <div style={{ color:'#e0e0ff', fontSize:20, fontWeight:'bold' }}>{balFmt(wallet?.balance)}</div>
        </div>

        <div style={{ display:'flex', marginBottom:16, background:C.bg, borderRadius:8, padding:3 }}>
          {['deposit','withdraw'].map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg(null) }} style={{
              flex:1, padding:'7px 0', borderRadius:6, border:'none', cursor:'pointer',
              background: tab === t ? C.border : 'transparent',
              color:      tab === t ? '#e0e0ff' : C.label,
              fontSize:12, fontWeight:'bold', textTransform:'uppercase', letterSpacing:1,
            }}>{t}</button>
          ))}
        </div>

        <input
          type="number" placeholder="Amount (ZAR)" value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{ width:'100%', padding:'10px 14px', background:C.bg,
            border:`1px solid ${C.border}`, borderRadius:8, color:'#e0e0ff',
            fontSize:14, boxSizing:'border-box', marginBottom:10 }}
        />

        {msg && (
          <div style={{ color: msg.err ? C.slCol : C.tpCol, fontSize:12, marginBottom:10, textAlign:'center' }}>
            {msg.text}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width:'100%', padding:'11px 0',
          background: tab === 'deposit' ? C.buyBg : C.sellBg,
          border:`1px solid ${tab === 'deposit' ? C.buyBorder : C.sellBorder}`,
          borderRadius:8,
          color:  tab === 'deposit' ? C.buyText : C.sellText,
          fontSize:13, fontWeight:'bold', cursor:'pointer', letterSpacing:1,
        }}>
          {loading ? '...' : tab === 'deposit' ? 'DEPOSIT' : 'WITHDRAW'}
        </button>
      </div>
    </div>
  )
}