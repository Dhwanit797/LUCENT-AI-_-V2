import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const NAV_LINKS = [
  { href: '#features', label: 'Platform' },
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
]

export default function LandingNav() {
  const location = useLocation()
  const { token, isValid } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isLoggedIn = !!token && isValid
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between transition-all duration-500 ${
        scrolled
          ? 'nav-scrolled border-b border-white/5 px-6 py-3 md:px-10 shadow-[0_1px_0_0_rgba(0,212,255,0.06)]'
          : 'border-b border-transparent bg-transparent px-6 py-5 md:px-10'
      }`}
    >
      {/* Logo */}
      <Link to="/" className="group flex items-center gap-3">
        {/* Animated dot indicator */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: 'rgb(var(--ds-accent))' }} />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: 'rgb(var(--ds-accent))' }} />
        </span>
        <span
          className="font-display text-base font-bold tracking-[0.08em] uppercase text-ds-text-primary transition-colors group-hover:text-ds-accent"
          style={{ letterSpacing: '0.12em' }}
        >
            Lucent<span style={{ color: 'rgb(var(--ds-accent))' }}>AI</span>
        </span>
      </Link>

      {/* Center: nav links (desktop) */}
      <nav className="hidden items-center gap-1 md:flex">
        {NAV_LINKS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="group relative px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-200"
            style={{ color: 'rgb(var(--ds-text-secondary))' }}
          >
            <span className="relative z-10 transition-colors duration-200 group-hover:text-ds-text-primary">
              {label}
            </span>
            {/* Hover bg pill */}
            <span
              className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ background: 'rgb(var(--ds-accent) / 0.06)' }}
            />
            {/* Bottom glow line on hover */}
            <span
              className="absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 transition-all duration-300 group-hover:w-4/5"
              style={{ background: 'rgb(var(--ds-accent))' }}
            />
          </a>
        ))}
      </nav>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <motion.button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-ds-bg-surface/60"
          style={{ color: 'rgb(var(--ds-text-muted))' }}
          whileTap={{ scale: 0.88, transition: { duration: 0.1 } }}
          aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sun className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Moon className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* CTA */}
        <Link to={isLoggedIn ? '/dashboard' : '/login'} className="group relative">
          {/* Neon outer glow */}
          <span
            className="absolute -inset-0.5 rounded-lg opacity-0 blur-md transition-all duration-300 group-hover:opacity-70"
            style={{ background: 'linear-gradient(135deg, rgb(var(--ds-accent)), rgb(var(--ds-accent-teal)))' }}
            aria-hidden
          />
          <motion.span
            className="relative flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold tracking-wide uppercase"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--ds-accent)) 0%, rgb(var(--ds-accent-teal)) 100%)',
              color: '#04060e',
              letterSpacing: '0.06em',
              boxShadow: '0 0 16px rgb(var(--ds-accent) / 0.25)',
            }}
            whileHover={{ y: -1, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.96, y: 0, transition: { duration: 0.1 } }}
          >
            {/* Shimmer sweep */}
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg" aria-hidden>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            </span>
            <span className="relative">{isLoggedIn ? 'Dashboard' : 'Launch'}</span>
          </motion.span>
        </Link>
      </div>
    </header>
  )
}
