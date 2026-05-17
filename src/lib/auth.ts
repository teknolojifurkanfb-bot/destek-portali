import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole, Profile, AuthUser } from '@/types/auth'
import { ROLE_ROUTES } from '@/types/auth'

/**
 * Mevcut oturumdaki kullanıcıyı ve profilini döndürür.
 * Oturum yoksa null döner.
 */
export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return { id: user.id, email: user.email!, profile }
}

/**
 * Giriş yapılmamışsa login sayfasına yönlendirir.
 * Server Component ve API Route'larda kullan.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Belirli bir rol(ler) gerektiren sayfalar için.
 * Rol uyuşmazsa kendi dashboard'una yönlendirir.
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[]
): Promise<AuthUser> {
  const user = await requireAuth()
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  if (!roles.includes(user.profile.role)) {
    redirect(ROLE_ROUTES[user.profile.role])
  }

  return user
}

/**
 * Zaten giriş yapılmışsa dashboard'a yönlendirir.
 * Login/register sayfalarında kullan.
 */
export async function redirectIfAuthenticated(): Promise<void> {
  const user = await getUser()
  if (user) redirect(ROLE_ROUTES[user.profile.role])
}
