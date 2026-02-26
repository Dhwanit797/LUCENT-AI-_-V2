import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { api } from '../services/api'

type Vendor = {
  id: number
  name: string
  rating: number
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)
    api<Vendor[]>('/vendors')
      .then((data) => {
        if (!isMounted) return
        setVendors(data)
      })
      .catch((err: Error) => {
        if (!isMounted) return
        setError(err.message || 'Failed to load vendors')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <PageHeader title="Vendors" />

      {loading && <LoadingSkeleton />}

      {!loading && error && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{
            background: 'rgba(248,70,70,0.06)',
            borderColor: 'rgba(248,70,70,0.3)',
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && vendors.length === 0 && (
        <div
          className="rounded-2xl border px-5 py-6 text-center text-sm"
          style={{
            background: 'rgb(var(--ds-bg-surface))',
            borderColor: 'rgb(var(--ds-border) / 0.25)',
            color: 'rgb(var(--ds-text-muted))',
          }}
        >
          No vendors found. Connect your data source to see vendor performance.
        </div>
      )}

      {!loading && !error && vendors.length > 0 && (
        <div className="space-y-4">
          {vendors.map((v, index) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="rounded-2xl border px-5 py-4"
              style={{
                background: 'rgb(var(--ds-bg-surface))',
                borderColor: 'rgb(var(--ds-border) / 0.18)',
                boxShadow: 'var(--ds-card-shadow)',
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'rgb(var(--ds-text-primary))' }}
                  >
                    {v.name}
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: 'rgb(var(--ds-text-muted))' }}
                  >
                    Overall rating based on delivery, quality, and pricing.
                  </p>
                </div>

                <div className="w-full max-w-xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span
                      className="font-medium"
                      style={{ color: 'rgb(var(--ds-text-secondary))' }}
                    >
                      Rating
                    </span>
                    <span
                      className="tabular-nums font-semibold"
                      style={{ color: '#22c594' }}
                    >
                      {v.rating} / 100
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: 'rgb(var(--ds-border) / 0.18)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${v.rating}%` }}
                      transition={{ duration: 0.6, delay: 0.05 * index }}
                      style={{
                        background:
                          'linear-gradient(90deg, #22c594, #00D4FF)',
                        boxShadow: '0 0 10px rgba(34,197,148,0.45)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

