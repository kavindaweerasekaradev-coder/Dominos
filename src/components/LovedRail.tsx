import { useEffect, useRef, useState } from 'react'
import { SIZES, fromPrice, type Product } from '../data/menu'
import { lkr } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { useQuickAdd } from '../state/useQuickAdd'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'
import { TagList } from './ProductCard'

const MEDIUM = SIZES.find((s) => s.id === 'medium')!

/** A tall photo card for the most-loved slider, ranked by popularity. */
function LovedCard({ product, rank }: { product: Product; rank: number }) {
  const { openProduct } = useUi()
  const quickAdd = useQuickAdd()
  const { state } = useStore()
  const [added, setAdded] = useState(false)
  const media = useRef<HTMLDivElement>(null)
  const isPizza = product.category === 'pizza'
  const price = isPizza ? product.prices.medium : fromPrice(product)
  const inCart = state.cart.filter((i) => i.productId === product.id).reduce((s, i) => s + i.qty, 0)

  useEffect(() => {
    if (!added) return
    const t = window.setTimeout(() => setAdded(false), 1400)
    return () => window.clearTimeout(t)
  }, [added])

  const add = () => {
    quickAdd(product.id, { size: 'medium', from: media.current })
    setAdded(true)
  }

  return (
    <article className="loved-card">
      <div ref={media} className="loved-card__media">
        <FoodPhoto photo={product.photo} width={640} />
      </div>
      <span className="loved-card__rank" aria-hidden="true">
        #{rank}
      </span>
      {inCart > 0 && (
        <span className="in-cart">
          <Icon name="bag" size={13} /> {inCart}
          <span className="sr-only"> in cart</span>
        </span>
      )}

      <div className="loved-card__body">
        <div className="loved-card__meta">
          {product.badge && <span className="loved-card__badge">{product.badge}</span>}
          <TagList product={product} />
        </div>
        <h3 className="loved-card__name">
          {isPizza ? (
            <button type="button" onClick={() => openProduct(product.id)}>
              {product.name}
            </button>
          ) : (
            product.name
          )}
        </h3>
        <p className="loved-card__desc">{product.description}</p>
        <div className="loved-card__foot">
          <div className="loved-card__price">
            <strong>{lkr(price)}</strong>
            <span>{isPizza ? `${MEDIUM.label} · ${MEDIUM.serves}` : product.unit}</span>
          </div>
          <button type="button" className={`loved-card__add ${added ? 'is-added' : ''}`} onClick={add} aria-label={`Add ${product.name} to cart`}>
            <Icon name={added ? 'check' : 'plus'} size={20} />
          </button>
        </div>
        {isPizza && (
          <button type="button" className="loved-card__custom" onClick={() => openProduct(product.id)}>
            Choose size & toppings <Icon name="chevronRight" size={14} />
          </button>
        )}
      </div>
    </article>
  )
}

/** Horizontal slider of the most-ordered items, with arrows and a progress bar. */
export function LovedRail({ title, note, products }: { title: string; note: string; products: Product[] }) {
  const track = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const [ends, setEnds] = useState({ start: true, end: false, scrolls: true })

  useEffect(() => {
    const el = track.current!
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const max = el.scrollWidth - el.clientWidth
        const share = el.clientWidth / el.scrollWidth
        bar.current?.style.setProperty('--size', String(share))
        bar.current?.style.setProperty('--pos', String(max > 0 ? (el.scrollLeft / max) * (1 - share) : 0))
        const next = { start: el.scrollLeft <= 8, end: el.scrollLeft >= max - 8, scrolls: max > 8 }
        setEnds((e) => (e.start === next.start && e.end === next.end && e.scrolls === next.scrolls ? e : next))
      })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  const scroll = (dir: number) => {
    const el = track.current!
    const card = el.firstElementChild as HTMLElement | null
    const step = card ? card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0') : el.clientWidth * 0.8
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <section className="container section loved" aria-labelledby="rail-title">
      <div className="loved__head">
        <div>
          <p className="eyebrow">Most loved</p>
          <h2 id="rail-title">{title}</h2>
          <p className="section__note">
            <Icon name="sparkle" size={14} /> {note}
          </p>
        </div>
        {ends.scrolls && (
          <div className="loved__arrows">
            <button type="button" className="loved__arrow" onClick={() => scroll(-1)} disabled={ends.start} aria-label="Previous">
              <Icon name="chevronLeft" />
            </button>
            <button type="button" className="loved__arrow" onClick={() => scroll(1)} disabled={ends.end} aria-label="Next">
              <Icon name="chevronRight" />
            </button>
          </div>
        )}
      </div>
      <div className={`loved__track ${ends.end ? '' : 'has-more'}`} ref={track}>
        {products.map((p, i) => (
          <LovedCard key={p.id} product={p} rank={i + 1} />
        ))}
      </div>
      {ends.scrolls && (
        <div className="loved__progress" aria-hidden="true">
          <span ref={bar} />
        </div>
      )}
    </section>
  )
}
