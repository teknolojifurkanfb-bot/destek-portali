'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser, UserRole } from '@/types/auth'
import { ROLE_ROUTES } from '@/types/auth'
import type { User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  logout: () => Promise<void>
  isRole: (role: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
  isRole: () => false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const loadUser = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    setUser(profile ? { id: authUser.id, email: authUser.email!, profile } : null)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => loadUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => loadUser(session?.user ?? null)
    )

    return () => subscription.unsubscribe()
  }, [loadUser, supabase.auth])

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
  }

  function isRole(role: UserRole | UserRole[]): boolean {
    if (!user) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(user.profile.role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Kullanım kolaylığı için yardımcı hook'lar
export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push(redirectTo)
  }, [user, loading, router, redirectTo])

  return { user, loading }
}

export function useRequireRole(role: UserRole | UserRole[]) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      const roles = Array.isArray(role) ? role : [role]
      if (!roles.includes(user.profile.role)) {
        router.push(ROLE_ROUTES[user.profile.role])
      }
    }
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, role, router])

  return { user, loading }
}
