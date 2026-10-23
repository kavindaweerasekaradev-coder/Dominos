const PIPS: Record<1 | 2 | 3, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [30, 30],
    [70, 70],
  ],
  3: [
    [27, 27],
    [50, 50],
    [73, 73],
  ],
}

/** A domino tile like the ones on Domino's shopfronts and walls: a rounded square with pips. */
export function DominoTile({ pips, tone = 'blue', className = '' }: { pips: 1 | 2 | 3; tone?: 'blue' | 'red' | 'white'; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`domino domino--${tone} ${className}`} aria-hidden="true">
      <rect className="domino__face" x="4" y="4" width="92" height="92" rx="22" />
      {PIPS[pips].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} className="domino__pip" cx={cx} cy={cy} r="10" />
      ))}
    </svg>
  )
}

/** The two tilted tiles of the Domino's mark: blue with two pips, red with one. */
export function DominoMark({ size = 34, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true">
      <rect x="3" y="9" width="20" height="20" rx="5" transform="rotate(-20 13 19)" fill="#006491" />
      <rect x="15" y="9" width="20" height="20" rx="5" transform="rotate(-20 25 19)" fill="#E31837" />
      <circle cx="10.5" cy="17" r="2.4" fill="#fff" />
      <circle cx="15" cy="23.5" r="2.4" fill="#fff" />
      <circle cx="26" cy="18" r="2.4" fill="#fff" />
    </svg>
  )
}
