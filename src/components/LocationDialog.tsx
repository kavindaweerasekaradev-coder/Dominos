import { useEffect, useMemo, useRef, useState } from 'react'
import { STORES, STORE_BY_ID, nearestStore, type Store } from '../data/stores'
import type { Fulfilment } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { Dialog } from './Dialog'
import { Icon } from './Icon'

export function FulfilmentToggle({ value, onChange }: { value: Fulfilment; onChange: (f: Fulfilment) => void }) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Order type">
      {(['delivery', 'pickup'] as const).map((f) => (
        <button key={f} type="button" role="radio" aria-checked={value === f} className="segmented__opt" onClick={() => onChange(f)}>
          <Icon name={f === 'delivery' ? 'scooter' : 'store'} size={18} />
          {f === 'delivery' ? 'Delivery' : 'Pickup'}
        </button>
      ))}
    </div>
  )
}

export function LocationDialog() {
  const { locationOpen } = useUi()
  // Mounting on open gives the form fresh state from the saved location each time.
  return locationOpen ? <LocationForm /> : null
}

const range = (pick: (s: Store) => [number, number]) => `${Math.min(...STORES.map((s) => pick(s)[0]))}–${Math.max(...STORES.map((s) => pick(s)[1]))} min`
const MODES: { id: Fulfilment; label: string; note: string; time: string }[] = [
  { id: 'delivery', label: 'Delivery', note: 'To your door', time: range((s) => s.deliveryMins) },
  { id: 'pickup', label: 'Pickup', note: 'No delivery fee', time: `Ready in ${range((s) => s.pickupMins)}` },
]

