import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

const buildKeyframes = (from, steps) => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap((step) => Object.keys(step))])
  return Object.fromEntries([...keys].map((key) => [key, [from[key], ...steps.map((step) => step[key])]]))
}

export default function BlurText({ text = '', delay = 120, className = '', as: Component = 'p', animateBy = 'words', direction = 'top', onAnimationComplete, stepDuration = 0.35, ...props }) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('')
  const [inView, setInView] = useState(false)
  const ref = useRef(null)
  const from = useMemo(() => ({ filter: 'blur(10px)', opacity: 0, y: direction === 'top' ? -36 : 36 }), [direction])
  const to = useMemo(() => [{ filter: 'blur(4px)', opacity: 0.55, y: direction === 'top' ? 4 : -4 }, { filter: 'blur(0px)', opacity: 1, y: 0 }], [direction])

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.unobserve(element)
      }
    }, { threshold: 0.1 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const keyframes = buildKeyframes(from, to)
  const times = [0, 0.5, 1]
  return (
    <Component ref={ref} className={className} {...props}>
      {elements.map((segment, index) => (
        <motion.span
          className="blur-segment"
          key={`${segment}-${index}`}
          initial={from}
          animate={inView ? keyframes : from}
          transition={{ duration: stepDuration * 2, times, delay: index * delay / 1000 }}
          onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
        >
          {segment}{animateBy === 'words' && index < elements.length - 1 ? '\u00a0' : ''}
        </motion.span>
      ))}
    </Component>
  )
}
