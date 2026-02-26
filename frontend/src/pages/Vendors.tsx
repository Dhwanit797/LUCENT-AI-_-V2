import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import LoadingSkeleton from '../components/LoadingSkeleton'

type Vendor = {
  id: number
  name: string
  rating: number
}

type InventoryRow = {
  vendor?: string
  quantity?: number
}

const INVENTORY_STORAGE_KEY = 'lucent_inventory_data_rows_v1'

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)
    try {
      const raw = localStorage.getItem(INVENTORY_STORAGE_KEY)
      const inventory_data: InventoryRow[] = raw ? JSON.parse(raw) : []

      const uniqueVendors = Array.from(
        new Set(
          inventory_data
            .map((row) => row.vendor?.trim())
            .filter((v): v is string => !!v && v.length > 0),
        ),
      )

      // Debug check (mandatory)
      console.log('All vendors extracted:', uniqueVendors)

      const computed: Vendor[] = uniqueVendors.map((vendorName, index) => {
        const vendorItems = inventory_data.filter(
          (row) => row.vendor?.trim() === vendorName,
        )

        const totalProducts = vendorItems.length
        const avgQuantity =
          totalProducts > 0
            ? vendorItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0) /
              totalProducts
            : 0

        let rating = 3
        rating += totalProducts * 0.2
        rating -= avgQuantity > 200 ? 0.3 : 0
        rating += avgQuantity < 100 ? 0.5 : 0
        rating = Math.max(1, Math.min(5, Number(rating.toFixed(1))))

        return {
          id: index + 1,
          name: vendorName,
          rating: Math.round(rating * 20),
        }
      })

      if (!isMounted) return
      setVendors(computed)
    } catch (e) {
      if (!isMounted) return
      setError(e instanceof Error ? e.message : 'Failed to load vendors')
    } finally {
      if (isMounted) setLoading(false)
    }

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
          No inventory data found. Please upload inventory CSV in Smart Inventory module.
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

