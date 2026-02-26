/**
 * Global animation variants and transitions
 */
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export const pageTransitionSlow = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
}

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export const staggerItemFast = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
}

export const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
}

export const tweenEase = { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
export const tweenEaseOut = { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
export const spring = { type: 'spring' as const, stiffness: 300, damping: 30 }
export const springSoft = { type: 'spring' as const, stiffness: 200, damping: 25 }
