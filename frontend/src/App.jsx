import { useState, useEffect } from 'react'
import useAuthStore from './store/authStore'
import Login from './pages/Login'
import TradingDashboard from './TradingDashboard'

export default function App() {
  const { token, user, loadUser, logout } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadUser().finally(() => setReady(true))
  }, [])

  if (!ready) return (
    <div style={{ minHeight:'100vh', background:'#08080f', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#a78bfa', fontSize:16 }}>Loading...</div>
    </div>
  )

  if (!token || !user) return <Login onSuccess={() => loadUser()} />

  return <TradingDashboard user={user} onLogout={logout} />
}