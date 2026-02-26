import { Outlet } from 'react-router-dom'

/**
 * Minimal layout for public landing — no sidebar, full viewport
 */
export default function MainLayout() {
  return (
    <div className="min-h-screen bg-ds-bg-base">
      <Outlet />
    </div>
  )
}
