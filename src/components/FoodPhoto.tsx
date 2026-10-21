import { useState } from 'react'
import type { Photo } from '../data/menu'
import { Icon } from './Icon'

/** Unsplash's download link redirects to its image CDN at the requested width. */
const photoUrl = (photo: Photo, width: number) => `https://unsplash.com/photos/${photo.id}/download?w=${width}`

interface Props {
  photo: Photo
  /** Display width in CSS pixels; a 2x version is offered for sharp screens. */
  width: number
  alt?: string
  eager?: boolean
}

export function FoodPhoto({ photo, width, alt = '', eager = false }: Props) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  if (failed) {
    return (
      <span className="photo photo--missing" role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <Icon name="pizza" size={Math.max(20, Math.min(40, Math.round(width / 6)))} />
      </span>
    )
  }
  return (
    <img
      // Fade in once loaded instead of popping in; also catches images that were already cached.
      ref={(img) => {
        if (img?.complete && img.naturalWidth > 0 && !loaded) setLoaded(true)
      }}
      className={`photo ${loaded ? 'is-loaded' : ''}`}
      src={photoUrl(photo, width)}
      srcSet={`${photoUrl(photo, width)} 1x, ${photoUrl(photo, width * 2)} 2x`}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  )
}
