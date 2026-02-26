import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Link } from 'react-router-dom'

interface MagneticButtonProps {
  to: string
  children: React.ReactNode
  className?: string
}

export function MagneticButton({ to, children, className = '' }: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 20 })
  const springY = useSpring(y, { stiffness: 150, damping: 20 })

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) * 0.2
    const dy = (e.clientY - cy) * 0.2
    x.set(dx)
    y.set(dy)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <Link to={to} ref={ref}>
      <motion.span
        className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-ds-accent-primary px-8 py-4 text-ds-body font-semibold text-white transition-shadow duration-300 hover:shadow-ds-glow ${className}`}
        style={{ x: springX, y: springY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="absolute inset-0 bg-ds-gradient-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="relative z-10">{children}</span>
      </motion.span>
    </Link>
  )
}
