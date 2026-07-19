import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function AnimatedContent({ children, distance = 56, direction = 'vertical', reverse = false, duration = 0.75, initialOpacity = 0, threshold = 0.12, delay = 0, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    const axis = direction === 'horizontal' ? 'x' : 'y'
    const timeline = gsap.timeline({ paused: true, delay })
    gsap.set(element, { [axis]: reverse ? -distance : distance, opacity: initialOpacity, visibility: 'visible' })
    timeline.to(element, { [axis]: 0, opacity: 1, duration, ease: 'power3.out' })
    const trigger = ScrollTrigger.create({ trigger: element, start: `top ${(1 - threshold) * 100}%`, once: true, onEnter: () => timeline.play() })
    return () => { trigger.kill(); timeline.kill() }
  }, [delay, direction, distance, duration, initialOpacity, reverse, threshold])

  return <div ref={ref} className={className} style={{ visibility: 'hidden' }}>{children}</div>
}
