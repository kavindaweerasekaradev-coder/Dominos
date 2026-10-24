import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, PRODUCTS, PRODUCT_BY_ID, type CategoryId } from '../data/menu'
import { STORE_BY_ID } from '../data/stores'
import { newKey } from '../lib/id'
import { onShowMenuCategory, scrollToSection } from '../lib/dom'
import { MOTION_OK, ScrollTrigger, gsap, useGSAP } from '../lib/gsap'
import { describeItem, lkr } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { Deals } from './Deals'
import { FoodPhoto } from './FoodPhoto'
import { Hero } from './Hero'
import { Icon, type IconName } from './Icon'
import { LovedRail } from './LovedRail'
import { ProductCard } from './ProductCard'
import { StoreWall } from './StoreWall'

type Filter = 'veg' | 'spicy'

function Toolbar({
  category,
  setCategory,
  filters,
  toggleFilter,
  query,
  setQuery,
  onSearch,
}: {
  category: CategoryId | 'all'
  setCategory: (c: CategoryId | 'all') => void
  filters: Set<Filter>
  toggleFilter: (f: Filter) => void
  query: string
  setQuery: (q: string) => void
  onSearch: () => void
}) {
  const chips: { id: CategoryId | 'all'; label: string }[] = [{ id: 'all', label: 'All' }, ...CATEGORIES]
  return (
    <div className="toolbar">
      <div className="container toolbar__inner">
        <div className="chip-row" role="tablist" aria-label="Menu categories">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              className={`chip ${category === c.id ? 'is-on' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
          <span className="chip-row__divider" aria-hidden="true" />
          <button
            type="button"
            aria-pressed={filters.has('veg')}
            className={`chip chip--filter ${filters.has('veg') ? 'is-on' : ''}`}
            onClick={() => toggleFilter('veg')}
          >
            <Icon name="leaf" size={15} /> Veg only
          </button>
          <button
            type="button"
            aria-pressed={filters.has('spicy')}
            className={`chip chip--filter ${filters.has('spicy') ? 'is-on' : ''}`}
            onClick={() => toggleFilter('spicy')}
          >
            <Icon name="flame" size={15} /> Spicy
          </button>
        </div>
        <form
          className="toolbar__search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            onSearch()
          }}
        >
          <Icon name="search" size={18} />
          <label htmlFor="menu-search" className="sr-only">
            Search the menu
          </label>
          <input id="menu-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pizzas, “spicy”, “veg”…" />
        </form>
      </div>
    </div>
  )
}

const HOW_STEPS: { icon: IconName; tone: 'blue' | 'red' | 'navy'; label: string; title: string; text: string; proof: string }[] = [
  {
    icon: 'receipt',
    tone: 'blue',
    label: 'Pick',
    title: 'Real prices, up front',
    text: 'Every size is priced on the menu. Taxes are included and fees are shown before checkout.',
    proof: 'Taxes included',
  },
  {
    icon: 'tag',
    tone: 'red',
    label: 'Save',
    title: 'Best deal, automatically',
    text: 'No hunting for codes. Your cart always gets the biggest saving.',
    proof: 'No codes needed',
  },
  {
    icon: 'scooter',
    tone: 'navy',
    label: 'Track',
    title: 'Live order tracking',
    text: 'See every step from oven to doorstep, with a clear arrival time.',
    proof: 'About 30 min to your door',
  },
]

function OrderAgain() {
  const { state, dispatch } = useStore()
  const { showToast, setCartOpen } = useUi()
  const last = state.orders[0]
  if (!last) {
    return (
      <section className="how" aria-labelledby="why-title">
        <div className="how__head">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 id="why-title">Ordering made simple</h2>
          </div>
          <p className="how__sub">Three easy steps from craving to doorstep, with no surprises at checkout.</p>
        </div>
        <ol className="how__steps">
          {HOW_STEPS.map((s, i) => (
            <li key={s.label} className={`how__step how__step--${s.tone}`}>
              <div className="how__top">
                <span className="how__icon">
                  <Icon name={s.icon} size={26} />
                </span>
                <span className="how__num" aria-hidden="true">
                  0{i + 1}
                </span>
              </div>
              <p className="how__label">
                <span className="how__label-num">Step {i + 1} · </span>
                {s.label}
              </p>
              <h3>{s.title}</h3>
              <p className="how__text">{s.text}</p>
              <p className="how__proof">
                <Icon name="check" size={16} /> {s.proof}
              </p>
            </li>
          ))}
        </ol>
      </section>
    )
  }
  const reorder = () => {
    const before = state.cart
    last.items.forEach((i) => dispatch({ type: 'addItem', item: { ...i, key: newKey() } }))
    showToast({
      text: 'Your last order is in the cart',
      action: { label: 'View cart', onClick: () => setCartOpen(true) },
      secondary: { label: 'Undo', onClick: () => dispatch({ type: 'restoreCart', cart: before }) },
    })
  }
  return (
    <section className="panel panel--again" aria-labelledby="again-title">
      <div className="panel__head">
        <div>
          <h2 id="again-title">Order again</h2>
          <p className="muted small">Your favourites, one tap away</p>
        </div>
        <a className="link-btn" href={`#/order/${last.id}`}>
          Last order <Icon name="chevronRight" size={16} />
        </a>
      </div>
      <ul className="again-list">
        {last.items.slice(0, 3).map((i) => {
          const p = PRODUCT_BY_ID[i.productId]
          return (
            <li key={i.key} className="again-item">
              <span className="again-item__art">
                <FoodPhoto photo={p.photo} width={56} />
              </span>
              <span className="again-item__text">
                <strong>{p.name}</strong>
                <span className="muted small">{describeItem(i)}</span>
              </span>
              <button
                type="button"
                className="add-btn add-btn--outline"
                aria-label={`Add ${p.name} again`}
                onClick={() => {
                  const before = state.cart
                  dispatch({ type: 'addItem', item: { ...i, qty: 1, key: newKey() } })
                  showToast({
                    text: `${p.name} added`,
                    action: { label: 'View cart', onClick: () => setCartOpen(true) },
                    secondary: { label: 'Undo', onClick: () => dispatch({ type: 'restoreCart', cart: before }) },
                  })
                }}
              >
                <Icon name="plus" size={18} />
              </button>
            </li>
          )
        })}
      </ul>
      <button type="button" className="btn btn--soft btn--block" onClick={reorder}>
        <Icon name="repeat" size={18} /> Reorder everything · {lkr(last.totals.subtotal)}
      </button>
    </section>
  )
}

const WALLET_LOGOS = [
  { name: 'Genie', file: 'genie.png' },
  { name: 'eZ Cash', file: 'ezcash.png' },
  { name: 'FriMi', file: 'frimi.png' },
]

function InfoBar() {
  const { state } = useStore()
  const { setLocationOpen } = useUi()
  const store = state.location ? STORE_BY_ID[state.location.storeId] : null
  const delivery = state.fulfilment === 'delivery'
  const mins = store ? (delivery ? store.deliveryMins : store.pickupMins) : null
  return (
    <section className="container info-bar" aria-label="Delivery and payment">
      <div className="info-panel">
        <button type="button" className="info-card info-card--where" onClick={() => setLocationOpen(true)}>
          <span className="info-card__icon">
            <Icon name={delivery ? 'scooter' : 'store'} size={20} />
          </span>
          <span className="info-card__text">
            <strong className="info-card__title">
              {store ? (delivery ? `Delivering to ${store.city}` : `Pickup from ${store.area}`) : 'Delivery or pickup?'}
              {store && delivery && state.location?.address ? <span className="info-card__addr"> · {state.location.address}</span> : null}
            </strong>
            <span className="info-card__sub">
              {store ? (
                <>
                  <span className="info-card__dot" aria-hidden="true" />
                  {delivery ? 'Arrives in' : 'Ready in'} {mins![0]}–{mins![1]} min
                </>
              ) : (
                'Set your location to see arrival times'
              )}
            </span>
          </span>
          <span className="info-card__action">
            {store ? 'Change' : 'Choose'} <Icon name="chevronRight" size={15} />
          </span>
        </button>
        <div className="info-card info-card--pay">
          <span className="info-card__icon">
            <Icon name="shield" size={20} />
          </span>
          <span className="info-card__text">
            <strong className="info-card__title">Secure checkout</strong>
            <span className="info-card__sub">
              Cash, card, LankaQR or
              <span className="info-card__wallets">
                {WALLET_LOGOS.map((w) => (
                  <img key={w.name} src={`${import.meta.env.BASE_URL}wallets/${w.file}`} alt={w.name} title={w.name} />
                ))}
              </span>
            </span>
          </span>
        </div>
      </div>
    </section>
  )
}

export function Home() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [filters, setFilters] = useState<Set<Filter>>(new Set())
  const { state } = useStore()
  const store = state.location ? STORE_BY_ID[state.location.storeId] : null

  const toggleFilter = (f: Filter) =>
    setFilters((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PRODUCTS.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      for (const f of filters) if (!p.tags.includes(f)) return false
      if (!q) return true
      const hay = `${p.name} ${p.description} ${p.tags.join(' ')} ${p.category}`.toLowerCase()
      return q.split(/\s+/).every((w) => hay.includes(w.replace(/s$/, '')))
    })
  }, [query, category, filters])

  const browsing = !query.trim() && category === 'all' && filters.size === 0
  const loved = ['devilled-chicken', 'pepperoni-classic', 'kochchi-paneer', 'chicken-wings', 'bbq-chicken', 'veggie-paradise'].map((id) => PRODUCT_BY_ID[id])

  // Wait a frame: changing filters can hide the sections above the menu, which moves it.
  const scrollToMenu = () => requestAnimationFrame(() => scrollToSection('menu'))

  // Links elsewhere on the page (like the footer) can ask for a category.
  useEffect(
    () =>
      onShowMenuCategory((c) => {
        setQuery('')
        setFilters(new Set())
        setCategory(c as CategoryId)
        requestAnimationFrame(() => scrollToSection('menu'))
      }),
    [],
  )

  // Cards, panels and headings fade up as they scroll into view; re-run when the visible set changes.
  const scope = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const targets = gsap.utils.toArray<HTMLElement>(
          '.section__head, .loved__head, .loved-card, .menu__group-title, .panel, .how__head, .how__step, .product-card, .info-card',
          scope.current,
        )
        gsap.set(targets, { opacity: 0, y: 36 })
        ScrollTrigger.batch(targets, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07, overwrite: true }),
        })
      })
    },
    { scope, dependencies: [results, browsing], revertOnUpdate: true },
  )

  return (
    <div ref={scope}>
      <Hero />
      <Toolbar
        category={category}
        setCategory={(c) => {
          setCategory(c)
          scrollToMenu()
        }}
        filters={filters}
        toggleFilter={toggleFilter}
        query={query}
        setQuery={setQuery}
        onSearch={scrollToMenu}
      />

      {browsing && (
        <>
          <LovedRail title={store ? `Most loved in ${store.city}` : 'Most loved right now'} note="Based on what people near you order" products={loved} />
          <Deals
            onPickPizzas={() => {
              setCategory('pizza')
              scrollToMenu()
            }}
          />
          <StoreWall />
          <div className="container">
            <OrderAgain />
          </div>
        </>
      )}

      <section id="menu" className="container section menu" aria-labelledby="menu-title">
        <div className="section__head">
          <h2 id="menu-title">{browsing ? 'Full menu' : `${results.length} result${results.length === 1 ? '' : 's'}`}</h2>
          {!browsing && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setQuery('')
                setCategory('all')
                setFilters(new Set())
              }}
            >
              <Icon name="x" size={16} /> Clear filters
            </button>
          )}
        </div>

        {results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Icon name="search" size={28} />
            </div>
            <h3>Nothing matches “{query || 'these filters'}”</h3>
            <p className="muted">Try “chicken”, “veg” or “spicy”, or clear the filters.</p>
          </div>
        )}

        {CATEGORIES.map((c) => {
          const items = results.filter((p) => p.category === c.id)
          if (!items.length) return null
          return (
            <div key={c.id} className="menu__group">
              <h3 className="menu__group-title">
                {c.label} <span className="muted">{items.length}</span>
              </h3>
              <div className="grid">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      <InfoBar />
    </div>
  )
}
