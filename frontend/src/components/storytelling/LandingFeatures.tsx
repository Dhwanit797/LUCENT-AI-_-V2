import { useRef, useState, useCallback } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Receipt, Shield, Package, Leaf, TrendingUp, Zap, BarChart3, ArrowRight } from 'lucide-react'

const MODULES = [
  {
    icon: Shield,
    title: 'Fraud Lens',
    desc: 'Isolation Forest anomaly detection across every transaction. Real-time alerts surface threats before they cascade.',
    color: '#00d4ff',
    accent: 'rgba(0,212,255,0.1)',
    border: 'rgba(0,212,255,0.2)',
    num: '01',
    tag: 'Risk',
  },
  {
    icon: Receipt,
    title: 'Expense Sense',
    desc: 'Category-level spend intelligence with trend forecasting. Know exactly where every dollar goes.',
    color: '#00ffc3',
    accent: 'rgba(0,255,195,0.1)',
    border: 'rgba(0,255,195,0.2)',
    num: '02',
    tag: 'Finance',
  },
  {
    icon: Package,
    title: 'Smart Inventory',
    desc: 'ML-powered reorder forecasting. Prevent stockouts and eliminate overstock with precision timing.',
    color: '#beff00',
    accent: 'rgba(190,255,0,0.08)',
    border: 'rgba(190,255,0,0.18)',
    num: '03',
    tag: 'Ops',
  },
  {
    icon: Leaf,
    title: 'Green Grid',
    desc: 'Carbon footprint analysis and energy optimization. Hit sustainability targets with data-driven load scheduling.',
    color: '#34d399',
    accent: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.18)',
    num: '04',
    tag: 'ESG',
  },
  {
    icon: TrendingUp,
    title: 'Revenue Intelligence',
    desc: 'Tracks revenue momentum, sustainability, and unified risk in one view.',
    color: '#38bdf8',
    accent: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.2)',
    num: '05',
    tag: 'Revenue',
  },
]

const VALUE_PROPS = [
  { icon: TrendingUp, title: 'Signal over noise', line: 'AI surfaces what matters so you act on data, not gut.' },
  { icon: Zap, title: 'Single pane of glass', line: 'All five intelligence modules unified in one real-time engine.' },
  { icon: BarChart3, title: 'Measurable outcomes', line: 'Reduce waste, catch fraud earlier, and hit targets with confidence.' },
]

/* ── 3D tilt card ── */
function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    const y = -(e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    setTilt({ x: x * 8, y: y * 8 })
  }, [])

  const onMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.5s ease' : 'transform 0.12s ease',
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  )
}

export default function LandingFeatures() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], [-40, 40])

  return (
    <section
      id="features"
      ref={ref}
      className="relative overflow-hidden py-28 md:py-40"
      style={{ background: 'rgb(var(--ds-bg-elevated))' }}
    >
      {/* Parallax bg glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          y: bgY,
          background: 'radial-gradient(ellipse 70% 55% at 75% 50%, rgba(0,212,255,0.07) 0%, transparent 62%)',
        }}
      />
      {/* Line grid */}
      <div className="absolute inset-0 line-grid-bg opacity-60 dark:opacity-40" />
      <div className="noise-overlay" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ── Header ── */}
        <div className="mb-20">
          <motion.div
            className="mb-4 flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="h-px w-12" style={{ background: 'rgb(var(--ds-accent))' }} />
            <span
              className="text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: 'rgb(var(--ds-accent))', fontFamily: 'var(--ds-font-mono)' }}
            >
              Platform modules
            </span>
          </motion.div>
          <motion.h2
            className="font-display font-black text-ds-text-primary"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.05 }}
          >
            One platform.{' '}
            <span className="text-gradient-accent">Five AI engines.</span>
          </motion.h2>
          <motion.p
            className="mt-5 max-w-xl text-lg leading-relaxed"
            style={{ color: 'rgb(var(--ds-text-secondary))' }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, delay: 0.12 }}
          >
            From fraud detection to carbon accounting — each module is a dedicated AI that learns your business patterns and surfaces the actions that move the needle.
          </motion.p>
        </div>

        {/* ── Module grid (2-col large, 1-col mobile) ── */}
        <div className="grid gap-5 md:grid-cols-2">
          {MODULES.map(({ icon: Icon, title, desc, color, accent, border, num, tag }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
            >
              <TiltCard
                className="group relative overflow-hidden rounded-2xl p-7 cursor-default"
                style={{
                  background: `linear-gradient(145deg, rgb(var(--ds-bg-surface)) 0%, rgb(var(--ds-bg-elevated)) 100%)`,
                  border: `1px solid ${border}`,
                  boxShadow: `0 4px 24px rgb(0 0 0 / 0.25), inset 0 1px 0 rgba(255,255,255,0.04)`,
                }}
              >
                {/* Ghost number */}
                <span
                  className="pointer-events-none absolute right-5 top-3 select-none text-8xl font-black leading-none"
                  style={{
                    color,
                    opacity: 0.04,
                    fontFamily: 'var(--ds-font-impact)',
                    transition: 'opacity 0.3s',
                  }}
                >
                  {num}
                </span>
                {/* Hover top glow */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg, transparent 10%, ${color} 50%, transparent 90%)`, opacity: 0.3 }}
                />

                <div className="flex items-start justify-between">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: accent, border: `1px solid ${border}` }}
                  >
                    <Icon className="h-6 w-6" style={{ color }} />
                  </div>
                  <span
                    className="rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color,
                      borderColor: `${color}30`,
                      background: `${color}0d`,
                      fontFamily: 'var(--ds-font-mono)',
                    }}
                  >
                    {tag}
                  </span>
                </div>

                <div className="mt-5" style={{ transform: 'translateZ(15px)' }}>
                  <h3
                    className="text-xl font-bold text-ds-text-primary"
                    style={{ fontFamily: 'var(--ds-font-display)', letterSpacing: '-0.01em' }}
                  >
                    {title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed" style={{ color: 'rgb(var(--ds-text-secondary))' }}>
                    {desc}
                  </p>
                </div>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full"
                  style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
                />
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* ── Value props strip ── */}
        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {VALUE_PROPS.map(({ icon: Icon, title, line }, i) => (
            <motion.div
              key={title}
              className="flex items-start gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: 'rgb(var(--ds-accent) / 0.08)',
                  border: '1px solid rgb(var(--ds-accent) / 0.14)',
                }}
              >
                <Icon className="h-5 w-5" style={{ color: 'rgb(var(--ds-accent))' }} />
              </div>
              <div>
                <h4 className="font-semibold text-ds-text-primary" style={{ fontFamily: 'var(--ds-font-display)' }}>{title}</h4>
                <p className="mt-0.5 text-sm leading-relaxed" style={{ color: 'rgb(var(--ds-text-secondary))' }}>{line}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
