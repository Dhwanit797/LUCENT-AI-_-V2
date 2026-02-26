import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'

interface UploadPanelProps {
    onUpload: (file: File) => Promise<any>
    csvColumns: string[]
    title?: string
    description?: string
    successMessage?: (res: any) => string
}

export default function UploadPanel({
    onUpload,
    csvColumns,
    title = 'Upload CSV',
    description = 'Drag & drop your file or click to browse',
    successMessage = () => 'Upload successful — insights unlocked!',
}: UploadPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const processFile = useCallback(
        async (file: File) => {
            if (!file.name.endsWith('.csv')) {
                setStatus('error')
                setMessage('Please upload a .csv file')
                return
            }
            setIsUploading(true)
            setStatus('idle')
            try {
                const res = await onUpload(file)
                setStatus('success')
                setMessage(successMessage(res))
            } catch (err: any) {
                setStatus('error')
                setMessage(err.message || 'Upload failed')
            } finally {
                setIsUploading(false)
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        },
        [onUpload, successMessage]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) processFile(file)
        },
        [processFile]
    )

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback(() => setIsDragging(false), [])

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) processFile(file)
        },
        [processFile]
    )

    return (
        <div className="flex flex-col gap-5">
            {/* Drop zone */}
            <motion.div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${isDragging
                      ? 'shadow-[0_0_30px_rgba(56,189,248,0.12)]'
                      : ''
                  }`}
              style={{
                background: isDragging ? 'rgba(56,189,248,0.06)' : 'rgb(var(--ds-bg-elevated))',
                borderColor: isDragging ? 'rgb(var(--ds-accent))' : 'rgb(var(--ds-border) / 0.3)',
              }}
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
            >
                {/* Ambient glow on hover */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.06) 0%, transparent 70%)',
                    }}
                />

                <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleInputChange}
                />

                <div className="relative flex flex-col items-center gap-3">
                    <motion.div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300`}
                          style={{ background: isDragging ? 'rgba(56,189,248,0.15)' : 'rgb(var(--ds-bg-surface))' }}
                        animate={isDragging ? { scale: [1, 1.08, 1] } : {}}
                        transition={{ duration: 0.6, repeat: isDragging ? Infinity : 0 }}
                    >
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-ds-accent" />
                        ) : (
                            <UploadCloud className={`h-6 w-6 transition-colors duration-300 ${isDragging ? 'text-ds-accent' : 'text-ds-text-muted'}`} />
                        )}
                    </motion.div>

                    <div>
                        <p className="text-sm font-semibold text-ds-text-primary">{title}</p>
                        <p className="mt-1 text-xs text-ds-text-muted">{description}</p>
                    </div>

                    <button
                        type="button"
                        disabled={isUploading}
                        className="mt-1 rounded-xl bg-ds-accent/10 px-5 py-2 text-xs font-semibold text-ds-accent transition-all hover:bg-ds-accent/20 disabled:opacity-50"
                    >
                        {isUploading ? 'Processing…' : 'Browse Files'}
                    </button>
                </div>
            </motion.div>

            {/* CSV format info */}
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgb(var(--ds-bg-elevated))' }}>
                <div className="flex items-center gap-2 text-xs font-medium text-ds-text-secondary">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Expected CSV columns
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {csvColumns.map((col) => (
                        <span
                            key={col}
                            className="rounded-md bg-ds-bg-elevated px-2 py-0.5 text-[11px] font-mono text-ds-text-muted"
                        >
                            {col}
                        </span>
                    ))}
                </div>
            </div>

            {/* Status */}
            <AnimatePresence mode="wait">
                {status !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${status === 'success'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                    >
                        {status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                        {message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
