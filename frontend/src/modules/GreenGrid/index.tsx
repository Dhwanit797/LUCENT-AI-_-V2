import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid, BarChart, Bar, LineChart, Line,
} from 'recharts'
import { Leaf, CheckCircle2, Zap, TrendingDown, BarChart3, RefreshCw, Flame } from 'lucide-react'
import { greenApi } from './services/api'
import useModuleStatus from '../../hooks/useModuleStatus'
import ModuleLayout from '../../components/module/ModuleLayout'
import PreInsightLayout from '../../components/module/PreInsightLayout'
import CsvUpload from '../../components/CsvUpload'
import AIRecommendations from '../../components/AIRecommendations'
import { useAuth } from '../../context/AuthContext'

const ACCENT = '#4ADE80'

type ChartPoint = { name: string; usage: number }
type WindowRange = 7 | 14 | 30 | 'lifetime'

/* ── 3D Tilt ─────────────────────────────────────────────── */
function TiltCard({ children, style = {}, className = '' }: {
  children: React.ReactNode; style?: React.CSSProperties; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0); const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 400, damping: 40 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 400, damping: 40 })
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
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', ...style }}
      onMouseMove={handleMove}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      className={className}
    >
      <motion.div className="pointer-events-none absolute inset-0 rounded-2xl z-10"
        style={{
          background: useTransform([glowX, glowY], ([gx, gy]) =>
            `radial-gradient(circle at ${gx}% ${gy}%, rgba(74,222,128,0.07) 0%, transparent 55%)`)
        }} />
      {children}
    </motion.div>
  )
}

