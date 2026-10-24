import { describe, expect, it } from 'vitest'
import { canOrderNow, firstOpenSlot, formatWhen, nextOpening, scheduleDays, slotStillOpen } from './schedule'

// Friday 23 October 2026, local time.
const at = (h: number, m = 0, day = 23) => new Date(2026, 9, day, h, m).getTime()

describe('scheduleDays', () => {
  it('offers seven days of half-hourly times between opening and closing', () => {
    const days = scheduleDays(at(8), 20, 'col-03')
    expect(days).toHaveLength(7)
    const tomorrow = days[1].groups.flatMap((g) => g.slots)
    expect(tomorrow[0].label).toBe(new Date(at(10, 30, 24)).toLocaleTimeString('en-LK', { hour: 'numeric', minute: '2-digit' }))
    expect(tomorrow).toHaveLength(25)
  })

  it('marks times inside the lead time as passed and hides finished parts of the day', () => {
    const today = scheduleDays(at(14, 10), 20, 'col-03')[0]
    const slots = today.groups.flatMap((g) => g.slots)
    expect(slots.find((s) => s.at === at(14))?.state).toBe('past')
    expect(slots.find((s) => s.at === at(14, 30))?.state).not.toBe('past')
    expect(today.groups.map((g) => g.id)).not.toContain('lunch')
  })

  it('has nothing left today late at night', () => {
    const today = scheduleDays(at(23, 40), 35, 'col-03')[0]
    expect(today.openCount).toBe(0)
    expect(today.hasFuture).toBe(false)
  })
})

describe('ordering now vs ahead', () => {
  it('only takes orders for now while the kitchen can finish before closing', () => {
    expect(canOrderNow(at(9, 59), 20)).toBe(false)
    expect(canOrderNow(at(14), 20)).toBe(true)
    expect(canOrderNow(at(22, 50), 20)).toBe(false)
  })

  it('points to the next opening and first free time when closed', () => {
    expect(nextOpening(at(23, 40))).toBe(at(10, 0, 24))
    expect(nextOpening(at(7))).toBe(at(10))
    const first = firstOpenSlot(at(23, 40), 35, 'col-03')!
    expect(first).toBeGreaterThanOrEqual(at(10, 30, 24))
    expect(slotStillOpen(first, at(23, 40), 35, 'col-03')).toBe(true)
  })

  it('rejects a time that has passed', () => {
    expect(slotStillOpen(at(14), at(14, 10), 20, 'col-03')).toBe(false)
  })
})

describe('formatWhen', () => {
  it('names today and tomorrow, and dates further out', () => {
    expect(formatWhen(at(19), at(9))).toMatch(/^Today, /)
    expect(formatWhen(at(19, 0, 24), at(9))).toMatch(/^Tomorrow, /)
    expect(formatWhen(at(19, 0, 27), at(9))).not.toMatch(/^(Today|Tomorrow)/)
  })
})
