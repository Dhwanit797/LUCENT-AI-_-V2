import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
}

export function TiltCard({ children, className = '' }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 20 })
  const springY = useSpring(y, { stiffness: 200, damping: 20 })
  const [isHovered, setHovered] = useState(false)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    x.set(Math.max(-1, Math.min(1, dx)) * 8)
    y.set(Math.max(-1, Math.min(1, dy)) * -8)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
    setHovered(false)
  }

  function handleMouseEnter() {
    setHovered(true)
  }

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl bg-ds-bg-surface transition-shadow duration-300 ${className}`}
      style={{
        boxShadow: 'var(--ds-card-shadow)',
        rotateX: springY,
        rotateY: springX,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      whileHover={{ y: -4, boxShadow: 'var(--ds-surface-shadow)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(56,189,248,.15), transparent 40%)',
          }}
        />
      )}
      <div className="relative z-10 p-6" style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </motion.div>
  )
}

export function SimpleCard({ children, className = '' }: TiltCardProps) {
  return (
    <motion.div
      className={`rounded-2xl bg-ds-bg-surface p-6 ${className}`}
      style={{ boxShadow: 'var(--ds-card-shadow)' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  )
}
