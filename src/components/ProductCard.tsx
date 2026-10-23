import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { SIZES, type Product, type SizeId } from '../data/menu'
import { gsap, useGSAP } from '../lib/gsap'
import { lkr } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { useQuickAdd } from '../state/useQuickAdd'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'

export function TagList({ product }: { product: Product }) {
  return (
    <span className="tags">
      {product.tags.includes('veg') && product.category !== 'drinks' && (
        <span className="tag tag--veg">
          <Icon name="leaf" size={13} /> Veg
        </span>
      )}
      {product.tags.includes('spicy') && (
        <span className="tag tag--spicy">
          <Icon name="flame" size={13} /> Spicy
        </span>
      )}
    </span>
  )
}

export function ProductCard({ product }: { product: Product }) {
  const { openProduct } = useUi()
  const quickAdd = useQuickAdd()
  const { state } = useStore()
  const [size, setSize] = useState<SizeId>('medium')
  const [added, setAdded] = useState(false)
  const card = useRef<HTMLElement>(null)
  const media = useRef<HTMLDivElement>(null)
  const inCart = state.cart.filter((i) => i.productId === product.id).reduce((s, i) => s + i.qty, 0)
  const isPizza = product.category === 'pizza'
  const price = isPizza ? product.prices[size] : product.price
  const sizeInfo = SIZES.find((s) => s.id === size)!

  useEffect(() => {
    if (!added) return
    const t = window.setTimeout(() => setAdded(false), 1400)
    return () => window.clearTimeout(t)
  }, [added])

  // Subtle 3D tilt that follows the mouse, on devices with a precise pointer.
  useGSAP(
    (_, contextSafe) => {
      if (!window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
      const el = card.current!
      gsap.set(el, { transformPerspective: 900 })
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' })
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' })
      const move = contextSafe!((e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        ry(((e.clientX - r.left) / r.width - 0.5) * 8)
        rx(-((e.clientY - r.top) / r.height - 0.5) * 8)
      })
      const leave = contextSafe!(() => (rx(0), ry(0)))
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      return () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      }
    },
    { scope: card },
  )

  const add = () => {
    quickAdd(product.id, { size, from: media.current })
    setAdded(true)
  }
  const customise = () => openProduct(product.id)

  return (
    <article ref={card} className="product-card">
      <div ref={media} className="product-card__media">
        <FoodPhoto photo={product.photo} width={480} />
        {isPizza && <button type="button" className="product-card__media-link" onClick={customise} tabIndex={-1} aria-hidden="true" />}
        {product.badge && (
          <span className={`badge ${product.badge === 'New' ? 'badge--new' : ''}`}>
            <Icon name="sparkle" size={12} /> {product.badge}
          </span>
        )}
        {inCart > 0 && (
          <span className="in-cart">
            <Icon name="bag" size={13} /> {inCart}
            <span className="sr-only"> in cart</span>
          </span>
        )}
      </div>

      <div className="product-card__body">
        <div className="product-card__meta">
          <TagList product={product} />
        </div>
        <h3 className="product-card__name">
          {isPizza ? (
            <button type="button" onClick={customise}>
              {product.name}
            </button>
          ) : (
            product.name
          )}
        </h3>
        <p className="product-card__desc">{product.description}</p>

        {isPizza && (
          <div
            className="size-pick"
            role="radiogroup"
            aria-label={`Size for ${product.name}`}
            style={{ '--i': SIZES.findIndex((s) => s.id === size) } as CSSProperties}
          >
            {SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={size === s.id}
                aria-label={`${s.label}, ${lkr(product.prices[s.id])}`}
                onClick={() => setSize(s.id)}
              >
                {s.inches}″
              </button>
            ))}
          </div>
        )}

        <div className="product-card__foot">
          <div className="price-block">
            <span className="price" aria-live="polite">
              <span className="price__cur">Rs</span>
              {lkr(price).replace('Rs ', '')}
            </span>
            <span className="price-note">
              {isPizza ? (
                <>
                  {sizeInfo.label}
                  <span className="price-note__serves"> · {sizeInfo.serves}</span>
                </>
              ) : (
                product.unit
              )}
            </span>
          </div>
          <button
            type="button"
            className={`add-pill ${added ? 'is-added' : ''}`}
            onClick={add}
            aria-label={`Add ${isPizza ? `${sizeInfo.label} ` : ''}${product.name} to cart`}
          >
            <Icon name={added ? 'check' : 'plus'} size={18} />
            <span>{added ? 'Added' : 'Add'}</span>
          </button>
        </div>

        {isPizza && (
          <div className="product-card__extra">
            {size === 'medium' ? (
              <span className="deal-hint">
                <Icon name="tag" size={13} /> 2 for {lkr(3990)}
              </span>
            ) : (
              <span />
            )}
            <button type="button" className="link-btn link-btn--sm" onClick={customise}>
              Customise <Icon name="chevronRight" size={14} />
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
