import { api, uploadCsv } from '../../../services/api'

export interface ExplainPoint {
  icon: 'amount' | 'vendor' | 'hours' | 'duplicate' | 'model'
  label: string
  detail: string
}

export interface ExplainResult {
  found: boolean
  transaction_id: string
  amount: number
  is_fraud: boolean
  points: ExplainPoint[]
}

export interface FraudTransaction {
  transaction_id: string
  amount: number
  timestamp: string | null
  merchant_category: string
  account_age_days: number | null
  risk_score: number
  risk_label: 'Safe' | 'Suspicious' | 'High Risk'
  breakdown: Record<string, number>
  is_fraud: boolean
}

export interface FraudSummary {
  total_transactions: number
  safe_count: number
  suspicious_count: number
  high_risk_count: number
  average_risk_score: number
  // legacy
  fraud_count: number
  normal_count: number
  fraud_percentage: number
}

export interface RiskDistributionItem {
  name: string
  value: number
  color: string
}

export interface TimelinePoint {
  date: string
  safe: number
  suspicious: number
  high_risk: number
}

export interface FraudUploadResult {
  transactions: FraudTransaction[]
  summary: FraudSummary
  chart_data: {
    risk_distribution: RiskDistributionItem[]
    timeline_series: TimelinePoint[]
  }
}

export const fraudApi = {
  status: () => api<{ has_data: boolean }>('/fraud/status'),
  insights: () => api<{
    anomalies_detected: number
    total_transactions: number
    risk_level: string
    alerts: { id: string; type: string; score: number }[]
  }>('/fraud/insights'),
  chart: () => api<{ day: string; normal: number; flagged: number }[]>('/fraud/chart'),
  upload: (file: File) =>
    uploadCsv<FraudUploadResult>('/fraud/upload-csv', file),
  clear: () => api<{ message: string }>('/fraud/clear', { method: 'DELETE' }),
  explain: (transactionId: string) =>
    api<ExplainResult>(`/fraud/explain/${encodeURIComponent(transactionId)}`),
}
