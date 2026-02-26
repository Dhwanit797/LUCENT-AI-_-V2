import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

type SimulationParams = {
  sales_growth_multiplier: number
  expense_growth_multiplier: number
  fraud_sensitivity: number
  supplier_delay_factor: number
  reorder_threshold_multiplier: number
}

type SimulationResult = {
  new_health_score: number
  delta_from_base: number
  projected_cash: number
  risk_index: number
  revenue_forecast: { period: string; value: number }[]
  explanation_summary: string
  metadata: {
    base_health_score: number
    base_expense_total: number
    fraud_rate_percent: number
  }
}

const DEFAULT_PARAMS: SimulationParams = {
  sales_growth_multiplier: 1.0,
  expense_growth_multiplier: 1.0,
  fraud_sensitivity: 1.0,
  supplier_delay_factor: 1.0,
  reorder_threshold_multiplier: 1.0,
}

export default function SimulationPanel() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS)
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const baseResult: SimulationResult = useMemo(
    () => ({
      new_health_score: 75,
      delta_from_base: 0,
      projected_cash: 100_000,
      risk_index: 40,
      revenue_forecast: [
        { period: 'P1', value: 80_000 },
        { period: 'P2', value: 82_500 },
        { period: 'P3', value: 85_000 },
        { period: 'P4', value: 87_500 },
      ],
      explanation_summary:
        'Baseline scenario using current health, expense and fraud signals to project revenue, cash and risk over the next four periods.',
      metadata: {
        base_health_score: 75,
        base_expense_total: 50_000,
        fraud_rate_percent: 10,
      },
    }),
    [],
  )

  function runLocalSimulation(p: SimulationParams): SimulationResult {
    const baseHealth = baseResult.metadata.base_health_score
    const baseExpense = baseResult.metadata.base_expense_total
    const baseFraud = baseResult.metadata.fraud_rate_percent

    const baseRevenue0 = baseExpense * 1.4
    const baseSeries = [0, 1, 2, 3].map((i) => baseRevenue0 * (1 + 0.03 * i))
    const revenueSeries = baseSeries.map((v) => v * p.sales_growth_multiplier)

    const simulatedExpenseTotal = baseExpense * p.expense_growth_multiplier
    const revenueSum = revenueSeries.reduce((acc, v) => acc + v, 0)
    const expenseSum = simulatedExpenseTotal * 4
    const projectedCash = 100_000 + revenueSum - expenseSum

    const fraudComponent = baseFraud * (0.6 * p.fraud_sensitivity)
    const inventoryComponent = (p.supplier_delay_factor - 1) * 40 + (p.reorder_threshold_multiplier - 1) * 25
    const expenseComponent = (p.expense_growth_multiplier - 1) * 60
    const rawRisk = fraudComponent + inventoryComponent + expenseComponent
    const riskIndex = Math.max(0, Math.min(100, rawRisk))

    const revenueVsExpenseDelta = (p.sales_growth_multiplier - p.expense_growth_multiplier) * 18
    const riskDelta = -((riskIndex - 40) / 4.5)
    const supplierDelta = -(p.supplier_delay_factor - 1) * 10
    const healthDelta = revenueVsExpenseDelta + riskDelta + supplierDelta
    const newHealth = Math.max(0, Math.min(100, baseHealth + healthDelta))
    const deltaFromBase = newHealth - baseHealth

    const revenueForecast = revenueSeries.map((v, i) => ({
      period: `P${i + 1}`,
      value: Math.round(v),
    }))

    const explanationParts: string[] = []
    if (p.sales_growth_multiplier !== 1) {
      const pct = Math.round((p.sales_growth_multiplier - 1) * 100)
      explanationParts.push(
        pct >= 0
          ? `Sales growth increased by ${pct}% which lifts projected revenue across the horizon.`
          : `Sales growth reduced by ${Math.abs(pct)}% which compresses projected revenue.`,
      )
    }
    if (p.expense_growth_multiplier !== 1) {
      const pct = Math.round((p.expense_growth_multiplier - 1) * 100)
      explanationParts.push(
        pct >= 0
          ? `Expenses are projected to grow by ${pct}%, creating additional pressure on cash and health.`
          : `Expenses are reduced by ${Math.abs(pct)}%, supporting stronger cash generation.`,
      )
    }
    if (p.fraud_sensitivity !== 1) {
      explanationParts.push(
        `Fraud sensitivity set to ${p.fraud_sensitivity.toFixed(
          2,
        )} changes how strongly fraud findings influence the unified risk index.`,
      )
    }
    if (p.supplier_delay_factor !== 1 || p.reorder_threshold_multiplier !== 1) {
      explanationParts.push(
        'Supply-chain levers (supplier delays and reorder thresholds) adjust inventory risk and slightly affect overall health.',
      )
    }

    const explanation_summary =
      explanationParts.join(' ') ||
      'Simulation uses current baseline assumptions to project revenue, cash and risk over the next four periods.';

    return {
      new_health_score: parseFloat(newHealth.toFixed(1)),
      delta_from_base: parseFloat(deltaFromBase.toFixed(1)),
      projected_cash: Math.round(projectedCash),
      risk_index: parseFloat(riskIndex.toFixed(1)),
      revenue_forecast: revenueForecast,
      explanation_summary,
      metadata: baseResult.metadata,
    }
  }

  function handleRun() {
    setLoading(true)
    const result = runLocalSimulation(params)
    setCurrentResult(result)
    setLoading(false)
  }

  const revenueDelta = useMemo(() => {
    if (!currentResult) return 0
    const baseSum = baseResult.revenue_forecast.reduce((acc, r) => acc + r.value, 0)
    const curSum = currentResult.revenue_forecast.reduce((acc, r) => acc + r.value, 0)
    return curSum - baseSum
  }, [baseResult, currentResult])

  const activeResult = currentResult || baseResult

  function updateParam<K extends keyof SimulationParams>(key: K, value: number) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 md:p-7"
      style={{
        background: 'linear-gradient(145deg, rgb(var(--ds-bg-surface)), rgb(var(--ds-bg-elevated)))',
        border: '1px solid rgba(0,212,255,0.15)',
        boxShadow: 'var(--ds-card-shadow)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full blur-3xl"
        style={{ background: 'rgba(0,212,255,0.12)' }}
      />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-1">
            <p
              className="text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'rgba(148,163,184,0.9)', fontFamily: 'var(--ds-font-mono)' }}
            >
              Simulation Controls
            </p>
            <p
              className="text-sm"
              style={{ color: 'rgb(var(--ds-text-secondary))' }}
            >
              Adjust business levers to see real-time impact on revenue, cash, risk and health.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SliderField
              label="Sales growth"
              min={0.8}
              max={1.3}
              step={0.02}
              value={params.sales_growth_multiplier}
              onChange={(v) => updateParam('sales_growth_multiplier', v)}
              formatter={(v) => `${Math.round((v - 1) * 100)}%`}
            />
            <SliderField
              label="Expense growth"
              min={0.8}
              max={1.3}
              step={0.02}
              value={params.expense_growth_multiplier}
              onChange={(v) => updateParam('expense_growth_multiplier', v)}
              formatter={(v) => `${Math.round((v - 1) * 100)}%`}
            />
            <SliderField
              label="Fraud sensitivity"
              min={0.5}
              max={1.5}
              step={0.05}
              value={params.fraud_sensitivity}
              onChange={(v) => updateParam('fraud_sensitivity', v)}
              formatter={(v) => v.toFixed(2)}
            />
            <SliderField
              label="Supplier delay"
              min={0.8}
              max={1.5}
              step={0.05}
              value={params.supplier_delay_factor}
              onChange={(v) => updateParam('supplier_delay_factor', v)}
              formatter={(v) => `${Math.round((v - 1) * 100)}%`}
            />
            <SliderField
              label="Reorder threshold"
              min={0.5}
              max={1.5}
              step={0.05}
              value={params.reorder_threshold_multiplier}
              onChange={(v) => updateParam('reorder_threshold_multiplier', v)}
              formatter={(v) => `${Math.round((v - 1) * 100)}%`}
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleRun}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,195,0.1))',
                border: '1px solid rgba(0,212,255,0.35)',
                color: '#e5f4ff',
                fontFamily: 'var(--ds-font-mono)',
              }}
            >
              {loading ? 'Running…' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div
            className="rounded-2xl border px-4 py-3"
            style={{
              background: 'rgba(15,23,42,0.9)',
              borderColor: 'rgba(15,118,255,0.35)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: 'rgba(148,163,184,0.9)', fontFamily: 'var(--ds-font-mono)' }}
                >
                  Health Score
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className="text-2xl font-black tabular-nums"
                    style={{ color: '#22c594', fontFamily: 'var(--ds-font-display)' }}
                  >
                    {activeResult ? activeResult.new_health_score.toFixed(1) : '--'}
                  </span>
                  {activeResult && (
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color:
                          activeResult.delta_from_base >= 0
                            ? '#4ade80'
                            : '#f97373',
                      }}
                    >
                      {activeResult.delta_from_base >= 0 ? '+' : ''}
                      {activeResult.delta_from_base.toFixed(1)} vs base
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden text-right text-[11px] md:block">
                {baseResult && (
                  <>
                    <p
                      style={{ color: 'rgba(148,163,184,0.9)', fontFamily: 'var(--ds-font-mono)' }}
                    >
                      Base:{' '}
                      {typeof baseResult.metadata?.base_health_score === 'number'
                        ? baseResult.metadata.base_health_score.toFixed(1)
                        : '—'}
                    </p>
                    <p
                      style={{ color: 'rgba(148,163,184,0.9)', fontFamily: 'var(--ds-font-mono)' }}
                    >
                      Fraud:{' '}
                      {typeof baseResult.metadata?.fraud_rate_percent === 'number'
                        ? `${baseResult.metadata.fraud_rate_percent.toFixed(1)}%`
                        : '0.0%'}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              {activeResult && (
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${activeResult.new_health_score}%` }}
                  transition={{ duration: 0.6 }}
                  style={{
                    background: 'linear-gradient(90deg,#22c594,#0ea5e9)',
                    boxShadow: '0 0 14px rgba(34,197,148,0.6)',
                  }}
                />
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat
              label="Projected Cash"
              value={
                activeResult
                  ? `$${activeResult.projected_cash.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`
                  : '—'
              }
              subLabel={
                revenueDelta !== 0
                  ? `${revenueDelta >= 0 ? '+' : ''}$${Math.round(
                      revenueDelta,
                    ).toLocaleString()} revenue vs base`
                  : 'Based on 4-period forecast'
              }
            />
            <MiniStat
              label="Unified Risk Index"
              value={activeResult ? activeResult.risk_index.toFixed(1) : '—'}
              subLabel={
                baseResult && activeResult
                  ? `Base ≈ ${(
                      activeResult.risk_index -
                      activeResult.delta_from_base * 0.5
                    ).toFixed(1)}`
                  : '0 = low · 100 = high'
              }
            />
          </div>

          <div
            className="rounded-2xl border px-4 py-3 text-xs leading-relaxed"
            style={{
              background: 'rgba(15,23,42,0.85)',
              borderColor: 'rgba(148,163,184,0.35)',
              color: 'rgba(226,232,240,0.9)',
              fontFamily: 'var(--ds-font-mono)',
            }}
          >
            {activeResult?.explanation_summary ??
              'Adjust the sliders, then click "Run Simulation" to generate an explanation of how these levers impact the business.'}
          </div>

          {loading && (
            <p
              className="text-[11px]"
              style={{ color: 'rgba(148,163,184,0.8)', fontFamily: 'var(--ds-font-mono)' }}
            >
              Recomputing scenario…
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatter,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  formatter: (value: number) => string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className="font-medium"
          style={{ color: 'rgb(var(--ds-text-secondary))' }}
        >
          {label}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            background: 'rgba(15,23,42,0.9)',
            color: 'rgba(148,163,184,0.95)',
            fontFamily: 'var(--ds-font-mono)',
          }}
        >
          {formatter(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-sky-400"
      />
    </div>
  )
}

function MiniStat({
  label,
  value,
  subLabel,
}: {
  label: string
  value: string
  subLabel?: string
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{
        background: 'rgb(var(--ds-bg-surface))',
        borderColor: 'rgb(var(--ds-border) / 0.18)',
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: 'rgba(148,163,184,0.9)', fontFamily: 'var(--ds-font-mono)' }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-base font-semibold"
        style={{ color: 'rgb(var(--ds-text-primary))' }}
      >
        {value}
      </p>
      {subLabel && (
        <p
          className="mt-0.5 text-[11px]"
          style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}
        >
          {subLabel}
        </p>
      )}
    </div>
  )
}

