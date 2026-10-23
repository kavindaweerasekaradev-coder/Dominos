import { useRef } from 'react'
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
const YEAR = new Date().getFullYear()

export function Footer({ route }: { route: Route }) {
  const root = useRef<HTMLElement>(null)
  const { state } = useStore()
  const { setLocationOpen, setCartOpen } = useUi()
  const open = useOpenNow()
  const onHome = route.name === 'home'
  const latest = state.orders[0]

  const goTo = (section: string) => {
    if (onHome) scrollToSection(section)
    else navigate('/')
  }
  const pickCategory = (c: CategoryId) => (onHome ? showMenuCategory(c) : navigate('/'))
  const toTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia(MOTION_OK).matches ? 'smooth' : 'auto' })

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
        gsap.from(q('.footer-col, .footer-brand > *'), {
          y: 30,
          autoAlpha: 0,
          duration: 0.7,
          stagger: 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: q('.footer-main')[0], start: 'top 85%' },
        })
        // The big slogan slides sideways as the footer scrolls past.
        gsap.fromTo(
          q('.footer-slogan span'),
          { xPercent: 6 },
          { xPercent: -14, ease: 'none', scrollTrigger: { trigger: q('.footer-slogan')[0], start: 'top bottom', end: 'bottom top', scrub: 0.8 } },
        )
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
                <a className="btn btn--glass btn--lg" href={TEL}>
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
        <div className="container footer-grid">
          <div className="footer-brand">
            <Logo />
            <p>Hot, fresh pizza from 50+ stores across Sri Lanka, made to order and delivered fast.</p>
            <a className="footer-hotline" href={TEL}>
              <span className="footer-hotline__icon">
                <Icon name="phone" size={20} />
              </span>
              <span>
                <small>Hotline</small>
                <strong>{HOTLINE}</strong>
              </span>
            </a>
            <p className={`footer-open ${open ? 'is-open' : ''}`}>
              <span className="footer-open__dot" aria-hidden="true" />
              {open ? 'Open now' : 'Closed now'} · {OPEN_HOURS}
            </p>
          </div>

          <nav className="footer-col" aria-labelledby="f-menu">
            <h2 id="f-menu">Menu</h2>
            <ul>
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => pickCategory(c.id)}>
                    {c.label}
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => goTo('deals')}>
                  Today’s deals
                </button>
              </li>
            </ul>
          </nav>

          <nav className="footer-col" aria-labelledby="f-order">
            <h2 id="f-order">Your order</h2>
            <ul>
              <li>
                <button type="button" onClick={() => setCartOpen(true)}>
                  View cart
                </button>
              </li>
              {latest && (
                <li>
                  <a href={`#/order/${latest.id}`}>Track order {latest.id}</a>
                </li>
              )}
              <li>
                <button type="button" onClick={() => setLocationOpen(true)}>
                  Delivery or pickup
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setLocationOpen(true)}>
                  Find your store
                </button>
              </li>
            </ul>
          </nav>

          <div className="footer-col">
            <h2>Good to know</h2>
            <ul className="footer-good">
              {good.map((g) => (
                <li key={g.text}>
                  <Icon name={g.icon} size={16} /> {g.text}
                </li>
              ))}
            </ul>
            <p className="footer-pay-title">We accept</p>
            <ul className="footer-pay">
              <li>
                <Icon name="cash" size={16} /> Cash
              </li>
              <li>
                <Icon name="card" size={16} /> Card
              </li>
              <li>
                <Icon name="shield" size={16} /> Online
              </li>
            </ul>
          </div>
        </div>

        <p className="footer-slogan" aria-hidden="true">
          <span>Hot. Fresh. Yours. Hot. Fresh. Yours.</span>
        </p>

        <div className="container footer-bottom">
          <p>
            © {YEAR} Design concept for a redesigned ordering experience. Not affiliated with or endorsed by Domino’s Pizza. Food photos from{' '}
            <a href="https://unsplash.com" target="_blank" rel="noreferrer">
              Unsplash
            </a>
            .
          </p>
          <button type="button" className="footer-top" onClick={toTop}>
            Back to top <Icon name="chevronDown" size={16} />
          </button>
        </div>
      </div>
    </footer>
  )
}
