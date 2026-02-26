import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Receipt, Shield, Package, Leaf, TrendingUp } from 'lucide-react'
import { ScrollRevealStagger, ScrollRevealItem } from '../../animations/ScrollReveal'

const features = [
  { icon: Receipt, title: 'Expense Sense', desc: 'Category intelligence and trend analysis' },
  { icon: Shield, title: 'Fraud Lens', desc: 'Anomaly detection that protects revenue' },
  { icon: Package, title: 'Smart Inventory', desc: 'Forecasts and reorder suggestions' },
  { icon: Leaf, title: 'Green Grid', desc: 'Energy optimization and sustainability' },
  { icon: TrendingUp, title: 'Revenue Intelligence', desc: 'Momentum, sustainability, and unified risk in one view' },
]

export default function SectionSolution() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative px-6 py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#030712] to-[#0f172a]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.p
          className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-cyan-400"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          The solution
        </motion.p>
        <motion.h2
          className="text-center text-4xl font-bold text-white sm:text-5xl"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          One platform. Full control.
        </motion.h2>

        <ScrollRevealStagger className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {features.map(({ icon: Icon, title, desc }, _i) => (
            <ScrollRevealItem key={title}>
              <motion.div
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-xl bg-blue-500/20 p-3">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{desc}</p>
                </div>
              </motion.div>
            </ScrollRevealItem>
          ))}
        </ScrollRevealStagger>
      </div>
    </section>
  )
}
