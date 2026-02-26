import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Card from './Card'

interface CsvUploadProps {
  onUpload: (file: File) => Promise<any>
  title?: string
  description?: string
  successMessage?: (res: any) => string
}

export default function CsvUpload({
  onUpload,
  title = "Upload CSV",
  description = "Bulk upload records via CSV.",
  successMessage = () => "Upload successful"
}: CsvUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setUploadStatus('error')
      setUploadMessage('Please upload a .csv file')
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')
    try {
      const res = await onUpload(file)
      setUploadStatus('success')
      setUploadMessage(successMessage(res))
    } catch (err: any) {
      setUploadStatus('error')
      setUploadMessage(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-medium text-ds-text-primary flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-indigo-400" />
            {title}
          </h3>
          <p className="text-sm text-ds-text-muted mt-1">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {isUploading ? 'Uploading...' : 'Select CSV File'}
          </button>

          <AnimatePresence mode="wait">
            {uploadStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`flex items-center gap-2 text-sm ${uploadStatus === 'success' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
              >
                {uploadStatus === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {uploadMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  )
}
