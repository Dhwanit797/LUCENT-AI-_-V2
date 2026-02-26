import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import ChatPanel from '../components/chat/ChatPanel'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen bg-surface-950">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <main className="flex-1 overflow-auto transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </div>
      </main>
      <ChatPanel />
    </div>
  )
}
