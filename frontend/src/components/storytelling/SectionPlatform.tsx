import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { BarChart3, TrendingUp, Zap } from 'lucide-react'

export default function SectionPlatform() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative px-6 py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-blue-950/10 to-[#0f172a]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.p
          className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-400"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          Platform intelligence
        </motion.p>
        <motion.h2
          className="text-4xl font-bold text-white sm:text-5xl"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          Analytics that drive decisions
        </motion.h2>
        <motion.p
          className="mt-6 text-lg text-slate-400"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          Health scores, recommendations, and reports—all in one dashboard.
        </motion.p>

        <motion.div
          className="mt-16 flex flex-wrap justify-center gap-8"
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          {[
            { Icon: BarChart3, label: 'Live metrics' },
            { Icon: TrendingUp, label: 'Trends' },
            { Icon: Zap, label: 'AI insights' },
          ].map(({ Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-6"
            >
              <Icon className="h-8 w-8 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
