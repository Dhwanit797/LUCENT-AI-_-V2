import { Outlet } from 'react-router-dom'

/**
 * Full-viewport auth layout — no centering; Login owns its split layout
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-ds-bg-base">
      <Outlet />
    </div>
  )
}
