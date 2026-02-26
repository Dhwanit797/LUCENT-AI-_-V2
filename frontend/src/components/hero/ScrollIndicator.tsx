import { motion, useScroll, useSpring } from 'framer-motion'

export default function ScrollIndicator() {
  const { scrollYProgress } = useScroll()
  void useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  return (
    <motion.div
      className="absolute bottom-ds-8 left-1/2 z-10 -translate-x-1/2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.5 }}
    >
      <motion.div
        className="flex flex-col items-center gap-2"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-ds-micro uppercase tracking-wider text-ds-text-muted">Scroll</span>
        <span className="block h-8 w-6 rounded-full border-2 border-ds-border-strong" />
      </motion.div>
    </motion.div>
  )
}
