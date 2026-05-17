'use client'

import { useState, useEffect, useCallback } from 'react'

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

export default function TicketsPage() {
  const [tickets, setTickets]     = useState<Ticket[]>([])
  const [statuses, setStatuses]   = useState<TicketStatus[]>([])
  const [departments, setDepts]   = useState<Department[]>([])
  const [categories, setCats]     = useState<Category[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterStatus, setFilter] = useState('all')
  const [selected, setSelected]   = useState<Ticket | null>(null)
  const [messages, setMessages]   = useState<any[]>([])
  const [reply, setReply]         = useState('')
  const [sending, setSending]     = useState(false)
  const [showNew, setShowNew]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newTicket, setNew]       = useState({
    title: '', description: '', category: '', priority: 'medium', department_id: ''
  })

  const loadStaticData = useCallback(async () => {
    const [sRes, dRes, cRes] = await Promise.all([
      fetch('/api/statuses'),
      fetch('/api/departments'),
      fetch('/api/categories'),
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
    if (!reply.trim() || !selected || sending) return
    setSending(true)
    const optimistic = {
      id: 'temp-' + Date.now(),
      content: reply,
      created_at: new Date().toISOString(),
      profiles: { full_name: 'Siz', role: 'agent' },
    }
    setMessages(prev => [...prev, optimistic])
    setReply('')
    await fetch('/api/tickets/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: selected.id, content: reply }),
    })
    await loadMessages(selected.id)
    setSending(false)
  }

  async function updateStatus(ticketId: string, status_id: string) {
    // Optimistic update — anında güncelle, sonra API'ye gönder
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

  const filteredCats = newTicket.department_id
    ? categories.filter(c => c.department_id === newTicket.department_id)
    : categories

  const filtered = filterStatus === 'all' ? tickets : tickets.filter(t => t.status_id === filterStatus)

  function getStatus(id: string) {
    return statuses.find(s => s.id === id)
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: '64px', background: '#f1f5f9', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    )
  }

  // Detay sayfası
  if (selected) {
    const status = getStatus(selected.status_id)
    const prio = PRIORITY_STYLE[selected.priority]
    return (
      <div style={{ padding: '24px', maxWidth: '800px' }}>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
          ← Geri dön
        </button>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{selected.ticket_no} · {selected.category}</div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>{selected.title}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500', background: prio.bg, color: prio.color }}>
                  {PRIORITY_LABEL[selected.priority]}
                </span>
                {selected.departments && (
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: '#f1f5f9', color: '#475569' }}>
                    {selected.departments.name}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13px', color: '#64748b' }}>
              <div style={{ fontWeight: '500', color: '#1e293b' }}>{selected.profiles?.full_name}</div>
              <div style={{ fontSize: '12px' }}>{selected.profiles?.email}</div>
            </div>
          </div>

          {selected.description && (
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
              {selected.description}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Durum:</span>
            {status && (
              <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', fontWeight: '500', background: status.bg_color, color: status.color }}>
                {status.name}
              </span>
            )}
            <span style={{ color: '#94a3b8' }}>→</span>
            <select value={selected.status_id} onChange={e => updateStatus(selected.id, e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '320px', overflowY: 'auto' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px' }}>Henüz mesaj yok.</div>
            )}
            {messages.map((m, i) => {
              const isAgent = m.profiles?.role === 'agent' || m.profiles?.role === 'admin'
              return (
                <div key={m.id || i} style={{ display: 'flex', gap: '10px', flexDirection: isAgent ? 'row-reverse' : 'row' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: isAgent ? '#dbeafe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: isAgent ? '#1d4ed8' : '#475569' }}>
                    {(m.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ padding: '10px 14px', fontSize: '13px', lineHeight: '1.5', maxWidth: '480px', background: isAgent ? '#1d4ed8' : '#f1f5f9', color: isAgent ? 'white' : '#1e293b', borderRadius: isAgent ? '12px 12px 4px 12px' : '12px 12px 12px 4px' }}>
                      {m.content}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                      {m.profiles?.full_name} · {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea value={reply} onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) sendReply() }}
              placeholder="Yanıt yazın... (Ctrl+Enter ile gönder)" rows={2}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', resize: 'none', fontFamily: 'system-ui' }} />
            <button onClick={sendReply} disabled={sending}
              style={{ padding: '0 20px', background: sending ? '#93c5fd' : '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: sending ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
              {sending ? '...' : 'Gönder'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Yeni ticket formu
  if (showNew) {
    return (
      <div style={{ padding: '24px', maxWidth: '600px' }}>
        <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
          ← Geri dön
        </button>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Yeni ticket</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Konu başlığı</label>
              <input value={newTicket.title} onChange={e => setNew({ ...newTicket, title: e.target.value })}
                placeholder="Sorununuzu kısaca açıklayın"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' as any }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Departman</label>
                <select value={newTicket.department_id}
                  onChange={e => setNew({ ...newTicket, department_id: e.target.value, category: '' })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
                  <option value="">Seçin</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Kategori</label>
                <select value={newTicket.category} onChange={e => setNew({ ...newTicket, category: e.target.value })}
                  disabled={!newTicket.department_id}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', opacity: !newTicket.department_id ? 0.5 : 1 }}>
                  <option value="">Seçin</option>
                  {filteredCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Öncelik</label>
              <select value={newTicket.priority} onChange={e => setNew({ ...newTicket, priority: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px' }}>Açıklama</label>
              <textarea value={newTicket.description} onChange={e => setNew({ ...newTicket, description: e.target.value })}
                placeholder="Sorununuzu detaylı açıklayın..." rows={4}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', resize: 'vertical', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={submitNewTicket} disabled={submitting}
                style={{ padding: '10px 20px', background: submitting ? '#93c5fd' : '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                {submitting ? 'Oluşturuluyor...' : 'Ticket oluştur'}
              </button>
              <button onClick={() => setShowNew(false)}
                style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px' }}>
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
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600' }}>Ticketlar</h1>
        <button onClick={() => setShowNew(true)}
          style={{ padding: '8px 16px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
          + Yeni ticket
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' as any }}>
        <button onClick={() => setFilter('all')}
          style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #e2e8f0', background: filterStatus === 'all' ? '#0f172a' : 'white', color: filterStatus === 'all' ? 'white' : '#64748b', cursor: 'pointer', fontSize: '13px' }}>
          Tümü ({tickets.length})
        </button>
        {statuses.map(s => {
          const count = tickets.filter(t => t.status_id === s.id).length
          if (count === 0) return null
          return (
            <button key={s.id} onClick={() => setFilter(s.id)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${filterStatus === s.id ? s.color : '#e2e8f0'}`, background: filterStatus === s.id ? s.bg_color : 'white', color: filterStatus === s.id ? s.color : '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: filterStatus === s.id ? '500' : '400' }}>
              {s.name} ({count})
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>Ticket bulunamadı.</div>
        )}
        {filtered.map(t => {
          const status = getStatus(t.status_id)
          const prio = PRIORITY_STYLE[t.priority]
          return (
            <div key={t.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', minWidth: '70px' }}>{t.ticket_no}</span>
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openTicket(t)}>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '3px' }}>{t.title}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {t.profiles?.full_name} · {t.departments?.name || '-'} · {t.category || '-'} · {new Date(t.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
              <select value={t.status_id || ''} onChange={e => { e.stopPropagation(); updateStatus(t.id, e.target.value) }}
                style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500', border: `1px solid ${status?.color || '#e2e8f0'}`, background: status?.bg_color || '#f1f5f9', color: status?.color || '#475569' }}>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500', background: prio.bg, color: prio.color }}>
                {PRIORITY_LABEL[t.priority]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
