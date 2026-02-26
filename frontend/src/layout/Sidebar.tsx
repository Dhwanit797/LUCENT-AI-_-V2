import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Receipt,
  Shield,
  Package,
  Leaf,
  ChevronLeft,
  LogOut,
  Building2,
  Boxes,
} from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expense', label: 'Expense Sense', icon: Receipt },
  { to: '/fraud', label: 'Fraud Lens', icon: Shield },
  { to: '/inventory', label: 'Smart Inventory', icon: Package },
  { to: '/green-grid', label: 'Green Grid', icon: Leaf },
  { to: '/vendors', label: 'Vendors', icon: Building2 },
  { to: '/products', label: 'Products', icon: Boxes },
]

export default function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { user, logout } = useAuth()

  return (
    <motion.aside
      className="sticky top-0 flex h-screen flex-col border-r border-white/10 bg-surface-900/80 backdrop-blur-xl"
      initial={false}
      animate={{ width: open ? 240 : 72 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-3">
        {open && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="truncate text-lg font-semibold text-white"
          >
              Lucent AI
          </motion.span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <motion.div animate={{ rotate: open ? 0 : 180 }}>
            <ChevronLeft className="h-5 w-5" />
          </motion.div>
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-accent-blue/20 text-accent-blue'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-2">
        {open && user && (
          <p className="truncate px-3 py-2 text-xs text-slate-500">
            {user.full_name || user.email}
          </p>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {open && <span>Log out</span>}
        </button>
      </div>
    </motion.aside>
  )
}
