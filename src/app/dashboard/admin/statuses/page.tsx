'use client'

import { useState, useEffect } from 'react'

interface TicketStatus {
  id: string
  name: string
  color: string
  bg_color: string
  sort_order: number
  is_default: boolean
  is_closed: boolean
}

const COLOR_PRESETS = [
  { color: '#1d4ed8', bg: '#dbeafe', label: 'Mavi' },
  { color: '#065f46', bg: '#d1fae5', label: 'Yeşil' },
  { color: '#92400e', bg: '#fef3c7', label: 'Sarı' },
  { color: '#c2410c', bg: '#ffedd5', label: 'Turuncu' },
  { color: '#991b1b', bg: '#fee2e2', label: 'Kırmızı' },
  { color: '#6d28d9', bg: '#ede9fe', label: 'Mor' },
  { color: '#0369a1', bg: '#e0f2fe', label: 'Açık Mavi' },
  { color: '#374151', bg: '#f3f4f6', label: 'Gri' },
]

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<TicketStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newStatus, setNewStatus] = useState({
    name: '',
    color: '#1d4ed8',
    bg_color: '#dbeafe',
    is_closed: false,
  })

  useEffect(() => {
    loadStatuses()
  }, [])

  async function loadStatuses() {
    setLoading(true)
    const res = await fetch('/api/statuses')
    const data = await res.json()
    setStatuses(data)
    setLoading(false)
  }

  async function addStatus() {
    if (!newStatus.name.trim()) return
    setSaving(true)
    await fetch('/api/statuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newStatus,
        sort_order: statuses.length + 1,
        is_default: false,
      }),
    })
    await loadStatuses()
    setNewStatus({ name: '', color: '#1d4ed8', bg_color: '#dbeafe', is_closed: false })
    setShowNew(false)
    setSaving(false)
  }

  async function deleteStatus(id: string) {
    setSaving(true)
    await fetch('/api/statuses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadStatuses()
    setDeleteConfirm(null)
    setSaving(false)
  }

  async function updateStatus(id: string, updates: Partial<TicketStatus>) {
    await fetch('/api/statuses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    await loadStatuses()
  }

  async function setDefault(id: string) {
    setSaving(true)
    for (const s of statuses) {
      await fetch('/api/statuses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, is_default: s.id === id }),
      })
    }
    await loadStatuses()
    setSaving(false)
  }

  async function moveUp(id: string) {
    const idx = statuses.findIndex(s => s.id === id)
    if (idx === 0) return
    const a = statuses[idx - 1]
    const b = statuses[idx]
    await updateStatus(a.id, { sort_order: b.sort_order })
    await updateStatus(b.id, { sort_order: a.sort_order })
  }

  async function moveDown(id: string) {
    const idx = statuses.findIndex(s => s.id === id)
    if (idx === statuses.length - 1) return
    const a = statuses[idx]
    const b = statuses[idx + 1]
    await updateStatus(a.id, { sort_order: b.sort_order })
    await updateStatus(b.id, { sort_order: a.sort_order })
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>Yükleniyor...</div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Durumu sil</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Bu durumu silmek istediğinize emin misiniz?</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px' }}>İptal</button>
              <button onClick={() => deleteStatus(deleteConfirm)} disabled={saving} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Evet, sil</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600' }}>Ticket Durumları</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Ticketlarda kullanılacak durumları yönetin</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ padding: '8px 16px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
          + Yeni durum
        </button>
      </div>

      {showNew && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Yeni durum ekle</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Durum adı</label>
              <input
                value={newStatus.name}
                onChange={e => setNewStatus({ ...newStatus, name: e.target.value })}
                placeholder="örn. Teknik İnceleme, Onay Bekliyor..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' as any }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '8px' }}>Renk</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as any }}>
                {COLOR_PRESETS.map(p => (
                  <button key={p.color} onClick={() => setNewStatus({ ...newStatus, color: p.color, bg_color: p.bg })}
                    style={{ padding: '6px 12px', borderRadius: '20px', border: `2px solid ${newStatus.color === p.color ? p.color : 'transparent'}`, background: p.bg, color: p.color, fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                    {p.label}
                  </button>
                ))}
              </div>
              {newStatus.name && (
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', marginRight: '8px' }}>Önizleme:</span>
                  <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', background: newStatus.bg_color, color: newStatus.color, fontWeight: '500' }}>{newStatus.name}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="is_closed" checked={newStatus.is_closed} onChange={e => setNewStatus({ ...newStatus, is_closed: e.target.checked })} />
              <label htmlFor="is_closed" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer' }}>Bu durum kapalı sayılsın</label>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addStatus} disabled={saving} style={{ padding: '8px 16px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                {saving ? 'Kaydediliyor...' : 'Ekle'}
              </button>
              <button onClick={() => setShowNew(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {statuses.map((s) => (
          <div key={s.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button onClick={() => moveUp(s.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', padding: '0', lineHeight: 1 }}>▲</button>
              <button onClick={() => moveDown(s.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', padding: '0', lineHeight: 1 }}>▼</button>
            </div>

            <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '10px', fontWeight: '500', background: s.bg_color, color: s.color, minWidth: '130px', textAlign: 'center' as any }}>
              {editId === s.id ? (
                <input
                  defaultValue={s.name}
                  onBlur={e => { updateStatus(s.id, { name: e.target.value }); setEditId(null) }}
                  autoFocus
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: s.color, fontSize: '12px', fontWeight: '500', width: '100%', textAlign: 'center' as any }}
                />
              ) : (
                <span onClick={() => setEditId(s.id)} style={{ cursor: 'text' }}>{s.name}</span>
              )}
            </span>

            <div style={{ display: 'flex', gap: '4px' }}>
              {COLOR_PRESETS.map(p => (
                <button key={p.color} onClick={() => updateStatus(s.id, { color: p.color, bg_color: p.bg })} title={p.label}
                  style={{ width: '16px', height: '16px', borderRadius: '50%', background: p.bg, border: `2px solid ${s.color === p.color ? p.color : '#e2e8f0'}`, cursor: 'pointer', padding: 0 }} />
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input type="checkbox" checked={s.is_closed} onChange={() => updateStatus(s.id, { is_closed: !s.is_closed })} id={`closed-${s.id}`} />
              <label htmlFor={`closed-${s.id}`} style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>Kapalı</label>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
              {s.is_default ? (
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: '#f0fdf4', color: '#15803d', fontWeight: '500' }}>Varsayılan</span>
              ) : (
                <button onClick={() => setDefault(s.id)} style={{ fontSize: '12px', padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#64748b' }}>Varsayılan yap</button>
              )}
              <button onClick={() => setDeleteConfirm(s.id)} style={{ fontSize: '12px', padding: '4px 10px', border: '1px solid #fecaca', borderRadius: '6px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626' }}>Sil</button>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>
        💡 Durum adını düzenlemek için üzerine tıklayın. Değişiklikler otomatik kaydedilir.
      </p>
    </div>
  )
}
