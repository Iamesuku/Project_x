import { useEffect, useRef, useState } from 'react'

/**
 * useScrollReveal — triggers visible=true when element enters the viewport.
 * • Respects prefers-reduced-motion (fires immediately)
 * • Falls back gracefully if IntersectionObserver is not supported
 * • rootMargin is generous so off-screen-but-close elements still animate
 *
 * @param {number} threshold  - 0–1 intersection ratio to trigger at
 * @param {boolean} once      - only fire once (default true)
 * @param {string}  rootMargin - IO margin (default "0px 0px -60px 0px")
 */
export function useScrollReveal(threshold = 0.05, once = true, rootMargin = '0px 0px -60px 0px') {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Immediately show if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    // Feature detect
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once, rootMargin])

  return [ref, visible]
}

/**
 * useCountUp — animates a number from 0 to target when triggered.
 * @param {number}  target   - the final value
 * @param {boolean} enabled  - start counting when true
 * @param {number}  duration - animation duration ms (default 900)
 */
export function useCountUp(target, enabled, duration = 900) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    const start = performance.now()
    function step(now) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, enabled, duration])

  return value
}

/**
 * use3DTilt — mouse-move 3D tilt on an element.
 * Disabled on coarse-pointer (touch) devices and reduced-motion.
 */
export function use3DTilt(maxTilt = 10) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    function onMouseMove(e) {
      const r = el.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2)
      const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2)
      el.style.transform  = `perspective(900px) rotateX(${-dy * maxTilt}deg) rotateY(${dx * maxTilt}deg) translateZ(8px)`
      el.style.transition = 'transform 0.08s ease'
    }
    function onMouseLeave() {
      el.style.transform  = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
      el.style.transition = 'transform 0.5s var(--ease-spring)'
    }

    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseleave', onMouseLeave)
    return () => {
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [maxTilt])

  return ref
}

/**
 * useParticleCanvas — animated connecting-dots particle network on a <canvas>.
 */
export function useParticleCanvas(enabled = true) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ctx
    try { ctx = canvas.getContext('2d') } catch { return }
    if (!ctx) return

    let animId, particles = []
    const SPEED = 0.35

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const NUM = Math.min(60, Math.floor((canvas.width * canvas.height) / 12000))
      particles = Array.from({ length: NUM }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: Math.random() * 1.8 + 0.5,
      }))
    }

    const CONNECT_DIST = 150

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(109,101,255,0.4)'
        ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.22
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(109,101,255,${alpha})`
            ctx.lineWidth = 0.9
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [enabled])

  return canvasRef
}
