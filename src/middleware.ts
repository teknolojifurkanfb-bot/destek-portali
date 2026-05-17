import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Auth ve heartbeat sayfaları - giriş gerekmez
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/devices/heartbeat')
  ) {
    return NextResponse.next()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, permissions, is_active')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_active) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (profile.role === 'admin') return NextResponse.next()

    if (profile.permissions && profile.permissions.length > 0) {
      const pageMap: Record<string, string> = {
        '/dashboard/tickets':   'tickets',
        '/dashboard/documents': 'documents',
        '/dashboard/devices':   'devices',
        '/dashboard/kb':        'kb',
        '/dashboard/profile':   'profile',
        '/dashboard':           'dashboard',
      }

      const pageKey = Object.keys(pageMap).find(k => pathname === k || pathname.startsWith(k + '/'))
      if (pageKey) {
        const required = pageMap[pageKey]
        if (required !== 'profile' && !profile.permissions.includes(required)) {
          return NextResponse.redirect(new URL('/dashboard/tickets', request.url))
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}