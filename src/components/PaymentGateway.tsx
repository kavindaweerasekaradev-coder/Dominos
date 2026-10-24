import { useEffect, useMemo, useRef, useState } from 'react'
import { formatPhone, normalisePhone } from '../lib/phone'
import { lkr } from '../lib/pricing'
import { Dialog } from './Dialog'
import { Icon, type IconName } from './Icon'

/*
 * Demo payment screen, shaped like a Sri Lankan payment gateway (cards with 3-D Secure, mobile wallets
 * and LankaQR). Nothing is sent anywhere and no money is taken: card details stay in this component.
 * To go live, replace `process` with a call to your gateway (for example PayHere or webxPay) from a server.
 */

type Method = 'card' | 'wallet' | 'qr'
type Stage = 'form' | 'processing' | 'otp' | 'success'
type Brand = 'visa' | 'mastercard' | 'amex' | null

const METHODS: { id: Method; label: string; icon: IconName }[] = [
  { id: 'card', label: 'Card', icon: 'card' },
  { id: 'wallet', label: 'Mobile wallet', icon: 'mobile' },
  { id: 'qr', label: 'LankaQR', icon: 'qr' },
]
const WALLETS = ['Genie', 'eZ Cash', 'FriMi']
// Official logos go in public/wallets/ (see the README there); until a file is added, a lettered badge shows instead.
const WALLET_LOGO: Record<string, string> = { Genie: 'genie.png', 'eZ Cash': 'ezcash.png', FriMi: 'frimi.png' }

function WalletLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="pay-wallet__mark">{name.replace(/\W/g, '').slice(0, 2)}</span>
  return (
    <span className="pay-wallet__logo">
      <img src={`${import.meta.env.BASE_URL}wallets/${WALLET_LOGO[name]}`} alt="" onError={() => setFailed(true)} />
    </span>
  )
}
const BRAND_LABEL: Record<NonNullable<Brand>, string> = { visa: 'VISA', mastercard: 'Mastercard', amex: 'AMEX' }

const digitsOf = (v: string) => v.replace(/\D/g, '')
function brandOf(num: string): Brand {
  if (/^4/.test(num)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(num)) return 'mastercard'
  if (/^3[47]/.test(num)) return 'amex'
  return null
}
/** Luhn checksum, the check digit every real card number passes. */
function luhn(num: string) {
  let sum = 0
  for (let i = 0; i < num.length; i++) {
    let d = Number(num[num.length - 1 - i])
    if (i % 2) d = d * 2 > 9 ? d * 2 - 9 : d * 2
    sum += d
  }
  return num.length >= 13 && sum % 10 === 0
}
function groupCard(num: string, brand: Brand) {
  const groups = brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4, 3]
  const out: string[] = []
  let i = 0
  for (const g of groups) {
    if (i >= num.length) break
    out.push(num.slice(i, i + g))
    i += g
  }
  return out.join(' ')
}
function expiryValid(v: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(v)
  if (!m) return false
  const month = Number(m[1])
  if (month < 1 || month > 12) return false
  const end = new Date(2000 + Number(m[2]), month, 1)
  return end > new Date()
}

/** A QR-looking pattern for the demo; a real gateway returns the LankaQR code to show here. */
function DemoQr({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let h = 0
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
    const out: boolean[] = []
    for (let i = 0; i < 25 * 25; i++) {
      h = (h * 1103515245 + 12345) >>> 0
      out.push(((h >>> 16) & 1) === 1)
    }
    return out
  }, [seed])
  const finder = (x: number, y: number) => {
    const inBox = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7
    return inBox(0, 0) || inBox(18, 0) || inBox(0, 18)
  }
  return (
    <svg viewBox="0 0 25 25" className="pay-qr__code" shapeRendering="crispEdges" aria-hidden="true">
      {cells.map((on, i) => {
        const x = i % 25
        const y = Math.floor(i / 25)
        return on && !finder(x, y) ? <rect key={i} x={x} y={y} width="1" height="1" /> : null
      })}
      {[
        [0, 0],
        [18, 0],
        [0, 18],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" />
          <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
          <rect x={x + 2} y={y + 2} width="3" height="3" />
        </g>
      ))}
    </svg>
  )
}

