import { useState, useCallback } from 'react'
import { walletAPI } from '../services/api'

export function useWallet() {
  const [wallet,  setWallet]  = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchWallet = useCallback(async () => {
    try {
      const res = await walletAPI.get()
      setWallet(res.data)
    } catch (e) {
      console.error('wallet fetch failed', e)
    }
  }, [])

  const deposit = async (amount) => {
    setLoading(true)
    try {
      await walletAPI.deposit(amount)
      await fetchWallet()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.response?.data?.detail || 'Deposit failed' }
    } finally {
      setLoading(false)
    }
  }

  const withdraw = async (amount) => {
    setLoading(true)
    try {
      await walletAPI.withdraw(amount)
      await fetchWallet()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.response?.data?.detail || 'Withdraw failed' }
    } finally {
      setLoading(false)
    }
  }

  return { wallet, fetchWallet, deposit, withdraw, loading }
}