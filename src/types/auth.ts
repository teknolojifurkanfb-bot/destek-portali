export type UserRole = 'customer' | 'agent' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  company: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  profile: Profile
}

// Her rolün erişebileceği route'lar
export const ROLE_ROUTES: Record<UserRole, string> = {
  customer: '/dashboard',
  agent: '/agent',
  admin: '/admin',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Müşteri',
  agent: 'Destek Temsilcisi',
  admin: 'Yönetici',
}
