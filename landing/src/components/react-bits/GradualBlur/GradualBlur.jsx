import React, { useEffect, useMemo, useRef, useState } from 'react'
import './GradualBlur.css'

const DEFAULT_CONFIG = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: '0.3s',
  easing: 'ease-out',
  opacity: 1,
  curve: 'linear',
  responsive: false,
  target: 'parent',
  className: '',
  style: {},
}

const PRESETS = {
  top: { position: 'top', height: '6rem' },
  bottom: { position: 'bottom', height: '6rem' },
  left: { position: 'left', height: '6rem' },
  right: { position: 'right', height: '6rem' },
  subtle: { height: '4rem', strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
  smooth: { height: '8rem', curve: 'bezier', divCount: 10 },
  sharp: { height: '5rem', curve: 'linear', divCount: 4 },
  header: { position: 'top', height: '8rem', curve: 'ease-out' },
  footer: { position: 'bottom', height: '8rem', curve: 'ease-out' },
  sidebar: { position: 'left', height: '6rem', strength: 2.5 },
  'page-header': { position: 'top', height: '10rem', target: 'page', strength: 3 },
  'page-footer': { position: 'bottom', height: '10rem', target: 'page', strength: 3 },
}

const CURVE_FUNCTIONS = {
  linear: (progress) => progress,
  bezier: (progress) => progress * progress * (3 - 2 * progress),
  'ease-in': (progress) => progress * progress,
  'ease-out': (progress) => 1 - Math.pow(1 - progress, 2),
  'ease-in-out': (progress) => progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2,
}

const getGradientDirection = (position) => ({ top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' })[position] || 'to bottom'

const debounce = (callback, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => callback(...args), wait)
  }
}

const useResponsiveDimension = (responsive, config, key) => {
  const [value, setValue] = useState(config[key])

  useEffect(() => {
    if (!responsive) return undefined
    const calculate = () => {
      const width = window.innerWidth
      const suffix = `${key[0].toUpperCase()}${key.slice(1)}`
      let nextValue = config[key]
      if (width <= 480 && config[`mobile${suffix}`]) nextValue = config[`mobile${suffix}`]
      else if (width <= 768 && config[`tablet${suffix}`]) nextValue = config[`tablet${suffix}`]
      else if (width <= 1024 && config[`desktop${suffix}`]) nextValue = config[`desktop${suffix}`]
      setValue(nextValue)
    }
    const debounced = debounce(calculate, 100)
    calculate()
    window.addEventListener('resize', debounced)
    return () => window.removeEventListener('resize', debounced)
  }, [config, key, responsive])

  return responsive ? value : config[key]
}

const useIntersectionObserver = (ref, shouldObserve) => {
  const [visible, setVisible] = useState(!shouldObserve)

  useEffect(() => {
    if (!shouldObserve || !ref.current) return undefined
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref, shouldObserve])

  return visible
}

function GradualBlur(props) {
  const containerRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...(props.preset ? PRESETS[props.preset] : {}), ...props }), [props])
  const responsiveHeight = useResponsiveDimension(config.responsive, config, 'height')
  const responsiveWidth = useResponsiveDimension(config.responsive, config, 'width')
  const visible = useIntersectionObserver(containerRef, config.animated === 'scroll')
  const targetClassName = config.target === 'page'
    ? 'gradual-blur-page gradual-blur-fixed'
    : 'gradual-blur-parent'

  const blurLayers = useMemo(() => {
    const increment = 100 / config.divCount
    const strength = hovered && config.hoverIntensity ? config.strength * config.hoverIntensity : config.strength
    const curve = CURVE_FUNCTIONS[config.curve] || CURVE_FUNCTIONS.linear

    return Array.from({ length: config.divCount }, (_, index) => {
      const current = index + 1
      const progress = curve(current / config.divCount)
      const blur = config.exponential
        ? Math.pow(2, progress * 4) * 0.0625 * strength
        : 0.0625 * (progress * config.divCount + 1) * strength
      const p1 = Math.round((increment * current - increment) * 10) / 10
      const p2 = Math.round(increment * current * 10) / 10
      const p3 = Math.round((increment * current + increment) * 10) / 10
      const p4 = Math.round((increment * current + increment * 2) * 10) / 10
      let gradient = `transparent ${p1}%, black ${p2}%`
      if (p3 <= 100) gradient += `, black ${p3}%`
      if (p4 <= 100) gradient += `, transparent ${p4}%`
      const mask = `linear-gradient(${getGradientDirection(config.position)}, ${gradient})`

      return (
        <div key={current} style={{
          position: 'absolute',
          inset: 0,
          maskImage: mask,
          WebkitMaskImage: mask,
          backdropFilter: `blur(${blur.toFixed(3)}rem)`,
          WebkitBackdropFilter: `blur(${blur.toFixed(3)}rem)`,
          opacity: config.opacity,
          transition: config.animated && config.animated !== 'scroll' ? `backdrop-filter ${config.duration} ${config.easing}` : undefined,
        }} />
      )
    })
  }, [config, hovered])

  const containerStyle = useMemo(() => {
    const vertical = ['top', 'bottom'].includes(config.position)
    const pageTarget = config.target === 'page'
    const style = {
      position: pageTarget ? 'fixed' : 'absolute',
      pointerEvents: config.hoverIntensity ? 'auto' : 'none',
      opacity: visible ? 1 : 0,
      transition: config.animated ? `opacity ${config.duration} ${config.easing}` : undefined,
      zIndex: pageTarget ? config.zIndex + 100 : config.zIndex,
      ...config.style,
    }
    if (vertical) {
      style.height = responsiveHeight
      style.width = responsiveWidth || '100%'
      style[config.position] = 0
      style.left = 0
      style.right = 0
    } else {
      style.width = responsiveWidth || responsiveHeight
      style.height = '100%'
      style[config.position] = 0
      style.top = 0
      style.bottom = 0
    }
    return style
  }, [config, responsiveHeight, responsiveWidth, visible])

  useEffect(() => {
    if (!visible || config.animated !== 'scroll' || !config.onAnimationComplete) return undefined
    const timeout = setTimeout(config.onAnimationComplete, parseFloat(config.duration) * 1000)
    return () => clearTimeout(timeout)
  }, [config.animated, config.duration, config.onAnimationComplete, visible])

  return (
    <div
      ref={containerRef}
      className={`gradual-blur ${targetClassName} ${config.className}`}
      style={containerStyle}
      aria-hidden="true"
      onMouseEnter={config.hoverIntensity ? () => setHovered(true) : undefined}
      onMouseLeave={config.hoverIntensity ? () => setHovered(false) : undefined}
    >
      <div className="gradual-blur-inner">{blurLayers}</div>
    </div>
  )
}

const GradualBlurMemo = React.memo(GradualBlur)
GradualBlurMemo.displayName = 'GradualBlur'
GradualBlurMemo.PRESETS = PRESETS
GradualBlurMemo.CURVE_FUNCTIONS = CURVE_FUNCTIONS

export default GradualBlurMemo
