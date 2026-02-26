import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'
import {
  Receipt, CheckCircle2, TrendingUp, TrendingDown,
  DollarSign, Tag, ArrowUpRight, BarChart3, RefreshCw,
} from 'lucide-react'
import { expenseApi } from './services/api'
import useModuleStatus from '../../hooks/useModuleStatus'
import ModuleLayout from '../../components/module/ModuleLayout'
import PreInsightLayout from '../../components/module/PreInsightLayout'
import CsvUpload from '../../components/CsvUpload'
import AIRecommendations from '../../components/AIRecommendations'
import { useAuth } from '../../context/AuthContext'

const ACCENT = '#38AAF8'
const COLORS = ['#00D4FF', '#38AAF8', '#34D399', '#20D2BA', '#4ADE80', '#A78BFA', '#F472B6']

type ChartItem = { name: string; value: number }
type TrendItem = { month: string; amount: number }
type Stats = { total: number; trend?: string; trend_percent?: number }
type TabId = 'overview' | 'trends' | 'ai'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'trends',   label: 'Trends' },
  { id: 'ai',       label: 'AI Insights' },
]

/* ── Animated Tab Bar ────────────────────────────────────── */
function AnimatedTabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="relative flex gap-1 rounded-2xl p-1"
      style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.1)' }}>
      {TABS.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className="relative z-10 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors duration-150"
          style={{
            color: active === t.id ? ACCENT : 'rgb(var(--ds-text-muted))',
            fontFamily: 'var(--ds-font-mono)',
            letterSpacing: '0.06em',
          }}
        >
          {active === t.id && (
            <motion.div
              layoutId="expense-tab-pill"
              className="absolute inset-0 rounded-xl"
              style={{ background: `${ACCENT}14`, border: `1px solid ${ACCENT}28` }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative">{t.label}</span>
        </button>
      ))}
    </div>
  )
}

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
            `radial-gradient(circle at ${gx}% ${gy}%, rgba(56,170,248,0.08) 0%, transparent 55%)`)
        }} />
      {children}
    </motion.div>
  )
}

/* ── Stat Card ────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, icon: Icon, delay = 0 }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode
  color: string; icon: React.FC<{ className?: string; style?: React.CSSProperties }>; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, ease: [0.22, 1, 0.36, 1], duration: 0.55 }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${color}18`, boxShadow: `0 0 30px ${color}06` }}
    >
      <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full blur-3xl"
        style={{ background: `${color}18` }} />
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
          {label}
        </p>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black"
        style={{ color: 'rgb(var(--ds-text-primary))', fontFamily: 'var(--ds-font-display)' }}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>{sub}</div>}
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
        <p key={i} style={{ color: p.fill || p.stroke || ACCENT }}>
          {p.name || 'Value'}: <strong>${Number(p.value).toLocaleString()}</strong>
        </p>
      ))}
    </div>
  )
}

/* ── Donut center label ─────────────────────────────────── */
function DonutCenter({ total }: { total: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <p className="text-[10px] uppercase tracking-[0.12em]"
        style={{ color: 'rgba(108,128,162,0.7)', fontFamily: 'var(--ds-font-mono)' }}>TOTAL</p>
      <p className="text-2xl font-black tabular-nums"
        style={{ color: ACCENT, fontFamily: 'var(--ds-font-display)' }}>
        ${total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString()}
      </p>
    </div>
  )
}

const reveal = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.58, ease: [0.16, 1, 0.3, 1] } },
}

