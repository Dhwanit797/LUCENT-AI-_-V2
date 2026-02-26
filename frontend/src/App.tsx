import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AnimatePresence } from 'framer-motion'
import MainLayout from './layout/MainLayout'
import AuthLayout from './layout/AuthLayout'
import DashboardLayout from './layout/DashboardLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vendors from './pages/Vendors'
import Products from './pages/Products'
import ExpenseSense from './modules/ExpenseSense'
import FraudLens from './modules/FraudLens'
import SmartInventory from './modules/SmartInventory'
import GreenGrid from './modules/GreenGrid'
import RevenueIntelligence from './modules/RevenueIntelligence'
import Settings from './pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isValid } = useAuth()
  if (!token || !isValid) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public: Cinematic landing */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Landing />} />
        </Route>

        {/* Public: Auth */}
        <Route path="/login" element={<AuthLayout />}>
          <Route index element={<Login />} />
        </Route>

        {/* Protected: Dashboard + modules */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Vendors />} />
        </Route>
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Products />} />
        </Route>
        <Route
          path="/modules"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="expense" element={<ExpenseSense />} />
          <Route path="fraud" element={<FraudLens />} />
          <Route path="inventory" element={<SmartInventory />} />
          <Route path="green-grid" element={<GreenGrid />} />
          <Route path="revenue-intelligence" element={<RevenueIntelligence />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
