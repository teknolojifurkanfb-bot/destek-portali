'use client'

import { useState, useEffect } from 'react'

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

const ROLE_STYLE: Record<Role, string> = {
  customer: '#dbeafe|#1d4ed8',
  agent:    '#d1fae5|#065f46',
  admin:    '#fef3c7|#92400e',
}

export default function UsersPage() {
  const [users, setUsers]         = useState<User[]>([])
  const [departments, setDepts]   = useState<Department[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterActive, setFilter] = useState<'all' | 'active' | 'passive'>('all')
  const [deleteConfirm, setDelConf] = useState<string | null>(null)
  const [inviteEmail, setInvEmail] = useState('')
  const [inviteRole, setInvRole]   = useState<Role>('customer')
  const [inviteDept, setInvDept]   = useState('')
  const [inviteLink, setInvLink]   = useState('')
  const [showInvite, setShowInv]   = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [uRes, dRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/departments'),
    ])
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

  function generateInvite() {
    if (!inviteEmail) return
    const token = Math.random().toString(36).substring(2, 12)
    setInvLink(`http://localhost:3000/register?invite=${token}&role=${inviteRole}&dept=${inviteDept}`)
  }

  function displayEmail(email: string) {
    if (email.endsWith('@destek.local')) {
      return '@' + email.replace('@destek.local', '')
    }
    return email
  }

  const filtered = users.filter(u =>
    filterActive === 'all' ? true :
    filterActive === 'active' ? u.is_active :
    !u.is_active
  )

  if (loading) return <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '24px' }}>
      {/* Silme onay modalı */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Kullanıcıyı sil</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              Bu kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDelConf(null)}
                style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px' }}
              >
                İptal
              </button>
              <button
                onClick={() => deleteUser(deleteConfirm)}
                style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
              >
                Evet, sil
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600' }}>Kullanıcı Yönetimi</h1>
        <button
          onClick={() => setShowInv(!showInvite)}
          style={{ padding: '8px 16px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
        >
          + Kullanıcı davet et
        </button>
      </div>

      {/* Davet linki */}
      {showInvite && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Davet linki oluştur</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Kullanıcı adı</label>
              <input value={inviteEmail} onChange={e => setInvEmail(e.target.value)} placeholder="kullanici_adi"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' as any }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Rol</label>
              <select value={inviteRole} onChange={e => setInvRole(e.target.value as Role)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
                <option value="customer">Müşteri</option>
                <option value="agent">Destek Temsilcisi</option>
                <option value="admin">Yönetici</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Departman</label>
              <select value={inviteDept} onChange={e => setInvDept(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
                <option value="">Seçin</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={generateInvite}
            style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginBottom: '12px' }}>
            Link oluştur
          </button>
          {inviteLink && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#475569', flex: 1, wordBreak: 'break-all' as any }}>{inviteLink}</span>
              <button onClick={() => navigator.clipboard.writeText(inviteLink)}
                style={{ padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}>
                Kopyala
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['all', 'active', 'passive'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '13px', background: filterActive === f ? '#0f172a' : 'white', color: filterActive === f ? 'white' : '#64748b' }}>
            {f === 'all' ? `Tümü (${users.length})` : f === 'active' ? `Aktif (${users.filter(u => u.is_active).length})` : `Pasif (${users.filter(u => !u.is_active).length})`}
          </button>
        ))}
      </div>

      {/* Kullanıcı tablosu */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Kullanıcı</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Rol</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Departman</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Durum</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const [bg, color] = ROLE_STYLE[u.role].split('|')
              return (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', opacity: u.is_active ? 1 : 0.6 }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        {(u.full_name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{u.full_name || '-'}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{displayEmail(u.email)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value as Role })}
                      style={{ padding: '4px 8px', border: `1px solid ${bg}`, borderRadius: '6px', fontSize: '12px', background: bg, color, cursor: 'pointer' }}>
                      <option value="customer">Müşteri</option>
                      <option value="agent">Destek Temsilcisi</option>
                      <option value="admin">Yönetici</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select value={u.department_id || ''} onChange={e => updateUser(u.id, { department_id: e.target.value || null })}
                      style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <option value="">-</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500', background: u.is_active ? '#d1fae5' : '#f1f5f9', color: u.is_active ? '#065f46' : '#64748b' }}>
                      {u.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                        style={{ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#475569' }}
                      >
                        {u.is_active ? 'Pasif yap' : 'Aktif yap'}
                      </button>
                      <button
                        onClick={() => setDelConf(u.id)}
                        style={{ padding: '5px 10px', border: '1px solid #fecaca', borderRadius: '6px', background: '#fff5f5', cursor: 'pointer', fontSize: '12px', color: '#dc2626' }}
                      >
                        Sil
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
