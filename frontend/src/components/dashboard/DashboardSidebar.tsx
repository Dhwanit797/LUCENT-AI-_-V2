import { useState, useEffect, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Receipt,
  Shield,
  Package,
  Leaf,
  ChevronRight,
  Settings,
  LogOut,
  Zap,
  Activity,
  Building2,
  Boxes,
  TrendingUp,
} from 'lucide-react'
import { api } from '../../services/api'

const nav = [
  { to: '/dashboard',          label: 'Dashboard',       icon: LayoutDashboard, color: '#00D4FF', glow: 'rgba(0,212,255,0.35)',   end: true  },
  { to: '/modules/expense',    label: 'Expense Sense',   icon: Receipt,         color: '#38AAF8', glow: 'rgba(56,170,248,0.35)',  end: false },
  { to: '/modules/fraud',      label: 'Fraud Lens',      icon: Shield,          color: '#20D2BA', glow: 'rgba(32,210,186,0.35)',  end: false },
  { to: '/modules/inventory',  label: 'Smart Inventory', icon: Package,         color: '#34D399', glow: 'rgba(52,211,153,0.35)',  end: false },
  { to: '/modules/green-grid', label: 'Green Grid',      icon: Leaf,            color: '#4ADE80', glow: 'rgba(74,222,128,0.35)',  end: false },
  { to: '/modules/revenue-intelligence', label: 'Revenue Intelligence', icon: TrendingUp, color: '#38BDF8', glow: 'rgba(56,189,248,0.35)', end: false },
  { to: '/vendors',            label: 'Vendors',         icon: Building2,       color: '#38BDF8', glow: 'rgba(56,189,248,0.35)',  end: true  },
  { to: '/products',           label: 'Products',        icon: Boxes,           color: '#F97316', glow: 'rgba(249,115,22,0.35)',  end: true  },
  { to: '/dashboard/settings', label: 'Settings',        icon: Settings,        color: '#A78BFA', glow: 'rgba(167,139,250,0.35)', end: true  },
]

