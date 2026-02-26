import { motion } from 'framer-motion'
import { pageVariants, pageTransition } from '../../animations/pageVariants'

interface ModuleLayoutProps {
    children: React.ReactNode
}

export default function ModuleLayout({ children }: ModuleLayoutProps) {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="space-y-8"
        >
            {children}
        </motion.div>
    )
}
