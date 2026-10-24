import { CLOSE_HOUR, OPEN_HOUR } from '../state/useOpenNow'

/** How far ahead people can order, and the gap between bookable times. */
export const DAYS_AHEAD = 7
export const SLOT_MINUTES = 30
/** Scheduled orders can be changed or cancelled until this long before their time. */
export const CHANGE_CUTOFF_MINS = 30

export type SlotState = 'open' | 'past' | 'full'

export interface Slot {
  at: number
  label: string
  state: SlotState
}

export interface SlotGroup {
  id: string
  label: string
  slots: Slot[]
}

export interface ScheduleDay {
  /** Midnight at the start of this day. */
  date: number
  label: string
  sub: string
  groups: SlotGroup[]
  openCount: number
  /** False when every time that day has already passed (e.g. late tonight). */
  hasFuture: boolean
}

const PARTS = [
  { id: 'lunch', label: 'Lunch', until: 14 },
  { id: 'afternoon', label: 'Afternoon', until: 17 },
  { id: 'evening', label: 'Evening', until: 20 },
  { id: 'night', label: 'Late night', until: 24 },
]

export const timeLabel = (at: number) => new Date(at).toLocaleTimeString('en-LK', { hour: 'numeric', minute: '2-digit' })

const startOfDay = (at: number) => {
  const d = new Date(at)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Bookable times run from 30 minutes after opening to 30 minutes before closing. */
const firstSlotMins = OPEN_HOUR * 60 + SLOT_MINUTES
const lastSlotMins = CLOSE_HOUR * 60 - SLOT_MINUTES

/** A stable stand-in for live store capacity: busy evenings and weekends fill up first. */
function isFull(storeId: string, at: number) {
  const d = new Date(at)
  const key = `${storeId}|${d.getFullYear()}-${d.getMonth()}-${d.getDate()}|${d.getHours()}:${d.getMinutes()}`
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  const roll = (h >>> 0) / 4294967295
  const weekend = d.getDay() === 5 || d.getDay() === 6
  const peak = d.getHours() >= 18 && d.getHours() < 21
  const chance = peak ? (weekend ? 0.5 : 0.3) : 0.06
  return roll < chance
}

/** Whether an order placed now could still be made today before closing. */
export function canOrderNow(now: number, leadMins: number) {
  const d = new Date(now)
  const mins = d.getHours() * 60 + d.getMinutes()
  return mins >= OPEN_HOUR * 60 && mins + leadMins <= CLOSE_HOUR * 60
}

/** When the stores next open, for the "we're closed" message. */
export function nextOpening(now: number) {
  const d = new Date(now)
  if (d.getHours() >= OPEN_HOUR) d.setDate(d.getDate() + 1)
  d.setHours(OPEN_HOUR, 0, 0, 0)
  return d.getTime()
}

export function dayLabel(at: number, now: number) {
  const diff = Math.round((startOfDay(at) - startOfDay(now)) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return new Date(at).toLocaleDateString('en-LK', { weekday: 'short' })
}

/** "Today, 4:15 PM", "Tomorrow, 12:30 PM" or "Sat 26 Oct, 4:15 PM". */
export function formatWhen(at: number, now: number) {
  const diff = Math.round((startOfDay(at) - startOfDay(now)) / 86_400_000)
  const day = diff <= 1 ? dayLabel(at, now) : new Date(at).toLocaleDateString('en-LK', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${day}, ${timeLabel(at)}`
}

/** The next seven days of bookable times for a store. */
export function scheduleDays(now: number, leadMins: number, storeId: string): ScheduleDay[] {
  const today = startOfDay(now)
  const earliest = now + leadMins * 60_000
  const days: ScheduleDay[] = []
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const base = new Date(today)
    base.setDate(base.getDate() + i)
    const date = base.getTime()
    const groups: SlotGroup[] = PARTS.map((p) => ({ id: p.id, label: p.label, slots: [] }))
    let openCount = 0
    for (let m = firstSlotMins; m <= lastSlotMins; m += SLOT_MINUTES) {
      const d = new Date(date)
      d.setHours(Math.floor(m / 60), m % 60, 0, 0)
      const at = d.getTime()
      const state: SlotState = at < earliest ? 'past' : isFull(storeId, at) ? 'full' : 'open'
      if (state === 'open') openCount++
      const part = PARTS.findIndex((p) => d.getHours() < p.until)
      groups[part].slots.push({ at, label: timeLabel(at), state })
    }
    days.push({
      date,
      label: dayLabel(date, now),
      sub: base.toLocaleDateString('en-LK', { day: 'numeric', month: 'short' }),
      // Parts of the day that are already over are left out rather than shown greyed.
      groups: groups.filter((g) => g.slots.some((s) => s.state !== 'past')),
      openCount,
      hasFuture: groups.some((g) => g.slots.some((s) => s.state !== 'past')),
    })
  }
  return days
}

/** The first bookable time, used when ordering while the store is closed. */
export function firstOpenSlot(now: number, leadMins: number, storeId: string) {
  for (const day of scheduleDays(now, leadMins, storeId)) {
    for (const g of day.groups) {
      const s = g.slots.find((x) => x.state === 'open')
      if (s) return s.at
    }
  }
  return null
}

/** Whether a chosen time can still be booked. */
export function slotStillOpen(at: number, now: number, leadMins: number, storeId: string) {
  return at >= now + leadMins * 60_000 && !isFull(storeId, at)
}
