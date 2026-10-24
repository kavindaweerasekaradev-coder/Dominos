import { useEffect, useState } from 'react'
import { HOTLINE, STORE_BY_ID } from '../data/stores'
import { PRODUCT_BY_ID } from '../data/menu'
import { newKey } from '../lib/id'
import { describeItem, lineTotal, lkr } from '../lib/pricing'
import { CHANGE_CUTOFF_MINS, formatWhen, timeLabel } from '../lib/schedule'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { Dialog } from './Dialog'
import { FoodPhoto } from './FoodPhoto'
import { Icon, type IconName } from './Icon'
import { SchedulePicker } from './SchedulePicker'

// Progress is sped up for the demo: each stage starts this many seconds after ordering.
const STAGE_AT = [0, 15, 45, 90, 150]

/** "in 2 days 4 h", "in 3 h 12 min", "in 12 min 05 s". */
function countdown(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d) return `${d} day${d > 1 ? 's' : ''} ${h} h`
  if (h) return `${h} h ${m} min`
  return `${m} min ${String(s % 60).padStart(2, '0')} s`
}

export function OrderTracking({ id }: { id: string }) {
  const { state, dispatch } = useStore()
  const { showToast, setCartOpen } = useUi()
  const order = state.orders.find((o) => o.id === id)
  const [now, setNow] = useState(() => Date.now())
  const [help, setHelp] = useState<string | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState(false)

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
  const scheduled = order.scheduledFor
  const cancelled = order.cancelledAt != null
  // Booked orders go into the oven so they're ready at the chosen time.
  const prepStart = scheduled ? scheduled - order.etaMins[1] * 60_000 : order.placedAt
  const waiting = scheduled != null && now < prepStart
  // Changes close 30 minutes before, or once the kitchen starts if that's sooner.
  const canChange = scheduled != null && !cancelled && now < Math.min(prepStart, scheduled - CHANGE_CUTOFF_MINS * 60_000)
  const stages: { label: string; note: string; icon: IconName }[] = [
    { label: 'Order placed', note: 'We’ve got it', icon: 'receipt' },
    ...(scheduled ? [{ label: 'Booked', note: `We’ll start making it at ${timeLabel(prepStart)}`, icon: 'calendar' as const }] : []),
    { label: 'Preparing', note: 'Fresh dough, your toppings', icon: 'sparkle' },
    { label: 'In the oven', note: 'Baking at 250°C', icon: 'flame' },
    delivery
      ? { label: 'On the way', note: 'Rider is heading to you', icon: 'scooter' }
      : { label: 'Ready to collect', note: `At ${store.area} store`, icon: 'store' },
    delivery ? { label: 'Delivered', note: 'Enjoy!', icon: 'check' } : { label: 'Collected', note: 'Enjoy!', icon: 'check' },
  ]
  const elapsed = (now - prepStart) / 1000
  const step = STAGE_AT.reduce((acc, at, i) => (elapsed >= at ? i : acc), 0)
  const current = !scheduled ? step : waiting ? 1 : step + 1 + (step === 0 ? 1 : 0)
  const done = current === stages.length - 1
  const eta = (m: number) => new Date(order.placedAt + m * 60000).toLocaleTimeString('en-LK', { hour: 'numeric', minute: '2-digit' })
  const firstName = order.contact.name.split(' ')[0]
  const paidOnline = order.payment === 'online'

  const saveTime = () => {
    if (editing == null) return
    dispatch({ type: 'updateOrder', id: order.id, patch: { scheduledFor: editing } })
    showToast({ text: `Moved to ${formatWhen(editing, now)}` })
    setEditing(null)
  }
  const cancel = () => {
    dispatch({ type: 'updateOrder', id: order.id, patch: { cancelledAt: now } })
    setCancelling(false)
    showToast({ text: `Order ${order.id} cancelled` })
  }

  const reorder = () => {
    order.items.forEach((i) => dispatch({ type: 'addItem', item: { ...i, key: newKey() } }))
    showToast({ text: 'Added your order to the cart', action: { label: 'View cart', onClick: () => setCartOpen(true) } })
  }

  return (
    <main id="main" tabIndex={-1} className="container tracking">
      <section className="card tracking__main" aria-labelledby="t-title">
        <p className="eyebrow">Order {order.id}</p>
        <h1 id="t-title">
          {cancelled
            ? 'Order cancelled'
            : done
              ? delivery
                ? 'Delivered. Enjoy your meal!'
                : 'Collected. Enjoy!'
              : waiting
                ? `You’re booked in, ${firstName}!`
                : `Thanks, ${firstName}! ${stages[current].label}…`}
        </h1>

        {cancelled ? (
          <div className="booking booking--cancelled" role="status">
            <Icon name="x" size={20} />
            <div>
              <strong>Cancelled at {timeLabel(order.cancelledAt!)}.</strong>
              <span>{paidOnline ? ` Your refund of ${lkr(order.totals.total)} will reach your card in 3–5 working days.` : ' Nothing to pay.'}</span>
            </div>
            <button type="button" className="btn btn--primary btn--sm" onClick={reorder}>
              <Icon name="repeat" size={16} /> Order again
            </button>
          </div>
        ) : (
          <>
            {scheduled && !done && (
              <div className="booking">
                <div className="booking__time">
                  <span className="booking__label">{delivery ? 'Arriving' : 'Ready to collect'}</span>
                  <strong>{timeLabel(scheduled)}</strong>
                  <span>{new Date(scheduled).toLocaleDateString('en-LK', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                <div className="booking__info">
                  <p className="booking__count" aria-live="off">
                    <Icon name="clock" size={16} /> {now < scheduled ? `in ${countdown(scheduled - now)}` : 'Any minute now'}
                  </p>
                  <p className="muted small">{delivery ? `To ${order.location.address}, ${store.city}` : `${store.area} store · ${store.address}`}</p>
                  {canChange ? (
                    <div className="booking__actions">
                      <button type="button" className="btn btn--soft btn--sm" onClick={() => setEditing(scheduled)}>
                        <Icon name="pencil" size={15} /> Change time
                      </button>
                      <button type="button" className="link-btn booking__cancel" onClick={() => setCancelling(true)}>
                        Cancel order
                      </button>
                    </div>
                  ) : (
                    <p className="muted small">
                      Too close to change online. Call the store on <a href={`tel:${HOTLINE.replace(/\s/g, '')}`}>{HOTLINE}</a>.
                    </p>
                  )}
                </div>
              </div>
            )}
            {!scheduled && !done && (
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
              {waiting && (
                <>
                  {' '}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => dispatch({ type: 'updateOrder', id: order.id, patch: { scheduledFor: now + order.etaMins[1] * 60_000 } })}
                  >
                    Start preparing now
                  </button>
                </>
              )}
            </p>
          </>
        )}

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
      {editing != null && (
        <Dialog
          open
          onClose={() => setEditing(null)}
          title={delivery ? 'Change delivery time' : 'Change pickup time'}
          className="sched-dialog"
          footer={
            <button type="button" className="btn btn--primary btn--lg btn--block" onClick={saveTime} disabled={editing === scheduled}>
              Save {formatWhen(editing, now)}
            </button>
          }
        >
          <SchedulePicker
            value={editing}
            onChange={setEditing}
            now={now}
            leadMins={order.etaMins[1]}
            storeId={store.id}
            label={delivery ? 'Delivery time' : 'Pickup time'}
          />
        </Dialog>
      )}
      {cancelling && (
        <Dialog
          open
          onClose={() => setCancelling(false)}
          title={`Cancel order ${order.id}?`}
          footer={
            <div className="confirm-actions">
              <button type="button" className="btn btn--soft btn--lg" onClick={() => setCancelling(false)} data-autofocus>
                Keep my order
              </button>
              <button type="button" className="btn btn--hot btn--lg" onClick={cancel}>
                Cancel order
              </button>
            </div>
          }
        >
          <p className="muted">
            Your {delivery ? 'delivery' : 'pickup'} for {formatWhen(scheduled ?? now, now)} will be cancelled.
            {paidOnline ? ` We’ll refund ${lkr(order.totals.total)} to your card within 3–5 working days.` : ' You won’t be charged.'}
          </p>
        </Dialog>
      )}
    </main>
  )
}
