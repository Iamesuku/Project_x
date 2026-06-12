/**
 * Avatar — renders either a Google profile photo (when avatar is a URL)
 * or an initials badge (when avatar is 1-2 characters).
 *
 * Props:
 *   src      {string}  — the avatar value: a URL or initials string
 *   name     {string}  — fallback for alt text / initials derivation
 *   size     {number}  — pixel diameter (default 36)
 *   className {string} — extra CSS class for the wrapper element
 */
export default function Avatar({ src, name = '', size = 36, className = '' }) {
  const isUrl = src && (src.startsWith('http') || src.startsWith('data:'))

  const style = {
    width:          size,
    height:         size,
    borderRadius:   '50%',
    flexShrink:     0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
    background:     isUrl ? 'transparent' : 'var(--nexus-ink, #1a1a1a)',
    color:          'var(--nexus-surface, #fff)',
    fontSize:       Math.max(10, Math.round(size * 0.3)),
    fontWeight:     700,
    letterSpacing:  '0.02em',
    userSelect:     'none',
    lineHeight:     1,
  }

  if (isUrl) {
    return (
      <div style={style} className={className} aria-hidden="true">
        <img
          src={src}
          alt={name ? `${name}'s photo` : 'User photo'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          referrerPolicy="no-referrer"
          onError={e => {
            // If the Google photo fails to load, fall back to initials
            const parent = e.currentTarget.parentElement
            if (parent) {
              parent.style.background = 'var(--nexus-ink, #1a1a1a)'
              parent.innerHTML = deriveInitials(name)
            }
          }}
        />
      </div>
    )
  }

  // Initials or single character — show text directly
  return (
    <div style={style} className={className} aria-hidden="true">
      {src || deriveInitials(name)}
    </div>
  )
}

/** Derive up to 2 initials from a name string */
function deriveInitials(name) {
  if (!name) return 'U'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
