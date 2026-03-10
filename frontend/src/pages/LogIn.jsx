import { useState } from 'react'
import useAuthStore from '../store/authStore'
import { C } from '../constants'

export default function Login() {
  const [mode,     setMode]     = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')

  const { login, register, isLoading, error } = useAuthStore()

  const handleSubmit = async () => {
    if (!email || !password) return
    if (mode === 'login') {
      await login(email, password)
    } else {
      await register(email, password, name)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 8, boxSizing: 'border-box',
    background: '#0a0a1e', border: '1.5px solid #2a2a58', color: '#e8e8ff',
    fontSize: 13, fontFamily: "'Courier New',monospace", outline: 'none',
  }

  const labelStyle = {
    color: C.labelDim, fontSize: 9, letterSpacing: 2, marginBottom: 6, display: 'block',
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier New',monospace", padding: 16,
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(167,139,250,0.008) 2px,rgba(167,139,250,0.008) 4px)',
      }}/>

      <div style={{
        width: '100%', maxWidth: 360,
        background: `linear-gradient(160deg,${C.panel},#0a0820)`,
        border: '1.5px solid #2e2e5a', borderRadius: 18,
        padding: '32px 28px', boxShadow: '0 0 60px #7c3aed22',
        position: 'relative', zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 44" width="120" height="33">
            <defs>
              <linearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8"/>
                <stop offset="100%" stopColor="#0ea5c8"/>
              </linearGradient>
              <linearGradient id="dotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#facc15"/>
                <stop offset="100%" stopColor="#d97706"/>
              </linearGradient>
              <filter id="eGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.8" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <text x="2" y="34" fontFamily="Georgia,'Times New Roman',serif" fontSize="36" fontWeight="400" fontStyle="italic" fill="url(#eGrad)" filter="url(#eGlow)" letterSpacing="-1">e</text>
            <text x="24" y="34" fontFamily="Georgia,'Times New Roman',serif" fontSize="36" fontWeight="700" fill="#e8e8ff" letterSpacing="-1">Q</text>
            <text x="55" y="34" fontFamily="Georgia,'Times New Roman',serif" fontSize="36" fontWeight="400" fill="#c8c8ee" letterSpacing="-0.5">ual</text>
            <circle cx="51" cy="38" r="3.5" fill="url(#dotGrad)"/>
            <line x1="2" y1="38.5" x2="22" y2="38.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          </svg>
          <div style={{ color: '#4a4a7a', fontSize: 9, letterSpacing: 3, marginTop: 6 }}>
            SIMULATION TRADING PLATFORM
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', marginBottom: 24, background: '#06060f', borderRadius: 8, padding: 3 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '9px', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 10, fontWeight: 'bold', letterSpacing: 2,
              background: mode === m ? 'linear-gradient(135deg,#1a0a3a,#2a1060)' : 'transparent',
              border: mode === m ? '1px solid #a78bfa' : '1px solid transparent',
              color: mode === m ? '#ddd6fe' : '#4a4a7a',
              transition: 'all 0.15s',
            }}>
              {m === 'login' ? 'LOGIN' : 'REGISTER'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {mode === 'register' && (
            <div>
              <label style={labelStyle}>DISPLAY NAME (OPTIONAL)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Trader name" style={inputStyle} />
            </div>
          )}
          <div>
            <label style={labelStyle}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="trader@example.com" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label style={labelStyle}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 8,
            background: '#2d0a0a22', border: '1px solid #ef4444',
            color: '#f87171', fontSize: 10, letterSpacing: 1,
          }}>
            ✗ {error}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={isLoading} style={{
          width: '100%', padding: '14px', borderRadius: 10,
          background: isLoading ? '#0a0a18' : 'linear-gradient(135deg,#1a054a,#3b0764)',
          border: '2px solid #a78bfa', color: '#ddd6fe',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 'bold', letterSpacing: 3,
          cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1,
          boxShadow: '0 0 24px #7c3aed33', transition: 'all 0.2s',
        }}>
          {isLoading ? 'CONNECTING...' : mode === 'login' ? '→ LOGIN' : '→ CREATE ACCOUNT'}
        </button>

        <div style={{ color: '#2a2a50', fontSize: 8, textAlign: 'center', marginTop: 16, letterSpacing: 1 }}>
          SIMULATION ONLY · NO REAL FUNDS INVOLVED
        </div>
      </div>
    </div>
  )
}