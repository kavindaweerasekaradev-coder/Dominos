import { useEffect, useState } from 'react'
import { HOTLINE, STORE_BY_ID } from '../data/stores'
import { PRODUCT_BY_ID } from '../data/menu'
import { newKey } from '../lib/id'
import { describeItem, lineTotal, lkr } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { FoodPhoto } from './FoodPhoto'
import { Icon, type IconName } from './Icon'

// Progress is sped up for the demo: each stage starts this many seconds after ordering.
const STAGE_AT = [0, 15, 45, 90, 150]

export function OrderTracking({ id }: { id: string }) {
  const { state, dispatch } = useStore()
  const { showToast, setCartOpen } = useUi()
  const order = state.orders.find((o) => o.id === id)
  const [now, setNow] = useState(() => Date.now())
  const [help, setHelp] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  if (!order) {
    return (
      <main id="main" tabIndex={-1} className="container checkout-empty">
        <div className="empty-state">
          <div className="empty-state__icon">
            <Icon name="receipt" size={30} />
          </div>
          <h1>We can’t find order {id}</h1>
          <p className="muted">Orders are saved on the device you ordered from. Call us and we’ll look it up.</p>
          <div className="row-gap">
            <a className="btn btn--soft" href={`tel:${HOTLINE.replace(/\s/g, '')}`}>
              <Icon name="phone" size={18} /> {HOTLINE}
            </a>
            <a className="btn btn--primary" href="#/">
              Back to menu
            </a>
          </div>
        </div>
      </main>
    )
  }

  const store = STORE_BY_ID[order.location.storeId]
  const delivery = order.fulfilment === 'delivery'
  const stages: { label: string; note: string; icon: IconName }[] = [
    { label: 'Order placed', note: 'We’ve got it', icon: 'receipt' },
    { label: 'Preparing', note: 'Fresh dough, your toppings', icon: 'sparkle' },
    { label: 'In the oven', note: 'Baking at 250°C', icon: 'flame' },
    delivery
      ? { label: 'On the way', note: 'Rider is heading to you', icon: 'scooter' }
      : { label: 'Ready to collect', note: `At ${store.area} store`, icon: 'store' },
    delivery ? { label: 'Delivered', note: 'Enjoy!', icon: 'check' } : { label: 'Collected', note: 'Enjoy!', icon: 'check' },
  ]
  const elapsed = (now - order.placedAt) / 1000
  const current = STAGE_AT.reduce((acc, at, i) => (elapsed >= at ? i : acc), 0)
  const done = current === stages.length - 1
  const eta = (m: number) => new Date(order.placedAt + m * 60000).toLocaleTimeString('en-LK', { hour: 'numeric', minute: '2-digit' })

  const reorder = () => {
    order.items.forEach((i) => dispatch({ type: 'addItem', item: { ...i, key: newKey() } }))
    showToast({ text: 'Added your order to the cart', action: { label: 'View cart', onClick: () => setCartOpen(true) } })
  }

  return (
    <main id="main" tabIndex={-1} className="container tracking">
      <section className="card tracking__main" aria-labelledby="t-title">
        <p className="eyebrow">Order {order.id}</p>
        <h1 id="t-title">
          {done ? (delivery ? 'Delivered. Enjoy your meal!' : 'Collected. Enjoy!') : `Thanks, ${order.contact.name.split(' ')[0]}! ${stages[current].label}…`}
        </h1>
        {!done && (
          <p className="tracking__eta">
            <Icon name="clock" size={20} />
            {delivery ? 'Arriving' : 'Ready'} between <strong>{eta(order.etaMins[0])}</strong> and <strong>{eta(order.etaMins[1])}</strong>
          </p>
        )}
        <ol className="tracker" aria-label="Order progress">
          {stages.map((s, i) => (
            <li key={s.label} className={i < current ? 'is-done' : i === current ? 'is-on' : ''} aria-current={i === current ? 'step' : undefined}>
              <span className="tracker__dot">
                <Icon name={i < current ? 'check' : s.icon} size={18} />
              </span>
              <span className="tracker__text">
                <strong>{s.label}</strong>
                <span className="muted small">{s.note}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="fine-print">
          <Icon name="info" size={14} /> Demo: progress is sped up. Bookmark this page to come back to it.
        </p>

        <div className="tracking__where">
          <div>
            <span className="label">{delivery ? 'Delivering to' : 'Pick up from'}</span>
            <strong>{delivery ? `${order.location.address}, ${store.city}` : `${store.area} store`}</strong>
            {delivery && order.location.landmark && <span className="muted small">Landmark: {order.location.landmark}</span>}
            {!delivery && <span className="muted small">{store.address}</span>}
          </div>
          <div>
            <span className="label">Payment</span>
            <strong>
              {order.payment === 'online' ? 'Paid online' : order.payment === 'cash' ? (delivery ? 'Cash on delivery' : 'Pay at store') : 'Card on delivery'}
            </strong>
            <span className="muted small">{lkr(order.totals.total)}</span>
          </div>
        </div>
      </section>

      <aside className="tracking__side">
        <section className="card" aria-labelledby="h-help">
          <h2 id="h-help">Need help?</h2>
          <div className="help-grid">
            <a className="help-btn" href={`tel:${HOTLINE.replace(/\s/g, '')}`}>
              <Icon name="phone" /> Call the store
            </a>
            <button type="button" className="help-btn" onClick={() => setHelp('late')}>
              <Icon name="clock" /> My order is late
            </button>
            <button type="button" className="help-btn" onClick={() => setHelp('wrong')}>
              <Icon name="help" /> Something’s wrong
            </button>
          </div>
          {help && (
            <p className="hint hint--ok" role="status">
              <Icon name="check" size={14} />
              {help === 'late'
                ? ` We’ve told the ${store.area} store. They’ll call you on +94 ${order.contact.phone} within 5 minutes.`
                : ` Sorry about that. The ${store.area} store will call you on +94 ${order.contact.phone} to put it right.`}
            </p>
          )}
        </section>

        <section className="card" aria-labelledby="h-items">
          <div className="panel__head">
            <h2 id="h-items">Your order</h2>
            <button type="button" className="link-btn" onClick={reorder}>
              <Icon name="repeat" size={15} /> Order again
            </button>
          </div>
          <ul className="cart-lines">
            {order.items.map((i) => {
              const p = PRODUCT_BY_ID[i.productId]
              return (
                <li key={i.key} className="cart-line">
                  <div className="cart-line__art">
                    <FoodPhoto photo={p.photo} width={80} />
                  </div>
                  <div className="cart-line__main">
                    <div className="cart-line__top">
                      <strong>
                        {i.qty} × {p.name}
                      </strong>
                      <span className="cart-line__price">{lkr(lineTotal(i))}</span>
                    </div>
                    <span className="muted small">{describeItem(i)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
          <dl className="totals">
            {order.totals.applied && (
              <div className="totals__save">
                <dt>Deal: {order.totals.applied.deal.code}</dt>
                <dd>−{lkr(order.totals.applied.saving)}</dd>
              </div>
            )}
            <div>
              <dt>{delivery ? 'Delivery fee' : 'Pickup'}</dt>
              <dd>{order.totals.deliveryFee ? lkr(order.totals.deliveryFee) : 'Free'}</dd>
            </div>
            <div className="totals__grand">
              <dt>Total</dt>
              <dd>{lkr(order.totals.total)}</dd>
            </div>
          </dl>
        </section>
      </aside>
    </main>
  )
}
