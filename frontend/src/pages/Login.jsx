import { useState } from 'react'
import useAuthStore from '../store/authStore.js'

export default function Login() {
  const [mode,        setMode]        = useState('login')
  const [email,       setEmail]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [error,       setError]       = useState(null)

  const { login, register, isLoading, error: storeError } = useAuthStore()

  const handleSubmit = async () => {
    setError(null)
    if (!email || !password) { setError('Please fill in all fields'); return }
    let ok
    if (mode === 'register') {
      ok = await register(email, password, displayName || undefined)
    } else {
      ok = await login(email, password)
    }
    if (!ok) setError(storeError || (mode === 'login' ? 'Invalid email or password' : 'Registration failed'))
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 8, boxSizing: 'border-box',
    background: '#0a0a1e', border: '1.5px solid #2a2a58', color: '#e8e8ff',
    fontSize: 13, fontFamily: "'Courier New',monospace", outline: 'none',
    letterSpacing: '0.5px',
  }

  const Label = ({ text, optional }) => (
    <div style={{ color: '#6060a0', fontSize: 8, letterSpacing: 2, marginBottom: 6 }}>
      {text}{optional && <span style={{ color: '#3a3a60', marginLeft: 6 }}>(OPTIONAL)</span>}
    </div>
  )

  const displayError = error || storeError

  return (
    <div style={{ minHeight: '100vh', background: '#030309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier New',monospace", padding: 16 }}>
      <style>{`
        @keyframes loginIn { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulseTeal { 0%,100% { box-shadow:0 0 20px #38bdf822 } 50% { box-shadow:0 0 40px #38bdf844 } }
        input::placeholder { color: #3a3a60 }
        input:focus { border-color: #38bdf8 !important; box-shadow: 0 0 0 2px #38bdf818 }
      `}</style>

      <div style={{ width: '100%', maxWidth: 380, animation: 'loginIn 0.35s ease-out' }}>

        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 60" width="160" height="44">
              <defs>
                <linearGradient id="lgEGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#38bdf8" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#0ea5c8" stopOpacity="1"/>
                </linearGradient>
                <linearGradient id="lgDotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#facc15" stopOpacity="1"/>
                  <stop offset="100%" stopColor="#d97706" stopOpacity="1"/>
                </linearGradient>
                <filter id="lgEGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="lgDotGlow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <text x="4"  y="46" fontFamily="Georgia,'Times New Roman',serif" fontSize="50" fontWeight="400" fontStyle="italic" fill="url(#lgEGrad)" filter="url(#lgEGlow)" letterSpacing="-1">e</text>
              <text x="34" y="46" fontFamily="Georgia,'Times New Roman',serif" fontSize="50" fontWeight="700" fill="#e8e8ff" letterSpacing="-1">Q</text>
              <text x="78" y="46" fontFamily="Georgia,'Times New Roman',serif" fontSize="50" fontWeight="400" fill="#c8c8ee" letterSpacing="-0.5">ual</text>
              <circle cx="72" cy="51" r="4.5" fill="url(#lgDotGrad)" filter="url(#lgDotGlow)"/>
              <line x1="4" y1="52" x2="30" y2="52" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </div>
          <div style={{ color: '#4a4a7a', fontSize: 9, letterSpacing: 3 }}>TRADING SIMULATION PLATFORM</div>
        </div>

        {/* ── Card ── */}
        <div style={{ background: 'linear-gradient(160deg,#08091a,#0c0a22)', border: '1.5px solid #1c1c44',
          borderRadius: 18, padding: '28px 24px', boxShadow: '0 0 60px #38bdf812',
          animation: 'pulseTeal 4s ease-in-out infinite' }}>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: '#060610', borderRadius: 8, padding: 3, marginBottom: 24, border: '1px solid #1a1a38' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null) }} style={{
                flex: 1, padding: '8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 9, fontWeight: 'bold', letterSpacing: 2,
                background: mode === m ? '#0d0d28' : 'transparent',
                border: mode === m ? '1px solid #38bdf844' : '1px solid transparent',
                color: mode === m ? '#38bdf8' : '#4a4a7a',
                transition: 'all 0.15s',
              }}>{m === 'login' ? 'SIGN IN' : 'REGISTER'}</button>
            ))}
          </div>

          {/* Error */}
          {displayError && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8,
              background: '#2d0a0a18', border: '1px solid #ef4444',
              color: '#f87171', fontSize: 10, letterSpacing: 1 }}>
              ✗ {displayError}
            </div>
          )}

          {/* ── Fields ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Display name — register only */}
            {mode === 'register' && (
              <div>
                <Label text="DISPLAY NAME" optional />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Your name"
                  style={inputStyle}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <Label text="EMAIL" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <Label text="PASSWORD" />
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: showPass ? '#38bdf8' : '#4a4a7a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{ width: '100%', marginTop: 22, padding: 14, borderRadius: 10,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              background: isLoading ? '#06101a' : 'linear-gradient(135deg,#052e16,#065f2a)',
              border: `2px solid ${isLoading ? '#1a3a28' : '#22c55e'}`,
              color: isLoading ? '#4a7a60' : '#4ade80',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 'bold', letterSpacing: 3,
              opacity: isLoading ? 0.7 : 1, transition: 'all 0.2s',
              boxShadow: isLoading ? 'none' : '0 0 20px #22c55e22' }}>
            {isLoading ? '· · ·' : mode === 'login' ? '▶ SIGN IN' : '▶ CREATE ACCOUNT'}
          </button>

          {/* Switch mode */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ color: '#3a3a60', fontSize: 9 }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
              style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 9, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1, textDecoration: 'underline' }}>
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, color: '#2a2a50', fontSize: 8, letterSpacing: 2 }}>
          SIMULATION ONLY · NO REAL FUNDS INVOLVED
        </div>

      </div>
    </div>
  )
}