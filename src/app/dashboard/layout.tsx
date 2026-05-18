'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { THEMES, applyTheme, getStoredTheme } from '@/lib/themes'
import type { ThemeName } from '@/lib/themes'
import {
  LayoutDashboard, Ticket, FolderOpen, BookOpen,
  Users, Tags, Building2, Palette, LogOut,
  ChevronLeft, ChevronRight, Plus, Menu, X, Monitor, Bell, BarChart3,
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link: string
  created_at: string
}

const NAV_ITEMS = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard',     roles: ['agent', 'admin'],              key: 'dashboard' },
  { href: '/dashboard/tickets',   icon: Ticket,          label: 'Ticketlar',     roles: ['customer', 'agent', 'admin'],  key: 'tickets' },
  { href: '/dashboard/documents', icon: FolderOpen,      label: 'Dokümanlar',    roles: ['customer', 'agent', 'admin'],  key: 'documents' },
  { href: '/dashboard/kb',        icon: BookOpen,        label: 'Bilgi Bankası', roles: ['customer', 'agent', 'admin'],  key: 'kb' },
  { href: '/dashboard/devices',   icon: Monitor,         label: 'Cihazlar',      roles: ['agent', 'admin'],              key: 'devices' },
  { href: '/dashboard/reports',   icon: BarChart3,       label: 'Raporlar',      roles: ['agent', 'admin'],              key: 'reports' },
]

