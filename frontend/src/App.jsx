import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import Login from './pages/Login'
import TradingDashboard from './TradingDashboard'

export default function App() {
  const { token, user, loadUser } = useAuthStore()

  // On mount — if token exists, load the user profile
  useEffect(() => {
    if (token && !user) loadUser()
  }, [])

  // Not logged in — show login
  if (!token || !user) return <Login />

  // Logged in — show dashboard
  return <TradingDashboard />
}