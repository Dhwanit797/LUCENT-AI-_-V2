export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export const pageTransition = { type: 'tween', duration: 0.25, ease: 'easeOut' }

export const staggerChildren = { staggerChildren: 0.06 }
export const staggerItem = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }
