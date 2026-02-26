import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Zap, RefreshCw } from 'lucide-react'
import { ai, health, recommendations, carbon } from '../../services/api'
import { expenseApi } from '../../modules/ExpenseSense/services/api'
import { fraudApi } from '../../modules/FraudLens/services/api'
import { inventoryApi } from '../../modules/SmartInventory/services/api'
import { greenApi } from '../../modules/GreenGrid/services/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'What are my current expenses?',
  'Any fraud risks detected?',
  'Which items are low in stock?',
  'What is my business health score?',
  'How is my energy usage?',
]

function formatResponse(text: string) {
  return text.split(/\n\n+/).map((para, i) => (
    <p key={i} className="mb-2 last:mb-0 leading-relaxed">
      {para.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong
            key={j}
            style={{ color: 'rgb(var(--ds-accent))', fontWeight: 600 }}
          >
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={j}>{part}</span>
        )
      )}
    </p>
  ))
}

/**
 * Fetch module data only when the module actually has real uploaded data.
 * Each module's /status endpoint returns { has_data: boolean }.
 * When has_data is false we pass null so the AI backend responds with
 * "please upload data" messages instead of random mock numbers.
 */
async function fetchModuleData(): Promise<Record<string, unknown>> {
  // Check all status endpoints in parallel (failures treated as no-data)
  const [expStatus, fraudStatus, invStatus, greenStatus] = await Promise.all([
    expenseApi.status().catch(() => ({ has_data: false })),
    fraudApi.status().catch(() => ({ has_data: false })),
    inventoryApi.status().catch(() => ({ has_data: false })),
    greenApi.status().catch(() => ({ has_data: false })),
  ])

  // Fetch data only for modules that have real data; pass null otherwise
  const results = await Promise.allSettled([
    health.score().catch(() => null),
    expStatus.has_data   ? expenseApi.summary().catch(() => null)   : Promise.resolve(null),
    fraudStatus.has_data ? fraudApi.insights().catch(() => null)    : Promise.resolve(null),
    invStatus.has_data   ? inventoryApi.summary().catch(() => null) : Promise.resolve(null),
    greenStatus.has_data ? greenApi.data().catch(() => null)        : Promise.resolve(null),
    carbon.estimate().catch(() => null),
    recommendations.list().catch(() => []),
  ])

  const [h, e, f, inv, g, c, r] = results
  return {
    health:          h.status === 'fulfilled'   ? h.value   : null,
    expense:         e.status === 'fulfilled'   ? e.value   : null,
    fraud:           f.status === 'fulfilled'   ? f.value   : null,
    inventory:       inv.status === 'fulfilled' ? inv.value : null,
    green_grid:      g.status === 'fulfilled'   ? g.value   : null,
    carbon:          c.status === 'fulfilled'   ? c.value   : null,
    recommendations: r.status === 'fulfilled'   ? r.value   : [],
  }
}

