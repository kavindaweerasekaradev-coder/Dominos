import { useId, useRef, useState } from 'react'
import { PRODUCT_BY_ID, type PizzaProduct } from '../data/menu'
import { scrollToSection } from '../lib/dom'
import { MOTION_OK, gsap, SplitText, useGSAP } from '../lib/gsap'
import { lkr } from '../lib/pricing'
import { useQuickAdd } from '../state/useQuickAdd'
import { useUntilMidnight } from '../state/useUntilMidnight'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'

const RING_TEXT = 'HOT & FRESH • MADE TO ORDER • DELIVERED ISLANDWIDE • '
const FEATURED = ['devilled-chicken', 'pepperoni-classic', 'kochchi-paneer', 'margherita'].map((id) => PRODUCT_BY_ID[id] as PizzaProduct)
const SLIDE_SECONDS = 5
const RING_LENGTH = 2 * Math.PI * 27
const TICKER = [
  `2 Medium pizzas for ${lkr(3990)}`,
  `Free delivery over ${lkr(4000)}`,
  '20% off Large pizzas',
  '15% off on pickup',
  'Best deal applied automatically',
  'Prices include all taxes',
  '50+ stores islandwide',
]

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const ringId = `ring${useId().replace(/:/g, '')}`
  const quickAdd = useQuickAdd()
  const timeLeft = useUntilMidnight()
  const [index, setIndex] = useState(0)
  // Visitors who ask for reduced motion get no automatic slideshow.
  const [playing, setPlaying] = useState(() => window.matchMedia(MOTION_OK).matches)
  const prev = useRef(0)
  const timer = useRef<gsap.core.Tween | null>(null)
  const pizza = FEATURED[index]

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
          .from(q('.hero__plate'), { scale: 0.4, rotate: -200, autoAlpha: 0, duration: 1.6, ease: 'expo.out' }, 0.3)
          .from(q('.hero__ring'), { scale: 0.8, autoAlpha: 0, duration: 1 }, 0.6)
          .from(q('.hero__burst'), { scale: 0, rotate: -180, duration: 0.9, ease: 'back.out(1.6)' }, 1.1)
          .from(q('.hero__info'), { y: 50, autoAlpha: 0, duration: 0.9 }, 1.15)
          .from(q('.ticker'), { autoAlpha: 0, duration: 0.6 }, 1.3)

        gsap.to(q('.hero__ring svg'), { rotate: 360, duration: 40, ease: 'none', repeat: -1 })
        gsap.to(q('.hero__plate-spin'), { rotate: 360, duration: 70, ease: 'none', repeat: -1 })
        gsap.to(q('.hero__burst-shape'), { rotate: 360, duration: 24, ease: 'none', repeat: -1 })
        gsap.to(q('.hero__glow'), { scale: 1.12, opacity: 0.8, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        q('.hero__steam path').forEach((el, i) =>
          gsap.fromTo(el, { y: 10, autoAlpha: 0 }, { y: -50, autoAlpha: 0.75, duration: 1.7, ease: 'sine.out', repeat: -1, yoyo: true, delay: 1.5 + i * 0.5 }),
        )
        gsap.to(q('.ticker__track'), { xPercent: -50, duration: 32, ease: 'none', repeat: -1 })

        // Scroll: the pizza grows and turns, the copy fades as the hero leaves.
        const scrub = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 }
        gsap.to(q('.hero__plate-scroll'), { rotate: 90, scale: 1.2, ease: 'none', scrollTrigger: scrub })
        gsap.to(q('.hero__copy'), { y: -60, opacity: 0.2, ease: 'none', scrollTrigger: scrub })

        if (window.matchMedia('(pointer: fine)').matches) {
          // The pizza follows the mouse slightly.
          const stage = q('.hero__stage')[0]
          const xTo = gsap.quickTo(stage, 'x', { duration: 0.8, ease: 'power3.out' })
          const yTo = gsap.quickTo(stage, 'y', { duration: 0.8, ease: 'power3.out' })
          const onMove = (e: PointerEvent) => {
            xTo((e.clientX / window.innerWidth - 0.5) * 30)
            yTo((e.clientY / window.innerHeight - 0.5) * 30)
          }
          window.addEventListener('pointermove', onMove)
          return () => window.removeEventListener('pointermove', onMove)
        }
      })
    },
    { scope: root },
  )

  // Slide change: the old pizza spins away as the new one spins in, and the details swap.
  useGSAP(
    () => {
      const from = prev.current
      prev.current = index
      if (from === index) return
      const q = gsap.utils.selector(root)
      const slides = q('.hero__slide')
      if (!window.matchMedia(MOTION_OK).matches) {
        gsap.set(slides[from], { autoAlpha: 0 })
        gsap.set(slides[index], { autoAlpha: 1 })
        return
      }
      gsap.to(slides[from], { rotate: 120, scale: 0.7, autoAlpha: 0, duration: 0.7, ease: 'power3.in' })
      gsap.fromTo(
        slides[index],
        { rotate: -140, scale: 1.25, autoAlpha: 0 },
        { rotate: 0, scale: 1, autoAlpha: 1, duration: 1.1, ease: 'expo.out', delay: 0.2 },
      )
      gsap.fromTo(q('.hero__swap'), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out', delay: 0.25 })
      gsap.fromTo(q('.hero__burst'), { scale: 0.5 }, { scale: 1, duration: 0.7, ease: 'back.out(2.2)', delay: 0.3 })
    },
    { scope: root, dependencies: [index] },
  )

  // Autoplay: the active thumbnail's ring fills up, then the next pizza comes in. Hovering the stage pauses it.
  useGSAP(
    (_, contextSafe) => {
      if (!playing) return
      const q = gsap.utils.selector(root)
      const ring = q(`.hero__thumb[data-i="${index}"] .hero__thumb-progress`)
      const tween = gsap.fromTo(
        ring,
        { strokeDashoffset: RING_LENGTH },
        { strokeDashoffset: 0, duration: SLIDE_SECONDS, ease: 'none', onComplete: () => setIndex((i) => (i + 1) % FEATURED.length) },
      )
      timer.current = tween
      const stage = q('.hero__visual')[0]
      const pause = contextSafe!(() => tween.pause())
      const resume = contextSafe!(() => tween.resume())
      stage.addEventListener('pointerenter', pause)
      stage.addEventListener('pointerleave', resume)
      stage.addEventListener('focusin', pause)
      stage.addEventListener('focusout', resume)
      return () => {
        stage.removeEventListener('pointerenter', pause)
        stage.removeEventListener('pointerleave', resume)
        stage.removeEventListener('focusin', pause)
        stage.removeEventListener('focusout', resume)
        gsap.set(ring, { strokeDashoffset: RING_LENGTH })
      }
    },
    { scope: root, dependencies: [index, playing], revertOnUpdate: true },
  )

  const addCurrent = () => quickAdd(pizza.id, { size: 'medium', from: root.current?.querySelectorAll<HTMLElement>('.hero__slide')[index] })

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

            <div className="hero__visual" aria-roledescription="carousel" aria-label="Featured pizzas">
              <div className="hero__stage">
                <div className="hero__ring" aria-hidden="true">
                  <svg viewBox="0 0 500 500">
                    <defs>
                      <path id={ringId} d="M250,250 m-232,0 a232,232 0 1,1 464,0 a232,232 0 1,1 -464,0" />
                    </defs>
                    <text>
                      <textPath href={`#${ringId}`} textLength="1450" lengthAdjust="spacing">
                        {RING_TEXT.repeat(2)}
                      </textPath>
                    </text>
                  </svg>
                </div>
                <svg className="hero__steam" viewBox="0 0 120 80" aria-hidden="true">
                  <path d="M30 78 C 18 62, 42 52, 30 36 S 38 12, 30 2" />
                  <path d="M60 78 C 48 62, 72 52, 60 36 S 68 12, 60 2" />
                  <path d="M90 78 C 78 62, 102 52, 90 36 S 98 12, 90 2" />
                </svg>
                {/* Separate layers so the intro, scroll zoom, slow spin and slide changes never fight over the same transform. */}
                <div className="hero__plate">
                  <div className="hero__plate-scroll">
                    <div className="hero__plate-spin">
                      {FEATURED.map((p, i) => (
                        <div key={p.id} className="hero__slide" aria-hidden={i !== index}>
                          <FoodPhoto photo={p.photo} width={900} alt={`${p.name} pizza`} eager={i === 0} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hero__burst" aria-hidden="true">
                  <svg className="hero__burst-shape" viewBox="0 0 100 100">
                    <polygon points={burstPoints(16, 50, 41)} />
                  </svg>
                  <span className="hero__burst-text">
                    <small>From</small>
                    <strong>{lkr(pizza.prices.personal)}</strong>
                  </span>
                </div>
              </div>

              <div className="hero__info">
                <div className="hero__info-top">
                  <span className="hero__info-label">
                    {pizza.badge ?? 'Featured'} · {index + 1}/{FEATURED.length}
                  </span>
                  <button
                    type="button"
                    className="hero__pause"
                    onClick={() => setPlaying((p) => !p)}
                    aria-label={playing ? 'Pause pizza slideshow' : 'Play pizza slideshow'}
                  >
                    <Icon name={playing ? 'pause' : 'play'} size={14} />
                  </button>
                </div>
                <div aria-live="polite">
                  <strong className="hero__swap hero__info-name">{pizza.name}</strong>
                  <p className="hero__swap hero__info-desc">{pizza.description}</p>
                </div>
                <div className="hero__swap hero__info-buy">
                  <span className="hero__info-price">
                    <small>Medium</small> {lkr(pizza.prices.medium)}
                  </span>
                  <button type="button" className="add-pill" onClick={addCurrent} aria-label={`Add Medium ${pizza.name} to cart`}>
                    <Icon name="plus" size={18} /> <span>Add</span>
                  </button>
                </div>
                <div className="hero__thumbs" role="tablist" aria-label="Choose a featured pizza">
                  {FEATURED.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      data-i={i}
                      aria-selected={i === index}
                      aria-label={p.name}
                      className="hero__thumb"
                      onClick={() => setIndex(i)}
                    >
                      <FoodPhoto photo={p.photo} width={56} />
                      <svg className="hero__thumb-ring" viewBox="0 0 60 60" aria-hidden="true">
                        <circle className="hero__thumb-progress" cx="30" cy="30" r="27" strokeDasharray={RING_LENGTH} strokeDashoffset={RING_LENGTH} />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ticker" aria-label="Current offers">
        <ul className="ticker__track">
          {[...TICKER, ...TICKER].map((t, i) => (
            <li key={i} aria-hidden={i >= TICKER.length}>
              <Icon name="sparkle" size={14} /> {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Points for a star-shaped price badge with `n` spikes. */
function burstPoints(n: number, outer: number, inner: number) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2
    return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`
  }).join(' ')
}
