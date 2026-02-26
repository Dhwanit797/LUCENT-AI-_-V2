import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Moon, Sun, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-10"
    >
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary md:text-3xl">Settings</h1>
        <p className="mt-1 text-ds-text-secondary">Preferences and account</p>
      </div>

      <div className="rounded-2xl bg-ds-bg-surface p-6 shadow-ds-card">
        <h2 className="text-lg font-semibold text-ds-text-primary">Appearance</h2>
        <p className="mt-1 text-sm text-ds-text-secondary">Choose light or dark theme for the entire app.</p>
        <button
          type="button"
          onClick={toggleTheme}
          className="mt-4 flex items-center gap-3 rounded-xl border border-ds-text-muted/20 bg-ds-bg-elevated px-4 py-3 text-ds-text-primary transition-colors hover:bg-ds-bg-surface-hover"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-ds-accent" aria-hidden />
          ) : (
            <Moon className="h-5 w-5 text-ds-accent" aria-hidden />
          )}
          <span className="font-medium">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>

      <div className="rounded-2xl bg-ds-bg-surface p-6 shadow-ds-card">
        <h2 className="text-lg font-semibold text-ds-text-primary">Account</h2>
        <p className="mt-1 text-sm text-ds-text-secondary">Sign out of your account.</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex items-center gap-3 rounded-xl border border-ds-text-muted/20 bg-ds-bg-elevated px-4 py-3 text-ds-text-primary transition-colors hover:bg-ds-accent-danger/10 hover:border-ds-accent-danger/30"
        >
          <LogOut className="h-5 w-5 text-ds-accent-danger" aria-hidden />
          <span className="font-medium">Log out</span>
        </button>
      </div>
    </motion.div>
  )
}
