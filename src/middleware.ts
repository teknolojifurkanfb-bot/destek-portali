import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

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

    if (profile.role === 'admin') return response

    if (profile.permissions && profile.permissions.length > 0) {
      const pageMap: Record<string, string> = {
        '/dashboard/tickets':   'tickets',
        '/dashboard/documents': 'documents',
        '/dashboard/devices':   'devices',
        '/dashboard/kb':        'kb',
        '/dashboard/reports':   'reports',
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

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}