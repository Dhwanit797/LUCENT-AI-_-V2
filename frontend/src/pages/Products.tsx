import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { api } from '../services/api'

type Product = {
  id: number
  name: string
  demand: number
  available_quantity: number
  total_sold: number
}

type SortOrder = 'highest' | 'lowest'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('highest')

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)
    api<Product[]>('/products')
      .then((data) => {
        if (!isMounted) return
        setProducts(data)
      })
      .catch((err: Error) => {
        if (!isMounted) return
        setError(err.message || 'Failed to load products')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const sortedProducts = useMemo(() => {
    const copy = [...products]
    copy.sort((a, b) =>
      sortOrder === 'highest'
        ? b.total_sold - a.total_sold
        : a.total_sold - b.total_sold,
    )
    return copy
  }, [products, sortOrder])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <PageHeader
        title="Products"
        action={
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium"
              style={{ color: 'rgb(var(--ds-text-muted))' }}
            >
              Sort by
            </span>
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as SortOrder)
              }
              className="rounded-xl border px-3 py-1.5 text-xs focus:outline-none"
              style={{
                background: 'rgb(var(--ds-bg-surface))',
                borderColor: 'rgb(var(--ds-border) / 0.3)',
                color: 'rgb(var(--ds-text-secondary))',
              }}
            >
              <option value="highest">Highest</option>
              <option value="lowest">Lowest</option>
            </select>
          </div>
        }
      />

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

      {!loading && !error && sortedProducts.length === 0 && (
        <div
          className="rounded-2xl border px-5 py-6 text-center text-sm"
          style={{
            background: 'rgb(var(--ds-bg-surface))',
            borderColor: 'rgb(var(--ds-border) / 0.25)',
            color: 'rgb(var(--ds-text-muted))',
          }}
        >
          No products found. Connect your inventory data to see product demand.
        </div>
      )}

      {!loading && !error && sortedProducts.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border"
          style={{
            background: 'rgb(var(--ds-bg-surface))',
            borderColor: 'rgb(var(--ds-border) / 0.18)',
            boxShadow: 'var(--ds-card-shadow)',
          }}
        >
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-dashed"
                style={{ borderColor: 'rgb(var(--ds-border) / 0.25)' }}
              >
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'rgb(var(--ds-text-muted))' }}
                >
                  Product
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'rgb(var(--ds-text-muted))' }}
                >
                  Demand Score
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'rgb(var(--ds-text-muted))' }}
                >
                  Available Quantity
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'rgb(var(--ds-text-muted))' }}
                >
                  Total Sold
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((p, index) => (
                <tr
                  key={p.id}
                  className="border-b border-dashed last:border-b-0"
                  style={{ borderColor: 'rgb(var(--ds-border) / 0.18)' }}
                >
                  <td className="px-5 py-3 align-middle">
                    <div className="flex flex-col">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'rgb(var(--ds-text-primary))' }}
                      >
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-middle">
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-xs tabular-nums font-semibold"
                        style={{ color: '#22c594' }}
                      >
                        {p.demand}%
                      </span>
                      <div
                        className="h-1.5 w-full overflow-hidden rounded-full"
                        style={{
                          background: 'rgb(var(--ds-border) / 0.18)',
                        }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${p.demand}%` }}
                          transition={{
                            duration: 0.6,
                            delay: 0.03 * index,
                          }}
                          style={{
                            background:
                              'linear-gradient(90deg, #22c594, #00D4FF)',
                            boxShadow:
                              '0 0 10px rgba(34,197,148,0.45)',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right align-middle">
                    <span
                      className="tabular-nums text-xs"
                      style={{ color: 'rgb(var(--ds-text-secondary))' }}
                    >
                      {p.available_quantity.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right align-middle">
                    <span
                      className="tabular-nums text-xs font-semibold"
                      style={{ color: 'rgb(var(--ds-text-primary))' }}
                    >
                      {p.total_sold.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

