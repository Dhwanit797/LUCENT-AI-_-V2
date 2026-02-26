import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { BarChart3, TrendingUp, PieChart } from 'lucide-react'

/** Section 2: Fake analytics UI floating around 3D — parallax layering */
export default function HeroFloatingPanels() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0.15, 0.4], [80, -20])
  const y2 = useTransform(scrollYProgress, [0.2, 0.45], [60, -40])
  const y3 = useTransform(scrollYProgress, [0.25, 0.5], [100, -10])
  const opacity = useTransform(scrollYProgress, [0.12, 0.3], [0, 1])

  return (
    <section ref={ref} className="relative min-h-[100vh] overflow-hidden bg-ds-bg-elevated">
      <div className="absolute inset-0 bg-ds-gradient-mesh opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[60vh] w-full max-w-4xl">
          <motion.div
            style={{ y: y1, opacity }}
            className="absolute left-[10%] top-[15%] rounded-2xl border border-ds-border bg-ds-bg-surface/60 p-4 shadow-ds-elevation-2 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 text-ds-body-sm text-ds-text-secondary">
              <BarChart3 className="h-4 w-4 text-ds-accent-primary" />
              <span>Expense overview</span>
            </div>
            <div className="mt-2 h-16 w-32 rounded-lg bg-ds-accent-primary/20" />
            <div className="mt-1 flex gap-1">
              {[40, 65, 45, 80, 55].map((h, i) => (
                <div
                  key={i}
                  className="w-4 rounded-t bg-ds-accent-primary/40"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </motion.div>
          <motion.div
            style={{ y: y2, opacity }}
            className="absolute right-[15%] top-[25%] rounded-2xl border border-ds-border bg-ds-bg-surface/60 p-4 shadow-ds-elevation-2 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 text-ds-body-sm text-ds-text-secondary">
              <TrendingUp className="h-4 w-4 text-ds-accent-success" />
              <span>Health score</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-ds-accent-success">84</div>
            <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-ds-bg-base">
              <div className="h-full w-[84%] rounded-full bg-ds-accent-success" />
            </div>
          </motion.div>
          <motion.div
            style={{ y: y3, opacity }}
            className="absolute bottom-[20%] left-1/2 -translate-x-1/2 rounded-2xl border border-ds-border bg-ds-bg-surface/60 p-4 shadow-ds-elevation-2 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 text-ds-body-sm text-ds-text-secondary">
              <PieChart className="h-4 w-4 text-ds-accent-secondary" />
              <span>By category</span>
            </div>
            <div className="mt-2 flex gap-2">
              {['#3b82f6', '#10b981', '#8b5cf6'].map((c, i) => (
                <div key={i} className="h-8 w-8 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <div className="relative z-10 px-ds-section-px py-ds-24 text-center">
        <motion.p
          className="text-ds-body-sm font-medium uppercase tracking-wider text-ds-accent-primary"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Your data, in context
        </motion.p>
        <motion.h2
          className="mx-auto mt-ds-3 max-w-2xl text-ds-title font-bold tracking-tight text-ds-text-primary"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
        >
          Analytics that float around your workflow
        </motion.h2>
      </div>
    </section>
  )
}
