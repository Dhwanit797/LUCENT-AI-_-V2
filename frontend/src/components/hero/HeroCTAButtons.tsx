import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

type PrimaryProps = { to: string; children: React.ReactNode }

export function HeroPrimaryButton({ to, children }: PrimaryProps) {
  return (
    <Link to={to} className="group relative inline-block">
      {/* Outer diffuse glow */}
      <span
        className="absolute -inset-1.5 rounded-2xl opacity-0 blur-xl transition-all duration-500 group-hover:opacity-70"
        style={{
          background: 'linear-gradient(135deg, rgb(var(--ds-accent)), rgb(var(--ds-accent-teal)))',
        }}
        aria-hidden
      />
      <motion.span
        className="relative flex items-center gap-2.5 rounded-[14px] px-7 py-3.5 font-bold uppercase tracking-wide"
        style={{
          background: 'linear-gradient(135deg, rgb(var(--ds-accent)) 0%, rgb(var(--ds-accent-teal)) 100%)',
          color: '#04060e',
          letterSpacing: '0.06em',
          boxShadow: '0 0 24px rgb(var(--ds-accent) / 0.4), 0 4px 16px rgb(var(--ds-accent) / 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          fontFamily: 'var(--ds-font-display)',
        }}
        whileHover={{
          y: -2,
          boxShadow: '0 8px 28px rgb(var(--ds-accent) / 0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
          transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
        }}
        whileTap={{
          scale: 0.97,
          y: 0,
          transition: { duration: 0.1 },
        }}
      >
        {/* Shimmer sweep */}
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[14px]" aria-hidden>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
        </span>
        <span className="relative">{children}</span>
        <motion.span
          className="relative"
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
        >
          <ArrowRight className="h-4 w-4" />
        </motion.span>
      </motion.span>
    </Link>
  )
}

type SecondaryProps = { href: string; children: React.ReactNode }

export function HeroSecondaryButton({ href, children }: SecondaryProps) {
  return (
    <a href={href} className="group relative inline-block rounded-[14px]">
      <motion.span
        className="relative flex items-center gap-2 rounded-[14px] border px-7 py-3.5 font-semibold text-ds-text-primary backdrop-blur-sm"
        style={{
          borderColor: 'rgb(var(--ds-border) / 0.4)',
          background: 'rgb(var(--ds-bg-surface) / 0.7)',
          boxShadow: 'var(--ds-card-shadow)',
        }}
        whileHover={{
          y: -2,
          borderColor: 'rgb(var(--ds-accent) / 0.45)',
          background: 'rgb(var(--ds-bg-surface) / 0.9)',
          boxShadow: 'var(--ds-surface-shadow)',
          transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
        }}
        whileTap={{
          scale: 0.97,
          y: 0,
          transition: { duration: 0.1 },
        }}
      >
        {/* Subtle gradient border on hover via pseudo via Tailwind group */}
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[14px]" aria-hidden>
          <span
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: 'linear-gradient(90deg, transparent, rgb(var(--ds-accent) / 0.06), transparent)',
            }}
          />
        </span>
        <span className="relative">{children}</span>
      </motion.span>
    </a>
  )
}
