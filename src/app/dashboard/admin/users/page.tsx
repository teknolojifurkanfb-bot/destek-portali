'use client'

import { useState, useEffect } from 'react'
import { KeyRound, UserX, UserCheck, Trash2, Link, Copy, X, Settings, Save } from 'lucide-react'

type Role = 'customer' | 'agent' | 'admin'

interface User {
  id: string
  full_name: string
  email: string
  role: Role
  department_id: string | null
  is_active: boolean
  permissions: string[] | null
  created_at: string
}

interface Department {
  id: string
  name: string
}

const ROLE_STYLE: Record<Role, { bg: string; color: string }> = {
  customer: { bg: '#dbeafe', color: '#1d4ed8' },
  agent:    { bg: '#d1fae5', color: '#065f46' },
  admin:    { bg: '#fef3c7', color: '#92400e' },
}

const ROLE_LABEL: Record<Role, string> = {
  customer: 'Müşteri',
  agent:    'Destek Temsilcisi',
  admin:    'Yönetici',
}

const ALL_PAGES = [
  { key: 'dashboard',   label: 'Dashboard',    icon: '◈', roles: ['agent', 'admin'] },
  { key: 'tickets',     label: 'Ticketlar',    icon: '⊟', roles: ['customer', 'agent', 'admin'] },
  { key: 'documents',   label: 'Dokümanlar',   icon: '📁', roles: ['customer', 'agent', 'admin'] },
  { key: 'kb',          label: 'Bilgi Bankası',icon: '◫', roles: ['agent', 'admin'] },
  { key: 'devices',     label: 'Cihazlar',     icon: '🖥️', roles: ['agent', 'admin'] },
  { key: 'users',       label: 'Kullanıcılar', icon: '◉', roles: ['admin'] },
  { key: 'statuses',    label: 'Durumlar',     icon: '◈', roles: ['admin'] },
  { key: 'departments', label: 'Departmanlar', icon: '⬡', roles: ['admin'] },
]

