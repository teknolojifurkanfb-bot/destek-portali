'use client'

import { useState, useEffect } from 'react'

interface Department {
  id: string
  name: string
  description: string | null
  created_at: string
}

interface Category {
  id: string
  name: string
  department_id: string
}

export default function DepartmentsPage() {
  const [departments, setDepts]   = useState<Department[]>([])
  const [categories, setCats]     = useState<Category[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [deleteConfirm, setDel]   = useState<string | null>(null)
  const [editId, setEditId]       = useState<string | null>(null)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [newDept, setNew]         = useState({ name: '', description: '' })
  const [newCatName, setNewCat]   = useState<Record<string, string>>({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [dRes, cRes] = await Promise.all([
      fetch('/api/departments'),
      fetch('/api/categories'),
    ])
    const [dData, cData] = await Promise.all([dRes.json(), cRes.json()])
    setDepts(Array.isArray(dData) ? dData : [])
    setCats(Array.isArray(cData) ? cData : [])
    setLoading(false)
  }

  async function addDept() {
    if (!newDept.name.trim()) return
    await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDept),
    })
    await load()
    setNew({ name: '', description: '' })
    setShowNew(false)
  }

  async function updateDept(id: string, name: string) {
    await fetch('/api/departments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    })
    await load()
    setEditId(null)
  }

  async function deleteDept(id: string) {
    await fetch('/api/departments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
    setDel(null)
  }

  async function addCategory(department_id: string) {
    const name = newCatName[department_id]?.trim()
    if (!name) return
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, department_id }),
    })
    setNewCat({ ...newCatName, [department_id]: '' })
    await load()
  }

  async function deleteCategory(id: string) {
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
  }

  if (loading) return <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '24px', maxWidth: '700px' }}>
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Departmanı sil</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              Bu departmanı ve tüm kategorilerini silmek istediğinize emin misiniz?
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDel(null)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px' }}>İptal</button>
              <button onClick={() => deleteDept(deleteConfirm)} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Evet, sil</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600' }}>Departmanlar</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Departman ve kategorileri yönetin</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ padding: '8px 16px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
          + Yeni departman
        </button>
      </div>

      {showNew && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Yeni departman ekle</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Departman adı</label>
              <input value={newDept.name} onChange={e => setNew({ ...newDept, name: e.target.value })}
                placeholder="örn. Muhasebe, Teknik Destek..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' as any }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Açıklama (isteğe bağlı)</label>
              <input value={newDept.description} onChange={e => setNew({ ...newDept, description: e.target.value })}
                placeholder="Departmanın sorumluluğu..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' as any }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addDept} style={{ padding: '8px 16px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Ekle</button>
              <button onClick={() => setShowNew(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {departments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>Henüz departman yok.</div>
        )}
        {departments.map(d => {
          const deptCats = categories.filter(c => c.department_id === d.id)
          const isExpanded = expanded === d.id
          return (
            <div key={d.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              {/* Departman satırı */}
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  🏢
                </div>
                <div style={{ flex: 1 }}>
                  {editId === d.id ? (
                    <input defaultValue={d.name} onBlur={e => updateDept(d.id, e.target.value)} autoFocus
                      style={{ fontSize: '14px', fontWeight: '500', border: '1px solid #1d4ed8', borderRadius: '6px', padding: '4px 8px', outline: 'none', width: '100%' }} />
                  ) : (
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{d.name}</div>
                  )}
                  {d.description && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{d.description}</div>}
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                  {deptCats.length} kategori
                </span>
                <button onClick={() => setExpanded(isExpanded ? null : d.id)}
                  style={{ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: isExpanded ? '#f1f5f9' : 'white', cursor: 'pointer', fontSize: '12px', color: '#475569' }}>
                  {isExpanded ? '▲ Kapat' : '▼ Kategoriler'}
                </button>
                <button onClick={() => setEditId(d.id)} style={{ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '12px', color: '#475569' }}>Düzenle</button>
                <button onClick={() => setDel(d.id)} style={{ padding: '5px 10px', border: '1px solid #fecaca', borderRadius: '6px', background: '#fff5f5', cursor: 'pointer', fontSize: '12px', color: '#dc2626' }}>Sil</button>
              </div>

              {/* Kategoriler */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 16px', background: '#fafafa' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: '500' }}>Kategoriler</div>

                  {deptCats.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>Henüz kategori yok.</div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap' as any, gap: '6px', marginBottom: '12px' }}>
                    {deptCats.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                        {c.name}
                        <button onClick={() => deleteCategory(c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0369a1', fontSize: '14px', lineHeight: 1, padding: '0 0 0 4px' }}>×</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={newCatName[d.id] || ''}
                      onChange={e => setNewCat({ ...newCatName, [d.id]: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && addCategory(d.id)}
                      placeholder="Yeni kategori adı..."
                      style={{ flex: 1, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                    />
                    <button onClick={() => addCategory(d.id)}
                      style={{ padding: '6px 14px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      Ekle
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
