import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  variant?: 'center' | 'drawer'
  className?: string
  children: ReactNode
  footer?: ReactNode
  /** Extra content beside the title, such as a count. */
  badge?: ReactNode
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

/** Modal with focus trap, Esc to close, scroll lock and focus return. Becomes a bottom sheet on phones. */
export function Dialog({ open, onClose, title, variant = 'center', className = '', children, footer, badge }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const first = panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
      }
      if (e.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
        if (!items.length) return
        const [a, b] = [items[0], items[items.length - 1]]
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          b.focus()
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault()
          a.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [open])

  if (!open) return null
  const titleId = `dlg-${title.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <div className={`overlay overlay--${variant}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`dialog dialog--${variant} ${className}`}>
        <header className="dialog__head">
          <h2 id={titleId} className="dialog__title">
            {title}
            {badge}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </header>
        <div className="dialog__body">{children}</div>
        {footer && <footer className="dialog__foot">{footer}</footer>}
      </div>
    </div>
  )
}
