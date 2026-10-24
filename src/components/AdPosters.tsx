import { useRef } from 'react'
import { PRODUCT_BY_ID, type PizzaProduct } from '../data/menu'
import { lkr } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { useQuickAdd } from '../state/useQuickAdd'
import { DominoMark } from './Domino'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'

type Action = 'pizzas' | 'pickup' | 'cake'
interface Ad {
  id: string
  tone: 'blue' | 'red'
  /** Headline lines; the line marked `big` is set larger. */
  lines: { text: string; big?: boolean }[]
  sticker: { label: string; value: string; unit?: string; was?: string }
  chips: string[]
  photo: string
  live?: boolean
  cta: { label: string; action: Action }
}

const pepperoni = PRODUCT_BY_ID['pepperoni-classic'] as PizzaProduct

// Every poster is one of the real deals, so the prices here are the prices the cart gives.
const ADS: Ad[] = [
  {
    id: 'cheese-games',
    tone: 'blue',
    lines: [{ text: 'Let the' }, { text: 'cheese', big: true }, { text: 'games' }, { text: 'begin' }],
    sticker: { label: '2 Medium pizzas', value: lkr(3990).replace('Rs ', ''), unit: 'Rs', was: lkr(pepperoni.prices.medium * 2) },
    chips: ['Any 2 mediums', 'Delivery & pickup'],
    photo: 'margherita',
    live: true,
    cta: { label: 'Pick 2 pizzas', action: 'pizzas' },
  },
  {
    id: 'go-big',
    tone: 'red',
    lines: [{ text: 'Go big' }, { text: 'or go', big: true }, { text: 'home!' }],
    sticker: { label: 'Every Large pizza', value: '20%', unit: 'OFF' },
    chips: ['Orders Rs 5,000+', 'Delivery & pickup'],
    photo: 'pepperoni-classic',
    cta: { label: 'Shop Large pizzas', action: 'pizzas' },
  },
  {
    id: 'can-wait',
    tone: 'blue',
    lines: [{ text: 'Everything' }, { text: 'else can', big: true }, { text: 'wait!' }],
    sticker: { label: 'Every pizza on pickup', value: '15%', unit: 'OFF' },
    chips: ['Pickup only', 'No minimum order'],
    photo: 'bbq-chicken',
    live: true,
    cta: { label: 'Switch to pickup', action: 'pickup' },
  },
  {
    id: 'dessert',
    tone: 'red',
    lines: [{ text: 'Dessert’s' }, { text: 'on us', big: true }],
    sticker: { label: 'Chocolate Fudge Cake', value: 'FREE', was: lkr(590) },
    chips: ['Orders Rs 4,500+', 'One per order'],
    photo: 'fudge-cake',
    cta: { label: 'Add the cake', action: 'cake' },
  },
]

/** Hand-drawn swoosh lines beside the headline, like the strokes on Domino's posters. */
function Swoosh() {
  return (
    <svg className="ad__swoosh" viewBox="0 0 60 40" aria-hidden="true">
      <path d="M4 30 Q 30 22 56 8" />
      <path d="M10 38 Q 34 32 54 22" />
      <path d="M48 2 L 54 6" />
    </svg>
  )
}

export function AdPosters({ onPickPizzas }: { onPickPizzas: () => void }) {
  const { state, dispatch } = useStore()
  const { setLocationOpen, showToast } = useUi()
  const quickAdd = useQuickAdd()
  const photos = useRef<Record<string, HTMLDivElement | null>>({})

  const run = (ad: Ad) => {
    if (ad.cta.action === 'pizzas') return onPickPizzas()
    if (ad.cta.action === 'cake') return quickAdd('fudge-cake', { from: photos.current[ad.id] })
    if (state.fulfilment !== 'pickup') {
      dispatch({ type: 'setFulfilment', fulfilment: 'pickup' })
      showToast({ text: 'Switched to pickup. 15% off pizzas is now available.' })
    }
    if (!state.location) setLocationOpen(true)
  }

  return (
    <section className="container section ads" aria-labelledby="ads-title">
      <div className="ads__head">
        <div>
          <p className="eyebrow">Latest from Domino’s</p>
          <h2 id="ads-title">Fresh offers, live now</h2>
        </div>
        <p className="section__note">
          <Icon name="sparkle" size={14} /> Applied automatically at checkout
        </p>
      </div>

      <div className="ads__track">
        {ADS.map((ad) => {
          const product = PRODUCT_BY_ID[ad.photo]
          return (
            <article
              key={ad.id}
              className={`ad ad--${ad.tone}`}
              aria-label={`${ad.lines.map((l) => l.text).join(' ')}: ${ad.sticker.label} ${ad.sticker.value}`}
            >
              <span className="ad__band" aria-hidden="true" />
              <span className="ad__logo" aria-hidden="true">
                <DominoMark size={22} /> Domino’s
              </span>
              <span className="ad__tcs" aria-hidden="true">
                *T&amp;Cs apply
              </span>

              <h3 className="ad__headline">
                {ad.lines.map((l, i) => (
                  <span key={l.text} className={l.big ? 'is-big' : undefined}>
                    {l.text}
                    {i === ad.lines.length - 1 && <Swoosh />}
                  </span>
                ))}
              </h3>

              <div
                className="ad__photo"
                ref={(el) => {
                  photos.current[ad.id] = el
                }}
              >
                <FoodPhoto photo={product.photo} width={520} />
              </div>

              <div className="ad__sticker">
                <span className="ad__sticker-label">{ad.sticker.label}</span>
                <span className="ad__sticker-value">
                  {ad.sticker.unit === 'Rs' && <small className="ad__sticker-rs">Rs</small>}
                  {ad.sticker.value}
                  {ad.sticker.unit && ad.sticker.unit !== 'Rs' && <small className="ad__sticker-unit">{ad.sticker.unit}</small>}
                </span>
                {ad.sticker.was && <s className="ad__sticker-was">{ad.sticker.was}</s>}
              </div>

              {ad.live && (
                <span className="ad__live" aria-hidden="true">
                  Live
                  <br />
                  now!
                </span>
              )}

              <div className="ad__foot">
                <ul className="ad__chips">
                  {ad.chips.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <button type="button" className="ad__cta" onClick={() => run(ad)}>
                  {ad.cta.label} <Icon name="chevronRight" size={16} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
