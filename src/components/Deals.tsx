import { Fragment, useRef } from 'react'
import { PRODUCTS, PRODUCT_BY_ID } from '../data/menu'
import { MOTION_OK, gsap, useGSAP } from '../lib/gsap'
import { DEALS, checkCoupon, lkr, type Deal } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { useQuickAdd } from '../state/useQuickAdd'
import { useUntilMidnight } from '../state/useUntilMidnight'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'

const DEAL = Object.fromEntries(DEALS.map((d) => [d.code, d])) as Record<string, Deal>

// Biggest saving on the 2-Mediums deal: the two priciest Medium pizzas for Rs 3,990.
const MEDIUMS = PRODUCTS.flatMap((p) => (p.category === 'pizza' ? [p.prices.medium] : [])).sort((a, b) => b - a)
const DUO_MAX_SAVING = MEDIUMS[0] + MEDIUMS[1] - 3990

const CLOCK_UNITS = ['hrs', 'min', 'sec']

const COUPONS = [
  { code: 'BIG20', value: 20, unit: '%', label: 'off Large', tone: 'blue' },
  { code: 'SWEET', value: 0, unit: 'free', label: 'chocolate cake', tone: 'red' },
  { code: 'PICKUP15', value: 15, unit: '%', label: 'off on pickup', tone: 'navy' },
] as const

/** Where the shopper stands on a deal right now, based on their cart. */
function useDealStatus() {
  const { state, totals } = useStore()
  return (code: string): { kind: 'applied' | 'unlocked' | 'hint'; text: string } => {
    if (totals.applied?.deal.code === code) return { kind: 'applied', text: `Applied. You’re saving ${lkr(totals.applied.saving)}` }
    const check = checkCoupon(code, state.cart, state.fulfilment)
    if (check.ok) return { kind: 'unlocked', text: `Unlocked. Saves ${lkr(check.result.saving)}, but another deal saves you more` }
    return { kind: 'hint', text: check.message }
  }
}

function Status({ code }: { code: string }) {
  const status = useDealStatus()(code)
  return (
    <p className={`deal-status deal-status--${status.kind}`} aria-live="polite">
      <Icon name={status.kind === 'hint' ? 'sparkle' : 'check'} size={14} /> {status.text}
    </p>
  )
}

