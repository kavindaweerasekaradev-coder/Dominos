import { useState } from 'react'
import { PRODUCT_BY_ID } from '../data/menu'
import { STORE_BY_ID } from '../data/stores'
import { FREE_DELIVERY_FROM, MIN_DELIVERY_ORDER, checkCoupon, describeItem, lineTotal, lkr, type CartItem, type Totals } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'

export function CartLines({ editable = true }: { editable?: boolean }) {
  const { state, dispatch } = useStore()
  const { openProduct, showToast } = useUi()

  const remove = (item: CartItem) => {
    const before = state.cart
    dispatch({ type: 'setQty', key: item.key, qty: 0 })
    showToast({
      text: `Removed ${PRODUCT_BY_ID[item.productId].name}`,
      secondary: { label: 'Undo', onClick: () => dispatch({ type: 'restoreCart', cart: before }) },
    })
  }

  return (
    <ul className="cart-lines">
      {state.cart.map((item) => {
        const p = PRODUCT_BY_ID[item.productId]
        if (!p) return null
        return (
          <li key={item.key} className="cart-line">
            <div className="cart-line__art">
              <FoodPhoto photo={p.photo} width={80} />
            </div>
            <div className="cart-line__main">
              <div className="cart-line__top">
                <strong>{p.name}</strong>
                {editable && p.category === 'pizza' && (
                  <button type="button" className="cart-line__edit" onClick={() => openProduct(p.id, item.key)} aria-label={`Edit ${p.name}`}>
                    <Icon name="pencil" size={14} />
                  </button>
                )}
              </div>
              <span className="cart-line__desc">{describeItem(item)}</span>
              <div className="cart-line__bottom">
                {editable ? (
                  <div className="qty qty--sm">
                    <button
                      type="button"
                      className="qty__btn"
                      onClick={() => (item.qty === 1 ? remove(item) : dispatch({ type: 'setQty', key: item.key, qty: item.qty - 1 }))}
                      aria-label={item.qty === 1 ? `Remove ${p.name}` : `One less ${p.name}`}
                    >
                      <Icon name={item.qty === 1 ? 'trash' : 'minus'} size={15} />
                    </button>
                    <span className="qty__val">{item.qty}</span>
                    <button
                      type="button"
                      className="qty__btn qty__btn--add"
                      onClick={() => dispatch({ type: 'setQty', key: item.key, qty: item.qty + 1 })}
                      aria-label={`One more ${p.name}`}
                    >
                      <Icon name="plus" size={15} />
                    </button>
                  </div>
                ) : (
                  <span className="muted small">Qty {item.qty}</span>
                )}
                <span className="cart-line__price">{lkr(lineTotal(item))}</span>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function DealBox() {
  const { state, totals, dispatch } = useStore()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const apply = (e: React.FormEvent) => {
    e.preventDefault()
    const r = checkCoupon(code, state.cart, state.fulfilment)
    if (r.ok) {
      dispatch({ type: 'setCoupon', coupon: r.result.deal.code })
      setMsg({ ok: true, text: `${r.result.deal.title} applied. You save ${lkr(r.result.saving)}.` })
      setCode('')
    } else {
      setMsg({ ok: false, text: r.message })
    }
  }

  return (
    <div className="deal-box">
      {totals.applied ? (
        <div className="deal-applied">
          <Icon name="tag" size={18} />
          <div>
            <strong>{totals.applied.deal.title}</strong>
            <span className="small">
              {state.coupon === totals.applied.deal.code ? 'Your code is applied.' : 'Best deal applied automatically.'} You save {lkr(totals.applied.saving)}.
            </span>
          </div>
        </div>
      ) : (
        <p className="small muted deal-none">
          <span className="deal-none__icon">
            <Icon name="tag" size={16} />
          </span>
          No deal applies yet. We’ll apply the best one for you automatically.
        </p>
      )}
      {totals.nudge && (
        <p className="deal-nudge small">
          <Icon name="sparkle" size={14} /> <span>{totals.nudge.reason}</span>
        </p>
      )}
      <form className="coupon" onSubmit={apply}>
        <label htmlFor="coupon" className="sr-only">
          Promo code
        </label>
        <input
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Promo code"
          autoCapitalize="characters"
          aria-describedby="coupon-msg"
        />
        <button type="submit" className="coupon__btn" disabled={!code.trim()}>
          Apply
        </button>
      </form>
      <p id="coupon-msg" className={`small ${msg ? (msg.ok ? 'hint--ok' : 'hint--warn') : ''}`} role="status">
        {msg?.text}
      </p>
    </div>
  )
}

export function Progress({ totals }: { totals: Totals }) {
  const { state } = useStore()
  if (state.fulfilment !== 'delivery' || totals.itemCount === 0) return null
  const afterDeal = totals.subtotal - (totals.applied?.saving ?? 0)
  if (afterDeal < MIN_DELIVERY_ORDER) {
    return (
      <div className="progress-note progress-note--warn">
        <span>
          Add <strong>{lkr(MIN_DELIVERY_ORDER - afterDeal)}</strong> more for delivery (minimum {lkr(MIN_DELIVERY_ORDER)})
        </span>
        <span className="bar">
          <span style={{ width: `${(afterDeal / MIN_DELIVERY_ORDER) * 100}%` }} />
        </span>
      </div>
    )
  }
  if (afterDeal < FREE_DELIVERY_FROM) {
    return (
      <div className="progress-note">
        <span>
          <strong>{lkr(FREE_DELIVERY_FROM - afterDeal)}</strong> away from free delivery
        </span>
        <span className="bar">
          <span style={{ width: `${(afterDeal / FREE_DELIVERY_FROM) * 100}%` }} />
        </span>
      </div>
    )
  }
  return (
    <div className="progress-note progress-note--ok">
      <Icon name="check" size={16} /> You’ve got free delivery
    </div>
  )
}

export function TotalsTable({ totals }: { totals: Totals }) {
  const { state } = useStore()
  return (
    <dl className="totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{lkr(totals.subtotal)}</dd>
      </div>
      {totals.applied && (
        <div className="totals__save">
          <dt>Deal: {totals.applied.deal.code}</dt>
          <dd>−{lkr(totals.applied.saving)}</dd>
        </div>
      )}
      <div>
        <dt>{state.fulfilment === 'delivery' ? 'Delivery fee' : 'Pickup'}</dt>
        <dd>{totals.deliveryFee ? lkr(totals.deliveryFee) : 'Free'}</dd>
      </div>
      <div className="totals__grand">
        <dt>Total</dt>
        <dd>{lkr(totals.total)}</dd>
      </div>
      <p className="fine-print">
        <Icon name="receipt" size={13} /> Includes all taxes. No service charge.
      </p>
    </dl>
  )
}

export function EtaLine() {
  const { state } = useStore()
  const store = state.location ? STORE_BY_ID[state.location.storeId] : null
  if (!store) return null
  const [a, b] = state.fulfilment === 'delivery' ? store.deliveryMins : store.pickupMins
  return (
    <p className="eta-line">
      <Icon name="clock" size={16} />
      {state.fulfilment === 'delivery' ? `Arrives in ${a}–${b} min` : `Ready for pickup in ${a}–${b} min`}
      <span className="muted">· {state.fulfilment === 'delivery' ? `from ${store.area}` : store.address}</span>
    </p>
  )
}
