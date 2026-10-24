import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { PRODUCT_BY_ID } from '../data/menu'
import { computeTotals, type CartItem, type Fulfilment, type Totals } from '../lib/pricing'

export interface Location {
  storeId: string
  address?: string
  landmark?: string
}

export interface Contact {
  name: string
  phone: string
  email: string
}

export type PaymentMethod = 'cash' | 'card-on-delivery' | 'online'

export interface Order {
  id: string
  placedAt: number
  etaMins: [number, number]
  fulfilment: Fulfilment
  location: Location
  items: CartItem[]
  totals: Totals
  payment: PaymentMethod
  contact: Contact
  /** Set for orders booked ahead: when the food should be ready (pickup) or arrive (delivery). */
  scheduledFor?: number
  cancelledAt?: number
}

interface State {
  fulfilment: Fulfilment
  location: Location | null
  cart: CartItem[]
  coupon: string | null
  orders: Order[]
  contact: Contact | null
}

type Action =
  | { type: 'setFulfilment'; fulfilment: Fulfilment }
  | { type: 'setLocation'; location: Location; fulfilment: Fulfilment }
  | { type: 'addItem'; item: CartItem }
  | { type: 'replaceItem'; item: CartItem }
  | { type: 'setQty'; key: string; qty: number }
  | { type: 'restoreCart'; cart: CartItem[] }
  | { type: 'setCoupon'; coupon: string | null }
  | { type: 'placeOrder'; order: Order }
  | { type: 'updateOrder'; id: string; patch: Partial<Pick<Order, 'scheduledFor' | 'cancelledAt'>> }

const STORAGE_KEY = 'dlk-state-v1'

const initial: State = { fulfilment: 'delivery', location: null, cart: [], coupon: null, orders: [], contact: null }

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved: State = { ...initial, ...JSON.parse(raw) }
      // Drop items that are no longer on the menu so old carts and orders still render.
      const known = (i: CartItem) => i.productId in PRODUCT_BY_ID
      return {
        ...saved,
        cart: saved.cart.filter(known),
        orders: saved.orders.map((o) => ({ ...o, items: o.items.filter(known) })).filter((o) => o.items.length > 0),
      }
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data); start fresh.
  }
  return initial
}

/** Two cart lines are the same if they'd make the same pizza. */
function sameConfig(a: CartItem, b: CartItem) {
  return (
    a.productId === b.productId &&
    a.size === b.size &&
    a.crust === b.crust &&
    !!a.extraCheese === !!b.extraCheese &&
    [...(a.extras ?? [])].sort().join() === [...(b.extras ?? [])].sort().join()
  )
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setFulfilment':
      return { ...state, fulfilment: action.fulfilment }
    case 'setLocation':
      return { ...state, location: action.location, fulfilment: action.fulfilment }
    case 'addItem': {
      const existing = state.cart.find((i) => sameConfig(i, action.item))
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((i) => (i === existing ? { ...i, qty: i.qty + action.item.qty } : i)),
        }
      }
      return { ...state, cart: [...state.cart, action.item] }
    }
    case 'replaceItem':
      return { ...state, cart: state.cart.map((i) => (i.key === action.item.key ? action.item : i)) }
    case 'setQty':
      return {
        ...state,
        cart: action.qty <= 0 ? state.cart.filter((i) => i.key !== action.key) : state.cart.map((i) => (i.key === action.key ? { ...i, qty: action.qty } : i)),
      }
    case 'restoreCart':
      return { ...state, cart: action.cart }
    case 'setCoupon':
      return { ...state, coupon: action.coupon }
    case 'placeOrder':
      return {
        ...state,
        cart: [],
        coupon: null,
        contact: action.order.contact,
        orders: [action.order, ...state.orders].slice(0, 10),
      }
    case 'updateOrder':
      return { ...state, orders: state.orders.map((o) => (o.id === action.id ? { ...o, ...action.patch } : o)) }
  }
}

interface Ctx {
  state: State
  totals: Totals
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const totals = useMemo(() => computeTotals(state.cart, state.fulfilment, state.coupon), [state.cart, state.fulfilment, state.coupon])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Not fatal: the cart still works for this visit.
    }
  }, [state])

  return <StoreContext.Provider value={{ state, totals, dispatch }}>{children}</StoreContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
