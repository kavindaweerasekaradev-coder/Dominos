import { MIN_DELIVERY_ORDER, lkr } from '../lib/pricing'
import { navigate } from '../lib/router'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { CartLines, DealBox, EtaLine, Progress, TotalsTable } from './CartParts'
import { Dialog } from './Dialog'
import { DominoTile } from './Domino'
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
      title={empty ? 'Your cart' : `Your cart · ${totals.itemCount} item${totals.itemCount > 1 ? 's' : ''}`}
      variant="drawer"
      footer={
        !empty && (
          <>
            <button
              type="button"
              className="btn btn--primary btn--block btn--split"
              disabled={belowMin}
              onClick={() => {
                setCartOpen(false)
                navigate('/checkout')
              }}
            >
              <span>Go to checkout</span>
              <span>{lkr(totals.total)}</span>
            </button>
            {belowMin && <p className="small muted center">Add a little more to reach the delivery minimum, or switch to pickup.</p>}
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