function LocationForm() {
  const { state, dispatch } = useStore()
  const { setLocationOpen, showToast } = useUi()
  const [mode, setMode] = useState<Fulfilment>(state.fulfilment)
  const [query, setQuery] = useState('')
  const [storeId, setStoreId] = useState(state.location?.storeId ?? '')
  // For delivery, the area list folds away once an area is chosen so the address fields come next.
  const [changingArea, setChangingArea] = useState(!state.location?.storeId)
  const [address, setAddress] = useState(state.location?.address ?? '')
  const [landmark, setLandmark] = useState(state.location?.landmark ?? '')
  const [geo, setGeo] = useState<'idle' | 'busy' | 'denied'>('idle')
  const [error, setError] = useState('')
  const list = useRef<HTMLUListElement>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return STORES.filter((s) => !q || `${s.area} ${s.city} ${s.address}`.toLowerCase().includes(q))
  }, [query])

  const selected = storeId ? STORE_BY_ID[storeId] : null
  const delivery = mode === 'delivery'
  const showList = !delivery || !selected || changingArea

  // Bring the saved store into view when the list opens.
  useEffect(() => {
    if (showList) list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [showList, mode])

  const choose = (id: string) => {
    setStoreId(id)
    setChangingArea(false)
    setError('')
  }

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return setGeo('denied')
    setGeo('busy')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        choose(nearestStore(pos.coords.latitude, pos.coords.longitude).id)
        setGeo('idle')
      },
      () => setGeo('denied'),
      { timeout: 8000 },
    )
  }

  const save = () => {
    if (!storeId) return setError(delivery ? 'Choose your area so we can find your nearest store.' : 'Choose a store to pick up from.')
    if (delivery && address.trim().length < 5) return setError('Add your house number and street so the rider can find you.')
    const changedMode = mode !== state.fulfilment
    dispatch({
      type: 'setLocation',
      fulfilment: mode,
      // Keep the address when switching to pickup so switching back doesn't lose it.
      location: { storeId, address: address.trim(), landmark: landmark.trim() },
    })
    setLocationOpen(false)
    if (changedMode && state.cart.length) {
      showToast({ text: mode === 'pickup' ? 'Switched to pickup. Your cart is kept and there’s no delivery fee.' : 'Switched to delivery. Your cart is kept.' })
    }
  }

  const mins = (st: Store) => (delivery ? st.deliveryMins : st.pickupMins).join('–')

  return (
    <Dialog
      open
      onClose={() => setLocationOpen(false)}
      title={delivery ? 'Where should we bring your pizza?' : 'Where will you pick up?'}
      className="loc-dialog"
      footer={
        <>
          {error && (
            <p className="form-error" role="alert">
              <Icon name="info" size={16} /> {error}
            </p>
          )}
          {selected && (
            <p className="loc-summary">
              <span className="loc-summary__icon">
                <Icon name={delivery ? 'scooter' : 'store'} size={18} />
              </span>
              <span>
                <strong>{delivery ? `Delivering in ${selected.city}` : `${selected.area} store`}</strong>
                <span className="muted small">
                  {delivery ? `From ${selected.area} store · ${mins(selected)} min` : `Ready in ${mins(selected)} min · ${selected.address}`}
                </span>
              </span>
            </p>
          )}
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={save}>
            {delivery ? 'Deliver here' : selected ? `Pick up from ${selected.area}` : 'Pick up from this store'}
          </button>
        </>
      }
    >
      <p className="loc-lead">You can browse the menu and build your cart first. Switching later keeps your cart.</p>

      <div className="loc-modes" role="radiogroup" aria-label="Order type">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            className="loc-mode"
            onClick={() => {
              setMode(m.id)
              setError('')
            }}
          >
            <span className="loc-mode__icon">
              <Icon name={m.id === 'delivery' ? 'scooter' : 'store'} size={22} />
            </span>
            <span className="loc-mode__text">
              <strong>{m.label}</strong>
              <span>
                {m.note} · <span className="nowrap">{m.time}</span>
              </span>
            </span>
            <span className="loc-mode__check" aria-hidden="true">
              <Icon name="check" size={14} />
            </span>
          </button>
        ))}
      </div>

      {showList ? (
        <div className="loc-pick">
          <div className="loc-search">
            <label htmlFor="area-search" className="sr-only">
              {delivery ? 'Find your area' : 'Find a store'}
            </label>
            <div className="input-icon loc-search__input">
              <Icon name="search" size={18} />
              <input
                id="area-search"
                data-autofocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={delivery ? 'Search your area, e.g. Nugegoda' : 'Search stores, e.g. Kandy'}
                autoComplete="off"
              />
            </div>
            <button type="button" className="loc-near" onClick={useMyLocation} disabled={geo === 'busy'}>
              <Icon name="locate" size={16} /> {geo === 'busy' ? 'Finding…' : 'Near me'}
            </button>
          </div>
          {geo === 'denied' && <p className="hint hint--warn">Location is turned off for this site. Pick your area from the list instead.</p>}

          <p className="loc-count">
            {delivery ? 'Choose your area' : 'Choose a store'}{' '}
            <span>
              {matches.length} of {STORES.length}
            </span>
          </p>
          <ul ref={list} className="loc-list" role="listbox" aria-label={delivery ? 'Areas' : 'Stores'}>
            {matches.map((st) => (
              <li key={st.id}>
                <button type="button" role="option" aria-selected={storeId === st.id} className="loc-store" onClick={() => choose(st.id)}>
                  <span className="loc-store__icon">
                    <Icon name={delivery ? 'pin' : 'store'} size={18} />
                  </span>
                  <span className="loc-store__text">
                    <strong>{delivery ? st.city : `${st.area} store`}</strong>
                    <span>
                      {delivery ? (
                        <>
                          From {st.area} store · <span className="nowrap">{mins(st)} min</span>
                        </>
                      ) : (
                        st.address
                      )}
                    </span>
                  </span>
                  <span className="loc-store__radio" aria-hidden="true">
                    <Icon name="check" size={12} />
                  </span>
                </button>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="loc-empty">
                <Icon name="search" size={20} />
                <span>
                  No stores match “{query}”. <br />
                  Try a nearby town.
                </span>
              </li>
            )}
          </ul>
        </div>
      ) : (
        <>
          <div className="loc-chosen">
            <span className="loc-store__icon">
              <Icon name="pin" size={18} />
            </span>
            <span className="loc-store__text">
              <strong>{selected!.city}</strong>
              <span>
                From {selected!.area} store · {mins(selected!)} min
              </span>
            </span>
            <button type="button" className="link-btn" onClick={() => setChangingArea(true)}>
              <Icon name="pencil" size={14} /> Change
            </button>
          </div>
          <div className="address-fields">
            <div className="field">
              <label htmlFor="addr">House no. & street</label>
              <input
                id="addr"
                data-autofocus
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 24/3, Lauries Road"
                autoComplete="street-address"
              />
            </div>
            <div className="field">
              <label htmlFor="landmark">
                Landmark <span className="muted">(optional, helps the rider)</span>
              </label>
              <input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Opposite the Keells, blue gate" />
            </div>
          </div>
        </>
      )}
    </Dialog>
  )
}
