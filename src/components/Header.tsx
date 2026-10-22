import { HOTLINE, STORE_BY_ID } from '../data/stores'
import { scrollToSection } from '../lib/dom'
import { lkr } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { Icon } from './Icon'

export function Logo() {
  return (
    <a href="#/" className="logo" aria-label="Domino's Sri Lanka, home">
      <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
        <rect x="3" y="9" width="20" height="20" rx="5" transform="rotate(-20 13 19)" fill="#006491" />
        <rect x="15" y="9" width="20" height="20" rx="5" transform="rotate(-20 25 19)" fill="#E31837" />
        <circle cx="10.5" cy="17" r="2.4" fill="#fff" />
        <circle cx="15" cy="23.5" r="2.4" fill="#fff" />
        <circle cx="26" cy="18" r="2.4" fill="#fff" />
      </svg>
      <span className="logo__text">
        Domino’s<small>Sri Lanka</small>
      </span>
    </a>
  )
}

export function LocationPill() {
  const { state } = useStore()
  const { setLocationOpen } = useUi()
  const store = state.location ? STORE_BY_ID[state.location.storeId] : null
  const mode = state.fulfilment === 'delivery' ? 'Deliver to' : 'Pickup from'
  return (
    <button type="button" className="loc-pill" onClick={() => setLocationOpen(true)}>
      <Icon name={state.fulfilment === 'delivery' ? 'pin' : 'store'} size={18} />
      <span className="loc-pill__text">
        <span className="loc-pill__mode">{store ? mode : 'Delivery or pickup'}</span>
        <span className="loc-pill__place">{store ? (state.fulfilment === 'delivery' ? store.city : `${store.area} store`) : 'Choose location'}</span>
      </span>
      <Icon name="chevronDown" size={16} />
    </button>
  )
}

export function Header({ compact = false }: { compact?: boolean }) {
  const { state, totals } = useStore()
  const { setCartOpen } = useUi()
  const latest = state.orders[0]
  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <Logo />
        {!compact && (
          <div className="site-header__loc">
            <LocationPill />
          </div>
        )}
        <nav className="site-nav" aria-label="Main">
          {compact ? (
            <a href="#/">
              <Icon name="arrowLeft" size={18} /> Back to menu
            </a>
          ) : (
            <>
              <button type="button" className="nav-link" onClick={() => scrollToSection('menu')}>
                Menu
              </button>
              <button type="button" className="nav-link" onClick={() => scrollToSection('deals')}>
                Deals
              </button>
              {latest && <a href={`#/order/${latest.id}`}>Track order</a>}
            </>
          )}
        </nav>
        <div className="site-header__actions">
          <a className="icon-btn icon-btn--ghost hide-sm" href={`tel:${HOTLINE.replace(/\s/g, '')}`} aria-label="Call us">
            <Icon name="phone" />
          </a>
          {!compact && (
            <button
              type="button"
              className="cart-btn"
              onClick={() => setCartOpen(true)}
              aria-label={`Cart, ${totals.itemCount} item${totals.itemCount === 1 ? '' : 's'}`}
            >
              <span className="cart-btn__icon">
                <Icon name="bag" />
                {totals.itemCount > 0 && <span className="cart-btn__badge">{totals.itemCount}</span>}
              </span>
              <span className="cart-btn__total hide-sm">{totals.itemCount ? lkr(totals.total) : 'Cart'}</span>
            </button>
          )}
        </div>
      </div>
      {!compact && (
        <div className="site-header__loc-mobile container">
          <LocationPill />
        </div>
      )}
    </header>
  )
}
