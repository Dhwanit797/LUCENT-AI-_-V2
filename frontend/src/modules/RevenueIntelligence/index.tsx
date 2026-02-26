import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Activity, Shield } from 'lucide-react'
import ModuleLayout from '../../components/module/ModuleLayout'
import { analytics } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

type RevenueInsight = Awaited<ReturnType<typeof analytics.revenueIntelligence>>
type RiskInsight = Awaited<ReturnType<typeof analytics.unifiedRisk>>

const ACCENT = '#38BDF8'

export default function RevenueIntelligence() {
  const { token } = useAuth()
  const [revenue, setRevenue] = useState<RevenueInsight | null>(null)
  const [risk, setRisk] = useState<RiskInsight | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [rev, uri] = await Promise.all([
          analytics.revenueIntelligence(),
          analytics.unifiedRisk(),
        ])
        if (!mounted) return
        setRevenue(rev)
        setRisk(uri)
      } catch (e) {
        if (!mounted) return
        setError((e as Error).message || 'Failed to load revenue intelligence')
      }
    }
    if (token) load()
    return () => {
      mounted = false
    }
  }, [token])

  const momentum = revenue?.revenue_momentum_index ?? 0
  const sustainability = revenue?.sustainability_score ?? 0

  const growthColor =
    sustainability >= 75 ? '#22c594' : sustainability >= 55 ? '#fbbf24' : '#f84646'
  const uriColor =
    (risk?.unified_risk_index ?? 0) < 40
      ? '#22c594'
      : (risk?.unified_risk_index ?? 0) < 70
      ? '#fbbf24'
      : '#f84646'

  return (
    <ModuleLayout>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: `${ACCENT}10`,
                border: `1px solid ${ACCENT}28`,
                boxShadow: `0 0 16px ${ACCENT}18`,
              }}
            >
              <TrendingUp className="h-4 w-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <p
                className="text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{
                  color: ACCENT,
                  fontFamily: 'var(--ds-font-mono)',
                  opacity: 0.7,
                }}
              >
                Revenue Module
              </p>
              <h1
                className="text-2xl font-black leading-tight md:text-3xl"
                style={{
                  fontFamily: 'var(--ds-font-display)',
                  background: `linear-gradient(135deg, rgb(var(--ds-text-primary)) 40%, ${ACCENT} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Revenue Intelligence
              </h1>
            </div>
          </div>
          <p
            className="text-xs"
            style={{
              color: 'rgba(108,128,162,0.8)',
              fontFamily: 'var(--ds-font-mono)',
            }}
          >
            Momentum · Sustainability · Unified risk
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold"
            style={{
              background: `${ACCENT}10`,
              border: `1px solid ${ACCENT}22`,
              color: ACCENT,
              fontFamily: 'var(--ds-font-mono)',
              letterSpacing: '0.08em',
            }}
          >
            <Activity className="h-3 w-3" /> LIVE ANALYSIS
          </span>
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'rgba(248,70,70,0.07)',
            border: '1px solid rgba(248,70,70,0.22)',
            color: '#f84646',
          }}
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Momentum gauge */}
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: 'rgb(var(--ds-bg-surface))',
            border: `1px solid ${ACCENT}20`,
            boxShadow: 'var(--ds-card-shadow)',
          }}
        >
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em]"
            style={{
              color: 'rgb(var(--ds-text-muted))',
              fontFamily: 'var(--ds-font-mono)',
            }}
          >
            Revenue Momentum
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span
              className="text-3xl font-black tabular-nums"
              style={{ color: ACCENT, fontFamily: 'var(--ds-font-display)' }}
            >
              {momentum.toFixed(1)}
            </span>
            <span
              className="text-xs"
              style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}
            >
              / 100
            </span>
          </div>
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: 'rgb(var(--ds-border) / 0.12)' }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, momentum)}%` }}
              transition={{ duration: 0.7 }}
              style={{
                background: 'linear-gradient(90deg,#38BDF8,#22c594)',
                boxShadow: '0 0 10px rgba(56,189,248,0.5)',
              }}
            />
          </div>
        </div>

        {/* Sustainability */}
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: 'rgb(var(--ds-bg-surface))',
            border: `1px solid ${growthColor}30`,
            boxShadow: 'var(--ds-card-shadow)',
          }}
        >
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em]"
            style={{
              color: 'rgb(var(--ds-text-muted))',
              fontFamily: 'var(--ds-font-mono)',
            }}
          >
            Sustainability Score
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span
              className="text-3xl font-black tabular-nums"
              style={{ color: growthColor, fontFamily: 'var(--ds-font-display)' }}
            >
              {sustainability.toFixed(1)}
            </span>
            <span
              className="text-xs"
              style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}
            >
              / 100
            </span>
          </div>
          <p
            className="mt-1 text-xs"
            style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}
          >
            {revenue?.growth_risk_flag ? 'Growth at risk' : 'Momentum is sustainable'}
          </p>
        </div>

        {/* Unified risk card */}
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: 'rgb(var(--ds-bg-surface))',
            border: `1px solid ${uriColor}30`,
            boxShadow: 'var(--ds-card-shadow)',
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.13em]"
              style={{
                color: 'rgb(var(--ds-text-muted))',
                fontFamily: 'var(--ds-font-mono)',
              }}
            >
              Unified Risk Index
            </p>
            <Shield className="h-4 w-4" style={{ color: uriColor }} />
          </div>
          <div className="mt-1 flex items-end gap-2">
            <span
              className="text-3xl font-black tabular-nums"
              style={{ color: uriColor, fontFamily: 'var(--ds-font-display)' }}
            >
              {(risk?.unified_risk_index ?? 0).toFixed(1)}
            </span>
            <span
              className="text-xs"
              style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}
            >
              / 100
            </span>
          </div>
          <p
            className="mt-1 text-xs"
            style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}
          >
            Trend: {risk?.trend_direction ?? 'flat'} · Volatility:{' '}
            {(risk?.volatility_score ?? 0).toFixed(1)} · Confidence:{' '}
            {(risk?.confidence_percentage ?? 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Forecast strip (minimal, numeric) */}
      <div className="rounded-2xl border px-4 py-3 text-xs"
        style={{
          background: 'rgb(var(--ds-bg-surface))',
          borderColor: 'rgb(var(--ds-border) / 0.16)',
        }}
      >
        <p
          className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em]"
          style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}
        >
          Forecast (30 / 60 / 90 days)
        </p>
        {revenue?.forecast_data?.points?.length ? (
          <div className="flex flex-wrap gap-4">
            {revenue.forecast_data.points.map((p, i) => (
              <div key={p.step} className="rounded-xl px-3 py-2"
                style={{
                  background: 'rgb(var(--ds-bg-elevated))',
                  border: '1px solid rgb(var(--ds-border) / 0.12)',
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.13em]"
                  style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}
                >
                  {revenue.forecast_data.horizon_days?.[i] ?? p.step * 30} days
                </p>
                <p
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: 'rgb(var(--ds-text-primary))' }}
                >
                  {p.value.toFixed(0)}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}
                >
                  Band: {p.lower.toFixed(0)} – {p.upper.toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              color: 'rgb(var(--ds-text-muted))',
              fontFamily: 'var(--ds-font-mono)',
            }}
          >
            Not enough history to forecast yet.
          </p>
        )}
      </div>
    </ModuleLayout>
  )
}

