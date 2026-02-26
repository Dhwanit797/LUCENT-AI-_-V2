import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function SectionCTA() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const beamX  = useTransform(scrollYProgress, [0.2, 0.8], ['-30%', '130%'])
  const bgY    = useTransform(scrollYProgress, [0, 1], [-24, 24])
  const { token, isValid } = useAuth()
  const isLoggedIn = !!token && isValid

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-36 md:py-48"
      style={{ background: 'rgb(var(--ds-bg-base))' }}
    >
      {/* Layered backgrounds */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(165deg, rgb(var(--ds-bg-elevated)) 0%, rgb(var(--ds-bg-base)) 40%, rgb(var(--ds-bg-elevated)) 75%, rgb(var(--ds-bg-base)) 100%)',
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          y: bgY,
          background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0,212,255,0.1) 0%, rgba(0,255,195,0.04) 40%, transparent 60%)',
        }}
      />
      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid-bg opacity-30 dark:opacity-20" />

      {/* Moving horizontal light beam */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 w-[40%] blur-[60px]"
        style={{
          x: beamX,
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.15), rgba(0,255,195,0.08), transparent)',
          opacity: 0.6,
        }}
      />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 4 === 0 ? '6px' : '3px',
              height: i % 4 === 0 ? '6px' : '3px',
              left: `${8 + i * 5.2}%`,
              top: `${15 + (i % 6) * 13}%`,
              background: i % 3 === 0 ? 'rgb(var(--ds-accent))' : i % 3 === 1 ? 'rgb(var(--ds-accent-teal))' : 'rgb(var(--ds-accent-lime))',
              opacity: 0.08 + (i % 5) * 0.04,
            }}
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.28, 0.1] }}
            transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <div className="noise-overlay" />

      <motion.div
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Pre-label */}
        <motion.div
          className="mb-8 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              borderColor: 'rgba(0,212,255,0.3)',
              background: 'rgba(0,212,255,0.06)',
              color: 'rgb(var(--ds-accent))',
              fontFamily: 'var(--ds-font-mono)',
            }}
          >
            <Zap className="h-3.5 w-3.5" />
            Get started — free
          </span>
        </motion.div>

        {/* Headline */}
        <h2
          className="font-display font-black text-ds-text-primary"
          style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', letterSpacing: '-0.03em', lineHeight: 1.0 }}
        >
          Run smarter.
          <br />
          <span className="text-gradient-accent">Act faster.</span>
        </h2>

        <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed" style={{ color: 'rgb(var(--ds-text-secondary))' }}>
            Join forward-thinking teams that use Lucent AI to see clearer, catch threats earlier, and stay ahead of every curve.
        </p>

        {/* CTA */}
        <motion.div
          className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.65 }}
        >
          <Link to={isLoggedIn ? '/dashboard' : '/login'} className="group relative inline-block">
            <span
              className="absolute -inset-1.5 rounded-2xl opacity-0 blur-xl transition-all duration-500 group-hover:opacity-80"
              style={{ background: 'linear-gradient(135deg, rgb(var(--ds-accent)), rgb(var(--ds-accent-teal)))' }}
              aria-hidden
            />
            <motion.span
              className="relative flex items-center gap-3 rounded-[16px] px-10 py-5 text-base font-bold uppercase tracking-wide"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--ds-accent)) 0%, rgb(var(--ds-accent-teal)) 100%)',
                color: '#04060e',
                letterSpacing: '0.07em',
                fontFamily: 'var(--ds-font-display)',
                boxShadow: '0 0 40px rgba(0,212,255,0.4), 0 8px 24px rgba(0,212,255,0.25)',
              }}
              whileHover={{
                y: -3,
                boxShadow: '0 0 60px rgba(0,212,255,0.55), 0 12px 32px rgba(0,212,255,0.35)',
                transition: { duration: 0.25 },
              }}
              whileTap={{ scale: 0.97, y: 0, transition: { duration: 0.1 } }}
            >
              {/* Shimmer */}
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[16px]" aria-hidden>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              </span>
              <span className="relative">{isLoggedIn ? 'Open dashboard' : 'Launch free'}</span>
              <ArrowRight className="relative h-5 w-5" />
            </motion.span>
          </Link>

          <a
            href="#features"
            className="group flex items-center gap-2 text-sm font-medium transition-colors duration-200"
            style={{ color: 'rgb(var(--ds-text-secondary))' }}
          >
            <span className="group-hover:text-ds-text-primary transition-colors">See all modules</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </motion.div>

        <p className="mt-7 text-sm" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
          No credit card required &nbsp;·&nbsp; CSV upload in minutes &nbsp;·&nbsp; AI active instantly
        </p>
      </motion.div>
    </section>
  )
}