export default function DashboardSidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { user, logout } = useAuth()
  const [time, setTime] = useState(new Date())
  const [fraudAlertCount, setFraudAlertCount] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetchFraudAlertCount = useCallback(async () => {
    try {
      const s = await api<{ has_data: boolean }>('/fraud/status')
      if (!s.has_data) {
        setFraudAlertCount(0)
        return
      }
      const d = await api<{ alerts: { id: number; type: string; score: number }[] }>('/fraud/insights')
      setFraudAlertCount(d.alerts?.length ?? 0)
    } catch {
      // swallow errors, keep existing badge state
    }
  }, [])

  useEffect(() => {
    // Initial fetch of fraud alert count for badge
    fetchFraudAlertCount()
  }, [fetchFraudAlertCount])

  useEffect(() => {
    // Listen for Fraud Lens updates / clears so we can keep the badge in sync
    const handler = () => {
      fetchFraudAlertCount()
    }
    window.addEventListener('fraud:updated', handler)
    window.addEventListener('fraud:cleared', handler)
    return () => {
      window.removeEventListener('fraud:updated', handler)
      window.removeEventListener('fraud:cleared', handler)
    }
  }, [fetchFraudAlertCount])

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.aside
      className="sticky top-0 z-30 flex h-screen flex-col overflow-hidden"
      initial={false}
      animate={{ width: open ? 252 : 64 }}
      transition={{ type: 'spring', stiffness: 340, damping: 34 }}
      style={{
        background: 'linear-gradient(180deg, rgb(var(--ds-bg-elevated)) 0%, rgb(var(--ds-bg-base)) 50%, rgb(var(--ds-bg-elevated)) 100%)',
        borderRight: '1px solid rgb(var(--ds-accent) / 0.07)',
        flexShrink: 0,
      }}
    >
      {/* Top glow line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.5) 50%, transparent 100%)' }} />

      {/* Subtle dot grid bg */}
      <div className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(0,212,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

      {/* ── Logo / Brand ──────────────────────────────── */}
      <div className="relative flex h-[60px] shrink-0 items-center justify-between pl-3 pr-3"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}>

        {/* Logo mark always visible */}
        <motion.div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.18), rgba(0,255,195,0.08))',
            border: '1px solid rgba(0,212,255,0.28)',
            boxShadow: '0 0 16px rgba(0,212,255,0.18)',
          }}
          whileHover={{ scale: 1.08 }}
        >
          <Zap className="h-4 w-4" style={{ color: '#00D4FF' }} />
        </motion.div>

        {/* Brand text */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="brand"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="ml-2.5 flex-1 min-w-0"
            >
              <p className="text-sm font-black leading-tight truncate"
                style={{
                  fontFamily: 'var(--ds-font-display)',
                  background: 'linear-gradient(135deg, #00D4FF 0%, #00FFC3 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  letterSpacing: '0.04em',
                }}>
                  LUCENT AI
              </p>
              <p className="text-[9px] leading-tight truncate"
                style={{ color: 'rgba(108,128,162,0.6)', fontFamily: 'var(--ds-font-mono)', letterSpacing: '0.12em' }}>
                INTELLIGENCE
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle chevron */}
        <motion.button
          type="button"
          onClick={onToggle}
          className="absolute right-1 top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full"
          style={{
            background: 'rgb(var(--ds-bg-elevated))',
            border: '1px solid rgba(0,212,255,0.22)',
            boxShadow: '0 0 10px rgba(0,212,255,0.12)',
            color: '#00D4FF',
          }}
          whileHover={{ scale: 1.18, boxShadow: '0 0 16px rgba(0,212,255,0.3)' }}
          whileTap={{ scale: 0.9 }}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.div>
        </motion.button>
      </div>

      {/* ── Live status ───────────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-3 pt-3"
          >
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(34,197,148,0.06)', border: '1px solid rgba(34,197,148,0.15)' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ background: '#22c594' }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: '#22c594' }} />
              </span>
              <span className="flex-1 text-[9px] font-bold uppercase tracking-[0.1em]"
                style={{ color: '#22c594', fontFamily: 'var(--ds-font-mono)' }}>
                ALL SYSTEMS ONLINE
              </span>
              <span className="text-[9px] tabular-nums font-bold"
                style={{ color: 'rgba(34,197,148,0.6)', fontFamily: 'var(--ds-font-mono)' }}>
                {timeStr}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav section label ──────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            key="nav-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="px-4 pb-1 pt-4 text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'rgba(108,128,162,0.45)', fontFamily: 'var(--ds-font-mono)' }}
          >
            Navigation
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Nav items ─────────────────────────────────── */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-1">
          {nav.map(({ to, label, icon: Icon, color, glow, end }) => (
            <NavLink key={to} to={to} end={end}>
              {({ isActive }) => (
                <motion.div
                  className="relative flex items-center gap-3 overflow-hidden rounded-xl px-2.5 py-2 cursor-pointer"
                  style={{
                    background: isActive ? `${color}12` : 'transparent',
                    border: isActive ? `1px solid ${color}22` : '1px solid transparent',
                  }}
                  whileHover={{
                    background: `${color}0e`,
                    border: `1px solid ${color}18`,
                    transition: { duration: 0.12 },
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <motion.div
                      layoutId="active-bar"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                      style={{ background: color, boxShadow: `0 0 10px ${glow}` }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: isActive ? `${color}16` : 'rgb(var(--ds-bg-elevated))',
                      border: `1px solid ${isActive ? `${color}28` : 'rgb(var(--ds-border) / 0.12)'}`,
                      boxShadow: isActive ? `0 0 12px ${color}25` : 'none',
                    }}
                  >
                    <Icon className="h-4 w-4"
                      style={{ color: isActive ? color : 'rgb(var(--ds-text-muted))' }} />
                    {/* Active pulse dot */}
                    {isActive && !open && (
                      <motion.div
                        className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full"
                        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    {/* Fraud alert badge */}
                    {to === '/modules/fraud' && fraudAlertCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black"
                        style={{
                          background: '#f84646',
                          color: '#fff',
                          fontFamily: 'var(--ds-font-mono)',
                          boxShadow: '0 0 8px rgba(248,70,70,0.6)',
                          zIndex: 20,
                        }}
                      >
                        {fraudAlertCount > 9 ? '9+' : fraudAlertCount}
                      </motion.div>
                    )}
                  </div>

                  {/* Label */}
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.16 }}
                        className="overflow-hidden whitespace-nowrap text-sm font-semibold"
                        style={{
                          color: isActive ? color : 'rgb(var(--ds-text-secondary))',
                          fontFamily: 'var(--ds-font-sans)',
                        }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Fraud count label badge (expanded sidebar) */}
                  {open && to === '/modules/fraud' && fraudAlertCount > 0 && (
                    <AnimatePresence>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-black"
                        style={{
                          background: 'rgba(248,70,70,0.12)',
                          color: '#f84646',
                          fontFamily: 'var(--ds-font-mono)',
                          border: '1px solid rgba(248,70,70,0.2)',
                        }}
                      >
                        {fraudAlertCount}
                      </motion.span>
                    </AnimatePresence>
                  )}

                  {/* Shimmer on active */}
                  {isActive && (
                    <div className="pointer-events-none absolute inset-0 rounded-xl"
                      style={{
                        background: `linear-gradient(105deg, transparent 30%, ${color}10 50%, transparent 70%)`,
                      }} />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="mx-3 h-px" style={{ background: 'rgba(0,212,255,0.06)' }} />

      {/* ── User footer ─────────────────────────────────── */}
      <div className="shrink-0 p-2">
        <AnimatePresence initial={false}>
          {open && user && (
            <motion.div
              key="user-card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="mb-1.5 overflow-hidden"
            >
                <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.1)' }}>
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.18), rgba(0,255,195,0.1))',
                    border: '1px solid rgba(0,212,255,0.22)',
                    color: '#00D4FF',
                    fontFamily: 'var(--ds-font-mono)',
                    boxShadow: '0 0 10px rgba(0,212,255,0.12)',
                  }}
                >
                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold"
                      style={{ color: 'rgb(var(--ds-text-primary))', fontFamily: 'var(--ds-font-sans)' }}>
                    {user.full_name || user.email}
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.1em]"
                    style={{ color: 'rgba(0,212,255,0.5)', fontFamily: 'var(--ds-font-mono)' }}>
                    PRO TIER
                  </p>
                </div>
                <Activity className="h-3 w-3 shrink-0" style={{ color: '#22c594' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout */}
        <motion.button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2"
          style={{ color: 'rgba(108,128,162,0.65)' }}
          whileHover={{ color: '#f84646', transition: { duration: 0.12 } } as any}
          whileTap={{ scale: 0.97 }}
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'rgb(var(--ds-bg-elevated))', border: '1px solid rgb(var(--ds-border) / 0.1)' }}>
            <LogOut className="h-3.5 w-3.5" />
          </div>
          <AnimatePresence initial={false}>
            {open && (
              <motion.span
                key="logout"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.16 }}
                className="overflow-hidden whitespace-nowrap text-sm font-semibold"
              >
                Log out
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Bottom glow line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.3) 50%, transparent 100%)' }} />
    </motion.aside>
  )
}