export function PaymentGateway({
  open,
  amount,
  orderRef,
  phone,
  onPaid,
  onCancel,
}: {
  open: boolean
  amount: number
  orderRef: string
  phone: string
  onPaid: () => void
  onCancel: () => void
}) {
  const [method, setMethod] = useState<Method>('card')
  const [stage, setStage] = useState<Stage>('form')
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [flipped, setFlipped] = useState(false)
  const [wallet, setWallet] = useState(WALLETS[0])
  const [walletPhone, setWalletPhone] = useState(formatPhone(phone))
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const timers = useRef<number[]>([])
  const clear = (k: string) =>
    errors[k] &&
    setErrors((e) => {
      const next = { ...e }
      delete next[k]
      return next
    })

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const num = digitsOf(number)
  const brand = brandOf(num)
  const cvvLen = brand === 'amex' ? 4 : 3
  const busy = stage === 'processing' || stage === 'success'

  const finish = () => {
    setStage('processing')
    later(() => {
      setStage('success')
      later(onPaid, 1300)
    }, 1500)
  }

  const pay = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (method === 'card') {
      if (!luhn(num)) errs.number = 'Check the card number.'
      if (name.trim().length < 2) errs.name = 'Enter the name on the card.'
      if (!expiryValid(expiry)) errs.expiry = 'Use MM/YY, not in the past.'
      if (digitsOf(cvv).length !== cvvLen) errs.cvv = `${cvvLen} digits on the ${brand === 'amex' ? 'front' : 'back'}.`
    }
    if (method === 'wallet' && !normalisePhone(walletPhone)) errs.walletPhone = 'Enter the mobile number linked to your wallet.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    if (method === 'card') {
      // Banks ask for a one-time code (3-D Secure) before approving an online card payment.
      setStage('processing')
      later(() => setStage('otp'), 1100)
    } else {
      finish()
    }
  }

  const confirmOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otp)) return setErrors({ otp: 'Enter the 6-digit code.' })
    setErrors({})
    finish()
  }

  const last4 = num.slice(-4)
  const masked = phone ? `+94 ${formatPhone(phone).slice(0, 2)} *** ${phone.slice(-4)}` : 'your phone'

  return (
    <Dialog open={open} onClose={() => !busy && onCancel()} title="Secure payment" className="pay-dialog">
      <div className="pay-head">
        <div>
          <span className="pay-head__label">Paying Domino’s Sri Lanka</span>
          <strong className="pay-head__amount">{lkr(amount)}</strong>
          <span className="pay-head__ref">Order ref {orderRef}</span>
        </div>
        <span className="pay-head__lock">
          <Icon name="lock" size={20} />
        </span>
      </div>

      {stage === 'success' ? (
        <div className="pay-result" role="status">
          <span className="pay-result__icon">
            <Icon name="check" size={34} />
          </span>
          <h3>Payment successful</h3>
          <p className="muted">{lkr(amount)} paid. Placing your order…</p>
        </div>
      ) : stage === 'processing' ? (
        <div className="pay-result" role="status">
          <span className="pay-result__spin">
            <Icon name="loader" size={34} />
          </span>
          <h3>{method === 'wallet' ? `Waiting for ${wallet}…` : method === 'qr' ? 'Checking for your payment…' : 'Contacting your bank…'}</h3>
          <p className="muted">Please don’t close this window.</p>
        </div>
      ) : stage === 'otp' ? (
        <form className="pay-form" onSubmit={confirmOtp} noValidate>
          <div className="pay-otp">
            <span className="pay-otp__badge">
              <Icon name="shield" size={18} /> 3-D Secure
            </span>
            <h3>Confirm with your bank</h3>
            <p className="muted">
              Enter the one-time code sent to {masked} for your {brand ? BRAND_LABEL[brand] : 'card'} ending {last4}.
            </p>
            <input
              className="pay-otp__input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(digitsOf(e.target.value).slice(0, 6))
                clear('otp')
              }}
              aria-label="One-time code"
              aria-invalid={!!errors.otp}
              data-autofocus
              placeholder="••••••"
            />
            {errors.otp && <p className="field-error">{errors.otp}</p>}
            <p className="pay-demo">Demo: any 6 digits work.</p>
          </div>
          <button type="submit" className="btn btn--hot btn--lg btn--block">
            Confirm & pay {lkr(amount)}
          </button>
          <button type="button" className="link-btn pay-back" onClick={() => setStage('form')}>
            Use a different card
          </button>
        </form>
      ) : (
        <form className="pay-form" onSubmit={pay} noValidate>
          <div className="pay-tabs" role="radiogroup" aria-label="Payment method">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={method === m.id}
                className="pay-tab"
                onClick={() => {
                  setMethod(m.id)
                  setErrors({})
                }}
              >
                <Icon name={m.icon} size={18} /> {m.label}
              </button>
            ))}
          </div>

          {method === 'card' && (
            <>
              <div className={`pay-card ${flipped ? 'is-flipped' : ''}`} aria-hidden="true">
                <div className="pay-card__face pay-card__front">
                  <div className="pay-card__top">
                    <span className="pay-card__chip" />
                    <span className="pay-card__brand">{brand ? BRAND_LABEL[brand] : ''}</span>
                  </div>
                  <span className="pay-card__number">{num ? groupCard(num, brand) : '•••• •••• •••• ••••'}</span>
                  <div className="pay-card__bottom">
                    <span>
                      <small>Card holder</small>
                      {name.trim() || 'YOUR NAME'}
                    </span>
                    <span>
                      <small>Expires</small>
                      {expiry || 'MM/YY'}
                    </span>
                  </div>
                </div>
                <div className="pay-card__face pay-card__back">
                  <span className="pay-card__stripe" />
                  <span className="pay-card__cvv">{cvv.replace(/./g, '•') || '•••'}</span>
                </div>
              </div>

              <div className="field">
                <label htmlFor="pay-num">Card number</label>
                <div className="pay-input">
                  <input
                    id="pay-num"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={number}
                    onChange={(e) => {
                      const d = digitsOf(e.target.value).slice(0, brandOf(digitsOf(e.target.value)) === 'amex' ? 15 : 19)
                      setNumber(groupCard(d, brandOf(d)))
                      clear('number')
                    }}
                    placeholder="1234 5678 9012 3456"
                    aria-invalid={!!errors.number}
                    data-autofocus
                  />
                  <span className="pay-input__brand">{brand ? BRAND_LABEL[brand] : <Icon name="card" size={18} />}</span>
                </div>
                {errors.number && <p className="field-error">{errors.number}</p>}
              </div>
              <div className="field">
                <label htmlFor="pay-name">Name on card</label>
                <input
                  id="pay-name"
                  autoComplete="cc-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value.toUpperCase())
                    clear('name')
                  }}
                  placeholder="K WEERASEKARA"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>
              <div className="form-row pay-row">
                <div className="field">
                  <label htmlFor="pay-exp">Expiry</label>
                  <input
                    id="pay-exp"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={expiry}
                    onChange={(e) => {
                      const d = digitsOf(e.target.value).slice(0, 4)
                      setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d)
                      clear('expiry')
                    }}
                    placeholder="MM/YY"
                    aria-invalid={!!errors.expiry}
                  />
                  {errors.expiry && <p className="field-error">{errors.expiry}</p>}
                </div>
                <div className="field">
                  <label htmlFor="pay-cvv">Security code</label>
                  <input
                    id="pay-cvv"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cvv}
                    onFocus={() => setFlipped(true)}
                    onBlur={() => setFlipped(false)}
                    onChange={(e) => {
                      setCvv(digitsOf(e.target.value).slice(0, cvvLen))
                      clear('cvv')
                    }}
                    placeholder={cvvLen === 4 ? '1234' : '123'}
                    aria-invalid={!!errors.cvv}
                  />
                  {errors.cvv && <p className="field-error">{errors.cvv}</p>}
                </div>
              </div>
              <p className="pay-demo">Demo: try 4242 4242 4242 4242, any future expiry and any 3-digit code.</p>
            </>
          )}

          {method === 'wallet' && (
            <>
              <div className="pay-wallets" role="radiogroup" aria-label="Wallet">
                {WALLETS.map((w) => (
                  <button key={w} type="button" role="radio" aria-checked={wallet === w} className="pay-wallet" onClick={() => setWallet(w)}>
                    <WalletLogo name={w} />
                    {w}
                  </button>
                ))}
              </div>
              <div className="field">
                <label htmlFor="pay-wphone">Mobile number linked to {wallet}</label>
                <div className="phone-input">
                  <span className="phone-input__cc" aria-hidden="true">
                    +94
                  </span>
                  <input
                    id="pay-wphone"
                    type="tel"
                    inputMode="tel"
                    value={walletPhone}
                    onChange={(e) => {
                      setWalletPhone(e.target.value)
                      clear('walletPhone')
                    }}
                    placeholder="77 123 4567"
                    aria-invalid={!!errors.walletPhone}
                  />
                </div>
                {errors.walletPhone && <p className="field-error">{errors.walletPhone}</p>}
              </div>
              <p className="pay-note">
                <Icon name="mobile" size={16} /> We’ll send a payment request to your {wallet} app. Approve it there to finish.
              </p>
            </>
          )}

          {method === 'qr' && (
            <div className="pay-qr">
              <div className="pay-qr__frame">
                <DemoQr seed={orderRef} />
                <span className="pay-qr__logo">
                  <Icon name="qr" size={16} />
                </span>
              </div>
              <div>
                <strong>Scan with any LankaQR app</strong>
                <p className="muted small">Open your banking or wallet app, scan the code and pay {lkr(amount)}. Then tap the button below.</p>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn--hot btn--lg btn--block pay-submit">
            <Icon name="lock" size={18} />
            {method === 'qr' ? 'I’ve paid' : method === 'wallet' ? `Send request to ${wallet}` : `Pay ${lkr(amount)}`}
          </button>
          <button type="button" className="link-btn pay-back" onClick={onCancel}>
            Cancel and go back
          </button>
        </form>
      )}

      <p className="pay-foot">
        <Icon name="shield" size={14} /> Demo payment screen. No money is taken and card details never leave this page.
      </p>
    </Dialog>
  )
}
