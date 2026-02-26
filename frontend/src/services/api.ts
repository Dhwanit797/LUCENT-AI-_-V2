const API_BASE = import.meta.env.VITE_API_BASE
if (!API_BASE) {
  throw new Error('VITE_API_BASE is not set')
}

function getToken(): string | null {
  return localStorage.getItem('business_ai_token')
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('business_ai_token')
    localStorage.removeItem('business_ai_user')
    window.location.href = '/login'
    throw new Error('UNAUTHORIZED')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.headers.get('content-type')?.includes('application/json')) return res.json()
  return res.blob() as Promise<T>
}

/** Upload CSV to an endpoint; do not set Content-Type (FormData needs boundary) */
export async function uploadCsv<T>(path: string, file: File): Promise<T> {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)
  const headers: HeadersInit = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
    headers,
  })
  if (res.status === 401) {
    localStorage.removeItem('business_ai_token')
    localStorage.removeItem('business_ai_user')
    window.location.href = '/login'
    throw new Error('UNAUTHORIZED')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Upload failed')
  }
  return res.json()
}

// Auth
export async function login(email: string, password: string) {
  return api<{ access_token: string; user: { email: string; full_name?: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function register(full_name: string, email: string, password: string) {
  return api<{ access_token: string; user: { email: string; full_name?: string } }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ full_name, email, password }),
  })
}

// Modules




export const health = {
  score: () => api<{ score: number; level: string; color: string; factors: { name: string; score: number }[] }>('/health/score'),
}
export const recommendations = {
  list: () => api<{ id: number; category: string; icon: string; title: string; priority: string }[]>('/recommendations'),
}
export const carbon = {
  estimate: () => api<{ kg_co2_per_year: number; equivalent: string; rating: string; suggestions: string[] }>('/carbon/estimate'),
}
export const report = {
  pdf: async (): Promise<Blob> => {
    const token = getToken()
    const headers: HeadersInit = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}/report/pdf`, { headers })
    if (res.status === 401) {
      localStorage.removeItem('business_ai_token')
      localStorage.removeItem('business_ai_user')
      window.location.href = '/login'
      throw new Error('UNAUTHORIZED')
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || 'Download failed')
    }
    return res.blob()
  },
}
export const chat = {
  message: (message: string, history: { role: string; content: string }[]) =>
    api<{ role: string; content: string }>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
}

export const ai = {
  ask: (question: string, moduleData: Record<string, unknown>) =>
    api<{ answer: string; metrics_used?: string[] }>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, module_data: moduleData }),
    }),
}

export const simulation = {
  run: (payload: {
    sales_growth_multiplier: number
    expense_growth_multiplier: number
    fraud_sensitivity: number
    supplier_delay_factor: number
    reorder_threshold_multiplier: number
  }) =>
    api<{
      new_health_score: number
      delta_from_base: number
      projected_cash: number
      risk_index: number
      revenue_forecast: { period: string; value: number }[]
      explanation_summary: string
      metadata?: {
        base_health_score: number
        base_expense_total: number
        fraud_rate_percent: number
      }
    }>('/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

export const analytics = {
  revenueIntelligence: () =>
    api<{
      revenue_momentum_index: number
      sustainability_score: number
      growth_risk_flag: boolean
      forecast_data: {
        horizon_days: number[]
        points: { step: number; value: number; lower: number; upper: number }[]
        moving_average: { index: number; value: number }[]
      }
    }>('/revenue/intelligence'),
  unifiedRisk: () =>
    api<{
      unified_risk_index: number
      trend_direction: 'up' | 'down' | 'flat'
      volatility_score: number
      confidence_percentage: number
    }>('/risk/unified'),
}
