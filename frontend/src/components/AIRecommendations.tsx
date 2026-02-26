import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, CheckCircle, Sparkles, RefreshCw } from 'lucide-react'

export interface Recommendation {
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
}

interface Props {
  endpoint: string         // e.g. '/fraud/recommendations'
  token: string | null
}

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    bg: 'rgba(248,70,70,0.1)',
    border: 'rgba(248,70,70,0.25)',
    badge: 'rgba(248,70,70,0.15)',
    badgeText: '#f84646',
    dot: '#f84646',
  },
  high: {
    label: 'High',
    icon: AlertCircle,
    bg: 'rgba(251,191,36,0.07)',
    border: 'rgba(251,191,36,0.22)',
    badge: 'rgba(251,191,36,0.12)',
    badgeText: '#fbbf24',
    dot: '#fbbf24',
  },
  medium: {
    label: 'Medium',
    icon: Info,
    bg: 'rgba(0,212,255,0.06)',
    border: 'rgba(0,212,255,0.18)',
    badge: 'rgba(0,212,255,0.1)',
    badgeText: '#00d4ff',
    dot: '#00d4ff',
  },
  low: {
    label: 'Low',
    icon: CheckCircle,
    bg: 'rgba(34,197,148,0.06)',
    border: 'rgba(34,197,148,0.18)',
    badge: 'rgba(34,197,148,0.1)',
    badgeText: '#22c594',
    dot: '#22c594',
  },
}

async function fetchRecs(endpoint: string, token: string): Promise<Recommendation[]> {
  const res = await fetch(`${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function AIRecommendations({ endpoint, token }: Props) {
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchRecs(endpoint, token)
      setRecs(data)
    } catch (e) {
      setError('Could not load recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [endpoint, token])

  // Hide section entirely if empty and not loading
  if (!loading && !error && recs.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mt-6"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
          >
            <Sparkles className="h-4 w-4" style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ds-text-primary" style={{ fontFamily: 'var(--ds-font-display)' }}>
              AI Recommendations
            </h2>
            <p className="text-xs" style={{ color: 'rgb(var(--ds-text-muted))' }}>
              Rule-based insights for your data
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-ds-bg-surface disabled:opacity-40"
          style={{ color: 'rgb(var(--ds-text-muted))' }}
          title="Refresh recommendations"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ background: 'rgba(248,70,70,0.06)', border: '1px solid rgba(248,70,70,0.2)', color: '#f84646' }}
        >
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl"
              style={{ background: 'rgb(var(--ds-bg-surface))' }}
            />
          ))}
        </div>
      )}

      {/* Recommendation cards */}
      <AnimatePresence>
        {!loading && !error && recs.length > 0 && (
          <div className="space-y-3">
            {recs.map((rec, i) => {
              const cfg = SEVERITY_CONFIG[rec.severity] ?? SEVERITY_CONFIG.low
              const Icon = cfg.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative overflow-hidden rounded-xl p-4"
                  style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  {/* Left accent bar */}
                  <div
                    className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
                    style={{ background: cfg.dot }}
                  />
                  <div className="ml-2 flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: cfg.badge }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: cfg.badgeText }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-ds-text-primary" style={{ fontFamily: 'var(--ds-font-display)' }}>
                          {rec.title}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{
                            background: cfg.badge,
                            color: cfg.badgeText,
                            fontFamily: 'var(--ds-font-mono)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--ds-text-secondary))' }}>
                        {rec.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
