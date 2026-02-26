import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

interface ModuleStatusResult {
  hasData: boolean
  loading: boolean
  refreshStatus: () => Promise<void>
}

/**
 * Reusable hook that checks if a module has data in the backend DB.
 * On mount it calls GET /{modulePath}/status and sets hasData accordingly.
 * Call refreshStatus() after a successful upload to re-check.
 */
export default function useModuleStatus(modulePath: string): ModuleStatusResult {
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api<{ has_data: boolean }>(`/${modulePath}/status`)
      setHasData(res.has_data)
    } catch {
      // If request fails, keep current state
    } finally {
      setLoading(false)
    }
  }, [modulePath])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  return { hasData, loading, refreshStatus }
}
