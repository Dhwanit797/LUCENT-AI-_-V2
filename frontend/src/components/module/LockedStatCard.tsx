import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

interface LockedStatCardProps {
    label: string
}

export default function LockedStatCard({ label }: LockedStatCardProps) {
    return (
        <motion.div
            className="glass-card relative overflow-hidden p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            {/* Blurred placeholder content */}
            <div className="select-none opacity-30 blur-[2px]">
                <p className="text-sm font-medium text-ds-text-muted">{label}</p>
                <p className="mt-2 text-3xl font-bold text-ds-text-primary">— —</p>
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ds-bg-elevated/60 backdrop-blur-[1px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ds-bg-surface/80 shadow-lg">
                    <Lock className="h-4 w-4 text-ds-text-muted" />
                </div>
                <p className="text-xs font-medium text-ds-text-muted">Upload to unlock</p>
            </div>
        </motion.div>
    )
}
