import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { staggerContainer, staggerItem } from './transitions'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  as?: keyof typeof motion
  delay?: number
  once?: boolean
  stagger?: boolean
}

export function ScrollReveal({
  children,
  className = '',
  as = 'div',
  delay = 0,
  once = true,
  stagger = false,
}: ScrollRevealProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, margin: '-60px' })
  const Component = motion[as] as typeof motion.div

  return (
    <Component
      ref={ref}
      className={className}
      initial={stagger ? undefined : { opacity: 0, y: 28 }}
      animate={inView ? (stagger ? staggerContainer.animate : { opacity: 1, y: 0 }) : undefined}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {stagger ? (
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          {children}
        </motion.div>
      ) : (
        children
      )}
    </Component>
  )
}

export function ScrollRevealStagger({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="initial"
      animate={inView ? 'animate' : 'initial'}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  )
}

export function ScrollRevealItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  )
}
