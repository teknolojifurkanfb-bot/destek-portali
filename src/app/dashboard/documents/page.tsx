'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Document {
  id: string
  name: string
  description: string | null
  file_url: string
  file_type: string
  file_size: number
  department_id: string
  created_at: string
  profiles: { full_name: string } | null
  departments: { name: string } | null
}

interface Department {
  id: string
  name: string
}

const FILE_ICONS: Record<string, string> = {
  XLSX: '📊', XLS: '📊',
  DOCX: '📄', DOC: '📄',
  PDF:  '📕',
  PNG:  '🖼️', JPG: '🖼️', JPEG: '🖼️',
  TXT:  '📝',
  CSV:  '📊',
}

const FILE_COLORS: Record<string, { bg: string; color: string }> = {
  XLSX: { bg: '#d1fae5', color: '#065f46' },
  XLS:  { bg: '#d1fae5', color: '#065f46' },
  DOCX: { bg: '#dbeafe', color: '#1d4ed8' },
  DOC:  { bg: '#dbeafe', color: '#1d4ed8' },
  PDF:  { bg: '#fee2e2', color: '#991b1b' },
  CSV:  { bg: '#fef3c7', color: '#92400e' },
}

function formatSize(bytes: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getPreviewUrl(doc: Document): string | null {
  const type = doc.file_type?.toUpperCase()
  const url = doc.file_url

  if (['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(type)) return url
  if (type === 'PDF') return url
  if (type === 'TXT') return url
  if (['XLSX', 'XLS', 'DOCX', 'DOC', 'PPT', 'PPTX'].includes(type)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
  }
  if (type === 'CSV') {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
  }
  return null
}

export default function DocumentsPage() {
  const [documents, setDocs]      = useState<Document[]>([])
  const [departments, setDepts]   = useState<Department[]>([])
  const [userDeptId, setUserDept] = useState<string | null>(null)
  const [userRole, setUserRole]   = useState<string>('')
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filterDept, setFilter]   = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [deleteConfirm, setDel]   = useState<Document | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [previewDoc, setPreview]  = useState<Document | null>(null)
  const [newDoc, setNew]          = useState({ name: '', description: '', department_id: '' })
  const [selectedFile, setFile]   = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('department_id, role')
        .eq('id', user.id)
        .single()
      setUserDept(profile?.department_id || null)
      setUserRole(profile?.role || 'customer')
      if (profile?.department_id) {
        setNew(n => ({ ...n, department_id: profile.department_id }))
      }
    }

    const [dRes, depRes] = await Promise.all([
      fetch('/api/documents'),
      fetch('/api/departments'),
    ])
    const [dData, depData] = await Promise.all([dRes.json(), depRes.json()])
    setDocs(Array.isArray(dData) ? dData : [])
    setDepts(Array.isArray(depData) ? depData : [])
    setLoading(false)
  }

  async function handleUpload() {
    if (!selectedFile || !newDoc.name || !newDoc.department_id) return
    setUploading(true)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('department_id', newDoc.department_id)

    const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: formData })
    const uploadData = await uploadRes.json()

    if (uploadData.error) {
      alert('Yükleme hatası: ' + uploadData.error)
      setUploading(false)
      return
    }

    await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newDoc.name,
        description: newDoc.description,
        file_url: uploadData.file_url,
        file_type: uploadData.file_type,
        file_size: uploadData.file_size,
        department_id: newDoc.department_id,
      }),
    })

    await loadData()
    setShowUpload(false)
    setNew({ name: '', description: '', department_id: userDeptId || '' })
    setFile(null)
    setUploading(false)
  }

  async function handleDelete(doc: Document) {
    await fetch('/api/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: doc.id, file_url: doc.file_url }),
    })
    await loadData()
    setDel(null)
  }

  async function handleDownload(doc: Document) {
    const supabase = createClient()
    const path = doc.file_url.split('/documents/')[1]
    if (!path) { window.open(doc.file_url, '_blank'); return }

    const { data, error } = await supabase.storage.from('documents').download(path)
    if (error || !data) { window.open(doc.file_url, '_blank'); return }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name + '.' + doc.file_type.toLowerCase()
    a.click()
    URL.revokeObjectURL(url)
  }

  const isAdmin = userRole === 'admin'
  const filtered = documents.filter(d => {
    const deptOk = filterDept === 'all' || d.department_id === filterDept
    const typeOk = filterType === 'all' || d.file_type === filterType
    return deptOk && typeOk
  })
  const fileTypes = [...new Set(documents.map(d => d.file_type))]

  if (loading) return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: '140px', background: 'var(--border)', borderRadius: '14px', opacity: 0.4 }} />)}
    </div>
  )

  return (
    <div style={{ padding: '24px' }}>

      {/* Önizleme modalı */}
      {previewDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{FILE_ICONS[previewDoc.file_type] || '📎'}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{previewDoc.name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{previewDoc.file_type} · {formatSize(previewDoc.file_size)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleDownload(previewDoc)} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                ↓ İndir
              </button>
              <button onClick={() => setPreview(null)} style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', color: '#fca5a5', cursor: 'pointer', fontSize: '13px' }}>
                ✕ Kapat
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            {['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(previewDoc.file_type) ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <img src={previewDoc.file_url} alt={previewDoc.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
              </div>
            ) : getPreviewUrl(previewDoc) ? (
              <iframe
                src={getPreviewUrl(previewDoc)!}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={previewDoc.name}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '48px' }}>{FILE_ICONS[previewDoc.file_type] || '📎'}</div>
                <div style={{ fontSize: '16px' }}>Bu dosya türü önizlenemiyor</div>
                <button onClick={() => handleDownload(previewDoc)} style={{ padding: '10px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  ↓ İndir
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Silme onayı */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🗑️</div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Dokümanı sil</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <strong>{deleteConfirm.name}</strong> kalıcı olarak silinecek.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDel(null)} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>İptal</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Doküman Yönetimi</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Excel, Word, PDF dosyalarını departmana göre yönetin</p>
        </div>
        <button onClick={() => setShowUpload(true)} style={{ padding: '10px 18px', background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
          ↑ Dosya yükle
        </button>
      </div>

      {/* Upload formu */}
      {showUpload && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>Yeni doküman yükle</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${selectedFile ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '12px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: selectedFile ? 'var(--accent-light)' : 'var(--bg-elevated)', transition: 'all 0.2s' }}>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.docx,.doc,.pdf,.csv,.txt,.png,.jpg,.jpeg"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!newDoc.name) setNew(n => ({ ...n, name: f.name.split('.')[0] })) } }}
                style={{ display: 'none' }} />
              {selectedFile ? (
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{FILE_ICONS[selectedFile.name.split('.').pop()?.toUpperCase() || ''] || '📎'}</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{formatSize(selectedFile.size)}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Dosya seçmek için tıklayın</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Excel, Word, PDF, CSV desteklenir</div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Doküman adı</label>
                <input value={newDoc.name} onChange={e => setNew({ ...newDoc, name: e.target.value })} placeholder="Envanter Listesi..."
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', boxSizing: 'border-box' as any, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Departman</label>
                <select value={newDoc.department_id} onChange={e => setNew({ ...newDoc, department_id: e.target.value })}
                  disabled={!isAdmin && !!userDeptId}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', opacity: (!isAdmin && !!userDeptId) ? 0.7 : 1 }}>
                  <option value="">Seçin</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Açıklama (isteğe bağlı)</label>
              <input value={newDoc.description} onChange={e => setNew({ ...newDoc, description: e.target.value })} placeholder="Bu doküman hakkında kısa bilgi..."
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', boxSizing: 'border-box' as any, outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleUpload} disabled={uploading || !selectedFile || !newDoc.name || !newDoc.department_id}
                style={{ padding: '10px 20px', background: (uploading || !selectedFile || !newDoc.name || !newDoc.department_id) ? 'var(--border)' : 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                {uploading ? 'Yükleniyor...' : 'Yükle'}
              </button>
              <button onClick={() => { setShowUpload(false); setFile(null) }} style={{ padding: '10px 20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' as any }}>
        {isAdmin && (
          <>
            <button onClick={() => setFilter('all')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: filterDept === 'all' ? 'var(--accent)' : 'var(--bg-surface)', color: filterDept === 'all' ? 'var(--accent-text)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
              Tüm departmanlar
            </button>
            {departments.map(d => (
              <button key={d.id} onClick={() => setFilter(d.id)} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: filterDept === d.id ? 'var(--accent)' : 'var(--bg-surface)', color: filterDept === d.id ? 'var(--accent-text)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                {d.name}
              </button>
            ))}
            <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />
          </>
        )}
        <button onClick={() => setFilterType('all')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: filterType === 'all' ? 'var(--bg-elevated)' : 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
          Tüm formatlar
        </button>
        {fileTypes.map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: filterType === t ? (FILE_COLORS[t]?.bg || 'var(--bg-elevated)') : 'var(--bg-surface)', color: filterType === t ? (FILE_COLORS[t]?.color || 'var(--text-primary)') : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: filterType === t ? '600' : '400' }}>
            {FILE_ICONS[t] || '📎'} {t}
          </button>
        ))}
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{filtered.length} doküman</div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📂</div>
          <div style={{ fontSize: '14px' }}>Henüz doküman yok</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Dosya yükle butonuyla başlayın</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filtered.map(doc => {
            const fc = FILE_COLORS[doc.file_type] || { bg: '#f1f5f9', color: '#475569' }
            const icon = FILE_ICONS[doc.file_type] || '📎'
            const canEdit = isAdmin || doc.department_id === userDeptId
            const canPreview = getPreviewUrl(doc) !== null || ['PNG','JPG','JPEG','GIF','WEBP'].includes(doc.file_type)
            return (
              <div key={doc.id}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--card-shadow)', transition: 'transform 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: fc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                    {doc.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.description}</div>}
                  </div>
                  <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: fc.bg, color: fc.color, fontWeight: '700', flexShrink: 0 }}>{doc.file_type}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap' as any }}>
                  <span>📁 {doc.departments?.name || '-'}</span>
                  <span>·</span>
                  <span>{formatSize(doc.file_size)}</span>
                  <span>·</span>
                  <span>{new Date(doc.created_at).toLocaleDateString('tr-TR')}</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {canPreview && (
                    <button onClick={() => setPreview(doc)}
                      style={{ flex: 1, padding: '7px', border: '1px solid var(--accent)', borderRadius: '8px', background: 'var(--accent-light)', cursor: 'pointer', fontSize: '12px', color: 'var(--accent-light-text)', fontWeight: '500' }}>
                      👁️ Görüntüle
                    </button>
                  )}
                  <button onClick={() => handleDownload(doc)}
                    style={{ flex: 1, padding: '7px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>
                    ↓ İndir
                  </button>
                  {canEdit && (
                    <button onClick={() => setDel(doc)}
                      style={{ padding: '7px 12px', border: '1px solid #fecaca', borderRadius: '8px', background: '#fff5f5', cursor: 'pointer', fontSize: '12px', color: '#dc2626' }}>
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
