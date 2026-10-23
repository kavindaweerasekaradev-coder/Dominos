import { useRef } from 'react'
import { HOTLINE } from '../data/stores'
import { MOTION_OK, gsap, useGSAP } from '../lib/gsap'
import { useUi } from '../state/ui'
import { OPEN_HOURS, useOpenNow } from '../state/useOpenNow'
import { DominoMark, DominoTile } from './Domino'
import { Icon } from './Icon'

const TEL = `tel:${HOTLINE.replace(/\s/g, '')}`
const WORDS = ['Hot', 'Fresh', 'Delivered']
const STATS = [
  { value: '50+', label: 'stores islandwide' },
  { value: '30', label: 'minute delivery' },
  { value: '7', label: 'days a week' },
]

/** A Domino's shopfront: the wall graphic of big type and domino tiles, the lit sign and the fascia stripe. */
export function StoreWall() {
  const { setLocationOpen } = useUi()
  const open = useOpenNow()
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const q = gsap.utils.selector(root)
        const trigger = { trigger: root.current, start: 'top 75%', once: true }
        gsap
          .timeline({ scrollTrigger: trigger, defaults: { ease: 'power3.out' } })
          .from(q('.store-wall__word'), { yPercent: 110, duration: 0.8, stagger: 0.1 })
          .from(q('.store-wall__copy > :not(h2)'), { y: 24, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, 0.3)
          .from(q('.store-wall__tile'), { scale: 0, rotate: -90, duration: 0.9, stagger: 0.12, ease: 'back.out(1.6)' }, 0.2)
          .from(q('.store-wall__sign'), { y: -30, autoAlpha: 0, duration: 0.6 }, 0.6)
        // The tiles drift gently, like a sign turning in the breeze.
        q('.store-wall__float').forEach((el, i) =>
          gsap.to(el, { y: i % 2 ? 14 : -14, rotate: i % 2 ? -4 : 4, duration: 3 + i * 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
        )
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="container store-wall-wrap" aria-labelledby="store-wall-title">
      <div className="store-wall">
        <div className="store-wall__copy">
          <p className="store-wall__kicker">
            <DominoMark size={22} /> Your local Domino’s
          </p>
          <h2 id="store-wall-title" className="store-wall__title">
            {WORDS.map((w) => (
              <span key={w} className="store-wall__line">
                <span className="store-wall__word">
                  {w}
                  <span className="store-wall__pip" aria-hidden="true" />
                </span>
              </span>
            ))}
          </h2>
          <p className="store-wall__sub">Every pizza is made fresh to order in our open kitchens, from Colombo to Kandy and Galle.</p>
          <ul className="store-wall__stats">
            {STATS.map((s) => (
              <li key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
          <div className="store-wall__ctas">
            <button type="button" className="btn btn--white btn--lg" onClick={() => setLocationOpen(true)}>
              <Icon name="pin" size={18} /> Find your store
            </button>
            <a className="btn btn--glass btn--lg" href={TEL}>
              <Icon name="phone" size={18} /> {HOTLINE}
            </a>
          </div>
        </div>

        <div className="store-wall__art" aria-hidden="true">
          <div className={`store-wall__sign ${open ? 'is-open' : ''}`}>
            <span className="store-wall__sign-dot" />
            <strong>{open ? 'Open' : 'Closed'}</strong>
            <small>{OPEN_HOURS}</small>
          </div>
          <div className="store-wall__float store-wall__float--a">
            <DominoTile pips={3} tone="white" className="store-wall__tile" />
          </div>
          <div className="store-wall__float store-wall__float--b">
            <DominoTile pips={2} tone="red" className="store-wall__tile" />
          </div>
          <div className="store-wall__float store-wall__float--c">
            <DominoTile pips={1} tone="red" className="store-wall__tile" />
          </div>
        </div>

        <div className="store-wall__stripe" aria-hidden="true" />
      </div>
    </section>
  )
}
