import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { TrendingDown, AlertTriangle, Package, Leaf } from 'lucide-react'

const benefits = [
  {
    icon: TrendingDown,
    title: 'Control spend',
    desc: 'Category breakdown and trend analysis so you can optimize costs.',
  },
  {
    icon: AlertTriangle,
    title: 'Catch fraud early',
    desc: 'Anomaly detection flags unusual transactions before they compound.',
  },
  {
    icon: Package,
    title: 'Never stock out',
    desc: 'Reorder suggestions and forecasts keep inventory in check.',
  },
  {
    icon: Leaf,
    title: 'Reduce footprint',
    desc: 'Green Grid and carbon estimates help you operate sustainably.',
  },
]

export default function SectionBenefits() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="benefits"
      ref={ref}
      className="relative w-full bg-ds-bg-elevated py-ds-24 md:py-ds-24"
    >
      <div className="mx-auto max-w-ds-container px-ds-section-px">
        <motion.p
          className="mb-ds-3 text-ds-body-sm font-medium uppercase tracking-wider text-ds-accent-success"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
        >
          Customer benefits
        </motion.p>
        <motion.h2
          className="max-w-2xl text-ds-title font-bold tracking-tight text-ds-text-primary"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          Outcomes that matter for your business
        </motion.h2>
        <motion.div
          className="mt-ds-16 grid gap-ds-6 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.08, delayChildren: 0.12 },
            },
          }}
        >
          {benefits.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              className="group rounded-2xl border border-ds-border bg-ds-bg-surface/40 p-ds-6 shadow-ds-sm transition-all duration-300 hover:-translate-y-1 hover:border-ds-accent-success/30 hover:shadow-ds-md"
            >
              <div className="mb-ds-4 inline-flex rounded-xl bg-ds-accent-success/15 p-ds-3 transition-transform group-hover:scale-105">
                <Icon className="h-6 w-6 text-ds-accent-success" />
              </div>
              <h3 className="text-ds-subheading font-semibold text-ds-text-primary">
                {title}
              </h3>
              <p className="mt-ds-2 text-ds-body-sm leading-relaxed text-ds-text-secondary">
                {desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
