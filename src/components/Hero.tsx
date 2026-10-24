import { useId, useRef, useState, type CSSProperties } from 'react'
import { PRODUCT_BY_ID, SIZES, type PizzaProduct, type SizeId } from '../data/menu'
import { scrollToSection } from '../lib/dom'
import { MOTION_OK, gsap, SplitText, useGSAP } from '../lib/gsap'
import { lkr } from '../lib/pricing'
import { useUi } from '../state/ui'
import { useQuickAdd } from '../state/useQuickAdd'
import { useUntilMidnight } from '../state/useUntilMidnight'
import { FoodPhoto } from './FoodPhoto'
import { DominoTile } from './Domino'
import { Icon, type IconName } from './Icon'

const FEATURED = ['devilled-chicken', 'pepperoni-classic', 'kochchi-paneer', 'margherita'].map((id) => PRODUCT_BY_ID[id] as PizzaProduct)
const SLIDE_SECONDS = 5
const MOTION_ALLOWED = window.matchMedia(MOTION_OK).matches
const TICKER: { icon: IconName; key: string; text: string }[] = [
  { icon: 'tag', key: lkr(3990), text: 'for 2 Medium pizzas' },
  { icon: 'scooter', key: 'Free delivery', text: `over ${lkr(4000)}` },
  { icon: 'pizza', key: '20% off', text: 'Large pizzas' },
  { icon: 'store', key: '15% off', text: 'on pickup' },
  { icon: 'sparkle', key: 'Best deal', text: 'applied automatically' },
  { icon: 'receipt', key: 'All taxes', text: 'included in prices' },
  { icon: 'pin', key: '50+ stores', text: 'islandwide' },
]

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const smokeId = `smoke${useId().replace(/:/g, '')}`
  const quickAdd = useQuickAdd()
  const { openProduct } = useUi()
  const timeLeft = useUntilMidnight()
  const [index, setIndex] = useState(0)
  const [size, setSize] = useState<SizeId>('medium')
  // Visitors who ask for reduced motion get no automatic slideshow.
  const [playing, setPlaying] = useState(() => window.matchMedia(MOTION_OK).matches)
  const [dragX, setDragX] = useState(0)
  const drag = useRef<{ x: number; moved: boolean } | null>(null)
  const ticker = useRef<gsap.core.Tween | null>(null)
  const [tickerOn, setTickerOn] = useState(MOTION_ALLOWED)
  // The offers ribbon pauses while it's hovered, and stays paused if the visitor stops it.
  const syncTicker = (on: boolean) => (on ? ticker.current?.play() : ticker.current?.pause())
  const pizza = FEATURED[index]
  const count = FEATURED.length
  const go = (n: number) => setIndex(((n % count) + count) % count)

  // Intro, ambient motion and scroll effects.
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const q = gsap.utils.selector(root)

        SplitText.create(q('.hero__title')[0], {
          type: 'words',
          mask: 'words',
          autoSplit: true,
          onSplit: (self) => gsap.from(self.words, { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.07, delay: 0.25 }),
        })
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from(q('.hero__card'), { scale: 0.96, autoAlpha: 0, duration: 0.8 })
          .from(q('.hero__pill'), { y: 16, autoAlpha: 0, duration: 0.6 }, 0.3)
          .from(q('.hero__sub, .hero__deal, .hero__ctas > *, .hero__proof li'), { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.07 }, 0.7)
          .from(q('.hero__deck'), { y: 80, rotate: -10, autoAlpha: 0, duration: 1.2, ease: 'expo.out' }, 0.4)
          .from(q('.hero__stories'), { y: -16, autoAlpha: 0, duration: 0.6 }, 1)
          .from(q('.hero__panel'), { y: 40, autoAlpha: 0, duration: 0.9 }, 1.1)
          .from(q('.ticker'), { autoAlpha: 0, duration: 0.6 }, 1.3)

        ticker.current = gsap.to(q('.ticker__track'), { xPercent: -50, duration: 40, ease: 'none', repeat: -1 })

        // Scroll: the deck tilts away gently and the copy fades as the hero leaves.
        const scrub = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 }
        gsap.to(q('.hero__deck'), { y: 40, rotate: -4, ease: 'none', scrollTrigger: scrub })
        gsap.to(q('.hero__copy'), { y: -60, opacity: 0.2, ease: 'none', scrollTrigger: scrub })

        if (window.matchMedia('(pointer: fine)').matches) {
          // The deck follows the mouse slightly.
          const stage = q('.hero__stage')[0]
          const xTo = gsap.quickTo(stage, 'x', { duration: 0.8, ease: 'power3.out' })
          const yTo = gsap.quickTo(stage, 'y', { duration: 0.8, ease: 'power3.out' })
          const onMove = (e: PointerEvent) => {
            xTo((e.clientX / window.innerWidth - 0.5) * 16)
            yTo((e.clientY / window.innerHeight - 0.5) * 16)
          }
          window.addEventListener('pointermove', onMove)
          return () => window.removeEventListener('pointermove', onMove)
        }
      })
    },
    { scope: root },
  )

  // Autoplay: the active story bar fills, then the next card comes forward. Hovering or focusing the deck pauses it.
  useGSAP(
    (_, contextSafe) => {
      if (!playing) return
      const q = gsap.utils.selector(root)
      const fill = q(`.hero__story[data-i="${index}"] .hero__story-fill`)
      const tween = gsap.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: SLIDE_SECONDS, ease: 'none', onComplete: () => go(index + 1) })
      const area = q('.hero__visual')[0]
      const pause = contextSafe!(() => tween.pause())
      const resume = contextSafe!(() => tween.resume())
      area.addEventListener('pointerenter', pause)
      area.addEventListener('pointerleave', resume)
      area.addEventListener('focusin', pause)
      area.addEventListener('focusout', resume)
      return () => {
        area.removeEventListener('pointerenter', pause)
        area.removeEventListener('pointerleave', resume)
        area.removeEventListener('focusin', pause)
        area.removeEventListener('focusout', resume)
        gsap.set(fill, { clearProps: 'transform' })
      }
    },
    { scope: root, dependencies: [index, playing], revertOnUpdate: true },
  )

  // Swipe or drag the front card left or right to change pizza.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    if (Math.abs(dx) > 6) drag.current.moved = true
    setDragX(dx)
  }
  const onPointerUp = () => {
    if (!drag.current) return
    if (dragX < -60) go(index + 1)
    else if (dragX > 60) go(index - 1)
    else if (!drag.current.moved) openProduct(pizza.id)
    drag.current = null
    setDragX(0)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(index + 1)
    if (e.key === 'ArrowLeft') go(index - 1)
  }

  const sizeInfo = SIZES.find((x) => x.id === size)!
  const addCurrent = () => quickAdd(pizza.id, { size, from: root.current?.querySelector<HTMLElement>('.hero__deck-card.is-front') })

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title">
      <div className="container">
        <div className="hero__card">
          <div className="hero__glow" aria-hidden="true" />
          <div className="hero__inner">
            <div className="hero__copy">
              <span className="hero__pill">
                <Icon name="flame" size={15} /> Hot & fresh in about 30 minutes
              </span>
              <h1 id="hero-title" className="hero__title">
                Hot pizza, <span className="hero__accent">made your way.</span>
              </h1>
              <p className="hero__sub">
                Cheesy, fresh from the oven and at your door in about 30 minutes. Real prices on every size, and the best deal is always applied for you.
              </p>
              <button type="button" className="hero__deal" onClick={() => scrollToSection('deals')}>
                <span className="hero__deal-tag">
                  <Icon name="tag" size={14} /> Today
                </span>
                <span>
                  2 Medium pizzas for <b>{lkr(3990)}</b>
                </span>
                <span className="hero__deal-timer" role="timer">
                  <Icon name="clock" size={13} /> {timeLeft}
                </span>
              </button>
              <div className="hero__ctas">
                <button type="button" className="btn btn--hot btn--lg" onClick={() => scrollToSection('menu')}>
                  Order now <Icon name="chevronRight" size={18} className="btn__arrow" />
                </button>
                <button type="button" className="btn btn--glass btn--lg" onClick={() => scrollToSection('deals')}>
                  <Icon name="tag" size={18} /> See today’s deals
                </button>
              </div>
              <ul className="hero__proof">
                <li>
                  <Icon name="store" size={16} /> 50+ stores islandwide
                </li>
                <li>
                  <Icon name="clock" size={16} /> ~30 min delivery
                </li>
                <li>
                  <Icon name="receipt" size={16} /> Taxes included
                </li>
              </ul>
            </div>

            <div className="hero__visual" role="region" aria-roledescription="carousel" aria-label="Featured pizzas" onKeyDown={onKeyDown}>
              <div className="hero__stories">
                {FEATURED.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    data-i={i}
                    className={`hero__story ${i < index ? 'is-done' : ''} ${i === index ? 'is-active' : ''}`}
                    aria-label={`Show ${p.name}`}
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => go(i)}
                  >
                    <span className="hero__story-fill" />
                  </button>
                ))}
                <button
                  type="button"
                  className="hero__pause"
                  onClick={() => setPlaying((v) => !v)}
                  aria-label={playing ? 'Pause pizza slideshow' : 'Play pizza slideshow'}
                >
                  <Icon name={playing ? 'pause' : 'play'} size={13} />
                </button>
              </div>

              <div className="hero__stage">
                {/* Steam: soft puffs rise off the pizza; the SVG filter breaks them into wisps. */}
                <svg className="hero__smoke-defs" aria-hidden="true" focusable="false">
                  <filter id={smokeId} x="-30%" y="-30%" width="160%" height="160%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.011 0.018" numOctaves="2" seed="7" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="60" xChannelSelector="R" yChannelSelector="G" />
                    <feGaussianBlur stdDeviation="3.5" />
                  </filter>
                </svg>
                <div className="hero__smoke" style={{ filter: `url(#${smokeId})` }} aria-hidden="true">
                  {Array.from({ length: 9 }, (_, i) => (
                    <span key={i} />
                  ))}
                </div>

                {/* A fanned deck: the front card is the current pizza, the next two peek out behind it. */}
                <div className="hero__deck">
                  {FEATURED.map((p, i) => {
                    const pos = (i - index + count) % count
                    const front = pos === 0
                    return (
                      <div
                        key={p.id}
                        className={`hero__deck-card pos-${pos} ${front ? 'is-front' : ''} ${front && dragX ? 'is-dragging' : ''}`}
                        style={front && dragX ? ({ '--dx': dragX } as CSSProperties) : undefined}
                        aria-hidden={!front}
                        {...(front ? { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } : {})}
                      >
                        <FoodPhoto photo={p.photo} width={720} alt={front ? `${p.name} pizza` : ''} eager={i === 0} />
                        <div className="hero__deck-info">
                          <span className="hero__deck-badge">
                            <Icon name="sparkle" size={12} /> {p.badge ?? 'Featured'}
                          </span>
                          <strong className="hero__deck-name">{p.name}</strong>
                          <span className="hero__deck-desc">{p.description}</span>
                        </div>
                      </div>
                    )
                  })}
                  <button type="button" className="hero__nav hero__nav--prev" onClick={() => go(index - 1)} aria-label="Previous pizza">
                    <Icon name="chevronLeft" size={20} />
                  </button>
                  <button type="button" className="hero__nav hero__nav--next" onClick={() => go(index + 1)} aria-label="Next pizza">
                    <Icon name="chevronRight" size={20} />
                  </button>
                </div>
              </div>

              <p className="sr-only" aria-live="polite">
                {pizza.name}, {index + 1} of {count}
              </p>

              {/* Order straight from the hero: pick a size and add it. */}
              <div className="hero__panel">
                <div className="hero__sizes" role="radiogroup" aria-label={`Size for ${pizza.name}`}>
                  {SIZES.map((sz) => (
                    <button key={sz.id} type="button" role="radio" aria-checked={size === sz.id} className="hero__size" onClick={() => setSize(sz.id)}>
                      <strong>{sz.inches}″</strong>
                      <span>{sz.label}</span>
                    </button>
                  ))}
                </div>
                <div className="hero__buy">
                  <span className="hero__buy-price">
                    <small>{sizeInfo.serves}</small>
                    <strong>{lkr(pizza.prices[size])}</strong>
                  </span>
                  <button type="button" className="hero__add" onClick={addCurrent} aria-label={`Add ${sizeInfo.label} ${pizza.name} to cart`}>
                    <Icon name="plus" size={20} /> Add
                  </button>
                </div>
                <button type="button" className="hero__customise" onClick={() => openProduct(pizza.id)}>
                  Customise crust & toppings <Icon name="chevronRight" size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ticker" onMouseEnter={() => syncTicker(false)} onMouseLeave={() => syncTicker(tickerOn)}>
        <div className="ticker__back" aria-hidden="true" />
        <div className="ticker__band">
          <ul className="ticker__track" aria-label="Current offers">
            {[...TICKER, ...TICKER].map((t, i) => (
              <li key={i} aria-hidden={i >= TICKER.length}>
                <Icon name={t.icon} size={18} />
                <strong className="ticker__key">{t.key}</strong>
                {t.text}
                <DominoTile pips={((i % 3) + 1) as 1 | 2 | 3} tone="white" className="ticker__tile" />
              </li>
            ))}
          </ul>
          {MOTION_ALLOWED && (
            <button
              type="button"
              className="ticker__toggle"
              onClick={() => {
                const on = !tickerOn
                setTickerOn(on)
                syncTicker(on)
              }}
              aria-label={tickerOn ? 'Pause offers ribbon' : 'Play offers ribbon'}
            >
              <Icon name={tickerOn ? 'pause' : 'play'} size={14} />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
