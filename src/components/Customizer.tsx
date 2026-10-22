import { useState } from 'react'
import {
  CRUSTS,
  EXTRA_CHEESE_PRICE,
  EXTRA_TOPPING_PRICE,
  EXTRA_TOPPINGS,
  PRODUCT_BY_ID,
  SIZES,
  type CrustId,
  type PizzaProduct,
  type SizeId,
  type Topping,
} from '../data/menu'
import { newKey } from '../lib/id'
import { describeItem, lkr, unitPrice, type CartItem } from '../lib/pricing'
import { useStore } from '../state/store'
import { useUi } from '../state/ui'
import { Dialog } from './Dialog'
import { FoodPhoto } from './FoodPhoto'
import { Icon } from './Icon'
import { TagList } from './ProductCard'

interface Draft {
  size: SizeId
  crust: CrustId
  extras: Topping[]
  extraCheese: boolean
  qty: number
}

const defaultDraft = (): Draft => ({ size: 'medium', crust: 'hand', extras: [], extraCheese: false, qty: 1 })

export function Customizer() {
  const { product: target } = useUi()
  // Unsaved choices survive closing the sheet, so nothing is lost by accident.
  const [drafts] = useState(() => new Map<string, Draft>())
  if (!target || PRODUCT_BY_ID[target.id]?.category !== 'pizza') return null
  return <CustomizerSheet key={`${target.id}:${target.editKey ?? ''}`} productId={target.id} editKey={target.editKey} drafts={drafts} />
}

function CustomizerSheet({ productId, editKey, drafts }: { productId: string; editKey?: string; drafts: Map<string, Draft> }) {
  const { closeProduct, showToast, setCartOpen } = useUi()
  const { state, dispatch } = useStore()
  const product = PRODUCT_BY_ID[productId] as PizzaProduct
  const editing = editKey ? state.cart.find((i) => i.key === editKey) : undefined
  const [draft, setDraft] = useState<Draft>(() =>
    editing
      ? { size: editing.size ?? 'medium', crust: editing.crust ?? 'hand', extras: editing.extras ?? [], extraCheese: !!editing.extraCheese, qty: editing.qty }
      : (drafts.get(productId) ?? defaultDraft()),
  )

  const update = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    if (!editing) drafts.set(product.id, next)
  }

  const item: CartItem = { key: editing?.key ?? newKey(), productId: product.id, ...draft }
  const unit = unitPrice(item)

  const submit = () => {
    if (editing) {
      dispatch({ type: 'replaceItem', item })
      showToast({ text: `Updated ${product.name}` })
    } else {
      const before = state.cart
      dispatch({ type: 'addItem', item })
      drafts.delete(product.id)
      showToast({
        text: `${product.name} (${describeItem(item)}) added`,
        action: { label: 'View cart', onClick: () => setCartOpen(true) },
        secondary: { label: 'Undo', onClick: () => dispatch({ type: 'restoreCart', cart: before }) },
      })
    }
    closeProduct()
  }

  const toggleExtra = (t: Topping) => update({ extras: draft.extras.includes(t) ? draft.extras.filter((x) => x !== t) : [...draft.extras, t] })
  const vegOnly = product.tags.includes('veg')
  const toppingOptions = EXTRA_TOPPINGS.filter((t) => !vegOnly || t.veg)

  return (
    <Dialog
      open
      onClose={closeProduct}
      title={product.name}
      className="customizer"
      footer={
        <div className="customizer__foot">
          <div className="qty" aria-label="Quantity">
            <button type="button" className="qty__btn" onClick={() => update({ qty: Math.max(1, draft.qty - 1) })} disabled={draft.qty <= 1} aria-label="Fewer">
              <Icon name="minus" size={18} />
            </button>
            <span className="qty__val" aria-live="polite">
              {draft.qty}
            </span>
            <button type="button" className="qty__btn" onClick={() => update({ qty: Math.min(20, draft.qty + 1) })} aria-label="More">
              <Icon name="plus" size={18} />
            </button>
          </div>
          <button type="button" className="btn btn--primary btn--grow" onClick={submit}>
            <span>{editing ? 'Update item' : 'Add to cart'}</span>
            <span className="btn__price" aria-live="polite">
              {lkr(unit * draft.qty)}
            </span>
          </button>
        </div>
      }
    >
      <div className="customizer__hero">
        <div className="customizer__art">
          <FoodPhoto photo={product.photo} width={360} />
        </div>
        <div>
          <p className="eyebrow">{editing ? 'Edit your pizza' : 'Make it yours'}</p>
          <p className="muted">{product.description}</p>
          <TagList product={product} />
        </div>
      </div>

      <fieldset className="opt-group">
        <legend>
          Size <span className="req">Required</span>
        </legend>
        <div className="size-grid">
          {SIZES.map((s) => (
            <label key={s.id} className={`size-opt ${draft.size === s.id ? 'is-on' : ''}`}>
              <input type="radio" name="size" checked={draft.size === s.id} onChange={() => update({ size: s.id })} />
              <svg viewBox="0 0 40 40" width={18 + s.inches * 1.6} height={18 + s.inches * 1.6} aria-hidden="true">
                <circle className="size-opt__crust" cx="20" cy="20" r="18" />
                <circle className="size-opt__top" cx="20" cy="20" r="14" />
              </svg>
              <strong>{s.label}</strong>
              <span className="muted small">
                {s.inches}″ · {s.serves}
              </span>
              <span className="size-opt__price">{lkr(product.prices[s.id])}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="opt-group">
        <legend>Crust</legend>
        <div className="crust-grid">
          {CRUSTS.map((c) => (
            <label key={c.id} className={`choice ${draft.crust === c.id ? 'is-on' : ''}`}>
              <input type="radio" name="crust" checked={draft.crust === c.id} onChange={() => update({ crust: c.id })} />
              <span className="choice__text">
                <strong>{c.label}</strong>
                <span className="muted small">{c.note}</span>
              </span>
              <span className="choice__price">{c.extra[draft.size] ? `+${lkr(c.extra[draft.size])}` : 'Included'}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="opt-group">
        <legend>
          Extra toppings <span className="muted small">+{lkr(EXTRA_TOPPING_PRICE[draft.size])} each</span>
        </legend>
        <div className="chip-wrap">
          {toppingOptions.map((t) => (
            <label key={t.id} className={`chip chip--check ${draft.extras.includes(t.id) ? 'is-on' : ''}`}>
              <input type="checkbox" checked={draft.extras.includes(t.id)} onChange={() => toggleExtra(t.id)} />
              {draft.extras.includes(t.id) ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />}
              {t.label}
            </label>
          ))}
        </div>
        <label className={`choice choice--inline ${draft.extraCheese ? 'is-on' : ''}`}>
          <input type="checkbox" checked={draft.extraCheese} onChange={() => update({ extraCheese: !draft.extraCheese })} />
          <span className="choice__text">
            <strong>Extra mozzarella</strong>
            <span className="muted small">Double the cheese pull</span>
          </span>
          <span className="choice__price">+{lkr(EXTRA_CHEESE_PRICE[draft.size])}</span>
        </label>
      </fieldset>

      <p className="fine-print">
        <Icon name="info" size={14} /> Prices include all taxes. No hidden service charge.
      </p>
    </Dialog>
  )
}
