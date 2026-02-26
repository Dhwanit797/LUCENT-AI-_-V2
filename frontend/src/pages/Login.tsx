import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin, register as apiRegister } from '../services/api'

const WORD_VARIANTS = {
  hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.8, delay: 0.1 + i * 0.09, ease: [0.22, 1, 0.36, 1] },
  }),
}

const HEADLINE = ['Turn Business', 'Data Into', 'Intelligent', 'Decisions.']

const inputClass =
  'w-full rounded-xl px-4 py-3 text-ds-text-primary placeholder:text-ds-text-muted outline-none ring-2 ring-transparent transition-all duration-200 focus:ring-ds-accent'
const inputStyle = {
  background: 'rgb(var(--ds-bg-elevated))',
  border: '1px solid rgb(var(--ds-border) / 0.15)',
}

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register fields
  const [fullName, setFullName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [company, setCompany] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  function switchMode(next: 'login' | 'register') {
    setError('')
    setMode(next)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiLogin(email, password)
      login(res.access_token, res.user)

      // small microtask delay so context updates
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (regPassword !== regConfirm) {
      setError('Passwords do not match')
      return
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await apiLogin(email, password)
      login(res.access_token, res.user)

      // small microtask delay so context updates
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full" style={{ background: 'rgb(var(--ds-bg-base))' }}>
      {/* Left panel */}
      <div
        className="relative hidden w-[55%] flex-col justify-center overflow-hidden px-12 py-16 md:flex xl:px-20"
        style={{ background: 'var(--ds-gradient-hero-left)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 20% 50%, rgb(var(--ds-accent) / 0.12) 0%, transparent 55%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 40% at 80% 20%, rgb(var(--ds-accent-teal) / 0.08) 0%, transparent 50%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 40% 40% at 60% 80%, rgb(var(--ds-accent) / 0.06) 0%, transparent 55%)' }} />
        </div>
        <div className="noise-overlay" />

        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgb(var(--ds-accent) / 0.4), transparent)' }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.1 }}
        />

        <motion.div
          className="relative z-10 mb-10"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <span className="text-lg font-bold tracking-tight text-ds-text-primary" style={{ fontFamily: 'var(--ds-font-display)' }}>
              Lucent AI
            </span>
        </motion.div>

        <div className="relative z-10 max-w-lg">
          <h1 className="leading-[1.08] text-[2.6rem] font-bold text-ds-text-primary xl:text-[3rem]" style={{ fontFamily: 'var(--ds-font-display)' }}>
            {HEADLINE.map((line, i) => (
              <div key={i} className="overflow-hidden">
                <motion.span className="block" variants={WORD_VARIANTS} custom={i} initial="hidden" animate="visible">
                  {i === HEADLINE.length - 1 ? (
                    <span style={{ background: 'linear-gradient(135deg, rgb(var(--ds-accent)), rgb(var(--ds-accent-teal)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {line}
                    </span>
                  ) : line}
                </motion.span>
              </div>
            ))}
          </h1>

          <motion.p
            className="mt-6 text-lg leading-relaxed text-ds-text-secondary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
          >
            AI-powered platform for expenses, fraud detection, inventory, sustainability, and analytics — in one place.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap gap-2.5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {['Analytics', 'Fraud Detection', 'Inventory', 'Sustainability'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-3 py-1 text-xs font-medium text-ds-text-secondary"
                style={{ borderColor: 'rgb(var(--ds-border) / 0.3)', background: 'rgb(var(--ds-bg-surface) / 0.5)' }}
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i % 3 === 0 ? '6px' : '4px',
                height: i % 3 === 0 ? '6px' : '4px',
                left: `${12 + (i * 8) % 70}%`,
                top: `${18 + (i * 9) % 65}%`,
                background: i % 2 === 0 ? 'rgb(var(--ds-accent))' : 'rgb(var(--ds-accent-teal))',
              }}
              animate={{ y: [0, -14, 0], opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 4 + i * 0.35, repeat: Infinity, delay: i * 0.28, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className="flex w-full flex-1 items-center justify-center px-6 py-12 md:w-[45%]"
        style={{ background: 'rgb(var(--ds-bg-elevated))' }}
      >
        <motion.div
          className="w-full max-w-[400px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mobile brand */}
          <div className="mb-8 md:hidden">
              <span className="text-xl font-bold text-ds-text-primary" style={{ fontFamily: 'var(--ds-font-display)' }}>
                Lucent AI
              </span>
          </div>

          <div
            className="rounded-2xl p-8"
            style={{
              background: 'linear-gradient(145deg, rgb(var(--ds-bg-surface)), rgb(var(--ds-bg-elevated)))',
              boxShadow: 'var(--ds-surface-shadow-lg)',
              border: '1px solid rgb(var(--ds-border) / 0.08)',
            }}
          >
            {/* Mode toggle tabs */}
            <div
              className="mb-7 flex rounded-xl p-1 gap-1"
              style={{ background: 'rgb(var(--ds-bg-elevated))' }}
            >
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className="relative flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-200"
                  style={{
                    color: mode === m ? 'rgb(var(--ds-text-primary))' : 'rgb(var(--ds-text-muted))',
                  }}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgb(var(--ds-bg-surface))' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 capitalize">{m === 'login' ? 'Sign in' : 'Create account'}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.form
                  key="login"
                  onSubmit={handleLogin}
                  className="space-y-5"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div>
                    <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-ds-text-primary">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-ds-text-primary">Password</label>
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  {error && <ErrorBanner message={error} />}

                  <SubmitButton loading={loading} label="Sign in" />

                  <p className="text-center text-xs text-ds-text-muted">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => switchMode('register')} className="font-medium text-ds-text-secondary hover:text-ds-text-primary transition-colors">
                      Create one
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  onSubmit={handleRegister}
                  className="space-y-4"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label htmlFor="reg-name" className="mb-2 block text-sm font-medium text-ds-text-primary">Full name</label>
                      <input
                        id="reg-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                        placeholder="Jane Smith"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="reg-company" className="mb-2 block text-sm font-medium text-ds-text-primary">
                        Company <span className="text-ds-text-muted font-normal">(optional)</span>
                      </label>
                      <input
                        id="reg-company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                        placeholder="Acme Corp"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-email" className="mb-2 block text-sm font-medium text-ds-text-primary">Email</label>
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-password" className="mb-2 block text-sm font-medium text-ds-text-primary">Password</label>
                    <input
                      id="reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="Min. 8 characters"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-confirm" className="mb-2 block text-sm font-medium text-ds-text-primary">Confirm password</label>
                    <input
                      id="reg-confirm"
                      type="password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  {error && <ErrorBanner message={error} />}

                  <SubmitButton loading={loading} label="Create account" />

                  <p className="text-center text-xs text-ds-text-muted">
                    Already have an account?{' '}
                    <button type="button" onClick={() => switchMode('login')} className="font-medium text-ds-text-secondary hover:text-ds-text-primary transition-colors">
                      Sign in
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.p
      className="rounded-xl px-4 py-2.5 text-sm font-medium"
      style={{
        background: 'rgb(var(--ds-accent-danger) / 0.12)',
        color: 'rgb(var(--ds-accent-danger))',
        border: '1px solid rgb(var(--ds-accent-danger) / 0.2)',
      }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {message}
    </motion.p>
  )
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      className="group relative w-full overflow-hidden rounded-xl py-3.5 font-semibold text-white transition-all duration-200 disabled:opacity-60"
      style={{
        background: 'linear-gradient(135deg, rgb(var(--ds-accent)) 0%, rgb(var(--ds-accent-teal)) 100%)',
        boxShadow: '0 4px 18px rgb(var(--ds-accent) / 0.32)',
      }}
      whileHover={{ y: -1, boxShadow: '0 6px 24px rgb(var(--ds-accent) / 0.44)', transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98, y: 0, transition: { duration: 0.1 } }}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative">
        {loading ? (
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : label}
      </span>
    </motion.button>
  )
}
