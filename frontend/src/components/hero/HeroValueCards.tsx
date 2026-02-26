import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Zap, Shield, LineChart, Leaf } from 'lucide-react'

const cards = [
  { icon: Zap, title: 'AI-powered', desc: 'Recommendations and health scores from your data.' },
  { icon: Shield, title: 'Fraud-aware', desc: 'Anomaly detection keeps you one step ahead.' },
  { icon: LineChart, title: 'Unified view', desc: 'Expense, inventory, and sustainability in one place.' },
  { icon: Leaf, title: 'Sustainable', desc: 'Green Grid and carbon footprint built in.' },
]

/** Section 3: Value cards — enter from depth (z-axis) + blur-to-focus */
export default function HeroValueCards() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative overflow-hidden bg-ds-bg-base py-ds-24">
      <div className="absolute inset-0 bg-ds-gradient-mesh opacity-40" />
      <div className="relative z-10 mx-auto max-w-ds-container px-ds-section-px">
        <motion.p
          className="mb-ds-3 text-center text-ds-body-sm font-medium uppercase tracking-wider text-ds-accent-tertiary"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
        >
          Why it matters
        </motion.p>
        <motion.h2
          className="text-center text-ds-title font-bold tracking-tight text-ds-text-primary"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          Built for serious business
        </motion.h2>
        <motion.div
          className="mt-ds-16 grid gap-ds-6 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
          }}
        >
          {cards.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={{
                hidden: {
                  opacity: 0,
                  filter: 'blur(12px)',
                  scale: 0.96,
                },
                visible: {
                  opacity: 1,
                  filter: 'blur(0px)',
                  scale: 1,
                  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className="rounded-2xl border border-ds-border bg-ds-bg-surface/50 p-ds-6 shadow-ds-md backdrop-blur-xl"
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="mb-ds-4 inline-flex rounded-xl bg-ds-accent-primary/15 p-ds-3">
                <Icon className="h-6 w-6 text-ds-accent-primary" />
              </div>
              <h3 className="text-ds-subheading font-semibold text-ds-text-primary">{title}</h3>
              <p className="mt-ds-2 text-ds-body-sm text-ds-text-secondary">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
