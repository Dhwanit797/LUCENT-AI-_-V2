import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { HeroPrimaryButton, HeroSecondaryButton } from './HeroCTAButtons'
import Hero3D from '../Hero3D'
import { ArrowRight, Zap, TrendingUp, Shield, Leaf } from 'lucide-react'

/* ── Letter-by-letter stagger ── */
function SplitText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 60, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.55,
            delay: delay + i * 0.028,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}

const STAT_ITEMS = [
  { value: '94%', label: 'Fraud detection accuracy', color: 'var(--ds-accent)' },
  { value: '3×', label: 'Faster financial insights', color: 'var(--ds-accent-teal)' },
  { value: '40%', label: 'Cost reduction achieved', color: 'var(--ds-accent-lime)' },
]

const MODULE_PILLS = [
  { icon: Shield,    label: 'Fraud Lens',       color: '#00d4ff' },
  { icon: TrendingUp,label: 'Expense Sense',    color: '#00ffc3' },
  { icon: Zap,       label: 'Smart Inventory',  color: '#beff00' },
  { icon: Leaf,      label: 'Green Grid',       color: '#34d399' },
]

export default function HeroSection() {
  const { token, isValid } = useAuth()
  const { theme } = useTheme()
  const isLoggedIn = !!token && isValid
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const yText  = useTransform(scrollYProgress, [0, 0.6], [0, 80])
  const y3d    = useTransform(scrollYProgress, [0, 0.6], [0, -60])
  const opacityHero = useTransform(scrollYProgress, [0, 0.45], [1, 0])
  const scaleDown = useTransform(scrollYProgress, [0, 0.4], [1, 0.94])

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden lg:flex-row lg:items-center"
      style={{ background: 'rgb(var(--ds-bg-base))' }}
    >
      {/* ── Background atmosphere ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Main deep gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: theme === 'dark'
              ? 'radial-gradient(ellipse 90% 80% at 50% 0%, rgba(0,212,255,0.06) 0%, rgba(4,6,14,0) 60%)'
              : 'radial-gradient(ellipse 90% 80% at 50% 0%, rgba(14,165,233,0.05) 0%, rgba(245,247,250,0) 60%)',
          }}
        />
        {/* Left accent glow */}
        <div
          className="absolute inset-0"
          style={{ background: 'var(--ds-hero-glow)' }}
        />
        {/* Right teal glow */}
        <div
          className="absolute inset-0"
          style={{ background: 'var(--ds-hero-ambient)' }}
        />
        {/* Vignette */}
        <div className="absolute inset-0" style={{ background: 'var(--ds-hero-vignette)' }} />

        {/* Dot grid overlay */}
        <div className="absolute inset-0 dot-grid-bg opacity-30 dark:opacity-20" />

        {/* Scanline sweep — subtle */}
        <div
          className="absolute left-0 right-0 h-[2px] pointer-events-none opacity-5"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgb(var(--ds-accent)) 50%, transparent 100%)',
            animation: 'scanline 8s linear infinite',
          }}
        />

        {/* Noise */}
        <div className="noise-overlay" />
      </div>

      {/* ── Top accent rule ── */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 h-[1.5px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgb(var(--ds-accent)) 30%, rgb(var(--ds-accent-teal)) 70%, transparent 100%)',
          boxShadow: '0 0 16px 1px rgba(0,212,255,0.5)',
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* ── Left: Text content ── */}
      <motion.div
        style={{ y: yText, opacity: opacityHero, scale: scaleDown }}
        className="relative z-10 flex flex-1 flex-col justify-center px-6 py-28 lg:w-[58%] lg:max-w-none lg:px-14 xl:px-20"
      >
        {/* Status pill — live indicator */}
        <motion.div
          className="mb-8 inline-flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              borderColor: 'rgb(var(--ds-accent) / 0.3)',
              background: 'rgb(var(--ds-accent) / 0.06)',
              color: 'rgb(var(--ds-accent))',
              fontFamily: 'var(--ds-font-mono)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'rgb(var(--ds-accent))' }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'rgb(var(--ds-accent))' }} />
            </span>
            AI Engine Active
          </span>
        </motion.div>

        {/* ── Headline — 3D letter reveal ── */}
        <div className="overflow-visible perspective-[800px]">
          <h1
            className="font-display font-black leading-none tracking-tight text-ds-text-primary"
            style={{
              fontSize: 'clamp(3.2rem, 7vw, 6rem)',
              lineHeight: '1.0',
              letterSpacing: '-0.02em',
            }}
          >
            <div className="overflow-hidden">
              <SplitText text="AI That" delay={0.2} />
            </div>
            <div className="overflow-hidden mt-1">
              <SplitText
                text="Thinks"
                delay={0.32}
                className="text-gradient-accent"
              />
            </div>
            <div className="overflow-hidden mt-1">
              <SplitText text="Like Your CFO." delay={0.48} />
            </div>
          </h1>
        </div>

        {/* ── Subhead ── */}
        <motion.p
          className="relative mt-7 max-w-[480px] text-lg leading-relaxed"
          style={{ color: 'rgb(var(--ds-text-secondary))' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          Expenses, fraud detection, inventory forecasting, and sustainability
          analytics — unified in one AI-powered intelligence engine.
        </motion.p>

        {/* ── Module pills ── */}
        <motion.div
          className="mt-6 flex flex-wrap gap-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          {MODULE_PILLS.map(({ icon: Icon, label, color }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: `${color}30`,
                background: `${color}0d`,
                color,
                fontFamily: 'var(--ds-font-mono)',
              }}
            >
              <Icon className="h-3 w-3" />
              {label}
            </span>
          ))}
        </motion.div>

        {/* ── CTA buttons ── */}
        <motion.div
          className="mt-10 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroPrimaryButton to={isLoggedIn ? '/dashboard' : '/login'}>
            Enter Dashboard
          </HeroPrimaryButton>
          <HeroSecondaryButton href="#features">
            Explore Platform
          </HeroSecondaryButton>
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div
          className="mt-12 flex flex-wrap gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {STAT_ITEMS.map(({ value, label, color }, i) => (
            <motion.div
              key={label}
              className="flex flex-col"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.15 + i * 0.08 }}
            >
              <span
                className="font-impact text-4xl font-bold leading-none"
                style={{ color, fontFamily: 'var(--ds-font-display)', letterSpacing: '-0.01em' }}
              >
                {value}
              </span>
              <span
                className="mt-1 text-xs font-medium uppercase tracking-[0.12em]"
                style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}
              >
                {label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Right: 3D sphere ── */}
      <motion.div
        style={{ y: y3d }}
        className="relative z-10 flex h-[55vh] flex-1 lg:h-screen lg:w-[42%]"
      >
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
        >
          <Hero3D theme={theme} />
        </motion.div>

        {/* Floating data chip 1 */}
        <motion.div
          className="absolute bottom-[28%] left-[-4%] z-20 rounded-xl border px-4 py-3 backdrop-blur-sm"
          style={{
            background: 'rgb(var(--ds-bg-surface) / 0.9)',
            border: '1px solid rgb(var(--ds-accent) / 0.22)',
            boxShadow: '0 8px 32px rgb(0 0 0 / 0.3), 0 0 16px rgb(var(--ds-accent) / 0.1)',
          }}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>Fraud Risk</p>
          <p className="mt-0.5 text-xl font-bold" style={{ color: 'rgb(var(--ds-accent-success))' }}>LOW</p>
          <div className="mt-1.5 flex items-center gap-1">
            {[0.3,0.5,0.2,0.7,0.4,0.6,0.3,0.8].map((h,i) => (
              <div key={i} className="w-1 rounded-full" style={{ height: `${h * 20}px`, background: 'rgb(var(--ds-accent-success))' }} />
            ))}
          </div>
        </motion.div>

        {/* Floating data chip 2 */}
        <motion.div
          className="absolute top-[22%] right-[4%] z-20 rounded-xl border px-4 py-3 backdrop-blur-sm"
          style={{
            background: 'rgb(var(--ds-bg-surface) / 0.9)',
            border: '1px solid rgb(var(--ds-accent-teal) / 0.22)',
            boxShadow: '0 8px 32px rgb(0 0 0 / 0.3), 0 0 16px rgb(var(--ds-accent-teal) / 0.1)',
          }}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>AI Health Score</p>
          <p className="mt-0.5 text-2xl font-bold" style={{ color: 'rgb(var(--ds-accent-teal))' }}>98<span className="text-sm">%</span></p>
        </motion.div>

        {/* Floating data chip 3 */}
        <motion.div
          className="absolute bottom-[18%] right-[8%] z-20 rounded-xl border px-4 py-3 backdrop-blur-sm"
          style={{
            background: 'rgb(var(--ds-bg-surface) / 0.9)',
            border: '1px solid rgb(var(--ds-accent-lime) / 0.25)',
            boxShadow: '0 8px 32px rgb(0 0 0 / 0.3)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>Carbon Saved</p>
          <p className="mt-0.5 text-xl font-bold" style={{ color: 'rgb(var(--ds-accent-lime))' }}>↓ 23%</p>
        </motion.div>
      </motion.div>

      {/* ── Bottom scroll indicator ── */}
      <motion.div
        className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.6 }}
      >
        <span className="text-xs uppercase tracking-[0.2em]" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
          Scroll
        </span>
        <motion.div
          className="h-8 w-[1.5px] rounded-full"
          style={{ background: 'linear-gradient(to bottom, rgb(var(--ds-accent)), transparent)' }}
          animate={{ scaleY: [1, 0.3, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  )
}
