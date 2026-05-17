'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, ChevronLeft, Paperclip, Send, X, FileText, Image } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TicketStatus {
  id: string
  name: string
  color: string
  bg_color: string
  is_default?: boolean
}

interface Ticket {
  id: string
  ticket_no: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: string
  status_id: string
  created_at: string
  profiles: { full_name: string; email: string }
  departments: { name: string } | null
  ticket_statuses: { name: string; color: string; bg_color: string } | null
}

interface Department { id: string; name: string }
interface Category { id: string; name: string; department_id: string }

const PRIORITY_LABEL = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' }
const PRIORITY_STYLE = {
  high:   { bg: '#fee2e2', color: '#991b1b' },
  medium: { bg: '#fef3c7', color: '#92400e' },
  low:    { bg: '#f1f5f9', color: '#475569' },
}

function isImage(type: string) {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type?.toLowerCase())
}

export default function TicketsPage() {
  const [tickets, setTickets]       = useState<Ticket[]>([])
  const [statuses, setStatuses]     = useState<TicketStatus[]>([])
  const [departments, setDepts]     = useState<Department[]>([])
  const [categories, setCats]       = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterStatus, setFilter]   = useState('all')
  const [selected, setSelected]     = useState<Ticket | null>(null)
  const [messages, setMessages]     = useState<any[]>([])
  const [reply, setReply]           = useState('')
  const [sending, setSending]       = useState(false)
  const [showNew, setShowNew]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [newTicket, setNew]         = useState({
    title: '', description: '', category: '', priority: 'medium', department_id: ''
  })

  const loadStaticData = useCallback(async () => {
    const [sRes, dRes, cRes] = await Promise.all([
      fetch('/api/statuses'), fetch('/api/departments'), fetch('/api/categories'),
    ])
    const [sData, dData, cData] = await Promise.all([sRes.json(), dRes.json(), cRes.json()])
    setStatuses(Array.isArray(sData) ? sData : [])
    setDepts(Array.isArray(dData) ? dData : [])
    setCats(Array.isArray(cData) ? cData : [])
  }, [])

  const loadTickets = useCallback(async () => {
    const res = await fetch('/api/tickets')
    const data = await res.json()
    setTickets(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([loadStaticData(), loadTickets()])
      setLoading(false)
    }
    init()
  }, [])

  async function loadMessages(ticket_id: string) {
    const res = await fetch(`/api/tickets/messages?ticket_id=${ticket_id}`)
    const data = await res.json()
    setMessages(Array.isArray(data) ? data : [])
  }

  async function openTicket(t: Ticket) {
    setSelected(t)
    loadMessages(t.id)
  }

  async function sendReply() {
    if ((!reply.trim() && !selectedFile) || !selected || sending) return
    setSending(true)
    setUploading(true)

    let file_url = null
    let file_name = null
    let file_type = null

    if (selectedFile) {
      const supabase = createClient()
      const ext = selectedFile.name.split('.').pop() || 'bin'
      const safeName = selectedFile.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase()
      const path = `${selected.id}/${Date.now()}_${safeName}`
      const { data, error } = await supabase.storage.from('ticket-files').upload(path, selectedFile)
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('ticket-files').getPublicUrl(data.path)
        file_url = urlData.publicUrl
        file_name = selectedFile.name
        file_type = ext
      }
    }

    setUploading(false)

    await fetch('/api/tickets/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: selected.id,
        content: reply || (file_name ? `📎 ${file_name}` : ''),
        file_url,
        file_name,
        file_type,
      }),
    })

    setReply('')
    setSelectedFile(null)
    await loadMessages(selected.id)
    setSending(false)
  }

  async function updateStatus(ticketId: string, status_id: string) {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status_id } : t))
    if (selected?.id === ticketId) setSelected(prev => prev ? { ...prev, status_id } : null)
    fetch('/api/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ticketId, status_id }),
    })
  }

  async function submitNewTicket() {
    if (!newTicket.title || submitting) return
    setSubmitting(true)
    const defaultStatus = statuses.find(s => s.is_default) || statuses[0]
    await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTicket, status_id: defaultStatus?.id }),
    })
    await loadTickets()
    setShowNew(false)
    setNew({ title: '', description: '', category: '', priority: 'medium', department_id: '' })
    setSubmitting(false)
  }

  const filteredCats = newTicket.department_id ? categories.filter(c => c.department_id === newTicket.department_id) : categories
  const filtered = filterStatus === 'all' ? tickets : tickets.filter(t => t.status_id === filterStatus)
  function getStatus(id: string) { return statuses.find(s => s.id === id) }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '14px', background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'inherit',
  }

  if (loading) return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: '72px', background: 'var(--border)', borderRadius: '12px', opacity: 0.4 }} />)}
    </div>
  )

  // Detay sayfası
  if (selected) {
    const status = getStatus(selected.status_id)
    const prio = PRIORITY_STYLE[selected.priority]
    return (
      <div style={{ padding: '16px', maxWidth: '800px' }}>
        <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', padding: 0 }}>
          <ChevronLeft size={16} /> Geri dön
        </button>

        <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{selected.ticket_no} · {selected.category}</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '10px', lineHeight: '1.4' }}>{selected.title}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500', background: prio.bg, color: prio.color }}>{PRIORITY_LABEL[selected.priority]}</span>
            {selected.departments && <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{selected.departments.name}</span>}
          </div>
          {selected.description && <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '10px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{selected.description}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Durum:</span>
            {status && <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', fontWeight: '500', background: status.bg_color, color: status.color }}>{status.name}</span>}
            <select value={selected.status_id} onChange={e => updateStatus(selected.id, e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Mesajlar */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border)', padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '320px', overflowY: 'auto' }}>
            {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>Henüz mesaj yok.</div>}
            {messages.map((m, i) => {
              const isAgent = m.profiles?.role === 'agent' || m.profiles?.role === 'admin'
              return (
                <div key={m.id || i} style={{ display: 'flex', gap: '8px', flexDirection: isAgent ? 'row-reverse' : 'row' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: isAgent ? 'var(--accent)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: isAgent ? '#fff' : 'var(--text-secondary)' }}>
                    {(m.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ maxWidth: '80%' }}>
                    {/* Metin */}
                    {m.content && !m.file_url && (
                      <div style={{ padding: '8px 12px', fontSize: '13px', lineHeight: '1.5', background: isAgent ? 'var(--accent)' : 'var(--bg-elevated)', color: isAgent ? '#fff' : 'var(--text-primary)', borderRadius: isAgent ? '12px 12px 4px 12px' : '12px 12px 12px 4px' }}>
                        {m.content}
                      </div>
                    )}
                    {/* Dosya eki */}
                    {m.file_url && (
                      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: '280px' }}>
                        {isImage(m.file_type) ? (
                          <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                            <img src={m.file_url} alt={m.file_name} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
                          </a>
                        ) : (
                          <a href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-elevated)', textDecoration: 'none', color: 'var(--text-primary)' }}>
                            <FileText size={20} color="var(--accent-light-text)" />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '500' }}>{m.file_name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.file_type}</div>
                            </div>
                          </a>
                        )}
                        {m.content && m.content !== `📎 ${m.file_name}` && (
                          <div style={{ padding: '8px 12px', fontSize: '13px', background: isAgent ? 'var(--accent)' : 'var(--bg-surface)', color: isAgent ? '#fff' : 'var(--text-primary)' }}>
                            {m.content}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Seçili dosya önizleme */}
          {selectedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '10px' }}>
              {selectedFile.type.startsWith('image/') ? <Image size={16} color="var(--accent-light-text)" /> : <FileText size={16} color="var(--accent-light-text)" />}
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Yanıt kutusu */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <input ref={fileRef} type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()} style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', flexShrink: 0 }}>
              <Paperclip size={16} />
            </button>
            <textarea value={reply} onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) sendReply() }}
              placeholder="Yanıt yazın... (Ctrl+Enter)" rows={2}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', resize: 'none', fontFamily: 'inherit', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }} />
            <button onClick={sendReply} disabled={sending || uploading} style={{ padding: '10px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, fontSize: '13px' }}>
              {sending || uploading ? '...' : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Yeni ticket formu
  if (showNew) {
    return (
      <div style={{ padding: '16px' }}>
        <button onClick={() => setShowNew(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', padding: 0 }}>
          <ChevronLeft size={16} /> Geri dön
        </button>
        <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>Yeni Ticket</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Konu başlığı</label>
              <input value={newTicket.title} onChange={e => setNew({ ...newTicket, title: e.target.value })} placeholder="Sorununuzu kısaca açıklayın" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Departman</label>
              <select value={newTicket.department_id} onChange={e => setNew({ ...newTicket, department_id: e.target.value, category: '' })} style={inputStyle}>
                <option value="">Seçin</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Kategori</label>
              <select value={newTicket.category} onChange={e => setNew({ ...newTicket, category: e.target.value })} disabled={!newTicket.department_id} style={{ ...inputStyle, opacity: !newTicket.department_id ? 0.5 : 1 }}>
                <option value="">Seçin</option>
                {filteredCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Öncelik</label>
              <select value={newTicket.priority} onChange={e => setNew({ ...newTicket, priority: e.target.value })} style={inputStyle}>
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Açıklama</label>
              <textarea value={newTicket.description} onChange={e => setNew({ ...newTicket, description: e.target.value })} placeholder="Sorununuzu detaylı açıklayın..." rows={4}
                style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={submitNewTicket} disabled={submitting} style={{ flex: 1, padding: '11px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                {submitting ? 'Oluşturuluyor...' : 'Ticket oluştur'}
              </button>
              <button onClick={() => setShowNew(false)} style={{ padding: '11px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
                İptal
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Liste
  return (
    <div style={{ padding: '16px' }}>
      <style>{`
        .filter-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .filter-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Ticketlar</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{tickets.length} talep</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Yeni
        </button>
      </div>

      <div className="filter-scroll" style={{ marginBottom: '14px' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: filterStatus === 'all' ? 'var(--accent)' : 'var(--bg-surface)', color: filterStatus === 'all' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Tümü ({tickets.length})
        </button>
        {statuses.map(s => {
          const count = tickets.filter(t => t.status_id === s.id).length
          if (count === 0) return null
          return (
            <button key={s.id} onClick={() => setFilter(s.id)} style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${filterStatus === s.id ? s.color : 'var(--border)'}`, background: filterStatus === s.id ? s.bg_color : 'var(--bg-surface)', color: filterStatus === s.id ? s.color : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: filterStatus === s.id ? '600' : '400', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {s.name} ({count})
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>Ticket bulunamadı.</div>
        )}
        {filtered.map(t => {
          const status = getStatus(t.status_id)
          const prio = PRIORITY_STYLE[t.priority]
          return (
            <div key={t.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openTicket(t)}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', fontFamily: 'monospace' }}>{t.ticket_no}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.3' }}>{t.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {t.profiles?.full_name} · {t.departments?.name || '-'} · {new Date(t.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500', background: prio.bg, color: prio.color, flexShrink: 0 }}>
                  {PRIORITY_LABEL[t.priority]}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select value={t.status_id || ''} onChange={e => { e.stopPropagation(); updateStatus(t.id, e.target.value) }}
                  style={{ padding: '5px 8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500', border: `1px solid ${status?.color || 'var(--border)'}`, background: status?.bg_color || 'var(--bg-elevated)', color: status?.color || 'var(--text-secondary)', flex: 1 }}>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={() => openTicket(t)} style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Detay →
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