const ADMIN_ITEMS = [
  { href: '/dashboard/admin/users',       icon: Users,     label: 'Kullanıcılar' },
  { href: '/dashboard/admin/statuses',    icon: Tags,      label: 'Durumlar' },
  { href: '/dashboard/admin/departments', icon: Building2, label: 'Departmanlar' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [role, setRole]                   = useState<string>('')
  const [userName, setUserName]           = useState<string>('')
  const [userId, setUserId]               = useState<string>('')
  const [theme, setTheme]                 = useState<ThemeName>('light')
  const [showTheme, setShowTheme]         = useState(false)
  const [collapsed, setCollapsed]         = useState(false)
  const [mobileOpen, setMobileOpen]       = useState(false)
  const [userPermissions, setPerms]       = useState<string[] | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotif, setShowNotif]         = useState(false)
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
        .select('role, full_name, theme, id, permissions')
        .eq('id', user.id)
        .single()
      if (data) {
        setRole(data.role)
        setUserName(data.full_name || user.email || '')
        setUserId(data.id)
        setPerms(data.permissions || null)
        if (data.theme) {
          setTheme(data.theme as ThemeName)
          applyTheme(data.theme as ThemeName)
        }
      }
    }
    load()
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadNotifications() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(Array.isArray(data) ? data : [])
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    loadNotifications()
  }

  async function markAllRead() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
    loadNotifications()
  }

  async function clearAll() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').delete().eq('user_id', user.id)
    setNotifications([])
    setShowNotif(false)
  }

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
  const unreadCount = notifications.filter(n => !n.is_read).length

  const visibleNav = NAV_ITEMS.filter(item => {
    if (!item.roles.includes(role)) return false
    if (isAdmin) return true
    if (userPermissions && userPermissions.length > 0) {
      return userPermissions.includes(item.key)
    }
    return true
  })

  const currentTheme = THEMES.find(t => t.name === theme) || THEMES[0]

  function getNotifColor(type: string) {
    if (type === 'success') return '#10b981'
    if (type === 'warning') return '#f59e0b'
    if (type === 'error') return '#ef4444'
    return 'var(--accent)'
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Az önce'
    if (mins < 60) return `${mins} dk önce`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} saat önce`
    return `${Math.floor(hours / 24)} gün önce`
  }

  const SidebarInner = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <>
      <div style={{ padding: isCollapsed ? '18px 0' : '18px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', minHeight: '64px', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
        <div style={{ width: '34px', height: '34px', background: 'var(--accent)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '18px' }}>🖥️</span>
        </div>
        {!isCollapsed && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>BullBase</div>
            <div style={{ fontSize: '10px', color: 'var(--sidebar-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Portal</div>
          </div>
        )}
        {!isCollapsed && (
          <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sidebar-text)', padding: '4px', display: 'flex' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: isCollapsed ? '10px 8px' : '10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {visibleNav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <a key={item.href} href={item.href}
              title={isCollapsed ? item.label : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: isCollapsed ? '10px 0' : '10px 12px',
                borderRadius: '10px', textDecoration: 'none',
                color: active ? '#fff' : 'var(--sidebar-text)',
                background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                fontSize: '14px', fontWeight: active ? '600' : '400',
                position: 'relative',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
              }}>
              {active && !isCollapsed && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: 'var(--sidebar-active)', borderRadius: '0 3px 3px 0' }} />}
              <Icon size={18} color={active ? 'var(--sidebar-active)' : 'var(--sidebar-text)'} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span>{item.label}</span>}
            </a>
          )
        })}

        {isAdmin && (
          <>
            {!isCollapsed && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', padding: '12px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Yönetim</div>}
            {isCollapsed && <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 4px' }} />}
            {ADMIN_ITEMS.map(item => {
              const active = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <a key={item.href} href={item.href}
                  title={isCollapsed ? item.label : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: isCollapsed ? '10px 0' : '10px 12px',
                    borderRadius: '10px', textDecoration: 'none',
                    color: active ? '#fff' : 'var(--sidebar-text)',
                    background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                    fontSize: '14px', fontWeight: active ? '600' : '400',
                    position: 'relative',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                  }}>
                  {active && !isCollapsed && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: 'var(--sidebar-active)', borderRadius: '0 3px 3px 0' }} />}
                  <Icon size={18} color={active ? 'var(--sidebar-active)' : 'var(--sidebar-text)'} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                  {!isCollapsed && <span>{item.label}</span>}
                </a>
              )
            })}
          </>
        )}
      </nav>

      <div style={{ padding: isCollapsed ? '10px 8px' : '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowTheme(!showTheme)}
            title={isCollapsed ? 'Tema' : ''}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: isCollapsed ? '10px 0' : '10px 12px',
              borderRadius: '10px', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--sidebar-text)', fontSize: '14px',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            }}>
            <Palette size={18} color="var(--sidebar-text)" strokeWidth={1.8} />
            {!isCollapsed && <><span>Tema</span><span style={{ marginLeft: 'auto', fontSize: '16px' }}>{currentTheme.emoji}</span></>}
          </button>

          {showTheme && (
            <div style={{
              position: 'absolute', bottom: '48px', left: isCollapsed ? '64px' : '0',
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

        <a href="/dashboard/profile"
          title={isCollapsed ? userName : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: isCollapsed ? '10px 0' : '10px 12px',
            borderRadius: '10px', textDecoration: 'none',
            background: pathname === '/dashboard/profile' ? 'var(--sidebar-active-bg)' : 'none',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
          }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
              <div style={{ fontSize: '11px', color: 'var(--sidebar-text)', textTransform: 'capitalize' }}>{role} · Profil</div>
            </div>
          )}
        </a>

        <button onClick={handleLogout}
          title={isCollapsed ? 'Çıkış yap' : ''}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: isCollapsed ? '10px 0' : '10px 12px',
            borderRadius: '10px', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--sidebar-text)', fontSize: '14px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
          }}>
          <LogOut size={18} color="var(--sidebar-text)" strokeWidth={1.8} />
          {!isCollapsed && <span>Çıkış yap</span>}
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

        <aside className="desktop-sidebar" style={{
          width: collapsed ? '64px' : '240px',
          background: 'var(--bg-sidebar)',
          flexShrink: 0,
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden', position: 'relative',
        }}>
          <SidebarInner isCollapsed={collapsed} />
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

        {mobileOpen && (
          <div className="mobile-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
            <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
            <aside style={{
              width: '280px', height: '100%', background: 'var(--bg-sidebar)',
              display: 'flex', flexDirection: 'column',
              position: 'absolute', left: 0, top: 0, zIndex: 1,
            }}>
              <SidebarInner isCollapsed={false} />
            </aside>
          </div>
        )}

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

            <div style={{ position: 'relative' }}>
              <button onClick={() => { setShowNotif(!showNotif); setShowTheme(false) }} style={{
                position: 'relative', background: 'none', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '7px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', color: 'var(--text-primary)',
              }}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <div style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg-surface)',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>

              {showNotif && (
                <div style={{
                  position: 'absolute', top: '44px', right: '0',
                  width: '320px', maxHeight: '420px',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Bildirimler {unreadCount > 0 && <span style={{ fontSize: '12px', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>{unreadCount}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} style={{ fontSize: '11px', color: 'var(--accent-light-text)', background: 'var(--accent-light)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                          Tümünü oku
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={clearAll} style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                          Temizle
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.3 }}>🔔</div>
                        <div>Bildirim yok</div>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id}
                          onClick={() => { markRead(n.id); setShowNotif(false); router.push(n.link || '/dashboard') }}
                          style={{
                            padding: '12px 16px', cursor: 'pointer',
                            background: n.is_read ? 'transparent' : 'var(--accent-light)',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex', gap: '10px', alignItems: 'flex-start',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                          onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'transparent' : 'var(--accent-light)')}
                        >
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.is_read ? 'transparent' : getNotifColor(n.type), flexShrink: 0, marginTop: '5px' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: n.is_read ? '400' : '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{n.title}</div>
                            {n.message && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>}
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{timeAgo(n.created_at)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
            onClick={() => { showTheme && setShowTheme(false); showNotif && setShowNotif(false) }}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  )
}