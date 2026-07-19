import { useRef } from 'react'
import './SpotlightCard.css'

export default function SpotlightCard({ children, className = '', spotlightColor = 'rgb(141 85 255 / 0.16)' }) {
  const ref = useRef(null)
  const handleMouseMove = (event) => {
    const rect = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`)
    ref.current.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`)
    ref.current.style.setProperty('--spotlight-color', spotlightColor)
  }
  return <div ref={ref} onMouseMove={handleMouseMove} className={`card-spotlight ${className}`}>{children}</div>
}
