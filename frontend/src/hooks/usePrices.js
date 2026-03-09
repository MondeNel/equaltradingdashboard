import { useState, useEffect, useRef } from 'react'
import { BASE_PRICES } from '../constants'

export function usePrices(symbol) {
  const [livePrice,  setLivePrice]  = useState(BASE_PRICES[symbol] ?? 1)
  const [livePrices, setLivePrices] = useState({ ...BASE_PRICES })

  // Drift live price for current symbol
  useEffect(() => {
    setLivePrice(BASE_PRICES[symbol] ?? 1)
  }, [symbol])

  useEffect(() => {
    const id = setInterval(() => {
      setLivePrice(prev => {
        const base  = BASE_PRICES[symbol] ?? prev
        const drift = (Math.random() - 0.49) * base * 0.0004
        return Math.max(base * 0.985, Math.min(base * 1.015, prev + drift))
      })
    }, 400)
    return () => clearInterval(id)
  }, [symbol])

  // Drift all prices for PnL calculation
  useEffect(() => {
    const id = setInterval(() => {
      setLivePrices(prev => {
        const next = { ...prev }
        Object.keys(BASE_PRICES).forEach(sym => {
          const base  = BASE_PRICES[sym]
          const drift = (Math.random() - 0.49) * base * 0.0003
          next[sym] = Math.max(base * 0.985, Math.min(base * 1.015, (prev[sym] ?? base) + drift))
        })
        return next
      })
    }, 800)
    return () => clearInterval(id)
  }, [])

  return { livePrice, livePrices }
}