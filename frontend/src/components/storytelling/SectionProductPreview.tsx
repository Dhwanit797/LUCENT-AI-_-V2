import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { BarChart3, TrendingUp, DollarSign, Activity, Cpu, Zap, Shield, Leaf } from 'lucide-react'

const METRICS = [
  { label: 'Revenue', value: '$124.2k', change: '+12.4%', icon: DollarSign, up: true, color: '#00d4ff' },
  { label: 'Expenses', value: '$48.1k', change: '-5.2%',  icon: BarChart3,  up: true, color: '#00ffc3' },
  { label: 'AI Health', value: '94 / 100', change: '+2pts', icon: Activity, up: true, color: '#beff00' },
  { label: 'Forecast Q4', value: '↑ 8.1%', change: 'On track', icon: TrendingUp, up: true, color: '#34d399' },
]

const MODULE_STATUS = [
  { icon: Shield,  label: 'Fraud Lens',           status: 'Active', risk: 'Low',        color: '#00d4ff' },
  { icon: BarChart3, label: 'Expense Sense',      status: 'Active', risk: 'Stable',     color: '#00ffc3' },
  { icon: Zap,     label: 'Smart Inventory',      status: 'Active', risk: 'OK',         color: '#beff00' },
  { icon: Leaf,    label: 'Green Grid',           status: 'Active', risk: 'Good',       color: '#34d399' },
  { icon: TrendingUp, label: 'Revenue Intelligence', status: 'Active', risk: 'Moderate',  color: '#38bdf8' },
]

