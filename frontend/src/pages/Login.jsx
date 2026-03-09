import { useState } from 'react'
import useAuthStore from '../store/authStore'

export default function Login({ onSuccess }) {
  const [mode, setMode]               = useState('login')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const { login, register, isLoading, error } = useAuthStore()

  const handleSubmit = async () => {
    const ok = mode === 'login'
      ? await login(email, password)
      : await register(email, password, displayName)
    if (ok) onSuccess()
  }

  const inp = {
    width:'100%', padding:'10px 14px', marginBottom:12,
    background:'#08080f', border:'1px solid #1e1e3a',
    borderRadius:8, color:'#e0e0ff', fontSize:14, boxSizing:'border-box',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#08080f', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#0d0d1a', border:'1px solid #1e1e3a', borderRadius:16, padding:40, width:360 }}>

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:28, color:'#a78bfa', fontWeight:'bold', letterSpacing:2 }}>⬡ eQual</div>
          <div style={{ color:'#5a5a88', fontSize:13, marginTop:4 }}>Simulation Trading Platform</div>
        </div>

        <div style={{ display:'flex', marginBottom:24, background:'#08080f', borderRadius:8, padding:4 }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex:1, padding:'8px 0', borderRadius:6, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:'bold',
              background: mode===m ? '#1e1e3a' : 'transparent',
              color:      mode===m ? '#a78bfa' : '#5a5a88',
            }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {mode === 'register' && (
          <input style={inp} placeholder="Display Name"
            value={displayName} onChange={e => setDisplayName(e.target.value)} />
        )}
        <input style={inp} placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input style={inp} placeholder="Password" type="password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

        {error && (
          <div style={{ color:'#f87171', fontSize:12, marginBottom:12, textAlign:'center' }}>{error}</div>
        )}

        <button onClick={handleSubmit} disabled={isLoading} style={{
          width:'100%', padding:'12px 0',
          background:'linear-gradient(135deg,#4c1d95,#7c3aed)',
          border:'none', borderRadius:8, color:'#fff',
          fontSize:15, fontWeight:'bold', cursor:'pointer',
        }}>
          {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </div>
    </div>
  )
}