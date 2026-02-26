import { motion } from 'framer-motion'

const TICKER_ITEMS = [
  'Fraud Detection', 'Expense Intelligence', 'Inventory AI', 'Green Grid',
  'Real-time Analytics', 'Anomaly Detection', 'Cost Optimization', 'Carbon Tracking',
  'Predictive Forecasting', 'Business Health Score', 'Data Ingestion', 'AI Insights',
]

/** Section divider with animated glowing glow-line + optional ticker */
export default function SectionDivider({ ticker = false }: { ticker?: boolean }) {
  if (ticker) {
    // Ticker strip variant: scrolling horizontal data stream
    return (
      <div
        className="relative overflow-hidden py-3 ticker-border"
        aria-hidden
      >
        {/* Left/right fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20" style={{ background: 'linear-gradient(90deg, rgb(var(--ds-bg-base)), transparent)' }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20" style={{ background: 'linear-gradient(-90deg, rgb(var(--ds-bg-base)), transparent)' }} />
        <div className="ticker-track flex w-max gap-6 whitespace-nowrap">
          {/* Duplicate for seamless loop */}
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: 'rgb(var(--ds-text-muted))', fontFamily: 'var(--ds-font-mono)' }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: i % 3 === 0 ? 'rgb(var(--ds-accent))' : i % 3 === 1 ? 'rgb(var(--ds-accent-teal))' : 'rgb(var(--ds-accent-lime))' }}
              />
              {item}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // Default: glow-line divider
  return (
    <div className="relative flex flex-col items-center justify-center py-1" aria-hidden>
      <motion.div
        className="glow-divider w-full"
        initial={{ opacity: 0.2, scaleX: 0.5 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute h-2 w-2 rounded-full"
        style={{
          background: 'rgb(var(--ds-accent))',
          boxShadow: '0 0 14px 3px rgb(var(--ds-accent) / 0.6)',
        }}
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.4 }}
      />
    </div>
  )
}
