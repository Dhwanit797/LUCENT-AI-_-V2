import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Package, CheckCircle2, AlertCircle, TrendingUp, Box } from 'lucide-react'
import { inventoryApi } from './services/api'
import useModuleStatus from '../../hooks/useModuleStatus'
import ModuleLayout from '../../components/module/ModuleLayout'
import PreInsightLayout from '../../components/module/PreInsightLayout'
import CsvUpload from '../../components/CsvUpload'
import AIRecommendations from '../../components/AIRecommendations'
import { useAuth } from '../../context/AuthContext'

const ACCENT = '#34D399'

function TiltCard({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0); const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 400, damping: 40 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 400, damping: 40 })
  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }, [x, y])
  return (
    <motion.div ref={ref} style={{ rotateX, rotateY, transformStyle: 'preserve-3d', ...style }}
      onMouseMove={handleMove} onMouseLeave={() => { x.set(0); y.set(0) }} className={className}>
      {children}
    </motion.div>
  )
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs" style={{
      background: 'rgb(var(--ds-bg-surface))',
      border: `1px solid ${ACCENT}35`,
      color: 'rgb(var(--ds-text-primary))',
      fontFamily: 'var(--ds-font-mono)',
      boxShadow: 'var(--ds-surface-shadow)',
    }}>
      {label && <p className="mb-1" style={{ color: 'rgb(var(--ds-text-muted))' }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: ACCENT }}>
          <span style={{ color: 'rgb(var(--ds-text-muted))' }}>{p.name}: </span>
          <strong style={{ color: ACCENT }}>{p.value?.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  )
}

const unlockVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

