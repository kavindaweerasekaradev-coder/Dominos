import { useId, useMemo, useState } from 'react'
import { scheduleDays } from '../lib/schedule'

interface Props {
  value: number | null
  onChange: (at: number) => void
  now: number
  leadMins: number
  storeId: string
  /** e.g. "Pickup time" — used to name the groups for screen readers. */
  label: string
}

/** Day chips for the next week, then that day's times grouped into lunch, afternoon, evening and night. */
export function SchedulePicker({ value, onChange, now, leadMins, storeId, label }: Props) {
  const name = useId()
  const days = useMemo(() => scheduleDays(now, leadMins, storeId), [now, leadMins, storeId])
  const valueDay = value == null ? -1 : days.findIndex((d) => value >= d.date && value < d.date + 86_400_000)
  const [picked, setPicked] = useState(() =>
    valueDay >= 0
      ? valueDay
      : Math.max(
          0,
          days.findIndex((d) => d.openCount > 0),
        ),
  )
  const dayIndex = Math.min(picked, days.length - 1)
  const day = days[dayIndex]

  return (
    <div className="sched">
      <div className="sched__days" role="radiogroup" aria-label={`${label}: day`}>
        {days.map((d, i) => (
          <button
            key={d.date}
            type="button"
            role="radio"
            aria-checked={i === dayIndex}
            className={`sched__day ${i === dayIndex ? 'is-on' : ''} ${valueDay === i ? 'has-value' : ''}`}
            disabled={d.openCount === 0}
            onClick={() => setPicked(i)}
          >
            <strong>{d.label}</strong>
            <span>{d.sub}</span>
            <small>{d.openCount ? `${d.openCount} times` : d.hasFuture ? 'Full' : 'Closed'}</small>
          </button>
        ))}
      </div>

      {day.groups.map((g) => (
        <div key={g.id} className="sched__group" role="radiogroup" aria-label={`${label}: ${day.label}, ${g.label.toLowerCase()}`}>
          <span className="sched__part">{g.label}</span>
          <div className="sched__slots">
            {g.slots.map((s) => (
              <label key={s.at} className={`when__slot ${value === s.at ? 'is-on' : ''} ${s.state !== 'open' ? `is-${s.state}` : ''}`}>
                <input type="radio" name={name} checked={value === s.at} disabled={s.state !== 'open'} onChange={() => onChange(s.at)} />
                {s.label}
                {s.state === 'full' && <small>Full</small>}
                {s.state !== 'open' && <span className="sr-only">{s.state === 'full' ? ', fully booked' : ', no longer available'}</span>}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
