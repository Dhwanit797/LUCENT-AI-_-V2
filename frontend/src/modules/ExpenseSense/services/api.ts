import { api, uploadCsv } from '../../../services/api'

export const expenseApi = {
    status: () => api<{ has_data: boolean }>('/expense/status'),
    summary: () => api<{ by_category: { name: string; value: number }[]; total: number; trend: string; trend_percent: number }>('/expense/summary'),
    trends: () => api<{ month: string; amount: number }[]>('/expense/trends'),
    upload: (file: File) =>
        uploadCsv<{ labels: string[]; values: number[]; total: number; trends?: { month: string; amount: number }[] }>('/expense/upload-csv', file),
    clear: () => api<{ message: string }>('/expense/clear', { method: 'DELETE' }),
}
