// FraudLens — Animated tabs: Overview | Risk Analysis | Flagged Alerts | AI Insights
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import {
  Shield, CheckCircle2, AlertTriangle, Eye, Scan, RefreshCw, X,
  DollarSign, Store, Clock, Copy, Cpu, Loader2, TrendingUp,
} from 'lucide-react'
import { fraudApi, ExplainResult, ExplainPoint, FraudTransaction, FraudUploadResult, RiskDistributionItem, TimelinePoint } from './services/api'
import useModuleStatus from '../../hooks/useModuleStatus'
import ModuleLayout from '../../components/module/ModuleLayout'
import PreInsightLayout from '../../components/module/PreInsightLayout'
import CsvUpload from '../../components/CsvUpload'
import AIRecommendations from '../../components/AIRecommendations'
import { useAuth } from '../../context/AuthContext'

const ACCENT = '#20D2BA'

function scoreColor(score: number) {
  if (score < 30) return '#22c594'
  if (score <= 70) return '#fbbf24'
  return '#f84646'
}
function riskColor(pct: number) {
  if (pct < 20) return '#22c594'
  if (pct <= 50) return '#fbbf24'
  return '#f84646'
}
function riskLabel(pct: number) {
  if (pct < 20) return 'LOW RISK'
  if (pct <= 50) return 'MEDIUM'
  return 'HIGH RISK'
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
            `radial-gradient(circle at ${gx}% ${gy}%, rgba(32,210,186,0.07) 0%, transparent 55%)`)
        }} />
      {children}
    </motion.div>
  )
}

