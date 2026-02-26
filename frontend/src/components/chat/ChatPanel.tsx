import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send } from 'lucide-react'
import { chat as chatApi } from '../../services/api'

interface Message {
  role: string
  content: string
}

export default function ChatPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const history = messages.map((x) => ({ role: x.role, content: x.content }))
      const res = await chatApi.message(text, history)
      setMessages((m) => [...m, { role: res.role, content: res.content }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ds-accent text-ds-text-inverse shadow-ds-surface-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI chat"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-40 flex h-[420px] w-[380px] flex-col overflow-hidden rounded-2xl border border-ds-text-muted/20 bg-ds-bg-elevated shadow-ds-surface-lg backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-ds-text-muted/20 px-4 py-3">
              <span className="font-semibold text-ds-text-primary">AI Assistant</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-ds-text-muted transition hover:bg-ds-bg-surface hover:text-ds-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-ds-text-muted">Ask about expenses, fraud, inventory, or reports.</p>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-ds-accent text-ds-text-inverse'
                        : 'bg-ds-bg-surface text-ds-text-secondary'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-1 rounded-2xl bg-ds-bg-surface px-4 py-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ds-text-muted [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ds-text-muted [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ds-text-muted [animation-delay:300ms]" />
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-ds-text-muted/20 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-ds-text-muted/20 bg-ds-bg-surface px-4 py-2.5 text-ds-text-primary placeholder:text-ds-text-muted outline-none focus:border-ds-accent"
                />
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-ds-accent p-2.5 text-ds-text-inverse disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Send className="h-5 w-5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
