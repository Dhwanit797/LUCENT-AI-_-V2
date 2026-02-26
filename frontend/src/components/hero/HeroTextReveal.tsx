import { motion } from 'framer-motion'

const title = 'Lucent AI'
const letters = title.split('')

const letterVariants = {
  hidden: { filter: 'blur(12px)', opacity: 0, y: 24 },
  visible: (i: number) => ({
    filter: 'blur(0px)',
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.5 + i * 0.06,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

export default function HeroTextReveal() {
  return (
    <motion.h1
      className="text-[2.75rem] font-bold tracking-tight text-ds-text-primary sm:text-ds-hero md:text-ds-display"
      style={{ textShadow: '0 0 80px rgb(59 130 246 / 0.2), 0 0 40px rgb(139 92 246 / 0.1)' }}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={letterVariants}
          custom={i}
          style={{ display: letter === ' ' ? 'inline' : 'inline-block' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.h1>
  )
}
