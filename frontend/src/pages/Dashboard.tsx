import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import {
  Receipt, Shield, Package, Leaf, Download,
  ArrowUpRight, TrendingUp, Activity,
  Zap, Target, BarChart3, Cpu, Globe,
  Check, X, AlertCircle,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import * as api from '../services/api'
import { expenseApi } from '../modules/ExpenseSense/services/api'
import SimulationPanel from '../components/dashboard/SimulationPanel'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'

type Health = Awaited<ReturnType<typeof api.health.score>>
type Recs = Awaited<ReturnType<typeof api.recommendations.list>>
type Carbon = Awaited<ReturnType<typeof api.carbon.estimate>>
type ExpSummary = Awaited<ReturnType<typeof expenseApi.summary>>

const modules = [
  {
    to: '/modules/expense', label: 'Expense Sense', icon: Receipt,
    color: '#38AAF8', glow: 'rgba(56,170,248,0.4)', bg: 'rgba(56,170,248,0.07)',
    border: 'rgba(56,170,248,0.2)', desc: 'Spending analytics & trends', tag: 'ANALYTICS',
    stat: 'Upload CSV',
  },
  {
    to: '/modules/fraud', label: 'Fraud Lens', icon: Shield,
    color: '#20D2BA', glow: 'rgba(32,210,186,0.4)', bg: 'rgba(32,210,186,0.07)',
    border: 'rgba(32,210,186,0.2)', desc: 'Anomaly & threat detection', tag: 'SECURITY',
    stat: 'AI Detection',
  },
  {
    to: '/modules/inventory', label: 'Smart Inventory', icon: Package,
    color: '#34D399', glow: 'rgba(52,211,153,0.4)', bg: 'rgba(52,211,153,0.07)',
    border: 'rgba(52,211,153,0.2)', desc: 'AI-driven stock management', tag: 'FORECAST',
    stat: 'ML Powered',
  },
  {
    to: '/modules/green-grid', label: 'Green Grid', icon: Leaf,
    color: '#4ADE80', glow: 'rgba(74,222,128,0.4)', bg: 'rgba(74,222,128,0.07)',
    border: 'rgba(74,222,128,0.2)', desc: 'Energy & sustainability ops', tag: 'ECO',
    stat: 'Net Zero',
  },
  {
    to: '/modules/revenue-intelligence', label: 'Revenue Intelligence', icon: TrendingUp,
    color: '#38BDF8', glow: 'rgba(56,189,248,0.4)', bg: 'rgba(56,189,248,0.07)',
    border: 'rgba(56,189,248,0.2)', desc: 'Revenue momentum & unified risk', tag: 'REVENUE',
    stat: 'Live Insight',
  },
]

const CHART_COLORS = ['#00D4FF', '#34D399', '#20D2BA', '#4ADE80', '#22D3EE', '#A78BFA']

/* ── 3D Tilt Card ─────────────────────────────────────────── */
function TiltCard({
  children, className = '', style = {}, perspective = 1200,
}: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; perspective?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 400, damping: 40 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 400, damping: 40 })
  const glowX = useTransform(x, [-0.5, 0.5], [0, 100])
  const glowY = useTransform(y, [-0.5, 0.5], [0, 100])

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }, [x, y])

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective, ...style }}
      onMouseMove={handleMove}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      className={className}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl z-10"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.07) 0%, transparent 55%)`
          ),
        }}
      />
      {children}
    </motion.div>
  )
}

/* ── Animated SVG health ring ─────────────────────────────── */
function HealthRing({ score, color }: { score: number; color: string }) {
  const r = 56
  const circ = 2 * Math.PI * r
  const ticks = 24

  return (
    <svg width="152" height="152" viewBox="0 0 152 152">
      {/* Outer track */}
      <circle cx="76" cy="76" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
      {/* Tick marks */}
      {Array.from({ length: ticks }).map((_, i) => {
        const angle = (i / ticks) * 360 - 90
        const rad = (angle * Math.PI) / 180
        const len = i % 4 === 0 ? 7 : 4
        const x1 = 76 + (r - 3) * Math.cos(rad)
        const y1 = 76 + (r - 3) * Math.sin(rad)
        const x2 = 76 + (r - 3 - len) * Math.cos(rad)
        const y2 = 76 + (r - 3 - len) * Math.sin(rad)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(255,255,255,0.07)" strokeWidth={i % 4 === 0 ? 1.5 : 1} />
        )
      })}
      {/* Glow blur ring */}
      <motion.circle
        cx="76" cy="76" r={r} fill="none"
        stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (circ * score) / 100 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
        transform="rotate(-90 76 76)"
        style={{
          // Softer, more neutral glow that works in both light and dark themes
          filter: `drop-shadow(0 0 5px ${color}55) drop-shadow(0 0 14px rgba(15,23,42,0.18))`,
        }}
      />
    </svg>
  )
}

