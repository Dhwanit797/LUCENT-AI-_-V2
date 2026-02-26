import { motion } from 'framer-motion'

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
  loading?: boolean
}

const variants = {
  primary:
    'bg-ds-accent text-ds-text-inverse shadow-[var(--ds-card-shadow)] hover:opacity-95',
  secondary:
    'bg-ds-bg-surface text-ds-text-primary hover:bg-ds-bg-surface-hover',
  ghost: 'text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface',
}

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type={props.type ?? 'button'}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ds-bg-elevated disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      style={variant === 'secondary' || variant === 'ghost' ? { boxShadow: 'var(--ds-card-shadow)' } : undefined}
      whileHover={disabled || loading ? undefined : { scale: 1.02 }}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <motion.span
          className="h-5 w-5 border-2 border-current/30 border-t-current rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
      ) : (
        children
      )}
    </motion.button>
  )
}