export default function SectionProductPreview() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y        = useTransform(scrollYProgress, [0.1, 0.5], [80, -60])
  const scale    = useTransform(scrollYProgress, [0.1, 0.38], [0.91, 1])
  const opacity  = useTransform(scrollYProgress, [0.06, 0.28], [0.3, 1])
  const bgGlowY  = useTransform(scrollYProgress, [0, 1], [-30, 30])

  return (
    <section
      id="product"
      ref={ref}
      className="relative overflow-hidden py-28 md:py-40"
      style={{ background: 'rgb(var(--ds-bg-base))' }}
    >
      {/* Ambient glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          y: bgGlowY,
          background: 'radial-gradient(ellipse 65% 55% at 50% 40%, rgba(0,212,255,0.09) 0%, transparent 60%)',
        }}
      />
      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid-bg opacity-25 dark:opacity-15" />
      <div className="noise-overlay" />

      {/* ── Header ── */}
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px w-12" style={{ background: 'rgb(var(--ds-accent))' }} />
          <motion.span
            className="text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: 'rgb(var(--ds-accent))', fontFamily: 'var(--ds-font-mono)' }}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Command center
          </motion.span>
        </div>
        <motion.h2
          className="font-display font-black text-ds-text-primary"
          style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.05 }}
        >
          Your business.{' '}
          <span className="text-gradient-accent">One dashboard.</span>
        </motion.h2>
        <motion.p
          className="mt-5 max-w-xl text-lg leading-relaxed"
          style={{ color: 'rgb(var(--ds-text-secondary))' }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.1 }}
        >
          Real-time KPIs, AI health scores, and cross-module insights — all visible in one live command center.
        </motion.p>
      </div>

      {/* ── Mockup ── */}
      <motion.div
        style={{ y, scale, opacity }}
        className="relative z-10 mx-auto mt-16 max-w-5xl px-6"
      >
        {/* Ambient glow behind mockup */}
        <div
          className="absolute inset-x-4 -inset-y-4 rounded-3xl blur-3xl opacity-30"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,212,255,0.25), rgba(0,255,195,0.1), transparent 70%)' }}
        />

        {/* Main window */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(145deg, rgb(var(--ds-bg-surface)) 0%, rgb(var(--ds-bg-elevated)) 100%)',
            boxShadow: '0 0 0 1px rgba(0,212,255,0.12), 0 32px 80px -12px rgba(0,0,0,0.5)',
            border: '1px solid rgba(0,212,255,0.12)',
          }}
        >
          {/* Chrome bar */}
          <div
            className="flex items-center justify-between border-b px-5 py-3.5"
            style={{ borderColor: 'rgba(0,212,255,0.08)' }}
          >
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#ff5f56' }} />
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#ffbd2e' }} />
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: '#27c93f' }} />
            </div>
            <div
              className="flex items-center gap-2 rounded-full border px-4 py-1"
              style={{ borderColor: 'rgba(0,212,255,0.15)', background: 'rgba(0,212,255,0.04)' }}
            >
              <span
                className="relative flex h-1.5 w-1.5"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: '#00d4ff' }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: '#00d4ff' }} />
              </span>
              <span className="text-xs font-medium" style={{ color: 'rgba(0,212,255,0.8)', fontFamily: 'var(--ds-font-mono)' }}>
                business-ai / dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5" style={{ color: '#00ffc3' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(0,255,195,0.8)', fontFamily: 'var(--ds-font-mono)' }}>AI LIVE</span>
            </div>
          </div>

          <div className="p-5">
            {/* Stats row */}
            <div className="grid gap-3 sm:grid-cols-4">
              {METRICS.map(({ label, value, change, icon: Icon, up, color }, idx) => (
                <motion.div
                  key={label}
                  className="rounded-xl p-4"
                  style={{
                    background: `linear-gradient(145deg, ${color}08, transparent)`,
                    border: `1px solid ${color}18`,
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 + idx * 0.07 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>{label}</span>
                    <Icon className="h-3.5 w-3.5 opacity-70" style={{ color }} />
                  </div>
                  <p className="mt-2 text-xl font-bold text-ds-text-primary" style={{ fontFamily: 'var(--ds-font-display)' }}>{value}</p>
                  <p className="mt-0.5 text-xs font-semibold" style={{ color: up ? '#34d399' : '#f87070', fontFamily: 'var(--ds-font-mono)' }}>
                    {change}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Chart row */}
            <div className="mt-4 grid gap-3 lg:grid-cols-[2fr_1fr]">
              {/* Bar chart */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(0,212,255,0.07)',
                  height: '140px',
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>Revenue trend — 12 months</span>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'rgb(var(--ds-text-muted))' }}>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: '#00d4ff' }} />Revenue</span>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: '#00ffc3' }} />Expenses</span>
                  </div>
                </div>
                <div className="flex h-16 items-end gap-1.5">
                  {[0.45, 0.62, 0.55, 0.78, 0.68, 0.85, 0.92, 0.75, 0.88, 0.95, 0.82, 1.0].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        background: i % 3 === 0
                          ? 'linear-gradient(to top, rgba(0,212,255,0.9), rgba(0,212,255,0.3))'
                          : 'linear-gradient(to top, rgba(0,255,195,0.7), rgba(0,255,195,0.2))',
                        transformOrigin: 'bottom',
                        height: '100%',
                      }}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: h }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.55, delay: 0.3 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    />
                  ))}
                </div>
              </div>

              {/* Module status list */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(0,212,255,0.07)',
                }}
              >
                <p className="mb-3 text-xs font-medium" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>Module status</p>
                <div className="space-y-2.5">
                  {MODULE_STATUS.map(({ icon: Icon, label, status, risk, color }, i) => (
                    <motion.div
                      key={label}
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                        <span className="text-xs text-ds-text-secondary">{label}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color, fontFamily: 'var(--ds-font-mono)' }}>{risk}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating chips */}
        {[
          { label: 'Anomaly detected',  value: '⚠ 2 new', top: '15%', right: '-2%', x: 24, delay: 0.7, color: '#00d4ff' },
          { label: 'Inventory alert',   value: 'Reorder soon', bottom: '22%', left: '-3%', x: -24, delay: 0.9, color: '#beff00' },
          { label: 'Carbon footprint',  value: '↓ 18%', bottom: '8%', right: '5%', x: 16, delay: 1.1, color: '#34d399' },
        ].map(({ label, value, top, bottom, left, right, x, delay, color }) => (
          <motion.div
            key={label}
            className="absolute rounded-xl border px-4 py-2.5 backdrop-blur-sm"
            style={{
              top: top ?? undefined,
              bottom: bottom ?? undefined,
              left: left ?? undefined,
              right: right ?? undefined,
              background: 'rgb(var(--ds-bg-surface) / 0.92)',
              border: `1px solid ${color}22`,
              boxShadow: `var(--ds-surface-shadow), 0 0 16px ${color}18`,
            }}
            initial={{ opacity: 0, x }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>{label}</p>
            <p className="mt-0.5 text-base font-bold" style={{ color }}>{value}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
