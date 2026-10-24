import { PRODUCT_BY_ID, type PizzaProduct } from '../data/menu'
import { lkr } from '../lib/pricing'
import { DominoMark } from './Domino'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'

interface Ad {
  id: string
  tone: 'blue' | 'red'
  /** Headline lines; the line marked `mark` sits on a coloured marker block. */
  lines: { text: string; mark?: boolean }[]
  tag: { label: string; value: string; unit?: string; was?: string }
  terms: string
  photo: string
  cta: string
}

const pepperoni = PRODUCT_BY_ID['pepperoni-classic'] as PizzaProduct

// Each banner is one of the real deals, so the price shown is the price the cart gives.
const ADS: Ad[] = [
  {
    id: 'cheese-games',
    tone: 'blue',
    lines: [{ text: 'Let the' }, { text: 'cheese', mark: true }, { text: 'games' }, { text: 'begin' }],
    tag: { label: '2 Medium pizzas', value: lkr(3990).replace('Rs ', ''), unit: 'Rs', was: lkr(pepperoni.prices.medium * 2) },
    terms: 'Any two mediums · Delivery & pickup',
    photo: 'margherita',
    cta: 'Pick 2 pizzas',
  },
  {
    id: 'go-big',
    tone: 'red',
    lines: [{ text: 'Go big' }, { text: 'or go', mark: true }, { text: 'home!' }],
    tag: { label: 'Every Large pizza', value: '20%', unit: 'OFF' },
    terms: 'Orders Rs 5,000+ · Delivery & pickup',
    photo: 'pepperoni-classic',
    cta: 'Shop Large pizzas',
  },
]

/** Two campaign banners in Domino's colours, each a live deal with one clear action. */
export function AdPosters({ onPickPizzas }: { onPickPizzas: () => void }) {
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
        {ADS.map((ad) => (
          <article key={ad.id} className={`ad ad--${ad.tone}`} aria-labelledby={`ad-${ad.id}`}>
            <span className="ad__glow" aria-hidden="true" />
            <div className="ad__photo" aria-hidden="true">
              <div className="ad__photo-spin">
                <FoodPhoto photo={PRODUCT_BY_ID[ad.photo].photo} width={640} />
              </div>
            </div>

            <div className="ad__top">
              <span className="ad__logo">
                <DominoMark size={20} /> Domino’s
              </span>
              <span className="ad__live">
                <i aria-hidden="true" /> Live now
              </span>
            </div>

            <div className="ad__copy">
              <h3 id={`ad-${ad.id}`} className="ad__headline">
                {ad.lines.map((l) => (
                  <span key={l.text} className={l.mark ? 'is-mark' : undefined}>
                    {l.text}
                  </span>
                ))}
              </h3>

              <p className="ad__tag">
                <span className="ad__tag-label">{ad.tag.label}</span>
                <span className="ad__tag-row">
                  <strong className="ad__tag-value">
                    {ad.tag.unit === 'Rs' && <small>Rs</small>}
                    {ad.tag.value}
                    {ad.tag.unit && ad.tag.unit !== 'Rs' && <small>{ad.tag.unit}</small>}
                  </strong>
                  {ad.tag.was && (
                    <s className="ad__tag-was">
                      <span className="sr-only">was </span>
                      {ad.tag.was}
                    </s>
                  )}
                </span>
              </p>

              <p className="ad__terms">{ad.terms}</p>

              <button type="button" className="ad__cta" onClick={onPickPizzas}>
                {ad.cta} <Icon name="chevronRight" size={17} />
              </button>
            </div>

            <span className="ad__tcs" aria-hidden="true">
              *T&amp;Cs apply
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
