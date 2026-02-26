import { motion } from 'framer-motion'

type Props = { children: React.ReactNode; className?: string }

/** Wraps a landing section for a subtle depth entrance: slight scale and fade. */
export default function SectionTransition({ children, className = '' }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0.92, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
