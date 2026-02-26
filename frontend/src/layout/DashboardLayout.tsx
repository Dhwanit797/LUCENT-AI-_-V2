import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import BusinessAssistantPanel from '../components/chat/BusinessAssistantPanel'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen bg-ds-bg-base transition-colors duration-300">
      <DashboardSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />

      <main className="relative flex-1 overflow-auto">
        {/* Dot grid background */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage: 'radial-gradient(rgb(var(--ds-accent) / 0.07) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Ambient glow — top left */}
        <div
          className="pointer-events-none fixed left-0 top-0 z-0 h-[500px] w-[500px] rounded-full blur-[120px]"
          style={{ background: 'rgb(var(--ds-accent) / 0.03)', transform: 'translate(-30%, -30%)' }}
        />
        {/* Ambient glow — bottom right */}
        <div
          className="pointer-events-none fixed bottom-0 right-0 z-0 h-[400px] w-[400px] rounded-full blur-[100px]"
          style={{ background: 'rgb(var(--ds-accent-teal) / 0.025)', transform: 'translate(30%, 30%)' }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </div>
      </main>

      <BusinessAssistantPanel />
    </div>
  )
}
