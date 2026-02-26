import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const TOKEN_KEY = 'business_ai_token'
const USER_KEY = 'business_ai_user'

type User = { email: string; full_name?: string } | null

interface AuthContextType {
  token: string | null
  user: User
  login: (token: string, user: User) => void
  logout: () => void
  isValid: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User>(() => {
    try {
      const u = localStorage.getItem(USER_KEY)
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })
  const [isValid, setIsValid] = useState(true)

  const login = useCallback((t: string, u: User) => {
    setToken(t)
    setUser(u)
    localStorage.setItem(TOKEN_KEY, t)
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
    setIsValid(true)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setIsValid(false)
  }, [])

  // Optional: validate token by decoding expiry (client-side check only)
  useEffect(() => {
    if (!token) {
      setIsValid(false)
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp * 1000
      if (Date.now() >= exp) {
        logout()
        return
      }
      setIsValid(true)
    } catch {
      setIsValid(false)
    }
  }, [token, logout])

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isValid: !!token && isValid }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