export default function UsersPage() {
  const [users, setUsers]           = useState<User[]>([])
  const [departments, setDepts]     = useState<Department[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterActive, setFilter]   = useState<'all' | 'active' | 'passive'>('all')
  const [deleteConfirm, setDelConf] = useState<string | null>(null)
  const [resetModal, setResetModal] = useState<User | null>(null)
  const [editUser, setEditUser]     = useState<User | null>(null)
  const [editForm, setEditForm]     = useState<Partial<User>>({})
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting]   = useState(false)
  const [resetMsg, setResetMsg]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState('')
  const [showInvite, setShowInv]    = useState(false)
  const [inviteRole, setInvRole]    = useState<Role>('customer')
  const [inviteDept, setInvDept]    = useState('')
  const [inviteLink, setInvLink]    = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [uRes, dRes] = await Promise.all([fetch('/api/users'), fetch('/api/departments')])
    const [uData, dData] = await Promise.all([uRes.json(), dRes.json()])
    setUsers(Array.isArray(uData) ? uData : [])
    setDepts(Array.isArray(dData) ? dData : [])
    setLoading(false)
  }

  async function updateUser(id: string, updates: Partial<User>) {
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    await loadData()
  }

  async function saveEdit() {
    if (!editUser) return
    setSaving(true)
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editUser.id, ...editForm }),
    })
    await loadData()
    setSaving(false)
    setEditUser(null)
    showToast('Kullanıcı güncellendi!')
  }

  async function deleteUser(id: string) {
    await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadData()
    setDelConf(null)
  }

  async function resetPassword() {
    if (!newPassword || !resetModal) return
    if (newPassword.length < 6) { setResetMsg('En az 6 karakter olmalı.'); return }
    setResetting(true)
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: resetModal.id, password: newPassword }),
    })
    const data = await res.json()
    if (data.success) {
      setResetMsg('Şifre başarıyla değiştirildi!')
      setTimeout(() => { setResetModal(null); setNewPassword(''); setResetMsg('') }, 1500)
    } else {
      setResetMsg('Hata: ' + data.error)
    }
    setResetting(false)
  }

  function openEdit(user: User) {
    setEditUser(user)
    setEditForm({
      full_name: user.full_name,
      role: user.role,
      department_id: user.department_id,
      is_active: user.is_active,
      permissions: user.permissions || getDefaultPermissions(user.role),
    })
  }

  function getDefaultPermissions(role: Role): string[] {
    return ALL_PAGES.filter(p => p.roles.includes(role)).map(p => p.key)
  }

  function togglePermission(key: string) {
    const perms = editForm.permissions || []
    const newPerms = perms.includes(key) ? perms.filter(p => p !== key) : [...perms, key]
    setEditForm({ ...editForm, permissions: newPerms })
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function displayEmail(email: string) {
    return email.endsWith('@destek.local') ? email.replace('@destek.local', '') : email
  }

  function generateInvite() {
    const token = Math.random().toString(36).substring(2, 12)
    setInvLink(`${window.location.origin}/register?invite=${token}&role=${inviteRole}&dept=${inviteDept}`)
  }

  const filtered = users.filter(u =>
    filterActive === 'all' ? true : filterActive === 'active' ? u.is_active : !u.is_active
  )

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '14px', background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'inherit',
  }

  if (loading) return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: '72px', background: 'var(--border)', borderRadius: '12px', opacity: 0.4 }} />)}
    </div>
  )

  return (
    <div style={{ padding: '16px' }}>
      <style>{`
        .users-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        @media (max-width: 600px) { .users-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#065f46', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', zIndex: 300, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          ✓ {toast}
        </div>
      )}

      {/* Düzenleme paneli */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div onClick={() => setEditUser(null)} style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-surface)', height: '100%', overflowY: 'auto', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1 }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                {editUser.full_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{editUser.full_name || 'İsimsiz'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{displayEmail(editUser.email)}</div>
              </div>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              <div>
                <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Temel Bilgiler</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Ad Soyad</label>
                    <input value={editForm.full_name || ''} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Rol</label>
                    <select value={editForm.role || 'customer'} onChange={e => {
                      const newRole = e.target.value as Role
                      setEditForm({ ...editForm, role: newRole, permissions: getDefaultPermissions(newRole) })
                    }} style={inputStyle}>
                      <option value="customer">Müşteri</option>
                      <option value="agent">Destek Temsilcisi</option>
                      <option value="admin">Yönetici</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Departman</label>
                    <select value={editForm.department_id || ''} onChange={e => setEditForm({ ...editForm, department_id: e.target.value || null })} style={inputStyle}>
                      <option value="">Seçin</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Aktif kullanıcı</span>
                    <button onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                      style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: editForm.is_active ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: '3px', left: editForm.is_active ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Sayfa İzinleri</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ALL_PAGES.map(page => {
                    const hasAccess = (editForm.permissions || []).includes(page.key)
                    return (
                      <div key={page.key} onClick={() => togglePermission(page.key)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${hasAccess ? 'var(--accent)' : 'var(--border)'}`, background: hasAccess ? 'var(--accent-light)' : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: '18px' }}>{page.icon}</span>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: hasAccess ? 'var(--accent-light-text)' : 'var(--text-primary)' }}>{page.label}</span>
                        <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${hasAccess ? 'var(--accent)' : 'var(--border)'}`, background: hasAccess ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {hasAccess && <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}>✓</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', position: 'sticky', bottom: 0, background: 'var(--bg-surface)' }}>
              <button onClick={saveEdit} disabled={saving} style={{ width: '100%', padding: '13px', background: saving ? 'var(--border)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Save size={16} />
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Şifre modal */}
      {resetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Şifre Sıfırla</h2>
              <button onClick={() => { setResetModal(null); setNewPassword(''); setResetMsg('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>{resetModal.full_name}</p>
            {resetMsg && (
              <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', background: resetMsg.startsWith('Hata') ? '#fee2e2' : '#d1fae5', color: resetMsg.startsWith('Hata') ? '#991b1b' : '#065f46' }}>
                {resetMsg}
              </div>
            )}
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Yeni şifre (en az 6 karakter)"
              style={{ ...inputStyle, marginBottom: '12px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={resetPassword} disabled={resetting || !newPassword} style={{ flex: 1, padding: '11px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                {resetting ? 'Sıfırlanıyor...' : 'Sıfırla'}
              </button>
              <button onClick={() => { setResetModal(null); setNewPassword(''); setResetMsg('') }} style={{ padding: '11px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Silme onayı */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Kullanıcıyı sil</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Bu işlem geri alınamaz.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setDelConf(null)} style={{ flex: 1, padding: '11px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>İptal</button>
              <button onClick={() => deleteUser(deleteConfirm)} style={{ flex: 1, padding: '11px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Kullanıcılar</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{users.length} kullanıcı</p>
        </div>
        <button onClick={() => setShowInv(!showInvite)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
          <Link size={14} /> Davet
        </button>
      </div>

      {/* Davet */}
      {showInvite && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>Davet linki</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
            <select value={inviteRole} onChange={e => setInvRole(e.target.value as Role)} style={inputStyle}>
              <option value="customer">Müşteri</option>
              <option value="agent">Destek Temsilcisi</option>
              <option value="admin">Yönetici</option>
            </select>
            <select value={inviteDept} onChange={e => setInvDept(e.target.value)} style={inputStyle}>
              <option value="">Departman seçin</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button onClick={generateInvite} style={{ padding: '8px 16px', background: 'var(--bg-sidebar)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginBottom: '10px' }}>
            Link oluştur
          </button>
          {inviteLink && (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1, wordBreak: 'break-all' as const }}>{inviteLink}</span>
              <button onClick={() => { navigator.clipboard.writeText(inviteLink); showToast('Kopyalandı!') }}
                style={{ padding: '5px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)', flexShrink: 0 }}>
                <Copy size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto' as const }}>
        {(['all', 'active', 'passive'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '12px', background: filterActive === f ? 'var(--accent)' : 'var(--bg-surface)', color: filterActive === f ? '#fff' : 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {f === 'all' ? `Tümü (${users.length})` : f === 'active' ? `Aktif (${users.filter(u => u.is_active).length})` : `Pasif (${users.filter(u => !u.is_active).length})`}
          </button>
        ))}
      </div>

      {/* Kullanıcı kartları */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(u => {
          const rs = ROLE_STYLE[u.role]
          return (
            <div key={u.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', opacity: u.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                  {(u.full_name || u.email).charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name || '-'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayEmail(u.email)}</div>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500', background: rs.bg, color: rs.color, flexShrink: 0 }}>
                  {ROLE_LABEL[u.role]}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                <button onClick={() => openEdit(u)}
                  style={{ flex: 1, padding: '8px', border: '1px solid var(--accent)', borderRadius: '8px', background: 'var(--accent-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '13px', color: 'var(--accent-light-text)', fontWeight: '500' }}>
                  <Settings size={13} /> Düzenle
                </button>
                <button onClick={() => { setResetModal(u); setNewPassword(''); setResetMsg('') }}
                  style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <KeyRound size={13} />
                </button>
                <button onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                  style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                </button>
                <button onClick={() => setDelConf(u.id)}
                  style={{ padding: '8px 12px', border: '1px solid #fecaca', borderRadius: '8px', background: '#fff5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#dc2626' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
