import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CATEGORIES, PRODUCT_BY_ID, type CategoryId } from '../data/menu'
import { HOTLINE } from '../data/stores'
import { scrollToSection, showMenuCategory } from '../lib/dom'
import { MOTION_OK, gsap, useGSAP } from '../lib/gsap'
import { FREE_DELIVERY_FROM, MIN_DELIVERY_ORDER, lkr } from '../lib/pricing'
import { navigate, type Route } from '../lib/router'
import { useStore } from '../state/store'
import { OPEN_HOURS, useOpenNow } from '../state/useOpenNow'
import { useUi } from '../state/ui'
import { DominoTile } from './Domino'
import { FoodPhoto } from './FoodPhoto'
import { Logo } from './Header'
import { Icon, type IconName } from './Icon'

const TEL = `tel:${HOTLINE.replace(/\s/g, '')}`
const WALLETS = [
  { name: 'Genie', file: 'genie.png' },
  { name: 'eZ Cash', file: 'ezcash.png' },
  { name: 'FriMi', file: 'frimi.png' },
]

/** True on screens wider than a phone, where footer link lists are always open. */
function useWide() {
  const query = '(min-width: 601px)'
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return wide
}

/** A footer link list: an always-open column on wider screens, a tap-to-open section on phones. */
function Fold({
  id,
  title,
  wide,
  open,
  onToggle,
  children,
}: {
  id: string
  title: string
  wide: boolean
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  if (wide) {
    return (
      <>
        <h2 id={id}>{title}</h2>
        {children}
      </>
    )
  }
  return (
    <>
      <h2 id={id} className="footer-fold__head">
        <button type="button" aria-expanded={open} aria-controls={`${id}-list`} onClick={onToggle}>
          {title}
          <Icon name="chevronDown" size={18} />
        </button>
      </h2>
      <div id={`${id}-list`} className="footer-fold__body" hidden={!open}>
        {children}
      </div>
    </>
  )
}
const YEAR = new Date().getFullYear()

export function Footer({ route }: { route: Route }) {
  const root = useRef<HTMLElement>(null)
  const { state } = useStore()
  const { setLocationOpen, setCartOpen } = useUi()
  const open = useOpenNow()
  const onHome = route.name === 'home'
  const latest = state.orders[0]
  const wide = useWide()
  const [folds, setFolds] = useState<Set<string>>(() => new Set())
  const toggleFold = (id: string) =>
    setFolds((f) => {
      const next = new Set(f)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const [trackId, setTrackId] = useState('')
  const [trackError, setTrackError] = useState('')
  const track = (e: React.FormEvent) => {
    e.preventDefault()
    const raw = (trackId.trim() || latest?.id || '').toUpperCase().replace(/\s/g, '')
    const m = /^(?:DLK-?)?(\d{5})$/.exec(raw)
    if (!m) return setTrackError('Enter your order number, for example DLK-12345.')
    navigate(`/order/DLK-${m[1]}`)
  }

  const goTo = (section: string) => {
    if (onHome) scrollToSection(section)
    else navigate('/')
  }
  const pickCategory = (c: CategoryId) => (onHome ? showMenuCategory(c) : navigate('/'))
  // Scroll up and move keyboard focus to the top too, so the next Tab doesn't jump back down here.
  const toTop = () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia(MOTION_OK).matches ? 'smooth' : 'auto' })
    document.querySelector<HTMLElement>('.site-header a, .site-header button')?.focus({ preventScroll: true })
  }

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const q = gsap.utils.selector(root)
        if (q('.footer-cta').length) {
          gsap.from(q('.footer-cta'), {
            y: 60,
            scale: 0.96,
            autoAlpha: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: q('.footer-cta')[0], start: 'top 90%' },
          })
          gsap.to(q('.footer-cta__pizza'), {
            rotate: 160,
            ease: 'none',
            scrollTrigger: { trigger: q('.footer-cta')[0], start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          })
        }
        gsap.from(q('.footer-col, .footer-brand'), {
          y: 30,
          autoAlpha: 0,
          duration: 0.7,
          stagger: 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: q('.footer-main')[0], start: 'top 85%' },
        })
        // The slogan words rise in one after another.
        gsap.from(q('.footer-slogan span'), {
          yPercent: 40,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: q('.footer-slogan')[0], start: 'top 95%' },
        })
        gsap.from(q('.footer-perks li'), {
          y: 24,
          autoAlpha: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: { trigger: q('.footer-perks')[0], start: 'top 90%' },
        })
      })
    },
    { scope: root, dependencies: [route.name], revertOnUpdate: true },
  )

  const good: { icon: IconName; text: string }[] = [
    { icon: 'receipt', text: 'All prices include taxes' },
    { icon: 'scooter', text: `Free delivery over ${lkr(FREE_DELIVERY_FROM)}` },
    { icon: 'bag', text: `Minimum delivery order ${lkr(MIN_DELIVERY_ORDER)}` },
    { icon: 'tag', text: 'Best deal applied automatically' },
  ]

  return (
    <footer ref={root} className="site-footer">
      {route.name !== 'checkout' && (
        <div className="container">
          <section className="footer-cta" aria-labelledby="footer-cta-title">
            <div className="footer-cta__copy">
              <p className="footer-cta__kicker">
                <Icon name="flame" size={15} /> Hungry?
              </p>
              <h2 id="footer-cta-title">
                Hot pizza at your door in <span className="footer-cta__mark">about 30 minutes.</span>
              </h2>
              <p className="footer-cta__sub">Free delivery over {lkr(FREE_DELIVERY_FROM)}. Prices include all taxes, and the best deal is applied for you.</p>
              <div className="footer-cta__actions">
                <button type="button" className="btn btn--white btn--lg" onClick={() => goTo('menu')}>
                  Order now <Icon name="chevronRight" size={18} className="btn__arrow" />
                </button>
                <a className="btn btn--glass btn--lg" href={TEL} aria-label={`Call Domino’s on ${HOTLINE}`}>
                  <Icon name="phone" size={18} /> {HOTLINE}
                </a>
              </div>
            </div>
            <div className="footer-cta__visual" aria-hidden="true">
              <span className="footer-cta__orbit" />
              <div className="footer-cta__pizza">
                <FoodPhoto photo={PRODUCT_BY_ID['pepperoni-classic'].photo} width={560} />
              </div>
              <span className="footer-cta__chip">
                <Icon name="clock" size={16} />
                <span>
                  <strong>30 min</strong>
                  <small>to your door</small>
                </span>
              </span>
              <DominoTile pips={2} tone="white" className="footer-cta__tile" />
            </div>
          </section>
        </div>
      )}

      <div className="footer-main">
        <div className="container">
          <ul className="footer-perks" aria-label="Good to know">
            {good.map((g) => (
              <li key={g.text}>
                <span className="footer-perks__icon">
                  <Icon name={g.icon} size={20} />
                </span>
                {g.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="container footer-grid">
          <div className="footer-brand">
            <Logo />
            <p>Hot, fresh pizza from 50+ stores across Sri Lanka, made to order and delivered fast.</p>
            <p className={`footer-open ${open ? 'is-open' : ''}`}>
              <span className="footer-open__dot" aria-hidden="true" />
              <span>
                <strong>{open ? 'Open now' : 'Closed now'}</strong> · {OPEN_HOURS}
              </span>
            </p>
          </div>

          <nav className="footer-col" aria-labelledby="f-menu">
            <Fold id="f-menu" title="Menu" wide={wide} open={folds.has('menu')} onToggle={() => toggleFold('menu')}>
              <ul>
                {CATEGORIES.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => pickCategory(c.id)}>
                      {c.label} <Icon name="chevronRight" size={14} />
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => goTo('deals')}>
                    Today’s deals <Icon name="chevronRight" size={14} />
                  </button>
                </li>
              </ul>
            </Fold>
          </nav>

          <nav className="footer-col" aria-labelledby="f-order">
            <Fold id="f-order" title="Your order" wide={wide} open={folds.has('order')} onToggle={() => toggleFold('order')}>
              <ul>
                <li>
                  <button type="button" onClick={() => setCartOpen(true)}>
                    View cart <Icon name="chevronRight" size={14} />
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLocationOpen(true)}>
                    Delivery or pickup <Icon name="chevronRight" size={14} />
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLocationOpen(true)}>
                    Find your store <Icon name="chevronRight" size={14} />
                  </button>
                </li>
              </ul>
              {/* Track an order by its number, prefilled with the latest one on this device. */}
              <form className="footer-track" onSubmit={track} noValidate>
                <label htmlFor="track-id">Track an order</label>
                <div className="footer-track__row">
                  <input
                    id="track-id"
                    value={trackId}
                    onChange={(e) => {
                      setTrackId(e.target.value)
                      setTrackError('')
                    }}
                    placeholder={latest?.id ?? 'DLK-12345'}
                    autoCapitalize="characters"
                    aria-invalid={!!trackError}
                    aria-describedby={trackError ? 'track-error' : undefined}
                  />
                  <button type="submit">Track</button>
                </div>
                {trackError && (
                  <p id="track-error" className="footer-track__error" role="alert">
                    {trackError}
                  </p>
                )}
              </form>
            </Fold>
          </nav>

          <div className="footer-col footer-contact">
            <h2>Get in touch</h2>
            <a className="footer-hotline" href={TEL} aria-label={`Call the Domino’s hotline, ${HOTLINE}`}>
              <span className="footer-hotline__icon">
                <Icon name="phone" size={20} />
              </span>
              <span>
                <small>Hotline</small>
                <strong>{HOTLINE}</strong>
              </span>
            </a>
            <p className="footer-pay-title">We accept</p>
            <ul className="footer-pay">
              <li>
                <Icon name="cash" size={16} /> Cash
              </li>
              <li>
                <Icon name="card" size={16} /> Card
              </li>
              <li>
                <Icon name="qr" size={16} /> LankaQR
              </li>
            </ul>
            <p className="footer-wallets">
              <span>Mobile wallets</span>
              {WALLETS.map((w) => (
                <img key={w.name} src={`${import.meta.env.BASE_URL}wallets/${w.file}`} alt={w.name} title={w.name} />
              ))}
            </p>
          </div>
        </div>

        <p className="container footer-slogan" aria-hidden="true">
          {['Hot', 'Fresh', 'Yours'].map((w) => (
            <span key={w}>
              {w}
              <i />
            </span>
          ))}
        </p>

        <div className="container footer-bottom">
          <p>
            © {YEAR} Design concept for a redesigned ordering experience. Not affiliated with or endorsed by Domino’s Pizza. Food photos from{' '}
            <a href="https://unsplash.com" target="_blank" rel="noreferrer">
              Unsplash<span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
          <button type="button" className="footer-top" onClick={toTop}>
            Back to top
            <span className="footer-top__icon">
              <Icon name="chevronDown" size={16} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  )
}
