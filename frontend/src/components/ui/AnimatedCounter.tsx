import { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'
import React from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  style?: React.CSSProperties
}

export function AnimatedCounter({ value, duration: _duration = 1, className = '', style }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const spring = useSpring(0, { stiffness: 75, damping: 25 })

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)))
    return () => unsub()
  }, [spring])

  return <motion.span className={className} style={style}>{display}</motion.span>
}
