/**
 * Design tokens — cinematic dark theme (navy/charcoal + blue/purple/cyan)
 * Single source of truth for colors, spacing, motion.
 */
export const theme = {
  colors: {
    bg: {
      base: '#030712',
      elevated: '#0f172a',
      surface: '#1e293b',
      overlay: 'rgba(15, 23, 42, 0.85)',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      muted: '#64748b',
    },
    accent: {
      blue: '#3b82f6',
      purple: '#8b5cf6',
      cyan: '#06b6d4',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
    },
    border: 'rgba(255, 255, 255, 0.08)',
    glow: {
      blue: '0 0 40px -10px rgba(59, 130, 246, 0.5)',
      purple: '0 0 40px -10px rgba(139, 92, 246, 0.4)',
      cyan: '0 0 40px -10px rgba(6, 182, 212, 0.4)',
    },
  },
  motion: {
    ease: [0.25, 0.46, 0.45, 0.94],
    easeOut: [0.16, 1, 0.3, 1],
    spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
    springSoft: { type: 'spring' as const, stiffness: 200, damping: 25 },
  },
} as const