export default function SmartInventory() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof inventoryApi.summary>> | null>(null)
  const [forecast, setForecast] = useState<Awaited<ReturnType<typeof inventoryApi.forecast>> | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const { hasData, loading, refreshStatus } = useModuleStatus('inventory')
  const { token } = useAuth()
  const [quality, setQuality] = useState<{ score: number; label: string } | null>(null)

  const loadData = () => {
    inventoryApi.summary().then(setSummary).catch(() => setSummary(null))
    inventoryApi.forecast().then(setForecast).catch(() => setForecast(null))
  }

  useEffect(() => { if (hasData) loadData() }, [hasData])

  const handleFileUpload = async (file: File) => {
    const res = await inventoryApi.upload(file)
    const dq = (res as any).data_quality_score
    const rl = (res as any).reliability_label
    if (typeof dq === 'number' && typeof rl === 'string') {
      setQuality({ score: dq, label: rl })
    } else {
      setQuality(null)
    }
    if (res.success) { await refreshStatus(); loadData(); return res }
    throw new Error('Upload failed')
  }

  const handleClearAll = async () => {
    if (!window.confirm('Clear all inventory data and start fresh?')) return
    setIsClearing(true)
    try {
      await inventoryApi.clear()
      setSummary(null); setForecast(null)
      await refreshStatus()
    } catch { alert('Failed to reset.') } finally { setIsClearing(false) }
  }

  if (loading) return (
    <ModuleLayout>
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: ACCENT }} />
      </div>
    </ModuleLayout>
  )

  if (!hasData) return (
    <ModuleLayout>
      <PreInsightLayout
        moduleTitle="Smart Inventory"
        tagline="Predict demand and optimize stock levels with intelligence."
        bullets={['Real-time stock level monitoring across items', 'AI-driven reorder suggestion engine', 'Weekly demand forecasting and predictions']}
        icon={Package} accentColor={ACCENT}
        lockedMetrics={['Stock Items', 'Low Stock Count', 'Forecast Weeks']}
          csvColumns={['item_name', 'category', 'quantity', 'price']}
        onUpload={handleFileUpload}
        successMessage={(res) => `Successfully added ${res.records_added} records`}
      />
    </ModuleLayout>
  )

  return (
    <ModuleLayout>
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={unlockVariants} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, boxShadow: `0 0 12px ${ACCENT}20` }}>
              <Package className="h-4 w-4" style={{ color: ACCENT }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: ACCENT, fontFamily: 'var(--ds-font-mono)', opacity: 0.8 }}>Inventory Module</span>
          </div>
          <h1 className="text-2xl font-black md:text-3xl" style={{ fontFamily: 'var(--ds-font-display)', background: `linear-gradient(135deg, rgb(var(--ds-text-primary)), ${ACCENT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Smart Inventory AI
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>Stock intelligence · Demand forecasting</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasData && (
            <button onClick={handleClearAll} disabled={isClearing}
              className="rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-all disabled:opacity-50"
              style={{ border: '1px solid rgba(248,70,70,0.25)', color: 'rgba(248,70,70,0.8)', fontFamily: 'var(--ds-font-mono)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,70,70,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              {isClearing ? 'Clearing...' : 'Reset Analysis'}
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`, color: ACCENT, fontFamily: 'var(--ds-font-mono)', letterSpacing: '0.08em' }}>
            <CheckCircle2 className="h-3 w-3" /> TRACKING ACTIVE
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
          <CsvUpload onUpload={handleFileUpload} title="Upload Inventory CSV" description="Bulk upload inventory records" successMessage={(res) => `Added ${res.records_added} records`} />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="visible" variants={unlockVariants} transition={{ delay: 0.1 }} className="grid gap-4 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}20`, boxShadow: 'var(--ds-card-shadow)' }}>
          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl" style={{ background: `${ACCENT}20` }} />
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>Total Items</p>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5" style={{ color: ACCENT }} />
            <span className="text-3xl font-black" style={{ color: ACCENT, fontFamily: 'var(--ds-font-display)' }}>{summary?.items?.length ?? 0}</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>SKUs tracked</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'rgb(var(--ds-bg-surface))', border: '1px solid rgba(251,191,36,0.2)', boxShadow: 'var(--ds-card-shadow)' }}>
          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl" style={{ background: 'rgba(251,191,36,0.2)' }} />
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>Low Stock</p>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" style={{ color: '#fbbf24' }} />
            <span className="text-3xl font-black" style={{ color: '#fbbf24', fontFamily: 'var(--ds-font-display)' }}>{summary?.low_stock_count ?? 0}</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>items need reorder</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'rgb(var(--ds-bg-surface))', border: '1px solid rgba(0,212,255,0.15)', boxShadow: 'var(--ds-card-shadow)' }}>
          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl" style={{ background: 'rgba(0,212,255,0.15)' }} />
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>Forecast Weeks</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: '#00D4FF' }} />
            <span className="text-3xl font-black" style={{ color: '#00D4FF', fontFamily: 'var(--ds-font-display)' }}>{forecast?.length ?? 0}</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>weeks projected</p>
        </div>
      </motion.div>

      {/* Stock Levels + Suggestions */}
      <motion.div initial="hidden" animate="visible" variants={unlockVariants} transition={{ delay: 0.2 }} className="grid gap-6 lg:grid-cols-2">
        {/* Stock items */}
        <TiltCard
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}15`, boxShadow: 'var(--ds-card-shadow)' }}
        >
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>STOCK LEVELS</p>
          {summary?.items ? (
            <div className="inv-scroll space-y-2.5 max-h-64 overflow-y-auto pr-2">
              {summary.items.map((item, i) => {
                const isLow = item.stock < item.reorder_at
                const pct = Math.min(100, (item.stock / (item.reorder_at * 3)) * 100)
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="rounded-xl p-3"
                    style={{
                      background: isLow ? 'rgba(251,191,36,0.06)' : 'rgb(var(--ds-bg-elevated))',
                      border: `1px solid ${isLow ? 'rgba(251,191,36,0.2)' : 'rgb(var(--ds-border) / 0.08)'}`,
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: 'rgb(var(--ds-text-primary))' }}>{item.name}</span>
                      <span className="text-xs font-bold" style={{ color: isLow ? '#fbbf24' : ACCENT, fontFamily: 'var(--ds-font-mono)' }}>
                        {item.stock} / {item.reorder_at}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgb(var(--ds-border) / 0.1)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: isLow ? '#fbbf24' : ACCENT, boxShadow: `0 0 6px ${isLow ? '#fbbf24' : ACCENT}60` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>Loading stock data…</p>
          )}
        </TiltCard>

        {/* Reorder suggestions */}
        <TiltCard
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: 'rgb(var(--ds-bg-surface))', border: '1px solid rgba(251,191,36,0.12)', boxShadow: 'var(--ds-card-shadow)' }}
        >
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>REORDER SUGGESTIONS</p>
          {summary?.suggestions?.length ? (
            <div className="space-y-2">
              {summary.suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.06 }}
                  className="flex items-start gap-2.5 rounded-xl p-3"
                  style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)' }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#fbbf24' }} />
                  <span className="text-sm" style={{ color: 'rgb(var(--ds-text-secondary))' }}>{s}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center flex-col gap-2">
              <CheckCircle2 className="h-8 w-8 opacity-30" style={{ color: ACCENT }} />
              <p className="text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>No reorder needed</p>
            </div>
          )}
        </TiltCard>
      </motion.div>

      {/* Forecast chart — NO TiltCard wrapper (prevents recharts hover glitch) */}
      <motion.div initial="hidden" animate="visible" variants={unlockVariants} transition={{ delay: 0.3 }}>
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: 'rgb(var(--ds-bg-surface))', border: `1px solid ${ACCENT}12`, boxShadow: 'var(--ds-card-shadow)' }}
        >
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>DEMAND FORECAST (NEXT WEEKS)</p>
          {forecast?.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecast} barSize={28} style={{ cursor: 'default' }}>
                  <defs>
                    <linearGradient id="invBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={ACCENT} stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="transparent" tick={{ fontSize: 11, fontFamily: 'var(--ds-font-mono)', fill: 'rgb(var(--ds-text-muted))' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="transparent" tick={{ fontSize: 11, fontFamily: 'var(--ds-font-mono)', fill: 'rgb(var(--ds-text-muted))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: 'rgb(var(--ds-bg-elevated))', radius: 4 }}
                      isAnimationActive={false}
                      wrapperStyle={{ pointerEvents: 'none', zIndex: 50 }}
                    />
                  <Bar dataKey="predicted_stock" name="Predicted stock" fill="url(#invBar)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}>Loading forecast…</p>
          )}
        </div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={unlockVariants} transition={{ delay: 0.4 }}>
        <AIRecommendations endpoint="/inventory/recommendations" token={token} />
      </motion.div>
    </ModuleLayout>
  )
}
