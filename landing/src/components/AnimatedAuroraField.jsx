import { useEffect, useRef, useState } from 'react'
import Aurora from './react-bits/Aurora/Aurora'

const palettes = {
  hero: ['#7148ff', '#51f3c4', '#8056ff'],
  feature: ['#3925b8', '#5effcc', '#6d3eff'],
  showcase: ['#5226d8', '#9a64ff', '#54e6ca'],
  cta: ['#6f3cf6', '#a259ff', '#59f0ca'],
}

export default function AnimatedAuroraField({ variant = 'hero', intensity = 1, speed = 0.7, className = '', eager = false }) {
  const ref = useRef(null)
  const [active, setActive] = useState(eager)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (eager || !ref.current) return undefined
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: '280px 0px' })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [eager])

  const canRenderWebGl = typeof WebGLRenderingContext !== 'undefined' && typeof ResizeObserver !== 'undefined'

  return (
    <div ref={ref} className={`aurora-field aurora-field--${variant} ${className}`} data-testid="aurora-field" aria-hidden="true">
      {active && !reducedMotion && canRenderWebGl ? (
        <Aurora colorStops={palettes[variant]} amplitude={intensity} blend={0.58} speed={speed} />
      ) : null}
    </div>
  )
}
