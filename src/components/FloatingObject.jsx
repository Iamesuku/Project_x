import styles from './FloatingObject.module.css'

/**
 * FloatingObject — renders an absolutely-positioned CSS geometric shape
 * with a floating animation (translateY oscillation).
 *
 * @param {'circle'|'hexagon'|'diamond'|'ring'|'square'} shape
 * @param {number} size          - px
 * @param {string} x             - CSS left value (%, px)
 * @param {string} y             - CSS top value  (%, px)
 * @param {number} duration      - float cycle seconds (default 5)
 * @param {number} phase         - animation delay 0-1 mapped to -duration..0
 * @param {number} opacity       - 0-1
 * @param {string} colour        - CSS colour
 * @param {number} blur          - px blur (default 0)
 * @param {boolean} rotate       - spin while floating (default false)
 * @param {boolean} filled       - filled vs outlined (default false)
 */
export default function FloatingObject({
  shape = 'circle',
  size = 40,
  x = '50%',
  y = '50%',
  duration = 5,
  phase = 0,
  opacity = 0.2,
  colour = 'var(--nexus-accent)',
  blur = 0,
  rotate = false,
  filled = false,
}) {
  const delay = -(phase * duration)

  const baseStyle = {
    position: 'absolute',
    left: x,
    top: y,
    width: size,
    height: size,
    opacity,
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
    animationName: rotate ? `${styles['float']}, ${styles['spin360']}` : styles['float'],
    animationDuration: rotate ? `${duration}s, ${duration * 3}s` : `${duration}s`,
    animationTimingFunction: 'ease-in-out, linear',
    animationIterationCount: 'infinite',
    animationDelay: `${delay}s`,
    willChange: 'transform',
    pointerEvents: 'none',
  }

  if (shape === 'circle') {
    return (
      <div
        className={styles.floatObj}
        style={{
          ...baseStyle,
          borderRadius: '50%',
          background: filled ? colour : 'transparent',
          border: filled ? 'none' : `1.5px solid ${colour}`,
        }}
      />
    )
  }

  if (shape === 'ring') {
    return (
      <div
        className={styles.floatObj}
        style={{
          ...baseStyle,
          borderRadius: '50%',
          border: `${Math.max(2, size * 0.06)}px solid ${colour}`,
          background: 'transparent',
        }}
      />
    )
  }

  if (shape === 'diamond') {
    return (
      <div
        className={styles.floatObj}
        style={{
          ...baseStyle,
          transform: 'rotate(45deg)',
          background: filled ? colour : 'transparent',
          border: filled ? 'none' : `1.5px solid ${colour}`,
          borderRadius: 4,
        }}
      />
    )
  }

  if (shape === 'square') {
    return (
      <div
        className={styles.floatObj}
        style={{
          ...baseStyle,
          background: filled ? colour : 'transparent',
          border: filled ? 'none' : `1.5px solid ${colour}`,
          borderRadius: 4,
        }}
      />
    )
  }

  if (shape === 'hexagon') {
    // CSS clip-path hexagon
    return (
      <div
        className={styles.floatObj}
        style={{
          ...baseStyle,
          background: filled ? colour : 'transparent',
          clipPath: 'polygon(50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)',
          border: 'none',
          outline: filled ? 'none' : `1.5px solid ${colour}`,
        }}
      />
    )
  }

  return null
}
