import { useEffect, useState } from 'react'

export const OPEN_HOUR = 10
export const CLOSE_HOUR = 23
export const OPEN_HOURS = 'Daily 10:00 am – 11:00 pm'

/** Whether stores are open right now, refreshed every minute. */
export function useOpenNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(t)
  }, [])
  const h = now.getHours()
  return h >= OPEN_HOUR && h < CLOSE_HOUR
}