function Terms({ deal }: { deal: Deal }) {
  return (
    <details className="deal-terms">
      <summary>Terms</summary>
      <ul>
        {deal.terms.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </details>
  )
}

export function Deals({ onPickPizzas }: { onPickPizzas: () => void }) {
  const root = useRef<HTMLElement>(null)
  const { state, dispatch } = useStore()
  const { setLocationOpen, showToast } = useUi()
  const quickAdd = useQuickAdd()
  const timeLeft = useUntilMidnight()
  const duo = DEAL.DUO

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const q = gsap.utils.selector(root)
        const trigger = { trigger: root.current, start: 'top 75%' }

        gsap
          .timeline({ scrollTrigger: trigger, defaults: { ease: 'power3.out' } })
          .from(q('.deals__head > *'), { y: 30, autoAlpha: 0, duration: 0.7, stagger: 0.08 })
          .from(q('.deal-feature'), { x: -80, rotate: -3, autoAlpha: 0, duration: 0.9 }, 0.15)
          .from(q('.deal-feature__pizza'), { scale: 0.3, rotate: -180, autoAlpha: 0, duration: 1.2, ease: 'back.out(1.4)', stagger: 0.15 }, 0.4)
          .from(q('.deal-coupon'), { x: 80, autoAlpha: 0, duration: 0.8, stagger: 0.12 }, 0.3)

        // Savings numbers count up when the section comes into view.
        q('[data-count]').forEach((el) => {
          const to = Number(el.getAttribute('data-count'))
          const fmt = el.getAttribute('data-fmt')
          const n = { v: 0 }
          gsap.to(n, {
            v: to,
            duration: 1.4,
            ease: 'power2.out',
            delay: 0.5,
            scrollTrigger: trigger,
            onUpdate: () => {
              el.textContent = fmt === 'lkr' ? lkr(n.v) : String(Math.round(n.v))
            },
          })
        })

        // Ambient: the feature pizzas turn slowly and a shine sweeps across each coupon now and then.
        q('.deal-feature__pizza').forEach((el, i) => gsap.to(el, { rotate: i ? -360 : 360, duration: 40, ease: 'none', repeat: -1 }))
        q('.deal-coupon__shine').forEach((el, i) =>
          gsap.fromTo(el, { xPercent: -150 }, { xPercent: 250, duration: 1.1, ease: 'power2.inOut', repeat: -1, repeatDelay: 5, delay: 2 + i * 0.6 }),
        )
      })
    },
    { scope: root },
  )

  const cta = (code: string): { label: string; run?: (from: HTMLElement | null) => void } => {
    switch (code) {
      case 'BIG20':
        return { label: 'Shop Large pizzas', run: onPickPizzas }
      case 'SWEET':
        return { label: 'Add the cake', run: (from) => quickAdd('fudge-cake', { from }) }
      case 'PICKUP15':
        return state.fulfilment === 'pickup'
          ? { label: 'Pickup selected', run: undefined }
          : {
              label: 'Switch to pickup',
              run: () => {
                dispatch({ type: 'setFulfilment', fulfilment: 'pickup' })
                if (!state.location) setLocationOpen(true)
                showToast({ text: 'Switched to pickup. 15% off pizzas is now available.' })
              },
            }
    }
    return { label: 'See menu', run: onPickPizzas }
  }

  return (
    <section ref={root} id="deals" className="container deals" aria-labelledby="deals-title">
      <div className="deals__head">
        <div>
          <p className="eyebrow">Today’s deals</p>
          <h2 id="deals-title">Deals worth ordering for</h2>
          <p className="deals__sub">No codes needed. We apply the one that saves you most.</p>
        </div>
        <div className="deals__timer" role="timer" aria-label={`Today’s deals end in ${timeLeft}`}>
          <span className="deals__timer-label">
            <Icon name="clock" size={14} /> Ends tonight in
          </span>
          <span className="deals__clock" aria-hidden="true">
            {timeLeft.split(':').map((part, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="deals__colon">:</span>}
                <span className="deals__digit">
                  <b>{part}</b>
                  <small>{CLOCK_UNITS[i]}</small>
                </span>
              </Fragment>
            ))}
          </span>
        </div>
      </div>

      <div className="deals__grid">
        <article className="deal-feature" aria-labelledby="deal-duo">
          <span className="deal-code">{duo.code}</span>
          <p className="deal-feature__kicker">
            <Icon name="flame" size={14} /> Best seller
          </p>
          <h3 id="deal-duo" className="deal-feature__title">
            2 Medium pizzas
            <span>
              for <b>{lkr(3990)}</b>
            </span>
          </h3>
          <p className="deal-feature__save">
            Save up to{' '}
            <b data-count={DUO_MAX_SAVING} data-fmt="lkr">
              {lkr(DUO_MAX_SAVING)}
            </b>
          </p>
          <p className="deal-feature__summary">{duo.summary} Pick any two from the menu and the price drops automatically.</p>
          <Status code="DUO" />
          <div className="deal-feature__actions">
            <button type="button" className="btn btn--white btn--lg" onClick={onPickPizzas}>
              Choose 2 pizzas <Icon name="chevronRight" size={18} className="btn__arrow" />
            </button>
            <Terms deal={duo} />
          </div>
          <div className="deal-feature__pizzas" aria-hidden="true">
            {['pepperoni-classic', 'kochchi-paneer'].map((id) => (
              <span key={id} className="deal-feature__pizza">
                <FoodPhoto photo={PRODUCT_BY_ID[id].photo} width={420} />
              </span>
            ))}
            <span className="deal-feature__plus">
              <Icon name="plus" size={26} />
            </span>
          </div>
        </article>

        {COUPONS.map((c) => {
          const deal = DEAL[c.code]
          const action = cta(c.code)
          return (
            <article key={c.code} className={`deal-coupon deal-coupon--${c.tone}`} aria-labelledby={`deal-${c.code}`}>
              <span className="deal-coupon__shine" aria-hidden="true" />
              <div className="deal-coupon__stub">
                <p className="deal-coupon__value">
                  {c.unit === 'free' ? (
                    'FREE'
                  ) : (
                    <>
                      <b data-count={c.value}>{c.value}</b>%
                    </>
                  )}
                </p>
                <p className="deal-coupon__unit">{c.label}</p>
                <span className="deal-code">{c.code}</span>
              </div>
              <div className="deal-coupon__body">
                <h3 id={`deal-${c.code}`} className="deal-coupon__title">
                  {deal.title}
                </h3>
                <p className="deal-coupon__summary">{deal.summary}</p>
                <Status code={c.code} />
                <div className="deal-coupon__actions">
                  <button
                    type="button"
                    className="deal-coupon__btn"
                    disabled={!action.run}
                    onClick={(e) => action.run?.(e.currentTarget.closest('.deal-coupon')?.querySelector<HTMLElement>('.deal-coupon__stub') ?? null)}
                  >
                    {action.label} <Icon name={action.run ? 'chevronRight' : 'check'} size={15} />
                  </button>
                  <Terms deal={deal} />
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