export default function ExpenseSense() {
  const [chartData, setChartData] = useState<ChartItem[] | null>(null)
  const [trends, setTrends] = useState<TrendItem[] | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const [activeSlice, setActiveSlice] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const { hasData, loading, refreshStatus } = useModuleStatus('expense')
  const { token } = useAuth()
  const [quality, setQuality] = useState<{ score: number; label: string } | null>(null)

  const loadData = useCallback(() => {
    expenseApi.summary().then((data) => {
      setChartData(data.by_category?.length ? data.by_category : null)
      setStats({ total: data.total, trend: data.trend, trend_percent: data.trend_percent })
    }).catch(() => {})
    expenseApi.trends().then(setTrends).catch(() => {})
  }, [])

  useEffect(() => { if (hasData) loadData() }, [hasData, loadData])

  const handleFileUpload = async (file: File) => {
    setError(null)
    try {
      const data = await expenseApi.upload(file)
      const byCategory: ChartItem[] = (data.labels || []).map((label, i) => ({
        name: label, value: data.values?.[i] ?? 0,
      }))
      setChartData(byCategory.length ? byCategory : null)
      setStats({ total: data.total ?? 0, trend: (data as any).trend, trend_percent: (data as any).trend_percent })
      setTrends(data.trends?.length ? data.trends : null)
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
      setChartData(null); setTrends(null); setStats(null)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Clear all expense data?')) return
    setIsClearing(true)
    try {
      await expenseApi.clear()
      setChartData(null); setTrends(null); setStats(null); setError(null)
      await refreshStatus()
    } catch { alert('Failed to reset.') } finally { setIsClearing(false) }
  }

  if (loading) return (
    <ModuleLayout>
      <div className="flex h-64 items-center justify-center">
        <div className="relative">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent"
            style={{ borderTopColor: ACCENT }} />
          <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full border border-transparent"
            style={{ borderTopColor: `${ACCENT}40` }} />
        </div>
      </div>
    </ModuleLayout>
  )

  if (!hasData) return (
    <ModuleLayout>
      <PreInsightLayout
        moduleTitle="Expense Sense"
        tagline="Transform raw spending data into strategic intelligence."
        bullets={[
          'Category-wise breakdown of all expenses',
          'Monthly spending trend analysis',
          'Spending direction and anomaly detection',
        ]}
        icon={Receipt}
        accentColor={ACCENT}
        lockedMetrics={['Total Expense', 'Trend Direction', 'Category Count']}
        csvColumns={['category', 'amount', 'month']}
        onUpload={handleFileUpload}
      />
    </ModuleLayout>
  )

  const trendUp = stats?.trend === 'up'
  const trendColor = trendUp ? '#FBBF24' : '#34D399'
  const total = stats?.total ?? 0

  return (
    <ModuleLayout>
      {/* ── Header ────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={reveal}
        className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}28`, boxShadow: `0 0 16px ${ACCENT}18` }}>
              <Receipt className="h-4.5 w-4.5" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{ color: ACCENT, fontFamily: 'var(--ds-font-mono)', opacity: 0.7 }}>
                Analytics Module
              </p>
              <h1 className="text-2xl font-black leading-tight md:text-3xl"
                style={{
                  fontFamily: 'var(--ds-font-display)',
                  background: `linear-gradient(135deg, rgb(var(--ds-text-primary)) 40%, ${ACCENT} 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                Expense Sense
              </h1>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'rgba(108,128,162,0.8)', fontFamily: 'var(--ds-font-mono)' }}>
            Spending analytics · AI-powered insights · Category intelligence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold"
            style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}22`, color: ACCENT, fontFamily: 'var(--ds-font-mono)', letterSpacing: '0.08em' }}>
            <CheckCircle2 className="h-3 w-3" /> INSIGHTS ACTIVE
          </span>
          <motion.button onClick={loadData}
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.12)', color: 'rgb(var(--ds-text-muted))' }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </motion.button>
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
          {hasData && (
            <button onClick={handleClearAll} disabled={isClearing}
              className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-all disabled:opacity-50"
              style={{ border: '1px solid rgba(248,70,70,0.22)', color: 'rgba(248,70,70,0.75)', fontFamily: 'var(--ds-font-mono)', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,70,70,0.07)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
              {isClearing ? 'Clearing…' : 'Reset'}
            </button>
          )}
          <CsvUpload onUpload={handleFileUpload} title="Upload Expenses" description="category, amount, month" />
        </div>
      </motion.div>

      {/* ── Tab Bar ───────────────────────────────────── */}
      <AnimatedTabBar active={activeTab} onChange={setActiveTab} />

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(248,70,70,0.07)', border: '1px solid rgba(248,70,70,0.22)', color: '#f84646' }}>
          {error}
        </motion.div>
      )}

      {/* ── Tab Content ───────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div key="overview"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6">

            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Total Expenses" icon={DollarSign} color={ACCENT} delay={0.05}
                value={<span style={{ color: ACCENT }}>${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>}
              />
              <StatCard label="Trend Direction" icon={trendUp ? TrendingUp : TrendingDown}
                color={trendColor} delay={0.1}
                value={
                  stats?.trend_percent != null ? (
                    <span style={{ color: trendColor }}>
                      {trendUp ? '↑' : '↓'} {Math.abs(stats.trend_percent).toFixed(1)}%
                    </span>
                  ) : <span style={{ color: 'rgba(180,196,224,0.4)' }}>—</span>
                }
                sub="vs previous period"
              />
              <StatCard label="Categories" icon={Tag} color="#A78BFA" delay={0.15}
                value={<span style={{ color: '#A78BFA' }}>{chartData?.length ?? 0}</span>}
                sub="unique spend categories"
              />
            </div>

            {/* Donut + category breakdown */}
            <div className="grid gap-6 lg:grid-cols-2">
              <TiltCard className="relative overflow-hidden rounded-2xl p-6"
                style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}12`, boxShadow: 'var(--ds-card-shadow)' }}>
                <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full blur-3xl"
                  style={{ background: `${ACCENT}08` }} />
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    BY CATEGORY
                  </p>
                  <BarChart3 className="h-3.5 w-3.5" style={{ color: 'rgb(var(--ds-text-muted))' }} />
                </div>
                {chartData?.length ? (
                  <>
                    <div className="relative h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} dataKey="value" nameKey="name"
                            cx="50%" cy="50%" innerRadius={62} outerRadius={90}
                            paddingAngle={3} strokeWidth={0}
                            onMouseEnter={(_, idx) => setActiveSlice(idx)}
                            onMouseLeave={() => setActiveSlice(null)}>
                            {chartData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]}
                                opacity={activeSlice === null || activeSlice === i ? 1 : 0.45}
                                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <DonutCenter total={total} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                      {chartData.slice(0, 6).map((item, i) => (
                        <button key={i} className="flex items-center gap-1.5 transition-opacity"
                          style={{ opacity: activeSlice === null || activeSlice === i ? 1 : 0.45 }}
                          onMouseEnter={() => setActiveSlice(i)} onMouseLeave={() => setActiveSlice(null)}>
                          <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-[11px]"
                            style={{ color: 'rgb(var(--ds-text-secondary))', fontFamily: 'var(--ds-font-mono)' }}>
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    No category data
                  </div>
                )}
              </TiltCard>

              {/* Category breakdown table */}
              {chartData?.length ? (
                <div className="relative overflow-hidden rounded-2xl p-6"
                  style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid rgb(var(--ds-border) / 0.08)`, boxShadow: 'var(--ds-card-shadow)' }}>
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    CATEGORY BREAKDOWN
                  </p>
                  <div className="space-y-2.5">
                    {chartData.map((item, i) => {
                      const pct = total > 0 ? (item.value / total) * 100 : 0
                      const color = COLORS[i % COLORS.length]
                      return (
                        <motion.div key={item.name}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3">
                          <div className="w-28 shrink-0 text-xs truncate"
                            style={{ color: 'rgb(var(--ds-text-secondary))', fontFamily: 'var(--ds-font-sans)' }}>
                            {item.name}
                          </div>
                          <div className="flex-1 h-1.5 overflow-hidden rounded-full"
                            style={{ background: 'rgb(var(--ds-border) / 0.1)' }}>
                            <motion.div className="h-full rounded-full"
                              style={{ background: color, boxShadow: `0 0 6px ${color}50` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.1 + i * 0.04, ease: [0.22, 1, 0.36, 1] }} />
                          </div>
                          <div className="w-20 shrink-0 text-right text-xs tabular-nums"
                            style={{ color, fontFamily: 'var(--ds-font-mono)' }}>
                            ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                          <div className="w-10 shrink-0 text-right text-[10px] tabular-nums"
                            style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                            {pct.toFixed(1)}%
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-2xl"
                  style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}10`, minHeight: '280px' }}>
                  <p className="text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    No breakdown data
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <motion.div key="trends"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6">

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Bar chart */}
              <TiltCard className="relative overflow-hidden rounded-2xl p-6"
                style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}12`, boxShadow: 'var(--ds-card-shadow)' }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-3xl"
                  style={{ background: `${ACCENT}08` }} />
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    MONTHLY BAR TREND
                  </p>
                  <ArrowUpRight className="h-3.5 w-3.5" style={{ color: 'rgb(var(--ds-text-muted))' }} />
                </div>
                {trends?.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trends} barSize={22} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.95} />
                            <stop offset="100%" stopColor={ACCENT} stopOpacity={0.25} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgb(var(--ds-border) / 0.07)" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="month" stroke="transparent"
                          tick={{ fontSize: 10, fontFamily: 'var(--ds-font-mono)', fill: 'rgb(var(--ds-text-muted))' }}
                          tickLine={false} axisLine={false} />
                        <YAxis stroke="transparent"
                          tick={{ fontSize: 10, fontFamily: 'var(--ds-font-mono)', fill: 'rgb(var(--ds-text-muted))' }}
                          tickLine={false} axisLine={false}
                          tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                        <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(56,170,248,0.05)' }} />
                        <Bar dataKey="amount" fill="url(#expGrad)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-xs"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    No trend data available
                  </div>
                )}
              </TiltCard>

              {/* Line chart */}
              <TiltCard className="relative overflow-hidden rounded-2xl p-6"
                style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}12`, boxShadow: 'var(--ds-card-shadow)' }}>
                <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full blur-3xl"
                  style={{ background: `${ACCENT}08` }} />
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    SPENDING TRAJECTORY
                  </p>
                  <TrendingUp className="h-3.5 w-3.5" style={{ color: 'rgb(var(--ds-text-muted))' }} />
                </div>
                {trends?.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgb(var(--ds-border) / 0.07)" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="month" stroke="transparent"
                          tick={{ fontSize: 10, fontFamily: 'var(--ds-font-mono)', fill: 'rgb(var(--ds-text-muted))' }}
                          tickLine={false} axisLine={false} />
                        <YAxis stroke="transparent"
                          tick={{ fontSize: 10, fontFamily: 'var(--ds-font-mono)', fill: 'rgb(var(--ds-text-muted))' }}
                          tickLine={false} axisLine={false}
                          tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                        <Tooltip content={<ChartTip />} cursor={{ stroke: `${ACCENT}30`, strokeWidth: 1 }} />
                        <Line type="monotone" dataKey="amount" stroke={ACCENT} strokeWidth={2.5}
                          dot={{ r: 4, fill: ACCENT, strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: ACCENT, strokeWidth: 0, filter: `drop-shadow(0 0 6px ${ACCENT})` }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-xs"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    No trend data available
                  </div>
                )}
              </TiltCard>
            </div>

            {/* Trend summary row */}
            {trends?.length ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    label: 'Peak Month',
                    value: trends.reduce((a, b) => a.amount > b.amount ? a : b).month,
                    sub: `$${trends.reduce((a, b) => a.amount > b.amount ? a : b).amount.toLocaleString()}`,
                    color: ACCENT,
                  },
                  {
                    label: 'Lowest Month',
                    value: trends.reduce((a, b) => a.amount < b.amount ? a : b).month,
                    sub: `$${trends.reduce((a, b) => a.amount < b.amount ? a : b).amount.toLocaleString()}`,
                    color: '#34D399',
                  },
                  {
                    label: 'Monthly Avg',
                    value: `$${Math.round(trends.reduce((s, t) => s + t.amount, 0) / trends.length).toLocaleString()}`,
                    sub: `${trends.length} months of data`,
                    color: '#A78BFA',
                  },
                ].map((item, i) => (
                  <motion.div key={item.label}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="relative overflow-hidden rounded-2xl p-5"
                    style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${item.color}18` }}>
                    <div className="pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full blur-3xl"
                      style={{ background: `${item.color}18` }} />
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                      {item.label}
                    </p>
                    <p className="text-2xl font-black"
                      style={{ color: item.color, fontFamily: 'var(--ds-font-display)' }}>
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                      {item.sub}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : null}
          </motion.div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'ai' && (
          <motion.div key="ai"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            <AIRecommendations endpoint="/expense/recommendations" token={token} />
          </motion.div>
        )}

      </AnimatePresence>
    </ModuleLayout>
  )
}
