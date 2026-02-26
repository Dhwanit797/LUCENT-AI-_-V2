import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Upload, Cpu, TrendingUp, Sparkles } from 'lucide-react'

const STEPS = [
  {
    icon: Upload,
    title: 'Connect your data',
    desc: 'CSV upload or API integration. Expenses, transactions, inventory, and energy — ingest everything in minutes.',
    color: '#00d4ff',
    num: '01',
  },
  {
    icon: Cpu,
    title: 'AI analyzes in real-time',
    desc: 'Isolation Forest, regression models, and rule-based engines detect patterns, anomalies, and opportunities instantly.',
    color: '#00ffc3',
    num: '02',
  },
  {
    icon: TrendingUp,
    title: 'Act on AI recommendations',
    desc: 'Severity-ranked insights with clear action items. Cut through noise and optimize with confidence.',
    color: '#beff00',
    num: '03',
  },
  {
    icon: Sparkles,
    title: 'Scale with full clarity',
    desc: 'From single teams to enterprise-wide operations. Unified health scores track progress across every dimension.',
    color: '#a78bfa',
    num: '04',
  },
]

export default function SectionHowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const lineScaleX = useTransform(scrollYProgress, [0.15, 0.65], [0, 1])
  const bgGlowY = useTransform(scrollYProgress, [0, 1], [-40, 40])

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative w-full overflow-hidden px-6 py-28 md:py-40"
      style={{ background: 'rgb(var(--ds-bg-elevated))' }}
    >
      {/* Parallax ambient bg */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          y: bgGlowY,
          background: 'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 60%)',
        }}
      />
      {/* Line grid */}
      <div className="absolute inset-0 line-grid-bg opacity-50 dark:opacity-30" />
      <div className="noise-overlay" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-20">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-12" style={{ background: 'rgb(var(--ds-accent))' }} />
            <motion.span
              className="text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: 'rgb(var(--ds-accent))', fontFamily: 'var(--ds-font-mono)' }}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Process
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
            Four steps to{' '}
            <span className="text-gradient-accent">smarter business.</span>
          </motion.h2>
        </div>

        {/* Steps — desktop: horizontal timeline row */}
        <div className="relative">
          {/* Connecting progress line (desktop) */}
          <div className="absolute left-[6.5%] right-[6.5%] top-9 hidden h-px lg:block" style={{ background: 'rgba(0,212,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                scaleX: lineScaleX,
                transformOrigin: 'left',
                background: 'linear-gradient(90deg, #00d4ff, #00ffc3, #beff00, #a78bfa)',
                boxShadow: '0 0 10px rgba(0,212,255,0.3)',
              }}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, desc, color, num }, i) => (
              <motion.div
                key={title}
                className="group relative overflow-hidden rounded-2xl p-6"
                style={{
                  background: 'linear-gradient(145deg, rgb(var(--ds-bg-surface)) 0%, rgb(var(--ds-bg-elevated)) 100%)',
                  border: `1px solid ${color}18`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                }}
                initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, delay: i * 0.12 }}
                whileHover={{
                  y: -6,
                  boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 24px ${color}18`,
                  transition: { duration: 0.25 },
                }}
              >
                {/* Step number circle — top */}
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="relative flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      background: `${color}14`,
                      border: `1.5px solid ${color}40`,
                      boxShadow: `0 0 16px ${color}20`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                    {/* Pulse ring */}
                    <span
                      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ border: `1px solid ${color}`, animation: 'pulse-ring 2s ease-out infinite' }}
                    />
                  </div>
                  <span
                    className="font-black text-3xl leading-none opacity-12 select-none"
                    style={{ color, fontFamily: 'var(--ds-font-impact)', opacity: 0.12 }}
                  >
                    {num}
                  </span>
                </div>

                <h3
                  className="text-base font-bold text-ds-text-primary"
                  style={{ fontFamily: 'var(--ds-font-display)', letterSpacing: '-0.01em' }}
                >
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgb(var(--ds-text-secondary))' }}>
                  {desc}
                </p>

                {/* Bottom glow line */}
                <div
                  className="absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full"
                  style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
                />
                {/* Corner glow */}
                <div
                  className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-2xl"
                  style={{ background: color }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
