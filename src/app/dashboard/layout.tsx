'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { THEMES, applyTheme, getStoredTheme } from '@/lib/themes'
import type { ThemeName } from '@/lib/themes'
import {
  LayoutDashboard, Ticket, FolderOpen, BookOpen,
  Users, Tags, Building2, Palette, LogOut,
  ChevronLeft, ChevronRight, Plus, Menu, X,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard',     roles: ['agent', 'admin'] },
  { href: '/dashboard/tickets',   icon: Ticket,          label: 'Ticketlar',     roles: ['customer', 'agent', 'admin'] },
  { href: '/dashboard/documents', icon: FolderOpen,      label: 'Dokümanlar',    roles: ['customer', 'agent', 'admin'] },
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
  const [role, setRole]             = useState<string>('')
  const [userName, setUserName]     = useState<string>('')
  const [userId, setUserId]         = useState<string>('')
  const [theme, setTheme]           = useState<ThemeName>('light')
  const [showTheme, setShowTheme]   = useState(false)
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
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

  useEffect(() => { setMobileOpen(false) }, [pathname])

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

  const SidebarContent = () => (
    <>
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', minHeight: '64px' }}>
        <div style={{ width: '34px', height: '34px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '18px' }}>🎧</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>DestekHub</div>
          <div style={{ fontSize: '10px', color: 'var(--sidebar-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Portal</div>
        </div>
        <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sidebar-text)', padding: '4px', display: 'flex' }}>
          <X size={18} />
        </button>
      </div>

      <nav style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {visibleNav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <a key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
              color: active ? '#fff' : 'var(--sidebar-text)',
              background: active ? 'var(--sidebar-active-bg)' : 'transparent',
              fontSize: '14px', fontWeight: active ? '600' : '400',
              position: 'relative',
            }}>
              {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: 'var(--sidebar-active)', borderRadius: '0 3px 3px 0' }} />}
              <Icon size={18} color={active ? 'var(--sidebar-active)' : 'var(--sidebar-text)'} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
              <span>{item.label}</span>
            </a>
          )
        })}

        {isAdmin && (
          <>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', padding: '12px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Yönetim</div>
            {ADMIN_ITEMS.map(item => {
              const active = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <a key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
                  color: active ? '#fff' : 'var(--sidebar-text)',
                  background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                  fontSize: '14px', fontWeight: active ? '600' : '400',
                  position: 'relative',
                }}>
                  {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: 'var(--sidebar-active)', borderRadius: '0 3px 3px 0' }} />}
                  <Icon size={18} color={active ? 'var(--sidebar-active)' : 'var(--sidebar-text)'} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                  <span>{item.label}</span>
                </a>
              )
            })}
          </>
        )}
      </nav>

      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowTheme(!showTheme)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--sidebar-text)', fontSize: '14px',
          }}>
            <Palette size={18} color="var(--sidebar-text)" strokeWidth={1.8} />
            <span>Tema</span>
            <span style={{ marginLeft: 'auto', fontSize: '16px' }}>{currentTheme.emoji}</span>
          </button>

          {showTheme && (
            <div style={{
              position: 'absolute', bottom: '48px', left: '0',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '8px', minWidth: '180px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 100,
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '4px 8px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tema seç</div>
              {THEMES.map(t => (
                <button key={t.name} onClick={() => changeTheme(t.name)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 10px', borderRadius: '8px', border: 'none',
                  background: theme === t.name ? 'var(--accent-light)' : 'transparent',
                  cursor: 'pointer', fontSize: '14px',
                  color: theme === t.name ? 'var(--accent-light-text)' : 'var(--text-primary)',
                  fontWeight: theme === t.name ? '600' : '400',
                }}>
                  <span style={{ fontSize: '18px' }}>{t.emoji}</span>
                  <span>{t.label}</span>
                  {theme === t.name && <span style={{ marginLeft: 'auto' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            <div style={{ fontSize: '11px', color: 'var(--sidebar-text)', textTransform: 'capitalize' }}>{role}</div>
          </div>
        </div>

        <button onClick={handleLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '10px', background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--sidebar-text)', fontSize: '14px',
        }}>
          <LogOut size={18} color="var(--sidebar-text)" strokeWidth={1.8} />
          <span>Çıkış yap</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        .desktop-sidebar { display: flex; flex-direction: column; }
        .mobile-overlay { display: none; }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-overlay { display: block !important; }
          .hamburger { display: flex !important; }
          .collapse-btn { display: none !important; }
        }
        .hamburger { display: none; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* Desktop Sidebar */}
        <aside className="desktop-sidebar" style={{
          width: collapsed ? '64px' : '240px',
          background: 'var(--bg-sidebar)',
          flexShrink: 0,
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden', position: 'relative',
        }}>
          <SidebarContent />
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} style={{
            position: 'absolute', top: '20px', right: '-12px',
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', zIndex: 10, boxShadow: 'var(--card-shadow)',
          }}>
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </aside>

        {/* Mobil Sidebar */}
        {mobileOpen && (
          <div className="mobile-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
            <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
            <aside style={{
              width: '280px', height: '100%', background: 'var(--bg-sidebar)',
              display: 'flex', flexDirection: 'column',
              position: 'absolute', left: 0, top: 0, zIndex: 1,
            }}>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Ana içerik */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <header style={{
            height: '56px', background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 16px',
            gap: '12px', flexShrink: 0, boxShadow: 'var(--card-shadow)',
          }}>
            <button className="hamburger" onClick={() => setMobileOpen(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-primary)', padding: '4px', display: 'none',
            }}>
              <Menu size={22} />
            </button>
            <div style={{ flex: 1 }} />
            <a href="/dashboard/tickets" style={{
              padding: '7px 14px', borderRadius: '8px',
              background: 'var(--accent)', color: 'var(--accent-text)',
              textDecoration: 'none', fontSize: '13px', fontWeight: '500',
              display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
            }}>
              <Plus size={14} />
              <span>Yeni Ticket</span>
            </a>
          </header>

          <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-base)' }}
            onClick={() => { showTheme && setShowTheme(false) }}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
