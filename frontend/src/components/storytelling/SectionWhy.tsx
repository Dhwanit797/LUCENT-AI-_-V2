import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { BarChart3, Shield, Zap, Globe } from 'lucide-react'

const items = [
  {
    icon: BarChart3,
    title: 'Unified analytics',
    desc: 'Expense, fraud, inventory, and sustainability in one place.',
  },
  {
    icon: Shield,
    title: 'Risk-aware',
    desc: 'Anomaly detection and alerts so you act before issues scale.',
  },
  {
    icon: Zap,
    title: 'AI-powered insights',
    desc: 'Recommendations and health scores driven by your data.',
  },
  {
    icon: Globe,
    title: 'Sustainable by design',
    desc: 'Green Grid and carbon footprint built into the platform.',
  },
]

export default function SectionWhy() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="why"
      ref={ref}
      className="relative w-full bg-ds-bg-elevated py-ds-24 md:py-ds-24"
    >
      <div className="mx-auto max-w-ds-container px-ds-section-px">
        <motion.p
          className="mb-ds-3 text-ds-body-sm font-medium uppercase tracking-wider text-ds-accent-primary"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
        >
            Why Lucent AI
        </motion.p>
        <motion.h2
          className="max-w-2xl text-ds-title font-bold tracking-tight text-ds-text-primary"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          One platform for the metrics that matter
        </motion.h2>
        <motion.div
          className="mt-ds-16 grid gap-ds-6 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.08, delayChildren: 0.1 },
            },
          }}
        >
          {items.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="group rounded-2xl border border-ds-border bg-ds-bg-surface/50 p-ds-6 transition-shadow hover:shadow-ds-md"
            >
              <motion.div
                className="mb-ds-4 inline-flex rounded-xl bg-ds-accent-primary/15 p-ds-3"
                whileHover={{ scale: 1.05 }}
              >
                <Icon className="h-6 w-6 text-ds-accent-primary" />
              </motion.div>
              <h3 className="text-ds-subheading font-semibold text-ds-text-primary">
                {title}
              </h3>
              <p className="mt-ds-2 text-ds-body-sm text-ds-text-secondary">
                {desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
