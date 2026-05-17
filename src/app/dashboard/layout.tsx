'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { THEMES, applyTheme, getStoredTheme } from '@/lib/themes'
import type { ThemeName } from '@/lib/themes'
import {
  LayoutDashboard,
  Ticket,
  FolderOpen,
  Bot,
  BookOpen,
  Users,
  Tags,
  Building2,
  Palette,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard',     roles: ['agent', 'admin'] },
  { href: '/dashboard/tickets',   icon: Ticket,          label: 'Ticketlar',     roles: ['customer', 'agent', 'admin'] },
  { href: '/dashboard/documents', icon: FolderOpen,      label: 'Dokümanlar',    roles: ['customer', 'agent', 'admin'] },
  { href: '/dashboard/chat',      icon: Bot,             label: 'AI Asistan',    roles: ['agent', 'admin'] },
  { href: '/dashboard/kb',        icon: BookOpen,        label: 'Bilgi Bankası', roles: ['agent', 'admin'] },
]

const ADMIN_ITEMS = [
  { href: '/dashboard/admin/users',       icon: Users,     label: 'Kullanıcılar' },
  { href: '/dashboard/admin/statuses',    icon: Tags,      label: 'Durumlar' },
  { href: '/dashboard/admin/departments', icon: Building2, label: 'Departmanlar' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [role, setRole]           = useState<string>('')
  const [userName, setUserName]   = useState<string>('')
  const [userId, setUserId]       = useState<string>('')
  const [theme, setTheme]         = useState<ThemeName>('light')
  const [showTheme, setShowTheme] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const fetched = useRef(false)

  useEffect(() => {
    const stored = getStoredTheme()
    setTheme(stored)
    applyTheme(stored)
  }, [])

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('role, full_name, theme, id')
        .eq('id', user.id)
        .single()
      if (data) {
        setRole(data.role)
        setUserName(data.full_name || user.email || '')
        setUserId(data.id)
        if (data.theme) {
          setTheme(data.theme as ThemeName)
          applyTheme(data.theme as ThemeName)
        }
      }
    }
    load()
  }, [])

  async function changeTheme(t: ThemeName) {
    setTheme(t)
    applyTheme(t)
    setShowTheme(false)
    if (userId) {
      const supabase = createClient()
      await supabase.from('profiles').update({ theme: t }).eq('id', userId)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const isAdmin = role === 'admin'
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(role))
  const currentTheme = THEMES.find(t => t.name === theme) || THEMES[0]

  const navItemStyle = (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: collapsed ? '10px 0' : '9px 12px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: active ? '#fff' : 'var(--sidebar-text)',
    background: active ? 'var(--sidebar-active-bg)' : 'transparent',
    fontSize: '13px',
    fontWeight: active ? '600' : '400',
    transition: 'all 0.15s',
    justifyContent: collapsed ? 'center' : 'flex-start',
    position: 'relative' as const,
    cursor: 'pointer',
    border: 'none',
    width: '100%',
  })

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s' }}>

      <aside style={{
        width: collapsed ? '64px' : '240px',
        background: 'var(--bg-sidebar)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden', position: 'relative',
      }}>

        {/* Logo */}
        <div style={{ padding: collapsed ? '18px 0' : '18px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', minHeight: '64px' }}>
          <div style={{ width: '34px', height: '34px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: collapsed ? '0 auto' : '0' }}>
            <span style={{ fontSize: '18px' }}>🎧</span>
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>DestekHub</div>
              <div style={{ fontSize: '10px', color: 'var(--sidebar-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Portal</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: collapsed ? '10px 8px' : '10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {visibleNav.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <a key={item.href} href={item.href}
                style={navItemStyle(active)}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: 'var(--sidebar-active)', borderRadius: '0 3px 3px 0' }} />}
                <Icon size={17} color={active ? 'var(--sidebar-active)' : 'var(--sidebar-text)'} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </a>
            )
          })}

          {isAdmin && (
            <>
              {!collapsed && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', padding: '12px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Yönetim</div>}
              {collapsed && <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 4px' }} />}
              {ADMIN_ITEMS.map(item => {
                const active = pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <a key={item.href} href={item.href}
                    style={navItemStyle(active)}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)' }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: 'var(--sidebar-active)', borderRadius: '0 3px 3px 0' }} />}
                    <Icon size={17} color={active ? 'var(--sidebar-active)' : 'var(--sidebar-text)'} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>{item.label}</span>}
                  </a>
                )
              })}
            </>
          )}
        </nav>

        {/* Alt kısım */}
        <div style={{ padding: collapsed ? '10px 8px' : '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '2px' }}>

          {/* Tema */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowTheme(!showTheme)}
              style={{ ...navItemStyle(false), background: 'none', border: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Palette size={17} color="var(--sidebar-text)" strokeWidth={1.8} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Tema</span>}
              {!collapsed && <span style={{ marginLeft: 'auto', fontSize: '14px' }}>{currentTheme.emoji}</span>}
            </button>

            {showTheme && (
              <div style={{
                position: 'absolute', bottom: '44px', left: collapsed ? '68px' : '0',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '8px', minWidth: '180px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 100,
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tema seç</div>
                {THEMES.map(t => (
                  <button key={t.name} onClick={() => changeTheme(t.name)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '8px', border: 'none',
                    background: theme === t.name ? 'var(--accent-light)' : 'transparent',
                    cursor: 'pointer', fontSize: '13px',
                    color: theme === t.name ? 'var(--accent-light-text)' : 'var(--text-primary)',
                    fontWeight: theme === t.name ? '600' : '400',
                  }}>
                    <span style={{ fontSize: '16px' }}>{t.emoji}</span>
                    <span>{t.label}</span>
                    {theme === t.name && <span style={{ marginLeft: 'auto' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Kullanıcı */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '10px 0' : '9px 12px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                <div style={{ fontSize: '10px', color: 'var(--sidebar-text)', textTransform: 'capitalize' }}>{role}</div>
              </div>
            )}
          </div>

          {/* Çıkış */}
          <button onClick={handleLogout}
            style={{ ...navItemStyle(false), background: 'none', border: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <LogOut size={17} color="var(--sidebar-text)" strokeWidth={1.8} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Çıkış yap</span>}
          </button>
        </div>

        {/* Collapse butonu */}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          position: 'absolute', top: '20px', right: '-12px',
          width: '24px', height: '24px', borderRadius: '50%',
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', zIndex: 10,
          boxShadow: 'var(--card-shadow)',
        }}>
          {collapsed
            ? <ChevronRight size={13} />
            : <ChevronLeft size={13} />
          }
        </button>
      </aside>

      {/* Ana içerik */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: '56px', background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 24px',
          gap: '12px', flexShrink: 0, boxShadow: 'var(--card-shadow)',
        }}>
          <div style={{ flex: 1 }} />
          <a href="/dashboard/tickets" style={{
            padding: '7px 14px', borderRadius: '8px',
            background: 'var(--accent)', color: 'var(--accent-text)',
            textDecoration: 'none', fontSize: '13px', fontWeight: '500',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Plus size={14} />
            Yeni Ticket
          </a>
        </header>

        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-base)' }}
          onClick={() => showTheme && setShowTheme(false)}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