/* ── Animated threat ring ─────────────────────────────────── */
function ThreatRing({ pct, color }: { pct: number; color: string }) {
  const r = 52
  const circ = 2 * Math.PI * r
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={66} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
      <motion.circle
        cx="70" cy="70" r={r} fill="none"
        stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (circ * pct) / 100 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
        transform="rotate(-90 70 70)"
        style={{ filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color}55)` }}
      />
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * 360 - 90
        const rad = (angle * Math.PI) / 180
        const x1 = 70 + (r - 2) * Math.cos(rad)
        const y1 = 70 + (r - 2) * Math.sin(rad)
        const x2 = 70 + (r - 9) * Math.cos(rad)
        const y2 = 70 + (r - 9) * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      })}
    </svg>
  )
}

/* ── Scan line animation ──────────────────────────────────── */
function ScanLines() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-30">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(32,210,186,0.4), transparent)' }}
          initial={{ top: '-1px' }}
          animate={{ top: '100%' }}
          transition={{ duration: 3, delay: i * 1.1, repeat: Infinity, repeatDelay: 0.5, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

/* ── Risk Score Badge ────────────────────────────────────── */
function RiskBadge({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score)
  const bg = label === 'Safe'
    ? 'rgba(34,197,148,0.12)'
    : label === 'Suspicious'
    ? 'rgba(251,191,36,0.12)'
    : 'rgba(248,70,70,0.12)'
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em]"
      style={{ background: bg, color, border: `1px solid ${color}30`, fontFamily: 'var(--ds-font-mono)' }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
      {label}
    </span>
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
        <p key={i} style={{ color: p.fill || p.color || p.stroke || ACCENT }}>
          {p.name}: <strong>{p.value?.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  )
}

const reveal = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.58, ease: [0.16, 1, 0.3, 1] } },
}

/* ── Explain icon map ─────────────────────────────────── */
const ICON_MAP: Record<ExplainPoint['icon'], React.ElementType> = {
  amount:    DollarSign,
  vendor:    Store,
  hours:     Clock,
  duplicate: Copy,
  model:     Cpu,
}

/* ── Explain Modal ────────────────────────────────────── */
function ExplainModal({ result, onClose }: { result: ExplainResult; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-lg overflow-hidden rounded-2xl"
          style={{
            background: 'rgb(var(--ds-bg-surface))',
            border: `1px solid ${ACCENT}22`,
            boxShadow: 'var(--ds-surface-shadow-lg)',
          }}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start justify-between p-5 pb-4"
            style={{ borderBottom: '1px solid rgb(var(--ds-border) / 0.1)' }}>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}25` }}>
                  <Eye className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: ACCENT, fontFamily: 'var(--ds-font-mono)', opacity: 0.8 }}>
                  Explainability Report
                </span>
              </div>
              <h2 className="text-base font-black" style={{ color: 'rgb(var(--ds-text-primary))', fontFamily: 'var(--ds-font-display)' }}>
                Transaction&nbsp;
                <span style={{ color: ACCENT, fontFamily: 'var(--ds-font-mono)', fontWeight: 700 }}>
                  {result.transaction_id}
                </span>
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                Amount: <strong style={{ color: '#f84646' }}>${result.amount?.toLocaleString()}</strong>
                &ensp;·&ensp;Status: <strong style={{ color: '#f84646' }}>FLAGGED</strong>
              </p>
            </div>
            <button onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
              style={{ color: 'rgb(var(--ds-text-muted))', background: 'rgb(var(--ds-bg-elevated))' }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2.5 p-5">
            {result.points.map((pt, i) => {
              const Icon = ICON_MAP[pt.icon] ?? Cpu
              const isWarning = ['amount', 'vendor', 'hours', 'duplicate'].includes(pt.icon)
              const accentCol = isWarning ? '#f84646' : ACCENT
              return (
                <motion.div key={i} className="flex gap-3 rounded-xl p-3.5"
                  style={{ background: `${accentCol}07`, border: `1px solid ${accentCol}18` }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${accentCol}12`, border: `1px solid ${accentCol}25` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: accentCol }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: accentCol, fontFamily: 'var(--ds-font-mono)' }}>
                      {pt.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'rgb(var(--ds-text-secondary))' }}>
                      {pt.detail}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
          <div className="px-5 pb-5">
            <p className="text-[10px]" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
              Explanations are statistical signals — not legal determinations. Review with your compliance team.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Animated Tab Bar ────────────────────────────────────── */
type TabId = 'overview' | 'risk' | 'alerts' | 'criteria' | 'ai'
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'risk',     label: 'Risk Analysis' },
  { id: 'alerts',   label: 'Flagged Alerts' },
  { id: 'criteria', label: 'Risk Criteria' },
  { id: 'ai',       label: 'AI Insights' },
]

function AnimatedTabBar({ active, onChange, alertCount }: {
  active: TabId; onChange: (t: TabId) => void; alertCount: number
}) {
  return (
    <div className="relative flex flex-wrap gap-1 rounded-2xl p-1"
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
              layoutId="fraud-tab-pill"
              className="absolute inset-0 rounded-xl"
              style={{ background: `${ACCENT}14`, border: `1px solid ${ACCENT}28` }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative">{t.label}</span>
          {t.id === 'alerts' && alertCount > 0 && (
            <span className="relative rounded-full px-1.5 py-0.5 text-[9px] font-black"
              style={{ background: 'rgba(248,70,70,0.15)', color: '#f84646' }}>
              {alertCount}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

type WindowRange = 7 | 14 | 30 | 'lifetime'

/* ─────────────────────────────────────────────────────────── */
/*  Main Component                                             */
/* ─────────────────────────────────────────────────────────── */
export default function FraudLens() {
  // Legacy overview state
  const [fraudCount, setFraudCount] = useState<number | null>(null)
  const [normalCount, setNormalCount] = useState<number | null>(null)
  const [fraudPct, setFraudPct] = useState<number | null>(null)
  const [alerts, setAlerts] = useState<{ id: string; type: string; score: number }[]>([])

  // New engine state
  const [uploadResult, setUploadResult] = useState<FraudUploadResult | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const [explainResult, setExplainResult] = useState<ExplainResult | null>(null)
  const [explainLoading, setExplainLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [windowDays, setWindowDays] = useState<WindowRange>(7)
  const { hasData, loading, refreshStatus } = useModuleStatus('fraud')
  const { token } = useAuth()
  const [quality, setQuality] = useState<{ score: number; label: string } | null>(null)

  const loadData = useCallback(() => {
    fraudApi.insights().then((data) => {
      // Only hydrate from legacy insights if we don't have a fresh engine result
      setFraudCount(prev => (uploadResult ? prev : data.anomalies_detected))
      setNormalCount(prev => (uploadResult ? prev : data.total_transactions - data.anomalies_detected))
      setFraudPct(prev => {
        if (uploadResult) return prev
        const pct = data.total_transactions > 0
          ? Math.round((data.anomalies_detected / data.total_transactions) * 100)
          : 0
        return pct
      })
      setAlerts(prev => (uploadResult ? prev : data.alerts.map(a => ({ id: String(a.id), type: a.type, score: a.score }))))
    }).catch(() => {})
  }, [uploadResult])

  useEffect(() => { if (hasData) loadData() }, [hasData, loadData])

  const handleFileUpload = async (file: File) => {
    setError(null)
    try {
      const data = await fraudApi.upload(file)
      // Hydrate all state from new rich response
      const s = data.summary
      setFraudCount(s.fraud_count)
      setNormalCount(s.normal_count)
      setFraudPct(Math.round(s.fraud_percentage))
      setUploadResult(data)
      // Build alerts from high-risk + suspicious transactions
      setAlerts(
        data.transactions
          .filter(t => t.risk_label !== 'Safe')
          .slice(0, 50)
          .map(t => ({ id: t.transaction_id, type: t.risk_label, score: t.risk_score / 100 }))
      )
      const dq = (data as any).data_quality_score
      const rl = (data as any).reliability_label
      if (typeof dq === 'number' && typeof rl === 'string') {
        setQuality({ score: dq, label: rl })
      } else {
        setQuality(null)
      }
      await refreshStatus()
      // Notify dashboard sidebar / other listeners that fraud alerts changed
      window.dispatchEvent(new Event('fraud:updated'))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadResult(null)
      setFraudCount(null); setNormalCount(null); setFraudPct(null)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Clear all fraud data?')) return
    setIsClearing(true)
    try {
      await fraudApi.clear()
      setUploadResult(null)
      setFraudCount(null); setNormalCount(null); setFraudPct(null)
      setAlerts([]); setError(null)
      await refreshStatus()
      // Notify listeners that fraud data has been cleared so badges can reset
      window.dispatchEvent(new Event('fraud:cleared'))
    } catch { alert('Failed to reset.') } finally { setIsClearing(false) }
  }

  const handleExplain = async (transactionId: string) => {
    setExplainLoading(transactionId)
    try {
      const result = await fraudApi.explain(transactionId)
      setExplainResult(result)
    } catch {
      // no-op
    } finally {
      setExplainLoading(null)
    }
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
        moduleTitle="Fraud Lens"
        tagline="Unmask hidden threats in your transaction data."
        bullets={[
          'Multi-criteria risk scoring per transaction',
          'Safe / Suspicious / High Risk classification',
          'Risk distribution charts and score timeline',
        ]}
        icon={Shield} accentColor={ACCENT}
        lockedMetrics={['Risk Score', 'Fraud Count', 'Safe Transactions']}
        csvColumns={['transaction_id', 'amount', 'timestamp', 'merchant_category', 'account_age_days']}
        onUpload={handleFileUpload}
      />
    </ModuleLayout>
  )

  const pct = fraudPct ?? 0
  const color = riskColor(pct)
  const total = (fraudCount ?? 0) + (normalCount ?? 0)

  // Pie data: prefer engine distribution, fall back to legacy
  const pieData: RiskDistributionItem[] = uploadResult
    ? uploadResult.chart_data.risk_distribution.filter(d => d.value > 0)
    : [
        { name: 'Safe',    value: normalCount ?? 0, color: '#22c594' },
        { name: 'Flagged', value: fraudCount  ?? 0, color: '#f84646' },
      ]

  const rawTimeline: TimelinePoint[] = uploadResult?.chart_data.timeline_series ?? []

  // Determine which dates fall into the selected rolling window. Since backend
  // already aggregates by date, we approximate "last N days" as the last N
  // distinct dates present in the dataset.
  let windowDates: Set<string> | null = null
  let timelineSeries: TimelinePoint[] = rawTimeline
  if (rawTimeline.length && typeof windowDays === 'number' && windowDays > 0) {
    const uniqueDates = Array.from(new Set(rawTimeline.map(p => p.date))).sort()
    const sliceStart = Math.max(0, uniqueDates.length - windowDays)
    const selected = uniqueDates.slice(sliceStart)
    windowDates = new Set(selected)
    timelineSeries = rawTimeline.filter(p => windowDates!.has(p.date))
  }

  const extractDate = (ts: string | null) => {
    if (!ts) return ''
    const s = ts.trim()
    const parts = s.split(/[T ]/)
    return parts[0] || s.slice(0, 10)
  }

  const inWindow = (tx: FraudTransaction) => {
    if (!windowDates || !tx.timestamp) return true
    const d = extractDate(tx.timestamp)
    return windowDates.has(d)
  }

  const highRiskTx: FraudTransaction[] = uploadResult
    ? uploadResult.transactions
        .filter(t => t.risk_label === 'High Risk' && inWindow(t))
        .slice(0, 20)
    : []

  const radarData = [
    { subject: 'Volume',     A: Math.min(100, (total / 100) * 20 + 40), fullMark: 100 },
    { subject: 'Fraud %',    A: pct,                                      fullMark: 100 },
    { subject: 'Anomaly',    A: Math.min(100, pct * 1.5 + 10),           fullMark: 100 },
    { subject: 'Pattern',    A: Math.max(10, 100 - pct * 0.8),           fullMark: 100 },
    { subject: 'Risk Score', A: uploadResult ? uploadResult.summary.average_risk_score : pct, fullMark: 100 },
  ]

  return (
    <ModuleLayout>
      {/* ── Header ────────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={reveal}
        className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}28`, boxShadow: `0 0 16px ${ACCENT}18` }}>
              <Shield className="h-4.5 w-4.5" style={{ color: ACCENT }} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full animate-pulse"
                style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{ color: ACCENT, fontFamily: 'var(--ds-font-mono)', opacity: 0.7 }}>
                Security Module
              </p>
              <h1 className="text-2xl font-black leading-tight md:text-3xl"
                style={{
                  fontFamily: 'var(--ds-font-display)',
                  background: `linear-gradient(135deg, rgb(var(--ds-text-primary)) 40%, ${ACCENT} 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                Fraud Lens
              </h1>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'rgba(108,128,162,0.8)', fontFamily: 'var(--ds-font-mono)' }}>
            Anomaly detection · Threat intelligence · Risk scoring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold"
            style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}22`, color: ACCENT, fontFamily: 'var(--ds-font-mono)', letterSpacing: '0.08em' }}>
            <Scan className="h-3 w-3" /> SCANNING ACTIVE
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
          <CsvUpload onUpload={handleFileUpload} title="Upload Transactions" description="transaction_id, amount, timestamp, merchant_category, account_age_days" />
        </div>
      </motion.div>

      {/* ── Tab Bar ───────────────────────────────────── */}
      <AnimatedTabBar active={activeTab} onChange={setActiveTab} alertCount={alerts.length} />

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(248,70,70,0.07)', border: '1px solid rgba(248,70,70,0.22)', color: '#f84646' }}>
          {error}
        </motion.div>
      )}

      {/* ── Tab Content ───────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ═══ Overview Tab ═══════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <motion.div key="overview"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6">

            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Threat gauge */}
              <div className="relative overflow-hidden rounded-2xl p-5"
                style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${color}22`, boxShadow: `0 0 30px ${color}08` }}>
                <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full blur-3xl"
                  style={{ background: `${color}20` }} />
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                  Threat Level
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative flex h-[100px] w-[100px] items-center justify-center shrink-0">
                    <ThreatRing pct={pct} color={color} />
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-black tabular-nums" style={{ color, fontFamily: 'var(--ds-font-mono)' }}>{pct}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-black" style={{ color, fontFamily: 'var(--ds-font-display)' }}>{riskLabel(pct)}</p>
                    <p className="text-xs" style={{ color: 'rgba(108,128,162,0.7)', fontFamily: 'var(--ds-font-mono)' }}>fraud detection rate</p>
                  </div>
                </div>
              </div>

              {/* High Risk count */}
              <div className="relative overflow-hidden rounded-2xl p-5"
                style={{ background: 'rgb(var(--ds-bg-surface))', border: '1px solid rgba(248,70,70,0.18)', boxShadow: '0 0 30px rgba(248,70,70,0.05)' }}>
                <ScanLines />
                <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full blur-3xl"
                  style={{ background: 'rgba(248,70,70,0.18)' }} />
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    {uploadResult ? 'High Risk' : 'Fraud Detected'}
                  </p>
                  <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#f84646' }} />
                </div>
                <p className="text-4xl font-black tabular-nums" style={{ color: '#f84646', fontFamily: 'var(--ds-font-display)' }}>
                  {(uploadResult ? uploadResult.summary.high_risk_count : (fraudCount ?? 0)).toLocaleString()}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'rgba(108,128,162,0.65)', fontFamily: 'var(--ds-font-mono)' }}>
                  {uploadResult ? 'high risk transactions' : 'anomalous transactions'}
                </p>
              </div>

              {/* Safe count */}
              <div className="relative overflow-hidden rounded-2xl p-5"
                style={{ background: 'rgb(var(--ds-bg-surface))', border: '1px solid rgba(34,197,148,0.18)', boxShadow: '0 0 30px rgba(34,197,148,0.05)' }}>
                <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full blur-3xl"
                  style={{ background: 'rgba(34,197,148,0.15)' }} />
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>Clean Transactions</p>
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#22c594' }} />
                </div>
                <p className="text-4xl font-black tabular-nums" style={{ color: '#22c594', fontFamily: 'var(--ds-font-display)' }}>
                  {(uploadResult ? uploadResult.summary.safe_count : (normalCount ?? 0)).toLocaleString()}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'rgba(108,128,162,0.65)', fontFamily: 'var(--ds-font-mono)' }}>verified safe</p>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Risk Distribution Pie */}
              <TiltCard className="relative overflow-hidden rounded-2xl p-6"
                style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}12`, boxShadow: 'var(--ds-card-shadow)' }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-3xl"
                  style={{ background: `${ACCENT}06` }} />
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                  RISK DISTRIBUTION
                </p>
                {pieData.length ? (
                  <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                    <div className="h-52 w-full sm:w-56 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                            innerRadius={55} outerRadius={85} paddingAngle={4} strokeWidth={0}>
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2.5 w-full">
                      {pieData.map((item) => (
                        <div key={item.name} className="rounded-xl p-3"
                          style={{ background: `${item.color}07`, border: `1px solid ${item.color}18` }}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                              <span className="text-xs font-semibold" style={{ color: 'rgb(var(--ds-text-secondary))' }}>{item.name}</span>
                            </div>
                            <span className="text-sm font-black tabular-nums" style={{ color: item.color, fontFamily: 'var(--ds-font-mono)' }}>
                              {item.value.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full" style={{ background: 'rgb(var(--ds-border) / 0.1)' }}>
                            <motion.div className="h-full rounded-full"
                              style={{ background: item.color, boxShadow: `0 0 6px ${item.color}50` }}
                              initial={{ width: 0 }}
                              animate={{ width: total > 0 ? `${Math.round((item.value / total) * 100)}%` : '0%' }}
                              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-52 items-center justify-center text-xs"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    No distribution data
                  </div>
                )}
              </TiltCard>

              {/* Threat Profile Radar */}
              <TiltCard className="relative overflow-hidden rounded-2xl p-6"
                style={{ background: 'rgb(var(--ds-bg-surface))', border: 'solid 1px rgba(248,70,70,0.1)', boxShadow: 'var(--ds-card-shadow)' }}>
                <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full blur-3xl"
                  style={{ background: 'rgba(248,70,70,0.06)' }} />
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                  THREAT PROFILE ANALYSIS
                </p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius={75}>
                      <PolarGrid stroke="rgb(var(--ds-border) / 0.1)" />
                      <PolarAngleAxis dataKey="subject"
                        tick={{ fontSize: 10, fontFamily: 'var(--ds-font-mono)', fill: 'rgb(var(--ds-text-muted))' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]}
                        tick={{ fontSize: 9, fill: 'rgb(var(--ds-text-muted))' }} />
                      <Radar name="Threat" dataKey="A" stroke={color} fill={color} fillOpacity={0.12} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </TiltCard>
            </div>

            {/* Analysis Summary */}
            <div className="relative overflow-hidden rounded-2xl p-6"
              style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${color}15`, boxShadow: 'var(--ds-card-shadow)' }}>
              <ScanLines />
              <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full blur-3xl"
                style={{ background: `${color}06` }} />
              <div className="mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4" style={{ color: ACCENT }} />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                  ANALYSIS SUMMARY
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: 'Total Scanned',    value: total.toLocaleString(), color: ACCENT },
                  { label: 'Fraud Rate',        value: `${pct}%`, color },
                  { label: 'High Risk',         value: (uploadResult?.summary.high_risk_count ?? fraudCount ?? 0).toLocaleString(), color: '#f84646' },
                  { label: 'Avg Risk Score',    value: uploadResult ? `${uploadResult.summary.average_risk_score}` : riskLabel(pct).split(' ')[0], color },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-3.5"
                    style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.08)' }}>
                    <p className="mb-1 text-[10px] uppercase tracking-[0.1em]"
                      style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                      {item.label}
                    </p>
                    <p className="text-xl font-black tabular-nums"
                      style={{ color: item.color, fontFamily: 'var(--ds-font-display)' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ Risk Analysis Tab ═══════════════════════════════════════════ */}
        {activeTab === 'risk' && (
          <motion.div key="risk"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6">

            {/* Risk Score Timeline */}
            <div className="relative overflow-hidden rounded-2xl p-6"
              style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}12`, boxShadow: 'var(--ds-card-shadow)' }}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: ACCENT }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    RISK SCORE TIMELINE
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full px-1.5 py-0.5"
                  style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.15)' }}>
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setWindowDays(d as WindowRange)}
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        fontFamily: 'var(--ds-font-mono)',
                        background: windowDays === d ? 'rgba(32,210,186,0.16)' : 'transparent',
                        color: windowDays === d ? '#20D2BA' : 'rgb(var(--ds-text-muted))',
                        border: windowDays === d ? '1px solid rgba(32,210,186,0.45)' : '1px solid transparent',
                      }}
                    >
                      {d}d
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWindowDays('lifetime')}
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      fontFamily: 'var(--ds-font-mono)',
                      background: windowDays === 'lifetime' ? 'rgba(32,210,186,0.16)' : 'transparent',
                      color: windowDays === 'lifetime' ? '#20D2BA' : 'rgb(var(--ds-text-muted))',
                      border: windowDays === 'lifetime' ? '1px solid rgba(32,210,186,0.45)' : '1px solid transparent',
                    }}
                  >
                    Lifetime
                  </button>
                </div>
              </div>
              {timelineSeries.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineSeries} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }} />
                      <YAxis tick={{ fontSize: 9, fill: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }} />
                      <Tooltip content={<ChartTip />} />
                      <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'var(--ds-font-mono)', paddingTop: '12px' }} />
                      <Line type="monotone" dataKey="safe" name="Safe" stroke="#22c594" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="suspicious" name="Suspicious" stroke="#fbbf24" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="high_risk" name="High Risk" stroke="#f84646" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-xs"
                  style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                  Upload a CSV with a timestamp column to see the timeline
                </div>
              )}
            </div>

            {/* High Risk Transactions Table */}
            <div className="relative overflow-hidden rounded-2xl p-6"
              style={{ background: 'rgb(var(--ds-bg-surface))', border: '1px solid rgba(248,70,70,0.12)', boxShadow: 'var(--ds-card-shadow)' }}>
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" style={{ color: '#f84646' }} />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                  HIGH-RISK TRANSACTIONS
                </p>
                <span className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold"
                  style={{ background: 'rgba(248,70,70,0.1)', color: '#f84646', fontFamily: 'var(--ds-font-mono)' }}>
                  {highRiskTx.length} flagged
                </span>
              </div>
              {highRiskTx.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ fontFamily: 'var(--ds-font-mono)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgb(var(--ds-border) / 0.1)' }}>
                        {['Transaction ID', 'Amount', 'Category', 'Risk Score', 'Label', 'Action'].map(h => (
                          <th key={h} className="pb-2 pr-4 text-left font-semibold"
                            style={{ color: 'rgb(var(--ds-text-muted))' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {highRiskTx.map((tx, i) => (
                        <motion.tr key={tx.transaction_id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          style={{ borderBottom: '1px solid rgb(var(--ds-border) / 0.06)' }}>
                          <td className="py-2.5 pr-4 font-medium" style={{ color: ACCENT }}>{tx.transaction_id}</td>
                          <td className="py-2.5 pr-4 font-black tabular-nums" style={{ color: '#f84646' }}>
                            ${tx.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 pr-4" style={{ color: 'rgb(var(--ds-text-secondary))' }}>
                            {tx.merchant_category || '—'}
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: 'rgb(var(--ds-border) / 0.12)' }}>
                                <div className="h-full rounded-full" style={{ width: `${tx.risk_score}%`, background: scoreColor(tx.risk_score) }} />
                              </div>
                              <span className="font-black tabular-nums" style={{ color: scoreColor(tx.risk_score) }}>
                                {tx.risk_score}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <RiskBadge label={tx.risk_label} score={tx.risk_score} />
                          </td>
                          <td className="py-2.5">
                            <motion.button
                              onClick={() => handleExplain(tx.transaction_id)}
                              disabled={explainLoading === tx.transaction_id}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] disabled:opacity-60"
                              style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25`, color: ACCENT }}
                              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                              {explainLoading === tx.transaction_id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Eye className="h-3 w-3" />}
                              Explain
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-xs"
                  style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                  No high-risk transactions detected
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ Flagged Alerts Tab ══════════════════════════════════════════ */}
        {activeTab === 'alerts' && (
          <motion.div key="alerts"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            {alerts.length > 0 ? (
              <div className="relative overflow-hidden rounded-2xl p-6"
                style={{ background: 'rgb(var(--ds-bg-surface))', border: '1px solid rgba(248,70,70,0.12)', boxShadow: 'var(--ds-card-shadow)' }}>
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" style={{ color: '#f84646' }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    FLAGGED TRANSACTIONS
                  </p>
                  <span className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold"
                    style={{ background: 'rgba(248,70,70,0.1)', color: '#f84646', fontFamily: 'var(--ds-font-mono)' }}>
                    {alerts.length} flagged
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ fontFamily: 'var(--ds-font-mono)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgb(var(--ds-border) / 0.1)' }}>
                        {['Transaction ID', 'Classification', 'Risk Score', 'Action'].map(h => (
                          <th key={h} className="pb-2 pr-4 text-left font-semibold"
                            style={{ color: 'rgb(var(--ds-text-muted))' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.map((alert, i) => {
                        const score100 = Math.round(alert.score * 100)
                        const label = score100 > 70 ? 'High Risk' : score100 > 30 ? 'Suspicious' : 'Safe'
                        return (
                          <motion.tr key={alert.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            style={{ borderBottom: '1px solid rgb(var(--ds-border) / 0.06)' }}>
                            <td className="py-2.5 pr-4 font-medium" style={{ color: ACCENT }}>{alert.id}</td>
                            <td className="py-2.5 pr-4">
                              <RiskBadge label={label} score={score100} />
                            </td>
                            <td className="py-2.5 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: 'rgb(var(--ds-border) / 0.12)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${score100}%`, background: scoreColor(score100) }} />
                                </div>
                                <span className="font-black" style={{ color: scoreColor(score100) }}>{score100}</span>
                              </div>
                            </td>
                            <td className="py-2.5">
                              <motion.button
                                onClick={() => handleExplain(alert.id)}
                                disabled={explainLoading === alert.id}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] disabled:opacity-60"
                                style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25`, color: ACCENT }}
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                                {explainLoading === alert.id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <Eye className="h-3 w-3" />}
                                Explain
                              </motion.button>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-2xl"
                style={{ background: 'rgb(var(--ds-bg-surface))', border: '1px solid rgba(248,70,70,0.1)' }}>
                <p className="text-sm" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                  No flagged transactions
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ Risk Criteria Tab ═══════════════════════════════════════════ */}
        {activeTab === 'criteria' && (
          <motion.div key="criteria"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl p-6"
              style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}18`, boxShadow: 'var(--ds-card-shadow)' }}>
              <ScanLines />
              <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full blur-3xl"
                style={{ background: `${ACCENT}06` }} />
              <div className="mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" style={{ color: ACCENT }} />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                  HOW FRAUD LENS FLAGS TRANSACTIONS
                </p>
              </div>
              <p className="mb-4 text-xs leading-relaxed"
                style={{ color: 'rgb(var(--ds-text-secondary))', fontFamily: 'var(--ds-font-mono)' }}>
                Every transaction receives a 0–100 risk score. Scores under 30 are treated as <span style={{ color: '#22c594', fontWeight: 700 }}>Safe</span>,
                30–69 as <span style={{ color: '#fbbf24', fontWeight: 700 }}>Suspicious</span>, and 70+ as <span style={{ color: '#f84646', fontWeight: 700 }}>High Risk</span>.
                Any Suspicious or High Risk transaction is considered flagged.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.12)' }}>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    Amount anomaly
                  </p>
                  <p className="mb-1 text-xs font-semibold"
                    style={{ color: 'rgb(var(--ds-text-primary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Up to 25 points
                  </p>
                  <p className="text-xs leading-relaxed"
                    style={{ color: 'rgb(var(--ds-text-secondary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Compares each amount to the customer&apos;s recent average. 3×+ average gets the highest score,
                    2×–3× medium, 1.5×–2× low. With no history, very large absolute amounts (over 50k) are treated as risky.
                  </p>
                </div>
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.12)' }}>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    Velocity (burst activity)
                  </p>
                  <p className="mb-1 text-xs font-semibold"
                    style={{ color: 'rgb(var(--ds-text-primary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Up to 20 points
                  </p>
                  <p className="text-xs leading-relaxed"
                    style={{ color: 'rgb(var(--ds-text-secondary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Counts how many transactions occur within a ±10 minute window. 5+ in that window scores highest,
                    3–4 adds a medium bump, fewer have no velocity impact.
                  </p>
                </div>
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.12)' }}>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    Merchant category risk
                  </p>
                  <p className="mb-1 text-xs font-semibold"
                    style={{ color: 'rgb(var(--ds-text-primary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Up to 15 points
                  </p>
                  <p className="text-xs leading-relaxed"
                    style={{ color: 'rgb(var(--ds-text-secondary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Categories such as gambling, crypto, gift cards, prepaid, and wire transfers are treated as
                    inherently higher risk and add extra score when present.
                  </p>
                </div>
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.12)' }}>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    Time-of-day anomaly
                  </p>
                  <p className="mb-1 text-xs font-semibold"
                    style={{ color: 'rgb(var(--ds-text-primary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Up to 10 points
                  </p>
                  <p className="text-xs leading-relaxed"
                    style={{ color: 'rgb(var(--ds-text-secondary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Transactions between midnight and 5 AM are considered higher risk and receive an additional bump
                    in their score when timestamps are available.
                  </p>
                </div>
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.12)' }}>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    Account age vs. amount
                  </p>
                  <p className="mb-1 text-xs font-semibold"
                    style={{ color: 'rgb(var(--ds-text-primary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Up to 15 points
                  </p>
                  <p className="text-xs leading-relaxed"
                    style={{ color: 'rgb(var(--ds-text-secondary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Very new accounts that immediately see large payments get penalized. Under 7 days with large
                    amounts scores highest, under 30 days with very large amounts adds a medium penalty.
                  </p>
                </div>
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.12)' }}>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                    Structuring around 50k
                  </p>
                  <p className="mb-1 text-xs font-semibold"
                    style={{ color: 'rgb(var(--ds-text-primary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Up to 15 points
                  </p>
                  <p className="text-xs leading-relaxed"
                    style={{ color: 'rgb(var(--ds-text-secondary))', fontFamily: 'var(--ds-font-mono)' }}>
                    Looks for several similar amounts clustered near the 50k reporting threshold. When 3+ similar
                    payments occur close to that level, they are treated as potential structuring behavior.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[10px]"
                style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>
                Fraud Lens is a rule-based demo engine. Scores are deterministic and should be used for training,
                experimentation, and storytelling — not as a replacement for production fraud systems.
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══ AI Insights Tab ═════════════════════════════════════════════ */}
        {activeTab === 'ai' && (
          <motion.div key="ai"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            <AIRecommendations endpoint="/fraud/recommendations" token={token} />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Explain Modal */}
      {explainResult && (
        <ExplainModal result={explainResult} onClose={() => setExplainResult(null)} />
      )}
    </ModuleLayout>
  )
}
