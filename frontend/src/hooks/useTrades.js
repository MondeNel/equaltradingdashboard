import { useState, useCallback } from 'react'
import { tradesAPI } from '../services/api'

export function useTrades() {
  const [openTrades,  setOpenTrades]  = useState([])
  const [loading,     setLoading]     = useState(false)

  const fetchTrades = useCallback(async () => {
    try {
      const res = await tradesAPI.open()
      setOpenTrades(res.data)
    } catch (e) {
      console.error('trades fetch failed', e)
    }
  }, [])

  const closeTrade = async (tradeId) => {
    setLoading(true)
    try {
      await tradesAPI.close(tradeId)
      await fetchTrades()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.response?.data?.detail || 'Close failed' }
    } finally {
      setLoading(false)
    }
  }

  const closeAllTrades = async () => {
    setLoading(true)
    try {
      await tradesAPI.closeAll()
      await fetchTrades()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.response?.data?.detail || 'Close all failed' }
    } finally {
      setLoading(false)
    }
  }

  const placeTrade = async (data) => {
    setLoading(true)
    try {
      const res = await tradesAPI.place ? tradesAPI.place(data) : null
      await fetchTrades()
      return { ok: true, data: res?.data }
    } catch (e) {
      return { ok: false, error: e.response?.data?.detail || 'Trade failed' }
    } finally {
      setLoading(false)
    }
  }

  return { openTrades, fetchTrades, closeTrade, closeAllTrades, placeTrade, loading }
}