/* ── Particle dot orbiting the health ring ── */
function OrbitDot({ color, score }: { color: string; score: number }) {
  const angle = (score / 100) * 360 - 90
  const rad = (angle * Math.PI) / 180
  const r = 56
  const cx = 76 + r * Math.cos(rad)
  const cy = 76 + r * Math.sin(rad)
  return (
    <motion.circle
      cx={cx} cy={cy} r="5" fill={color}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2.0, duration: 0.4 }}
      style={{ filter: `drop-shadow(0 0 6px ${color})` }}
    />
  )
}

/* ── SmoothUI: Basic Toast ─────────────────────────────────── */
type ToastType = 'success' | 'error'
function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 32, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 rounded-2xl px-5 py-3.5 backdrop-blur-md"
      style={{
        background: type === 'success'
          ? 'linear-gradient(135deg, rgba(34,197,148,0.18), rgba(0,212,255,0.08))'
          : 'linear-gradient(135deg, rgba(248,70,70,0.18), rgba(251,113,133,0.06))',
        border: `1px solid ${type === 'success' ? 'rgba(34,197,148,0.35)' : 'rgba(248,70,70,0.35)'}`,
        boxShadow: type === 'success'
          ? '0 8px 32px rgba(34,197,148,0.2)'
          : '0 8px 32px rgba(248,70,70,0.2)',
        minWidth: '280px',
        maxWidth: '380px',
      }}
    >
      {type === 'success'
        ? <Check className="h-5 w-5 shrink-0" style={{ color: '#22c594' }} />
        : <AlertCircle className="h-5 w-5 shrink-0" style={{ color: '#f84646' }} />}
      <p className="flex-1 text-sm font-semibold" style={{ color: type === 'success' ? '#22c594' : '#f84646', fontFamily: 'var(--ds-font-mono)' }}>
        {message}
      </p>
      <button type="button" onClick={onClose}
        className="rounded-lg p-1 transition-opacity hover:opacity-60"
        style={{ color: type === 'success' ? '#22c594' : '#f84646' }}>
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

