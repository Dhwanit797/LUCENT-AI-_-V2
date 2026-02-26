import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

export default function SectionProblem() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const gradientOpacity = useTransform(scrollYProgress, [0.2, 0.5], [0, 0.6])

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-violet-950/20 to-[#0f172a]"
        style={{ opacity: gradientOpacity }}
      />
      <div className="absolute inset-0 bg-[#030712]" />

      <div className="relative z-10 max-w-3xl text-center">
        <motion.p
          className="mb-4 text-sm font-medium uppercase tracking-widest text-violet-400"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          The problem
        </motion.p>
        <motion.h2
          className="text-4xl font-bold leading-tight text-white sm:text-5xl"
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Data is everywhere. Clarity is not.
        </motion.h2>
        <motion.p
          className="mt-8 text-lg leading-relaxed text-slate-400"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Scattered tools, blind spots in fraud, inventory guesswork, and energy waste. Your business
          runs on decisions—but decisions need one source of truth.
        </motion.p>
      </div>
    </section>
  )
}
