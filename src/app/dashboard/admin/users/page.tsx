'use client'

import { useState, useEffect } from 'react'
import { KeyRound, UserX, UserCheck, Trash2, Link, Copy, X } from 'lucide-react'

type Role = 'customer' | 'agent' | 'admin'

interface User {
  id: string
  full_name: string
  email: string
  role: Role
  department_id: string | null
  is_active: boolean
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

export default function UsersPage() {
  const [users, setUsers]           = useState<User[]>([])
  const [departments, setDepts]     = useState<Department[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterActive, setFilter]   = useState<'all' | 'active' | 'passive'>('all')
  const [deleteConfirm, setDelConf] = useState<string | null>(null)
  const [resetModal, setResetModal] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting]   = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')
  const [inviteEmail, setInvEmail]  = useState('')
  const [inviteRole, setInvRole]    = useState<Role>('customer')
  const [inviteDept, setInvDept]    = useState('')
  const [inviteLink, setInvLink]    = useState('')
  const [showInvite, setShowInv]    = useState(false)
  const [toast, setToast]           = useState('')

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
    if (newPassword.length < 6) {
      setResetSuccess('Şifre en az 6 karakter olmalı.')
      return
    }
    setResetting(true)
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: resetModal.id, password: newPassword }),
    })
    const data = await res.json()
    if (data.success) {
      setResetSuccess('Şifre başarıyla değiştirildi!')
      setTimeout(() => {
        setResetModal(null)
        setNewPassword('')
        setResetSuccess('')
      }, 1500)
    } else {
      setResetSuccess('Hata: ' + data.error)
    }
    setResetting(false)
  }

  function generateInvite() {
    if (!inviteEmail) return
    const token = Math.random().toString(36).substring(2, 12)
    setInvLink(`${window.location.origin}/register?invite=${token}&role=${inviteRole}&dept=${inviteDept}`)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function displayEmail(email: string) {
    return email.endsWith('@destek.local') ? '@' + email.replace('@destek.local', '') : email
  }

  function getDeptName(id: string | null) {
    return departments.find(d => d.id === id)?.name || '-'
  }

  const filtered = users.filter(u =>
    filterActive === 'all' ? true : filterActive === 'active' ? u.is_active : !u.is_active
  )

  const cardStyle = {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--card-shadow)',
  }

  if (loading) return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: '60px', background: 'var(--border)', borderRadius: '12px', opacity: 0.4 }} />)}
    </div>
  )

  return (
    <div style={{ padding: '24px' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#065f46', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', zIndex: 300, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          ✓ {toast}
        </div>
      )}

      {/* Şifre sıfırlama modalı */}
      {resetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Şifre Sıfırla</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{resetModal.full_name}</p>
              </div>
              <button onClick={() => { setResetModal(null); setNewPassword(''); setResetSuccess('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {resetSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', background: resetSuccess.startsWith('Hata') ? '#fee2e2' : '#d1fae5', color: resetSuccess.startsWith('Hata') ? '#991b1b' : '#065f46' }}>
                {resetSuccess}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Yeni şifre</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', boxSizing: 'border-box' as const, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={resetPassword} disabled={resetting || !newPassword} style={{ flex: 1, padding: '10px', background: resetting ? 'var(--border)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                {resetting ? 'Sıfırlanıyor...' : 'Şifreyi sıfırla'}
              </button>
              <button onClick={() => { setResetModal(null); setNewPassword(''); setResetSuccess('') }} style={{ padding: '10px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Silme onayı */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '90%', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Kullanıcıyı sil</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Bu kullanıcı kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDelConf(null)} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>İptal</button>
              <button onClick={() => deleteUser(deleteConfirm)} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Evet, sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Kullanıcı Yönetimi</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{users.length} kullanıcı</p>
        </div>
        <button onClick={() => setShowInv(!showInvite)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
          <Link size={15} /> Davet et
        </button>
      </div>

      {/* Davet */}
      {showInvite && (
        <div style={{ ...cardStyle, padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Davet linki oluştur</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Kullanıcı adı</label>
              <input value={inviteEmail} onChange={e => setInvEmail(e.target.value)} placeholder="kullanici_adi"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', boxSizing: 'border-box' as const, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Rol</label>
              <select value={inviteRole} onChange={e => setInvRole(e.target.value as Role)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                <option value="customer">Müşteri</option>
                <option value="agent">Destek Temsilcisi</option>
                <option value="admin">Yönetici</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Departman</label>
              <select value={inviteDept} onChange={e => setInvDept(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                <option value="">Seçin</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={generateInvite} style={{ padding: '8px 16px', background: 'var(--bg-sidebar)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginBottom: '12px' }}>
            Link oluştur
          </button>
          {inviteLink && (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1, wordBreak: 'break-all' as const }}>{inviteLink}</span>
              <button onClick={() => { navigator.clipboard.writeText(inviteLink); showToast('Link kopyalandı!') }}
                style={{ padding: '6px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <Copy size={12} /> Kopyala
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['all', 'active', 'passive'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', background: filterActive === f ? 'var(--accent)' : 'var(--bg-surface)', color: filterActive === f ? '#fff' : 'var(--text-secondary)' }}>
            {f === 'all' ? `Tümü (${users.length})` : f === 'active' ? `Aktif (${users.filter(u => u.is_active).length})` : `Pasif (${users.filter(u => !u.is_active).length})`}
          </button>
        ))}
      </div>

      {/* Kullanıcı tablosu */}
      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              {['Kullanıcı', 'Rol', 'Departman', 'Durum', 'İşlemler'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const rs = ROLE_STYLE[u.role]
              return (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', opacity: u.is_active ? 1 : 0.6 }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                        {(u.full_name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{u.full_name || '-'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{displayEmail(u.email)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value as Role })}
                      style={{ padding: '4px 8px', border: `1px solid ${rs.color}`, borderRadius: '6px', fontSize: '12px', background: rs.bg, color: rs.color, cursor: 'pointer', fontWeight: '500' }}>
                      <option value="customer">Müşteri</option>
                      <option value="agent">Destek Temsilcisi</option>
                      <option value="admin">Yönetici</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select value={u.department_id || ''} onChange={e => updateUser(u.id, { department_id: e.target.value || null })}
                      style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                      <option value="">-</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500', background: u.is_active ? '#d1fae5' : 'var(--bg-elevated)', color: u.is_active ? '#065f46' : 'var(--text-muted)' }}>
                      {u.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                      {/* Şifre sıfırla */}
                      <button onClick={() => { setResetModal(u); setNewPassword(''); setResetSuccess('') }}
                        title="Şifre sıfırla"
                        style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <KeyRound size={13} /> Şifre
                      </button>
                      {/* Aktif/Pasif */}
                      <button onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                        title={u.is_active ? 'Pasif yap' : 'Aktif yap'}
                        style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                        {u.is_active ? 'Pasif' : 'Aktif'}
                      </button>
                      {/* Sil */}
                      <button onClick={() => setDelConf(u.id)}
                        title="Sil"
                        style={{ padding: '5px 8px', border: '1px solid #fecaca', borderRadius: '6px', background: '#fff5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#dc2626' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