/* ── SmoothUI: Dot Morph Button ────────────────────────────── */
type BtnStatus = 'idle' | 'loading' | 'success' | 'error'
function DotMorphButton({
  onClick, label, icon: Icon, status, style: extStyle, className,
}: {
  onClick: () => void
  label: string
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>
  status: BtnStatus
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={status === 'loading'}
      className={`relative flex items-center justify-center gap-2.5 overflow-hidden rounded-xl px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed ${className ?? ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,195,0.1))',
        border: '1px solid rgba(0,212,255,0.3)',
        color: '#00D4FF',
        fontFamily: 'var(--ds-font-mono)',
        letterSpacing: '0.04em',
        boxShadow: '0 0 20px rgba(0,212,255,0.12)',
        minWidth: '148px',
        ...extStyle,
      }}
      whileHover={status !== 'loading' ? { scale: 1.04, boxShadow: '0 0 32px rgba(0,212,255,0.25)' } : {}}
      whileTap={status !== 'loading' ? { scale: 0.97 } : {}}
    >
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.span key="idle" className="flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}>
            <Icon className="h-4 w-4" />
            {label}
          </motion.span>
        )}
        {status === 'loading' && (
          <motion.span key="loading" className="flex items-center gap-1.5"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}>
            {[0, 1, 2].map(i => (
              <motion.span key={i} className="inline-block h-2 w-2 rounded-full"
                style={{ background: '#00D4FF' }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
              />
            ))}
          </motion.span>
        )}
        {status === 'success' && (
          <motion.span key="success" className="flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{ color: '#22c594' }}>
            <Check className="h-4 w-4" />
            DOWNLOADED
          </motion.span>
        )}
        {status === 'error' && (
          <motion.span key="error" className="flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{ color: '#f84646' }}>
            <AlertCircle className="h-4 w-4" />
            FAILED
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/* ── Shimmer Skeleton ─────────────────────────────────────── */
function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ background: 'rgb(var(--ds-bg-elevated))', ...style }}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

/* ── Main Dashboard ───────────────────────────────────────── */
export default function Dashboard() {
  const [health, setHealth] = useState<Health | null>(null)
  const [recs, setRecs] = useState<Recs | null>(null)
  const [carbon, setCarbon] = useState<Carbon | null>(null)
  const [expenseSummary, setExpenseSummary] = useState<ExpSummary | null>(null)
  const [reportStatus, setReportStatus] = useState<BtnStatus>('idle')
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    api.health.score().then(setHealth).catch(() => setHealth(null))
    api.recommendations.list().then(setRecs).catch(() => setRecs(null))
    api.carbon.estimate().then(setCarbon).catch(() => setCarbon(null))
    expenseApi.status().then(s => {
      if (s.has_data) expenseApi.summary().then(setExpenseSummary).catch(() => null)
    }).catch(() => null)
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  async function handleDownloadReport() {
    if (reportStatus === 'loading') return
    setReportStatus('loading')
    try {
      const blob = await api.report.pdf()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'lucent_ai_report.pdf'; a.click()
      URL.revokeObjectURL(url)
      setReportStatus('success')
      setToast({ message: 'Report downloaded successfully!', type: 'success' })
      setTimeout(() => setReportStatus('idle'), 2500)
    } catch {
      setReportStatus('error')
      setToast({ message: 'Failed to generate report. Try again.', type: 'error' })
      setTimeout(() => setReportStatus('idle'), 2500)
    }
  }

  const score = health?.score ?? 0
  const healthColor = score >= 80 ? '#34D399' : score >= 65 ? '#00D4FF' : score >= 50 ? '#FBBF24' : '#F87171'
  const healthLabel = score >= 80 ? 'EXCELLENT' : score >= 65 ? 'GOOD' : score >= 50 ? 'FAIR' : 'CRITICAL'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-10"
    >
      {/* ── HERO HEADER ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--ds-bg-elevated)) 0%, rgb(var(--ds-bg-surface)) 60%, rgba(0,212,255,0.04) 100%)',
            border: '1px solid rgba(0,212,255,0.12)',
            boxShadow: '0 0 60px rgba(0,212,255,0.06), var(--ds-card-shadow)',
          }}
      >
        {/* Grid bg */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        {/* Ambient orb */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full blur-[80px]"
          style={{ background: 'rgba(0,212,255,0.08)' }} />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full blur-[60px]"
          style={{ background: 'rgba(0,255,195,0.06)' }} />

        <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ background: '#00D4FF' }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#00D4FF' }} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: '#00D4FF', fontFamily: 'var(--ds-font-mono)' }}>
                  LUCENT AI · LIVE INTELLIGENCE PLATFORM
              </span>
            </div>

              <h1 className="text-4xl font-black leading-none md:text-5xl lg:text-6xl"
                style={{
                  fontFamily: 'var(--ds-font-display)',
                  color: 'rgb(var(--ds-text-primary))',
                }}>
              Business
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #00D4FF 0%, #00FFC3 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Intelligence</span>
            </h1>

            <p className="mt-3 text-sm max-w-md" style={{ color: 'rgba(108,128,162,0.9)', fontFamily: 'var(--ds-font-mono)', lineHeight: 1.7 }}>
              Real-time AI analytics across expenses, fraud detection, inventory forecasting, and sustainability.
            </p>
          </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
              {/* Live clock */}
              <div className="rounded-xl px-4 py-2" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.12)' }}>
                <p className="text-[10px]" style={{ color: 'rgba(108,128,162,0.7)', fontFamily: 'var(--ds-font-mono)' }}>SYSTEM TIME</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: '#00D4FF', fontFamily: 'var(--ds-font-mono)' }}>
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>

              <DotMorphButton
                onClick={handleDownloadReport}
                label="EXPORT PDF"
                icon={Download}
                status={reportStatus}
              />
            </div>
        </div>

        {/* Bottom ticker */}
        <div className="border-t overflow-hidden" style={{ borderColor: 'rgba(0,212,255,0.08)' }}>
          <div className="flex items-center gap-8 px-8 py-2.5 ticker-track whitespace-nowrap">
            {['EXPENSE ANALYTICS', 'FRAUD DETECTION', 'INVENTORY FORECAST', 'ENERGY GRID', 'AI RECOMMENDATIONS', 'CARBON FOOTPRINT', 'EXPENSE ANALYTICS', 'FRAUD DETECTION', 'INVENTORY FORECAST', 'ENERGY GRID'].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-[10px] font-bold"
                style={{ color: 'rgba(108,128,162,0.5)', fontFamily: 'var(--ds-font-mono)', letterSpacing: '0.12em' }}>
                <span className="h-1 w-1 rounded-full" style={{ background: 'rgba(0,212,255,0.4)' }} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── HEALTH SCORE ─────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionLabel icon={Activity} label="Business Health Score" />
        <TiltCard
          className="group relative overflow-hidden rounded-3xl"
            style={{
              background: 'linear-gradient(145deg, rgb(var(--ds-bg-surface)), rgb(var(--ds-bg-elevated)))',
              border: `1px solid ${healthColor}22`,
              boxShadow: `0 0 60px ${healthColor}08, var(--ds-card-shadow)`,
            }}
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(ellipse 50% 70% at 20% 50%, ${healthColor}08, transparent)` }} />

          <div className="relative flex flex-col items-center gap-8 p-8 md:flex-row">
            {/* Ring */}
            <div className="relative shrink-0 flex items-center justify-center">
              <svg width="152" height="152" viewBox="0 0 152 152" className="absolute">
                <HealthRing score={score} color={healthColor} />
                <OrbitDot color={healthColor} score={score} />
              </svg>
              <div className="flex flex-col items-center justify-center w-36 h-36">
                <AnimatedCounter
                  value={score}
                  className="text-5xl font-black tabular-nums"
                  style={{ color: healthColor, fontFamily: 'var(--ds-font-display)', lineHeight: 1 }}
                />
                <span className="mt-1 text-[11px] font-bold tracking-[0.15em]"
                  style={{ color: healthColor, fontFamily: 'var(--ds-font-mono)' }}>
                  {healthLabel}
                </span>
              </div>
            </div>

            {/* Factors */}
            <div className="flex-1 w-full">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: 'rgba(108,128,162,0.7)', fontFamily: 'var(--ds-font-mono)' }}>
                Score Breakdown
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {health?.factors.map((f, i) => (
                  <motion.div
                    key={f.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      className="relative overflow-hidden rounded-2xl p-4"
                      style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.08)' }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold" style={{ color: 'rgb(var(--ds-text-secondary))', fontFamily: 'var(--ds-font-mono)' }}>{f.name}</p>
                      <span className="text-sm font-black tabular-nums" style={{ color: healthColor, fontFamily: 'var(--ds-font-mono)' }}>{f.score}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgb(var(--ds-border) / 0.12)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${healthColor}, ${healthColor}88)`,
                          boxShadow: `0 0 8px ${healthColor}60`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${f.score}%` }}
                        transition={{ duration: 1.1, delay: 0.45 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </motion.div>
                  )) ?? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                ))}

              </div>
            </div>
          </div>
        </TiltCard>
      </motion.section>

      {/* ── MODULE CARDS ─────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionLabel icon={Cpu} label="Intelligence Modules" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map(({ to, label, icon: Icon, color, glow, bg, border, desc, tag, stat }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
                <TiltCard
                  className="group relative h-full overflow-hidden rounded-2xl cursor-pointer"
                  style={{
                    background: 'rgb(var(--ds-bg-surface))',
                    border: `1px solid ${border}`,
                    boxShadow: `var(--ds-card-shadow)`,
                  }}
              >
                <Link to={to} className="block h-full p-5">
                  {/* Ambient hover glow */}
                  <div
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: glow }}
                  />
                  {/* Corner shimmer line */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />

                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[9px] font-bold tracking-[0.18em]"
                      style={{ color, fontFamily: 'var(--ds-font-mono)', opacity: 0.65 }}>
                      {tag}
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      style={{ color }}
                    />
                  </div>

                  {/* Icon */}
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: bg,
                      border: `1px solid ${color}30`,
                      boxShadow: `0 0 20px ${color}15`,
                    }}
                  >
                    <Icon className="h-6 w-6" style={{ color }} />
                  </div>

                    <h3 className="mb-1 text-base font-bold"
                      style={{ color: 'rgb(var(--ds-text-primary))', fontFamily: 'var(--ds-font-display)' }}>
                      {label}
                    </h3>
                    <p className="mb-4 text-xs" style={{ color: 'rgb(var(--ds-text-muted))' }}>{desc}</p>

                  {/* Stat badge */}
                  <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                    style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: color }} />
                    <span className="text-[10px] font-bold" style={{ color, fontFamily: 'var(--ds-font-mono)' }}>{stat}</span>
                  </div>

                  {/* Bottom accent line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                  />
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── EXPENSE CHART + AI RECS ───────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Expense donut — takes 2 cols */}
        <motion.section
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionLabel icon={Receipt} label="Expense Breakdown" />
          <div
            className="relative overflow-hidden rounded-2xl p-6 h-full"
            style={{
              background: 'rgb(var(--ds-bg-surface))',
              border: '1px solid rgba(56,170,248,0.15)',
              boxShadow: 'var(--ds-card-shadow)',
              minHeight: '280px',
            }}
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full blur-3xl"
              style={{ background: 'rgba(56,170,248,0.08)' }} />
            {expenseSummary?.by_category?.length ? (
              <div className="flex h-full flex-col items-center gap-4">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseSummary.by_category}
                        dataKey="value" nameKey="name"
                        cx="50%" cy="50%"
                        innerRadius={58} outerRadius={86}
                        paddingAngle={3} strokeWidth={0}
                      >
                        {expenseSummary.by_category.map((_e, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                        <Tooltip contentStyle={{
                          background: 'rgb(var(--ds-bg-surface))', border: '1px solid rgba(0,212,255,0.2)',
                          borderRadius: '12px', color: 'rgb(var(--ds-text-primary))', fontSize: '12px',
                        }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                  {expenseSummary.by_category.slice(0, 5).map((cat, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-[11px]" style={{ color: 'rgb(var(--ds-text-secondary))', fontFamily: 'var(--ds-font-mono)' }}>{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(56,170,248,0.08)', border: '1px solid rgba(56,170,248,0.15)' }}>
                  <Receipt className="h-8 w-8 opacity-40" style={{ color: '#38AAF8' }} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: 'rgb(var(--ds-text-secondary))' }}>No expense data</p>
                    <p className="mt-1 text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    Upload a CSV in Expense Sense
                  </p>
                </div>
                <Link to="/modules/expense"
                  className="rounded-xl px-4 py-2 text-xs font-bold transition-all"
                  style={{ background: 'rgba(56,170,248,0.1)', border: '1px solid rgba(56,170,248,0.25)', color: '#38AAF8', fontFamily: 'var(--ds-font-mono)' }}>
                  Go to Expense Sense →
                </Link>
              </div>
            )}
          </div>
        </motion.section>

        {/* AI Recommendations — 3 cols */}
        <motion.section
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionLabel icon={Zap} label="AI Recommendations" />
          <div
            className="relative overflow-hidden rounded-2xl p-6 h-full"
            style={{
              background: 'rgb(var(--ds-bg-surface))',
              border: '1px solid rgba(0,212,255,0.12)',
              boxShadow: 'var(--ds-card-shadow)',
              minHeight: '280px',
            }}
          >
            <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full blur-3xl"
              style={{ background: 'rgba(0,212,255,0.05)' }} />
            {recs ? (
              <div className="space-y-2.5">
                {recs.slice(0, 5).map((r, i) => {
                  const pColors = { high: '#f84646', medium: '#fbbf24', low: '#22c594' }
                  const pBgs = { high: 'rgba(248,70,70,0.1)', medium: 'rgba(251,191,36,0.08)', low: 'rgba(34,197,148,0.08)' }
                  const p = r.priority as 'high' | 'medium' | 'low'
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.07 }}
                        className="group flex items-start gap-3 rounded-xl p-3.5 transition-all duration-200 cursor-default"
                        style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.08)' }}
                      whileHover={{ borderColor: 'rgba(0,212,255,0.18)', background: 'rgba(0,212,255,0.03)' } as any}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
                        style={{ background: pBgs[p] || pBgs.low, border: `1px solid ${pColors[p] || pColors.low}20` }}>
                        💡
                      </div>
                      <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug" style={{ color: 'rgb(var(--ds-text-primary))' }}>{r.title}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.08em]"
                          style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                          {r.priority} priority
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: pBgs[p] || pBgs.low,
                          color: pColors[p] || pColors.low,
                          border: `1px solid ${pColors[p] || pColors.low}25`,
                          fontFamily: 'var(--ds-font-mono)',
                        }}>
                        {r.category || r.priority}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="w-full space-y-2">
                    {[100, 85, 70].map((w, i) => (
                      <Skeleton key={i} className="h-14" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              )}
          </div>
        </motion.section>
      </div>

      {/* ── CARBON + REPORT ──────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.38 }}
      >
        <SectionLabel icon={Globe} label="Sustainability & Reports" />
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Carbon card */}
          <TiltCard
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgb(var(--ds-bg-surface)), rgba(34,197,148,0.04))',
              border: '1px solid rgba(34,197,148,0.18)',
              boxShadow: '0 0 40px rgba(34,197,148,0.04)',
            }}
          >
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl"
                style={{ background: 'rgba(34,197,148,0.12)' }} />
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(34,197,148,0.1)', border: '1px solid rgba(34,197,148,0.2)' }}>
                  <Leaf className="h-4 w-4" style={{ color: '#22c594' }} />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.12em]"
                  style={{ color: 'rgba(108,128,162,0.8)', fontFamily: 'var(--ds-font-mono)' }}>
                  Carbon Footprint
                </p>
              </div>
              {carbon ? (
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <AnimatedCounter
                      value={carbon.kg_co2_per_year}
                      className="text-4xl font-black tabular-nums"
                      style={{ color: '#22c594', fontFamily: 'var(--ds-font-display)' }}
                    />
                    <span className="text-sm" style={{ color: 'rgb(var(--ds-text-muted))' }}>kg CO₂/yr</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed max-w-xs"
                    style={{ color: 'rgba(108,128,162,0.8)', fontFamily: 'var(--ds-font-mono)' }}>
                    {carbon.equivalent}
                  </p>
                </div>
                <div className="shrink-0 rounded-xl px-4 py-2 text-center"
                  style={{
                    background: 'rgba(34,197,148,0.1)',
                    border: '1px solid rgba(34,197,148,0.2)',
                  }}>
                  <p className="text-[10px] uppercase tracking-[0.1em]"
                    style={{ color: 'rgba(108,128,162,0.7)', fontFamily: 'var(--ds-font-mono)' }}>Rating</p>
                  <p className="text-xl font-black" style={{ color: '#22c594', fontFamily: 'var(--ds-font-display)' }}>
                    {carbon.rating}
                  </p>
                </div>
              </div>
              ) : (
                <Skeleton className="h-20" />
              )}
          </TiltCard>

          {/* Report download */}
          <TiltCard
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgb(var(--ds-bg-surface)), rgba(0,212,255,0.04))',
              border: '1px solid rgba(0,212,255,0.15)',
            }}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl"
              style={{ background: 'rgba(0,212,255,0.1)' }} />
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                <Target className="h-4 w-4" style={{ color: '#00D4FF' }} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.12em]"
                style={{ color: 'rgba(108,128,162,0.8)', fontFamily: 'var(--ds-font-mono)' }}>
                Full Business Report
              </p>
            </div>
            <p className="mb-5 text-sm leading-relaxed"
              style={{ color: 'rgb(var(--ds-text-secondary))' }}>
                AI-generated PDF covering all modules — health score, expense trends, fraud analysis, inventory and sustainability data.
              </p>
              <DotMorphButton
                onClick={handleDownloadReport}
                label="DOWNLOAD REPORT"
                icon={Download}
                status={reportStatus}
              />
          </TiltCard>
        </div>
      </motion.section>

      {/* ── WHAT-IF SIMULATOR ───────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionLabel icon={Cpu} label="What-if Simulator" />
        <SimulationPanel />
      </motion.section>
    </motion.div>
  )
}

/* ── Section label ────────────────────────────────────────── */
function SectionLabel({ icon: Icon, label }: { icon: React.FC<{ className?: string; style?: React.CSSProperties }>, label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5" style={{ color: '#00D4FF', opacity: 0.75 }} />
      <p className="text-[11px] font-bold uppercase tracking-[0.16em]"
        style={{ color: 'rgba(108,128,162,0.8)', fontFamily: 'var(--ds-font-mono)' }}>
        {label}
      </p>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.15), transparent)' }} />
    </div>
  )
}