/* ── Tooltip ─────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs"
      style={{
      background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}25`,
          color: 'rgb(var(--ds-text-primary))', fontFamily: 'var(--ds-font-mono)',
          boxShadow: 'var(--ds-surface-shadow)',
        }}>
        {label && <p className="mb-1" style={{ color: 'rgb(var(--ds-text-muted))' }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.stroke || p.fill || ACCENT }}>
          {p.name || 'Usage'}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value} kWh</strong>
        </p>
      ))}
    </div>
  )
}

/* ── Pulsing eco orb ──────────────────────────────────────── */
function EcoOrb({ kwh }: { kwh: number }) {
  const intensity = Math.min(1, kwh / 100)
  const color = intensity < 0.3 ? '#4ADE80' : intensity < 0.6 ? '#fbbf24' : '#f84646'
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {/* Outer pulse rings */}
      {[1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{ borderColor: `${color}30`, inset: `${-i * 12}px` }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 3, delay: i * 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Core orb */}
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}22 0%, ${color}08 100%)`,
          border: `1.5px solid ${color}35`,
          boxShadow: `0 0 24px ${color}30, 0 0 60px ${color}12`,
        }}>
        <Leaf className="h-8 w-8" style={{ color }} />
      </div>
    </div>
  )
}

const reveal = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.58, ease: [0.16, 1, 0.3, 1] } },
}

export default function GreenGrid() {
  const [chartData, setChartData] = useState<ChartPoint[] | null>(null)
  const [average, setAverage] = useState<number | null>(null)
  const [savings, setSavings] = useState<number | null>(null)
  const [peak, setPeak] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const [windowRange, setWindowRange] = useState<WindowRange>(7)
  const { hasData, loading, refreshStatus } = useModuleStatus('green-grid')
  const { token } = useAuth()
  const [quality, setQuality] = useState<{ score: number; label: string } | null>(null)

  const loadData = useCallback(() => {
    greenApi.chart().then((data) => {
      const points = data.map((d) => ({ name: d.hour, usage: d.usage }))
      setChartData(points.length ? points : null)
      if (points.length) {
        const usages = points.map(p => p.usage)
        setPeak(Math.max(...usages))
      }
    }).catch(() => {})
    greenApi.data().then((data) => {
      setAverage(data.current_usage_kwh)
      setSavings(data.potential_savings_percent ?? null)
    }).catch(() => {})
  }, [])

  useEffect(() => { if (hasData) loadData() }, [hasData, loadData])

  const handleFileUpload = async (file: File) => {
    setError(null)
    try {
      const data = await greenApi.upload(file)
      const points: ChartPoint[] = (data.labels || []).map((label, i) => ({
        name: label, usage: data.values?.[i] ?? 0,
      }))
      setChartData(points.length ? points : null)
      setAverage(data.average ?? null)
      if (points.length) setPeak(Math.max(...points.map(p => p.usage)))
      const dq = (data as any).data_quality_score
      const rl = (data as any).reliability_label
      if (typeof dq === 'number' && typeof rl === 'string') {
        setQuality({ score: dq, label: rl })
      } else {
        setQuality(null)
      }
      await refreshStatus()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setChartData(null); setAverage(null); setSavings(null)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Clear all energy data?')) return
    setIsClearing(true)
    try {
      await greenApi.clear()
      setChartData(null); setAverage(null); setSavings(null); setPeak(null); setError(null)
      await refreshStatus()
    } catch { alert('Failed to reset.') } finally { setIsClearing(false) }
  }

  if (loading) return (
    <ModuleLayout>
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: ACCENT }} />
      </div>
    </ModuleLayout>
  )

  if (!hasData) return (
    <ModuleLayout>
      <PreInsightLayout
        moduleTitle="Green Grid Optimizer"
        tagline="Optimize energy consumption with data-driven efficiency."
        bullets={[
          'Hourly and daily usage trend analysis',
          'Peak consumption detection and shift recommendations',
          'Environmental impact scoring and benchmarking',
        ]}
        icon={Leaf} accentColor={ACCENT}
        lockedMetrics={['Average Usage (kWh)', 'Data Points', 'Grid Status']}
        csvColumns={['hour', 'usage_kwh']}
        onUpload={handleFileUpload}
      />
    </ModuleLayout>
  )

  const savingsPct = savings ?? 0
  const savingsColor = savingsPct > 20 ? '#34D399' : savingsPct > 10 ? '#fbbf24' : ACCENT

  const visibleChartData: ChartPoint[] | null = (() => {
    if (!chartData || !chartData.length) return null
    if (windowRange === 'lifetime') return chartData
    const size = windowRange
    if (!size || chartData.length <= size) return chartData
    return chartData.slice(chartData.length - size)
  })()

  return (
    <ModuleLayout>
      {/* ── Header ────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={reveal}
        className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: `${ACCENT}10`, border: `1px solid ${ACCENT}28`,
                boxShadow: `0 0 16px ${ACCENT}18`,
              }}>
              <Leaf className="h-4.5 w-4.5" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{ color: ACCENT, fontFamily: 'var(--ds-font-mono)', opacity: 0.7 }}>
                Eco Module
              </p>
              <h1 className="text-2xl font-black leading-tight md:text-3xl"
                style={{
                  fontFamily: 'var(--ds-font-display)',
                    background: `linear-gradient(135deg, rgb(var(--ds-text-primary)) 40%, ${ACCENT} 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                Green Grid Optimizer
              </h1>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'rgba(108,128,162,0.8)', fontFamily: 'var(--ds-font-mono)' }}>
            Energy analytics · Sustainability intelligence · Net zero tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold"
            style={{
              background: `${ACCENT}10`, border: `1px solid ${ACCENT}22`,
              color: ACCENT, fontFamily: 'var(--ds-font-mono)', letterSpacing: '0.08em',
            }}>
            <CheckCircle2 className="h-3 w-3" /> GRID ACTIVE
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold"
            style={{
              background: quality
                ? quality.label === 'High'
                  ? 'rgba(34,197,148,0.12)'
                  : quality.label === 'Medium'
                  ? 'rgba(251,191,36,0.12)'
                  : 'rgba(248,70,70,0.12)'
                : 'rgba(148,163,184,0.10)',
              border: quality
                ? quality.label === 'High'
                  ? '1px solid rgba(34,197,148,0.35)'
                  : quality.label === 'Medium'
                  ? '1px solid rgba(251,191,36,0.35)'
                  : '1px solid rgba(248,70,70,0.35)'
                : '1px solid rgba(148,163,184,0.22)',
              color: quality
                ? quality.label === 'High'
                  ? '#22c594'
                  : quality.label === 'Medium'
                  ? '#fbbf24'
                  : '#f84646'
                : 'rgba(148,163,184,0.85)',
              fontFamily: 'var(--ds-font-mono)',
              letterSpacing: '0.08em',
            }}
          >
            Data Quality:{' '}
            {quality ? `${quality.score.toFixed(1)} · ${quality.label}` : '—'}
          </span>
          <motion.button onClick={loadData}
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.12)', color: 'rgb(var(--ds-text-muted))' }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </motion.button>
          {hasData && (
            <button onClick={handleClearAll} disabled={isClearing}
              className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-all disabled:opacity-50"
              style={{ border: '1px solid rgba(248,70,70,0.22)', color: 'rgba(248,70,70,0.75)', fontFamily: 'var(--ds-font-mono)', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,70,70,0.07)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
              {isClearing ? 'Clearing…' : 'Reset'}
            </button>
          )}
          <CsvUpload onUpload={handleFileUpload} title="Upload Grid Data" description="hour, usage_kwh" />
        </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(248,70,70,0.07)', border: '1px solid rgba(248,70,70,0.22)', color: '#f84646' }}>
          {error}
        </motion.div>
      )}

      {/* ── Stats + Orb ───────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ delay: 0.08 }}
        className="grid gap-4 sm:grid-cols-4">

          {/* Eco orb card */}
          <div className="sm:col-span-1 flex items-center justify-center relative overflow-hidden rounded-2xl p-5"
            style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}15` }}>
            <EcoOrb kwh={average ?? 0} />
          </div>

          {/* Avg usage */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}18`, boxShadow: `0 0 30px ${ACCENT}06` }}>
            <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full blur-3xl"
              style={{ background: `${ACCENT}20` }} />
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
              Avg Usage
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black tabular-nums"
                style={{ color: ACCENT, fontFamily: 'var(--ds-font-display)' }}>
                {average != null ? average.toFixed(1) : '—'}
              </span>
              <span className="text-sm" style={{ color: 'rgb(var(--ds-text-muted))' }}>kWh</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
              per reading period
            </p>
          </motion.div>

          {/* Peak */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: 'rgb(var(--ds-bg-surface))', border: '1px solid rgba(251,191,36,0.18)' }}>
            <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full blur-3xl"
              style={{ background: 'rgba(251,191,36,0.15)' }} />
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                Peak Load
              </p>
              <Flame className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black tabular-nums"
                style={{ color: '#fbbf24', fontFamily: 'var(--ds-font-display)' }}>
                {peak != null ? peak.toFixed(1) : '—'}
              </span>
              <span className="text-sm" style={{ color: 'rgb(var(--ds-text-muted))' }}>kWh</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
              maximum recorded
            </p>
          </motion.div>

          {/* Savings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${savingsColor}18` }}>
            <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full blur-3xl"
              style={{ background: `${savingsColor}15` }} />
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                Savings Potential
              </p>
              <TrendingDown className="h-3.5 w-3.5" style={{ color: savingsColor }} />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-4xl font-black tabular-nums"
                style={{ color: savingsColor, fontFamily: 'var(--ds-font-display)' }}>
                {savingsPct.toFixed(0)}
              </span>
              <span className="text-xl font-black" style={{ color: savingsColor }}>%</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
              peak-to-avg reduction
            </p>
          </motion.div>
      </motion.div>

      {/* ── Area chart ────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ delay: 0.18 }}>
        <TiltCard
            className="relative overflow-hidden rounded-2xl p-6"
            style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}12`, boxShadow: 'var(--ds-card-shadow)' }}
          >
            <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full blur-3xl"
              style={{ background: `${ACCENT}06` }} />
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                ENERGY USAGE TIMELINE
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                  <span className="text-[10px]" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    LIVE DATA
                  </span>
                </div>
                <div className="flex items-center gap-1 rounded-full px-1.5 py-0.5"
                  style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.15)' }}>
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setWindowRange(d as WindowRange)}
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        fontFamily: 'var(--ds-font-mono)',
                        background: windowRange === d ? 'rgba(74,222,128,0.16)' : 'transparent',
                        color: windowRange === d ? ACCENT : 'rgb(var(--ds-text-muted))',
                        border: windowRange === d ? '1px solid rgba(74,222,128,0.45)' : '1px solid transparent',
                      }}
                    >
                      {d}d
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWindowRange('lifetime')}
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      fontFamily: 'var(--ds-font-mono)',
                      background: windowRange === 'lifetime' ? 'rgba(74,222,128,0.16)' : 'transparent',
                      color: windowRange === 'lifetime' ? ACCENT : 'rgb(var(--ds-text-muted))',
                      border: windowRange === 'lifetime' ? '1px solid rgba(74,222,128,0.45)' : '1px solid transparent',
                    }}
                  >
                    Lifetime
                  </button>
                </div>
              </div>
            </div>
            {visibleChartData?.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visibleChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} />
                        <stop offset="50%" stopColor={ACCENT} stopOpacity={0.08} />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgb(var(--ds-border) / 0.07)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="name"
                      stroke="transparent"
                      tick={{ fontSize: 10, fontFamily: 'var(--ds-font-mono)', fill: 'rgb(var(--ds-text-muted))' }}
                      tickLine={false} axisLine={false}
                      interval={Math.max(0, Math.floor((visibleChartData?.length ?? 0) / 8) - 1)}
                    />
                    <YAxis
                      stroke="transparent"
                      tick={{ fontSize: 10, fontFamily: 'var(--ds-font-mono)', fill: 'rgb(var(--ds-text-muted))' }}
                      tickLine={false} axisLine={false}
                      tickFormatter={v => `${v}kWh`}
                    />
                    <Tooltip content={<ChartTip />} />
                    <Area
                      type="monotone" dataKey="usage" name="Usage"
                      stroke={ACCENT} fill="url(#greenFill)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: ACCENT, stroke: 'rgb(var(--ds-bg-surface))', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-xs"
                style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                No usage data
              </div>
            )}
          </TiltCard>
      </motion.div>

      {/* ── Usage distribution bar chart ─────────────── */}
      {visibleChartData && visibleChartData.length > 1 && (
        <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ delay: 0.26 }}>
          <TiltCard
              className="relative overflow-hidden rounded-2xl p-6"
              style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}10`, boxShadow: 'var(--ds-card-shadow)' }}
            >
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                USAGE DISTRIBUTION BY PERIOD
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visibleChartData.slice(0, 24)} barSize={14} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="greenBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity={0.25} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgb(var(--ds-border) / 0.07)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="name" stroke="transparent"
                      tick={{ fontSize: 9, fontFamily: 'var(--ds-font-mono)', fill: 'rgb(var(--ds-text-muted))' }}
                      tickLine={false} axisLine={false} />
                    <YAxis stroke="transparent"
                      tick={{ fontSize: 9, fontFamily: 'var(--ds-font-mono)', fill: 'rgb(var(--ds-text-muted))' }}
                      tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: `${ACCENT}06` }} />
                    <Bar dataKey="usage" name="Usage" fill="url(#greenBar)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TiltCard>
        </motion.div>
      )}

      {/* ── Grid status ───────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ delay: 0.32 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}12` }}>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: ACCENT }} />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
              GRID STATUS PANEL
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Data Points', value: chartData?.length ?? 0, unit: 'readings', color: ACCENT },
              { label: 'Avg kWh', value: average != null ? average.toFixed(2) : '—', unit: 'kWh', color: '#00D4FF' },
              { label: 'Peak kWh', value: peak != null ? peak.toFixed(2) : '—', unit: 'kWh', color: '#fbbf24' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3.5"
                style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.08)' }}>
                <p className="mb-1 text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                  {item.label}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black"
                    style={{ color: item.color, fontFamily: 'var(--ds-font-display)' }}>
                    {item.value}
                  </span>
                  <span className="text-xs" style={{ color: 'rgb(var(--ds-text-muted))' }}>{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ delay: 0.38 }}>
        <AIRecommendations endpoint="/green-grid/recommendations" token={token} />
      </motion.div>
    </ModuleLayout>
  )
}
