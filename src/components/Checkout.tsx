import { useEffect, useRef, useState } from 'react'
import { STORE_BY_ID } from '../data/stores'
import { formatPhone, normalisePhone } from '../lib/phone'
import { MIN_DELIVERY_ORDER, lkr } from '../lib/pricing'
import { navigate } from '../lib/router'
import { CHANGE_CUTOFF_MINS, canOrderNow, dayLabel, firstOpenSlot, formatWhen, nextOpening, slotStillOpen, timeLabel } from '../lib/schedule'
import { useStore, type PaymentMethod } from '../state/store'
import { useUi } from '../state/ui'
import { CartLines, DealBox, EtaLine, TotalsTable } from './CartParts'
import { Icon, type IconName } from './Icon'
import { FulfilmentToggle } from './LocationDialog'
import { PaymentGateway } from './PaymentGateway'
import { SchedulePicker } from './SchedulePicker'

const newOrderId = () => `DLK-${Math.floor(10000 + Math.random() * 89999)}`

type Errors = Partial<Record<'location' | 'address' | 'when' | 'name' | 'phone' | 'email', string>>

export function Checkout() {
  const { state, totals, dispatch } = useStore()
  const { setLocationOpen, setCartOpen, showToast } = useUi()
  const store = state.location ? STORE_BY_ID[state.location.storeId] : null
  // Address lives with the saved location so the picker and this form never disagree.
  const address = state.location?.address ?? ''
  const landmark = state.location?.landmark ?? ''
  const setAddressField = (patch: { address?: string; landmark?: string }) =>
    state.location && dispatch({ type: 'setLocation', fulfilment: state.fulfilment, location: { ...state.location, ...patch } })
  const [name, setName] = useState(state.contact?.name ?? '')
  const [phone, setPhone] = useState(state.contact ? formatPhone(state.contact.phone) : '')
  const [email, setEmail] = useState(state.contact?.email ?? '')
  const [when, setWhen] = useState<'asap' | number>('asap')
  const [payment, setPayment] = useState<PaymentMethod>('cash')
  const [errors, setErrors] = useState<Errors>({})
  const clearError = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }))
  // The address can also be filled in from the location picker, so hide its error once it's valid.
  const addressError = address.trim().length < 5 ? errors.address : undefined
  // Online payments open the payment screen first; the order is placed once it succeeds.
  const [gateway, setGateway] = useState<{ id: string; phone: string } | null>(null)
  // A clock for the time picker, so past times drop out while the page is open.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(t)
  }, [])
  const formRef = useRef<HTMLFormElement>(null)

  if (state.cart.length === 0) {
    return (
      <main id="main" tabIndex={-1} className="container checkout-empty">
        <div className="empty-state">
          <div className="empty-state__icon">
            <Icon name="bag" size={32} />
          </div>
          <h1>Your cart is empty</h1>
          <p className="muted">Add something tasty first.</p>
          <a className="btn btn--primary" href="#/">
            Back to menu
          </a>
        </div>
      </main>
    )
  }

  const delivery = state.fulfilment === 'delivery'
  const belowMin = delivery && totals.subtotal - (totals.applied?.saving ?? 0) < MIN_DELIVERY_ORDER

  // Scheduling: the slowest time for this store is the lead time, so a booked slot is always achievable.
  const leadMins = store ? (delivery ? store.deliveryMins[1] : store.pickupMins[1]) : 35
  const storeId = store?.id ?? 'col-03'
  const asapOk = canOrderNow(now, leadMins)
  const firstOpen = firstOpenSlot(now, leadMins, storeId)
  // When the kitchen can't take an order for now, ordering ahead is the default.
  const scheduledAt = when !== 'asap' ? when : asapOk ? null : firstOpen
  const later = scheduledAt != null
  const opens = nextOpening(now)

  const payOptions: { id: PaymentMethod; label: string; note: string; icon: IconName }[] = [
    {
      id: 'cash',
      label: delivery ? 'Cash on delivery' : 'Pay at the store',
      note: delivery ? 'Have change ready if you can' : 'Cash or card at the counter',
      icon: 'cash',
    },
    ...(delivery ? [{ id: 'card-on-delivery' as const, label: 'Card on delivery', note: 'Rider brings a card machine', icon: 'card' as const }] : []),
    { id: 'online', label: 'Pay online by card', note: 'Visa, Mastercard, Amex. Secure 3-D Secure checkout', icon: 'shield' },
  ]

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Errors = {}
    if (!store) errs.location = delivery ? 'Choose your delivery area.' : 'Choose a pickup store.'
    if (delivery && address.trim().length < 5) errs.address = 'Add your house number and street so the rider can find you.'
    if (later && !slotStillOpen(scheduledAt, now, leadMins, storeId)) errs.when = 'That time is no longer available. Pick another one.'
    if (name.trim().length < 2) errs.name = 'Tell us who the order is for.'
    const digits = normalisePhone(phone)
    if (!digits) errs.phone = 'Enter a 9-digit number after +94, for example 77 123 4567.'
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'This email doesn’t look right. It’s optional, so you can leave it empty.'
    setErrors(errs)
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    const id = newOrderId()
    if (payment === 'online') {
      setGateway({ id, phone: digits! })
      return
    }
    placeOrder(id, digits!)
  }

  const placeOrder = (id: string, digits: string) => {
    const [a, b] = delivery ? store!.deliveryMins : store!.pickupMins
    dispatch({
      type: 'placeOrder',
      order: {
        id,
        placedAt: Date.now(),
        etaMins: [a, b],
        fulfilment: state.fulfilment,
        location: delivery ? { storeId: store!.id, address: address.trim(), landmark: landmark.trim() } : { storeId: store!.id },
        items: state.cart,
        totals,
        payment,
        contact: { name: name.trim(), phone: digits, email: email.trim() },
        ...(scheduledAt != null && { scheduledFor: scheduledAt }),
      },
    })
    navigate(`/order/${id}`)
  }

  return (
    <main id="main" tabIndex={-1} className="container checkout">
      <div className="checkout__head">
        <h1>Checkout</h1>
        <ol className="steps" aria-label="Checkout steps">
          <li className="is-done">
            <span className="steps__dot" aria-hidden="true">
              <Icon name="check" size={14} />
            </span>
            Cart<span className="sr-only"> (done)</span>
          </li>
          <li className="is-on" aria-current="step">
            <span className="steps__dot" aria-hidden="true">
              2
            </span>
            Details & payment
          </li>
          <li>
            <span className="steps__dot" aria-hidden="true">
              3
            </span>
            Track
          </li>
        </ol>
      </div>

      <div className="checkout__grid">
        <form ref={formRef} className="checkout__form" onSubmit={submit} noValidate>
          <section className="card form-card" aria-labelledby="h-where">
            <h2 id="h-where">
              <span className="num">1</span> {delivery ? 'Delivery details' : 'Pickup details'}
            </h2>
            <FulfilmentToggle value={state.fulfilment} onChange={(f) => dispatch({ type: 'setFulfilment', fulfilment: f })} />
            {store ? (
              <div className="store-summary">
                <span className="store-summary__icon">
                  <Icon name={delivery ? 'pin' : 'store'} size={18} />
                </span>
                <span className="store-summary__text">
                  <strong>{delivery ? store.city : `${store.area} store`}</strong>
                  <span className="muted small">{delivery ? `Prepared at our ${store.area} store` : store.address}</span>
                </span>
                <button type="button" className="store-summary__change" onClick={() => setLocationOpen(true)}>
                  <Icon name="pencil" size={14} /> Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="store-summary is-empty"
                onClick={() => setLocationOpen(true)}
                aria-invalid={!!errors.location}
                aria-describedby={errors.location ? 'e-location' : undefined}
              >
                <span className="store-summary__icon">
                  <Icon name={delivery ? 'pin' : 'store'} size={18} />
                </span>
                <span className="store-summary__text">
                  <strong>{delivery ? 'Choose your delivery area' : 'Choose a pickup store'}</strong>
                  <span className="muted small">{delivery ? 'We’ll match you to your nearest Domino’s' : 'Pick the store closest to you'}</span>
                </span>
                <span className="store-summary__go" aria-hidden="true">
                  <Icon name="chevronRight" size={18} />
                </span>
              </button>
            )}
            {errors.location && !store && (
              <p id="e-location" className="field-error">
                {errors.location}
              </p>
            )}
            <EtaLine />

            {delivery && store && (
              <div className="form-row">
                <div className="field">
                  <label htmlFor="c-addr">House no. & street</label>
                  <input
                    id="c-addr"
                    value={address}
                    onChange={(e) => setAddressField({ address: e.target.value })}
                    autoComplete="street-address"
                    placeholder="e.g. 24/3, Lauries Road"
                    aria-invalid={!!addressError}
                    aria-describedby={addressError ? 'e-addr' : undefined}
                  />
                  {addressError && (
                    <p id="e-addr" className="field-error">
                      {addressError}
                    </p>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="c-landmark">
                    Landmark <span className="muted">(optional)</span>
                  </label>
                  <input
                    id="c-landmark"
                    value={landmark}
                    onChange={(e) => setAddressField({ landmark: e.target.value })}
                    placeholder="e.g. Opposite the Keells, blue gate"
                  />
                </div>
              </div>
            )}

            <div className="field">
              <span className="label" id="when-label">
                When?
              </span>
              {!asapOk && (
                <p className="when__closed" role="status">
                  <Icon name="clock" size={16} />
                  <span>
                    <strong>We’re closed right now.</strong> Order ahead and we’ll have it {delivery ? 'at your door' : 'hot and ready'} when you want it.
                  </span>
                </p>
              )}
              <div className="when" role="radiogroup" aria-labelledby="when-label">
                <label className={`choice when__opt ${!later ? 'is-on' : ''} ${!asapOk ? 'is-disabled' : ''}`}>
                  <input type="radio" name="when" checked={!later} disabled={!asapOk} onChange={() => setWhen('asap')} />
                  <span className="choice__icon">
                    <Icon name="zap" size={18} />
                  </span>
                  <span className="choice__text">
                    <strong>As soon as possible</strong>
                    <span className="muted small">
                      {!asapOk
                        ? `Opens ${dayLabel(opens, now) === 'Today' ? '' : 'tomorrow '}at ${timeLabel(opens)}`
                        : store
                          ? `About ${(delivery ? store.deliveryMins : store.pickupMins).join('–')} min`
                          : 'Fastest available'}
                    </span>
                  </span>
                  <span className="when__radio" aria-hidden="true" />
                </label>
                <label className={`choice when__opt ${later ? 'is-on' : ''}`}>
                  <input type="radio" name="when" checked={later} onChange={() => firstOpen != null && setWhen(firstOpen)} />
                  <span className="choice__icon">
                    <Icon name="calendar" size={18} />
                  </span>
                  <span className="choice__text">
                    <strong>{delivery ? 'Schedule delivery' : 'Order ahead'}</strong>
                    <span className="muted small">{scheduledAt != null ? formatWhen(scheduledAt, now) : 'Up to 7 days ahead'}</span>
                  </span>
                  <span className="when__radio" aria-hidden="true" />
                </label>
              </div>
              {later && (
                <SchedulePicker
                  value={scheduledAt}
                  onChange={(at) => {
                    setWhen(at)
                    clearError('when')
                  }}
                  now={now}
                  leadMins={leadMins}
                  storeId={storeId}
                  label={delivery ? 'Delivery time' : 'Pickup time'}
                />
              )}
              {errors.when && (
                <p id="e-when" className="field-error" role="alert">
                  {errors.when}
                </p>
              )}
            </div>
          </section>

          <section className="card form-card" aria-labelledby="h-contact">
            <h2 id="h-contact">
              <span className="num">2</span> Your details
            </h2>
            <p className="muted small">No account needed. We’ll only use these for this order.</p>
            <div className="form-row">
              <div className="field">
                <label htmlFor="c-name">Name</label>
                <input
                  id="c-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    clearError('name')
                  }}
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'e-name' : undefined}
                />
                {errors.name && (
                  <p id="e-name" className="field-error">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="field">
                <label htmlFor="c-phone">Mobile number</label>
                <div className="phone-input">
                  <span className="phone-input__cc" aria-hidden="true">
                    +94
                  </span>
                  <input
                    id="c-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      clearError('phone')
                    }}
                    onBlur={() => {
                      const d = normalisePhone(phone)
                      if (d) setPhone(formatPhone(d))
                    }}
                    placeholder="77 123 4567"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'e-phone' : 'h-phone'}
                  />
                </div>
                {errors.phone ? (
                  <p id="e-phone" className="field-error">
                    {errors.phone}
                  </p>
                ) : (
                  <p id="h-phone" className="hint">
                    The rider will call this number if they can’t find you.
                  </p>
                )}
              </div>
            </div>
            <div className="field">
              <label htmlFor="c-email">
                Email <span className="muted">(optional, for your receipt)</span>
              </label>
              <input
                id="c-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearError('email')
                }}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'e-email' : undefined}
              />
              {errors.email && (
                <p id="e-email" className="field-error">
                  {errors.email}
                </p>
              )}
            </div>
          </section>

          <section className="card form-card" aria-labelledby="h-pay">
            <h2 id="h-pay">
              <span className="num">3</span> Payment
            </h2>
            <div className="pay-grid" role="radiogroup" aria-labelledby="h-pay">
              {payOptions.map((o) => (
                <label key={o.id} className={`choice ${payment === o.id ? 'is-on' : ''}`}>
                  <input type="radio" name="pay" checked={payment === o.id} onChange={() => setPayment(o.id)} />
                  <span className="choice__icon">
                    <Icon name={o.icon} />
                  </span>
                  <span className="choice__text">
                    <strong>{o.label}</strong>
                    <span className="muted small">{o.note}</span>
                  </span>
                </label>
              ))}
            </div>
            {payment === 'online' && (
              <p className="hint">
                <Icon name="shield" size={14} /> You’ll confirm the payment with your bank. If it fails, you won’t be charged and your cart stays saved.
              </p>
            )}
          </section>

          <div className="place-bar">
            {belowMin && (
              <div className="min-warn" role="status">
                <p>
                  <Icon name="info" size={16} />
                  <span>
                    Add <strong>{lkr(MIN_DELIVERY_ORDER - (totals.subtotal - (totals.applied?.saving ?? 0)))}</strong> more for delivery (minimum{' '}
                    {lkr(MIN_DELIVERY_ORDER)}), or pick it up yourself.
                  </span>
                </p>
                <div className="min-warn__actions">
                  <button type="button" className="btn btn--hot btn--sm" onClick={() => dispatch({ type: 'setFulfilment', fulfilment: 'pickup' })}>
                    <Icon name="store" size={16} /> Switch to pickup
                  </button>
                  <a className="btn btn--soft btn--sm" href="#/">
                    <Icon name="plus" size={16} /> Add more items
                  </a>
                </div>
              </div>
            )}
            {scheduledAt != null && (
              <p className="place-bar__when">
                <Icon name="calendar" size={18} />
                <span>
                  {delivery ? 'Arriving' : 'Ready'} <strong>{formatWhen(scheduledAt, now)}</strong>
                  {store && <> · {delivery ? store.city : `${store.area} store`}</>}
                </span>
              </p>
            )}
            <button type="submit" className="btn btn--hot btn--lg btn--split place-bar__btn" disabled={belowMin}>
              <span>{payment === 'online' ? 'Continue to payment' : later ? 'Book order' : 'Place order'}</span>
              <span>{lkr(totals.total)}</span>
            </button>
            <p className="fine-print center">
              {later
                ? `Prices include all taxes. You can change the time or cancel up to ${CHANGE_CUTOFF_MINS} minutes before.`
                : 'Prices include all taxes. You’ll get live tracking as soon as you place the order.'}
            </p>
          </div>
        </form>

        <aside className="checkout__summary card" aria-labelledby="h-summary">
          <div className="panel__head">
            <h2 id="h-summary">Your order</h2>
            <button type="button" className="link-btn" onClick={() => setCartOpen(true)}>
              <Icon name="pencil" size={15} /> Edit
            </button>
          </div>
          <CartLines editable={false} />
          <DealBox />
          <TotalsTable totals={totals} />
        </aside>
      </div>

      {/* Mounted only while open so every visit starts fresh with this order’s details. */}
      {gateway && (
        <PaymentGateway
          open
          amount={totals.total}
          orderRef={gateway.id}
          phone={gateway.phone}
          onPaid={() => placeOrder(gateway.id, gateway.phone)}
          onCancel={() => {
            setGateway(null)
            showToast({ text: 'Payment cancelled. You haven’t been charged and your cart is saved.' })
          }}
        />
      )}
    </main>
  )
}
