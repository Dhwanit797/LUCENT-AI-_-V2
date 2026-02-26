import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import UploadPanel from './UploadPanel'
import LockedStatCard from './LockedStatCard'

interface PreInsightLayoutProps {
    moduleTitle: string
    tagline: string
    bullets: string[]
    icon: LucideIcon
    lockedMetrics: string[]
    csvColumns: string[]
    onUpload: (file: File) => Promise<any>
    accentColor?: string
    successMessage?: (res: any) => string
}

const bulletVariants = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
}

export default function PreInsightLayout({
    moduleTitle,
    tagline,
    bullets,
    icon: Icon,
    lockedMetrics,
    csvColumns,
    onUpload,
    accentColor = '#38BDF8',
    successMessage,
}: PreInsightLayoutProps) {
    return (
        <div className="space-y-10">
            {/* SECTION 1 — Split Layout */}
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
                {/* LEFT — Value proposition */}
                <motion.div
                    className="flex flex-col justify-center space-y-6"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Icon + Title */}
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl"
                            style={{ backgroundColor: `${accentColor}18` }}
                        >
                            <Icon className="h-6 w-6" style={{ color: accentColor }} />
                        </div>
                        <h1 className="text-2xl font-bold text-ds-text-primary md:text-3xl">
                            {moduleTitle}
                        </h1>
                    </div>

                    {/* Tagline */}
                    <p className="max-w-md text-lg font-medium leading-relaxed text-ds-text-secondary">
                        {tagline}
                    </p>

                    {/* Bullet points */}
                    <motion.ul
                        className="space-y-3"
                        initial="initial"
                        animate="animate"
                        variants={{ animate: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
                    >
                        {bullets.map((text, i) => (
                            <motion.li
                                key={i}
                                variants={bulletVariants}
                                className="flex items-start gap-3 text-sm text-ds-text-secondary"
                            >
                                <span
                                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    {i + 1}
                                </span>
                                {text}
                            </motion.li>
                        ))}
                    </motion.ul>

                    {/* Decorative subtle glow */}
                    <div
                        className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full opacity-[0.07] blur-[80px]"
                        style={{ background: accentColor }}
                    />
                </motion.div>

                {/* RIGHT — Upload panel */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="glass-card p-6">
                        <UploadPanel
                            onUpload={onUpload}
                            csvColumns={csvColumns}
                            title={`Upload ${moduleTitle} Data`}
                            description="Drag & drop your CSV or click to browse"
                            successMessage={successMessage}
                        />
                    </div>
                </motion.div>
            </div>

            {/* SECTION 2 — Locked Insight Preview */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
            >
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ds-text-muted">
                    Insights you'll unlock
                </p>
                <div className={`grid gap-4 ${lockedMetrics.length <= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
                    {lockedMetrics.map((metric) => (
                        <LockedStatCard key={metric} label={metric} />
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