export default function BusinessAssistantPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [moduleData, setModuleData] = useState<Record<string, unknown>>({})
  const [dataReady, setDataReady] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadModuleData = useCallback(async () => {
    setDataLoading(true)
    try {
      const data = await fetchModuleData()
      setModuleData(data)
      setDataReady(true)
    } catch {
      setDataReady(true)
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadModuleData()
      setTimeout(() => inputRef.current?.focus(), 320)
    }
  }, [open, loadModuleData])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const question = (text ?? input).trim()
    if (!question || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: question }])
    setLoading(true)
    try {
      const res = await ai.ask(question, moduleData)
      setMessages((m) => [...m, { role: 'assistant', content: res.answer }])
    } catch (err) {
      const msg =
        err instanceof Error && err.message !== 'UNAUTHORIZED'
          ? 'Something went wrong. Please try again.'
          : 'Session expired — please log in again.'
      setMessages((m) => [...m, { role: 'assistant', content: msg }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
        <motion.button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full sm:right-6"
        style={{
          background: open
            ? 'rgb(var(--ds-bg-surface))'
            : 'linear-gradient(135deg, rgb(var(--ds-accent)) 0%, rgb(var(--ds-accent-teal)) 100%)',
          border: open ? '1px solid rgb(var(--ds-accent) / 0.35)' : 'none',
          boxShadow: open
            ? '0 4px 24px rgb(0 0 0 / 0.4)'
            : '0 0 24px rgb(var(--ds-accent) / 0.45), 0 4px 16px rgb(0 0 0 / 0.4)',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
              transition={{ duration: 0.18 }}
            >
              <X className="h-5 w-5" style={{ color: 'rgb(var(--ds-accent))' }} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ opacity: 0, rotate: 90, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.7 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle className="h-6 w-6" style={{ color: 'rgb(var(--ds-bg-base))' }} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="fixed z-50 flex flex-col overflow-hidden rounded-2xl"
            style={{
              /* Mobile: stretch edge-to-edge with small margin */
              bottom: '5.5rem',
              right: '1rem',
              left: '1rem',
              /* On sm+ screens: fixed width anchored to right */
              maxWidth: '420px',
              marginLeft: 'auto',
              height: 'min(520px, calc(100dvh - 9rem))',
              background: 'rgb(var(--ds-bg-elevated))',
              border: '1px solid rgb(var(--ds-accent) / 0.18)',
              boxShadow:
                '0 0 0 1px rgb(var(--ds-accent) / 0.07), 0 24px 64px rgb(0 0 0 / 0.6), 0 0 40px rgb(var(--ds-accent) / 0.06)',
            }}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center gap-3 px-4 py-3"
              style={{
                borderBottom: '1px solid rgb(var(--ds-accent) / 0.12)',
                background:
                  'linear-gradient(90deg, rgb(var(--ds-bg-surface)) 0%, rgb(var(--ds-bg-elevated)) 100%)',
              }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgb(var(--ds-accent) / 0.18) 0%, rgb(var(--ds-accent-teal) / 0.12) 100%)',
                  border: '1px solid rgb(var(--ds-accent) / 0.25)',
                }}
              >
                <Zap className="h-4 w-4" style={{ color: 'rgb(var(--ds-accent))' }} />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-semibold leading-tight truncate"
                  style={{
                    color: 'rgb(var(--ds-text-primary))',
                    fontFamily: 'var(--ds-font-display)',
                  }}
                >
                  AI Assistant
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'rgb(var(--ds-accent))', fontFamily: 'var(--ds-font-mono)' }}
                >
                  {dataLoading ? (
                    <span className="animate-pulse">Loading data...</span>
                  ) : dataReady ? (
                    '● Live data connected'
                  ) : (
                    'Connecting...'
                  )}
                </p>
              </div>

              <motion.button
                type="button"
                onClick={loadModuleData}
                disabled={dataLoading}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                style={{ color: 'rgb(var(--ds-text-muted))' }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                title="Refresh module data"
              >
                <motion.div
                  animate={dataLoading ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    dataLoading
                      ? { repeat: Infinity, duration: 1, ease: 'linear' }
                      : { duration: 0 }
                  }
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </motion.div>
              </motion.button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                style={{ color: 'rgb(var(--ds-text-muted))' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.color = 'rgb(var(--ds-text-primary))'
                  el.style.background = 'rgb(var(--ds-bg-surface-hover))'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.color = 'rgb(var(--ds-text-muted))'
                  el.style.background = 'transparent'
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ scrollbarWidth: 'thin' }}
            >
              {/* Welcome state */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background:
                        'linear-gradient(135deg, rgb(var(--ds-accent) / 0.07) 0%, rgb(var(--ds-accent-teal) / 0.05) 100%)',
                      border: '1px solid rgb(var(--ds-accent) / 0.15)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4" style={{ color: 'rgb(var(--ds-accent))' }} />
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: 'rgb(var(--ds-accent))',
                          fontFamily: 'var(--ds-font-mono)',
                        }}
                      >
                        BUSINESS AI
                      </span>
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'rgb(var(--ds-text-secondary))' }}
                    >
                      Ask me about your{' '}
                      <span style={{ color: 'rgb(var(--ds-text-primary))' }}>expenses</span>,{' '}
                      <span style={{ color: 'rgb(var(--ds-text-primary))' }}>fraud risks</span>,{' '}
                      <span style={{ color: 'rgb(var(--ds-text-primary))' }}>inventory</span>,{' '}
                      <span style={{ color: 'rgb(var(--ds-text-primary))' }}>health score</span>, or{' '}
                      <span style={{ color: 'rgb(var(--ds-text-primary))' }}>sustainability</span>.
                    </p>
                  </div>

                  {/* Suggestion chips */}
                  <div className="space-y-2">
                    <p
                      className="text-xs"
                      style={{
                        color: 'rgb(var(--ds-text-muted))',
                        fontFamily: 'var(--ds-font-mono)',
                      }}
                    >
                      SUGGESTIONS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          disabled={loading || dataLoading}
                          className="rounded-lg px-3 py-1.5 text-xs transition-all disabled:opacity-40 text-left"
                          style={{
                            background: 'rgb(var(--ds-bg-surface))',
                            border: '1px solid rgb(var(--ds-accent) / 0.2)',
                            color: 'rgb(var(--ds-text-secondary))',
                            fontFamily: 'var(--ds-font-sans)',
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLButtonElement
                            el.style.borderColor = 'rgb(var(--ds-accent) / 0.5)'
                            el.style.color = 'rgb(var(--ds-accent))'
                            el.style.background = 'rgb(var(--ds-accent) / 0.06)'
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLButtonElement
                            el.style.borderColor = 'rgb(var(--ds-accent) / 0.2)'
                            el.style.color = 'rgb(var(--ds-text-secondary))'
                            el.style.background = 'rgb(var(--ds-bg-surface))'
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Message list */}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`flex items-end gap-2 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mb-0.5"
                      style={{
                        background: 'rgb(var(--ds-accent) / 0.15)',
                        border: '1px solid rgb(var(--ds-accent) / 0.3)',
                      }}
                    >
                      <Bot className="h-3 w-3" style={{ color: 'rgb(var(--ds-accent))' }} />
                    </div>
                  )}

                  <div
                    className="max-w-[82%] rounded-2xl px-4 py-2.5 text-sm"
                    style={
                      msg.role === 'user'
                        ? {
                            background:
                              'linear-gradient(135deg, rgb(var(--ds-accent)) 0%, rgb(var(--ds-accent-teal)) 100%)',
                            color: 'rgb(var(--ds-bg-base))',
                            borderBottomRightRadius: '4px',
                            fontWeight: 500,
                          }
                        : {
                            background: 'rgb(var(--ds-bg-surface))',
                            border: '1px solid rgb(var(--ds-accent) / 0.1)',
                            color: 'rgb(var(--ds-text-secondary))',
                            borderBottomLeftRadius: '4px',
                          }
                    }
                  >
                    {msg.role === 'assistant'
                      ? formatResponse(msg.content)
                      : msg.content}
                  </div>

                  {msg.role === 'user' && (
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mb-0.5"
                      style={{
                        background: 'rgb(var(--ds-accent) / 0.15)',
                        border: '1px solid rgb(var(--ds-accent) / 0.3)',
                      }}
                    >
                      <User className="h-3 w-3" style={{ color: 'rgb(var(--ds-accent))' }} />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-2 justify-start"
                >
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: 'rgb(var(--ds-accent) / 0.15)',
                      border: '1px solid rgb(var(--ds-accent) / 0.3)',
                    }}
                  >
                    <Bot className="h-3 w-3" style={{ color: 'rgb(var(--ds-accent))' }} />
                  </div>
                  <div
                    className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
                    style={{
                      background: 'rgb(var(--ds-bg-surface))',
                      border: '1px solid rgb(var(--ds-accent) / 0.1)',
                      borderBottomLeftRadius: '4px',
                    }}
                  >
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="h-1.5 w-1.5 animate-bounce rounded-full"
                        style={{
                          background: 'rgb(var(--ds-accent))',
                          animationDelay: `${delay}ms`,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div
              className="shrink-0 p-3"
              style={{
                borderTop: '1px solid rgb(var(--ds-accent) / 0.12)',
                background: 'rgb(var(--ds-bg-surface))',
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your business metrics..."
                  disabled={loading}
                    className="flex-1 min-w-0 rounded-xl px-4 py-2.5 text-sm outline-none transition-all disabled:opacity-50"
                  style={{
                    background: 'rgb(var(--ds-bg-elevated))',
                    border: '1px solid rgb(var(--ds-accent) / 0.18)',
                    color: 'rgb(var(--ds-text-primary))',
                    fontFamily: 'var(--ds-font-sans)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgb(var(--ds-accent) / 0.5)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgb(var(--ds-accent) / 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgb(var(--ds-accent) / 0.18)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <motion.button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-opacity disabled:opacity-40"
                  style={{
                    background:
                      'linear-gradient(135deg, rgb(var(--ds-accent)) 0%, rgb(var(--ds-accent-teal)) 100%)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                >
                  <Send className="h-4 w-4" style={{ color: 'rgb(var(--ds-bg-base))' }} />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
