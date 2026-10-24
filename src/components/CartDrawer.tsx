import { MIN_DELIVERY_ORDER, lkr } from '../lib/pricing'
import { navigate } from '../lib/router'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { CartLines, DealBox, EtaLine, Progress, TotalsTable } from './CartParts'
import { Dialog } from './Dialog'
import { DominoTile } from './Domino'
import { Icon } from './Icon'
import { FulfilmentToggle } from './LocationDialog'

export function CartDrawer() {
  const { state, totals, dispatch } = useStore()
  const { cartOpen, setCartOpen } = useUi()
  const empty = state.cart.length === 0
  const belowMin = state.fulfilment === 'delivery' && totals.subtotal - (totals.applied?.saving ?? 0) < MIN_DELIVERY_ORDER

  return (
    <Dialog
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      title="Your cart"
      badge={
        !empty && (
          <span className="cart-count">
            {totals.itemCount}
            <span className="sr-only"> item{totals.itemCount > 1 ? 's' : ''}</span>
          </span>
        )
      }
      variant="drawer"
      className="cart-drawer"
      footer={
        !empty && (
          <>
            <button
              type="button"
              className="btn btn--hot btn--lg btn--block cart-checkout"
              onClick={() => {
                setCartOpen(false)
                navigate('/checkout')
              }}
            >
              <span className="cart-checkout__label">
                Go to checkout <Icon name="chevronRight" size={18} className="btn__arrow" />
              </span>
              <span className="cart-checkout__total">{lkr(totals.total)}</span>
            </button>
            {belowMin ? (
              <p className="cart-trust">
                Below the delivery minimum.{' '}
                <button type="button" className="link-btn link-btn--sm" onClick={() => dispatch({ type: 'setFulfilment', fulfilment: 'pickup' })}>
                  Switch to pickup
                </button>
              </p>
            ) : (
              <p className="cart-trust">
                <Icon name="shield" size={14} /> Secure checkout · Cash, card or online
              </p>
            )}
          </>
        )
      }
    >
      {empty ? (
        <div className="empty-state">
          <div className="empty-state__dominoes" aria-hidden="true">
            <DominoTile pips={2} tone="blue" />
            <DominoTile pips={1} tone="red" />
          </div>
          <h3>Your cart is empty</h3>
          <p className="muted">Pick a pizza to get started. Deals apply automatically.</p>
          <button type="button" className="btn btn--soft" onClick={() => setCartOpen(false)}>
            Browse the menu
          </button>
        </div>
      ) : (
        <>
          <FulfilmentToggle value={state.fulfilment} onChange={(f) => dispatch({ type: 'setFulfilment', fulfilment: f })} />
          <EtaLine />
          <Progress totals={totals} />
          <CartLines />
          <DealBox />
          <TotalsTable totals={totals} />
        </>
      )}
    </Dialog>
  )
}
