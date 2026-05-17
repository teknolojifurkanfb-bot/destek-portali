'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, ArrowLeft, Send, Filter } from 'lucide-react'

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
  const [showFilter, setShowFilter] = useState(false)
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
    const optimistic = { id: 'temp-' + Date.now(), content: reply, created_at: new Date().toISOString(), profiles: { full_name: 'Siz', role: 'agent' } }
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
    color: 'var(--text-primary)', boxSizing: 'border-box' as const, outline: 'none',
    fontFamily: 'inherit',
  }

  const selectStyle = { ...inputStyle }

  if (loading) return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: '80px', background: 'var(--border)', borderRadius: '12px', opacity: 0.4 }} />)}
    </div>
  )

  // Detay
  if (selected) {
    const status = getStatus(selected.status_id)
    const prio = PRIORITY_STYLE[selected.priority]
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selected.ticket_no}</div>
          </div>
        </div>

        {/* Ticket bilgisi */}
        <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500', background: prio.bg, color: prio.color }}>
              {PRIORITY_LABEL[selected.priority]}
            </span>
            {selected.departments && (
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                {selected.departments.name}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Durum:</span>
            <select value={selected.status_id} onChange={e => updateStatus(selected.id, e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: `1px solid ${status?.color || 'var(--border)'}`, background: status?.bg_color || 'var(--bg-elevated)', color: status?.color || 'var(--text-primary)' }}>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Mesajlar */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px' }}>Henüz mesaj yok.</div>}
          {messages.map((m, i) => {
            const isAgent = m.profiles?.role === 'agent' || m.profiles?.role === 'admin'
            return (
              <div key={m.id || i} style={{ display: 'flex', gap: '8px', flexDirection: isAgent ? 'row-reverse' : 'row' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: isAgent ? 'var(--accent)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: isAgent ? '#fff' : 'var(--text-secondary)' }}>
                  {(m.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ padding: '9px 12px', fontSize: '13px', lineHeight: '1.5', background: isAgent ? 'var(--accent)' : 'var(--bg-surface)', color: isAgent ? '#fff' : 'var(--text-primary)', borderRadius: isAgent ? '12px 12px 4px 12px' : '12px 12px 12px 4px', border: isAgent ? 'none' : '1px solid var(--border)' }}>
                    {m.content}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', textAlign: isAgent ? 'right' : 'left' }}>
                    {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Yanıt */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea value={reply} onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) sendReply() }}
            placeholder="Yanıt yazın..." rows={1}
            style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', resize: 'none', outline: 'none', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 100) + 'px' }}
          />
          <button onClick={sendReply} disabled={sending || !reply.trim()}
            style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none', background: sending || !reply.trim() ? 'var(--border)' : 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Send size={15} color={sending || !reply.trim() ? 'var(--text-muted)' : '#fff'} />
          </button>
        </div>
      </div>
    )
  }

  // Yeni ticket
  if (showNew) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Yeni Ticket</h1>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Konu başlığı</label>
              <input value={newTicket.title} onChange={e => setNew({ ...newTicket, title: e.target.value })} placeholder="Sorununuzu kısaca açıklayın" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Departman</label>
              <select value={newTicket.department_id} onChange={e => setNew({ ...newTicket, department_id: e.target.value, category: '' })} style={selectStyle}>
                <option value="">Seçin</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Kategori</label>
              <select value={newTicket.category} onChange={e => setNew({ ...newTicket, category: e.target.value })} disabled={!newTicket.department_id} style={{ ...selectStyle, opacity: !newTicket.department_id ? 0.5 : 1 }}>
                <option value="">Seçin</option>
                {filteredCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Öncelik</label>
              <select value={newTicket.priority} onChange={e => setNew({ ...newTicket, priority: e.target.value })} style={selectStyle}>
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Açıklama</label>
              <textarea value={newTicket.description} onChange={e => setNew({ ...newTicket, description: e.target.value })} placeholder="Sorununuzu detaylı açıklayın..." rows={4}
                style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }} />
            </div>
            <button onClick={submitNewTicket} disabled={submitting}
              style={{ padding: '12px', background: submitting ? 'var(--border)' : 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              {submitting ? 'Oluşturuluyor...' : 'Ticket oluştur'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Liste
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Ticketlar</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowFilter(!showFilter)}
            style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <Filter size={16} />
          </button>
          <button onClick={() => setShowNew(true)}
            style={{ padding: '8px 14px', background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={14} /> Yeni
          </button>
        </div>
      </div>

      {/* Filtreler */}
      {showFilter && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('all')}
            style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--border)', background: filterStatus === 'all' ? 'var(--accent)' : 'var(--bg-surface)', color: filterStatus === 'all' ? 'var(--accent-text)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
            Tümü ({tickets.length})
          </button>
          {statuses.map(s => {
            const count = tickets.filter(t => t.status_id === s.id).length
            if (count === 0) return null
            return (
              <button key={s.id} onClick={() => setFilter(s.id)}
                style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${filterStatus === s.id ? s.color : 'var(--border)'}`, background: filterStatus === s.id ? s.bg_color : 'var(--bg-surface)', color: filterStatus === s.id ? s.color : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: filterStatus === s.id ? '600' : '400' }}>
                {s.name} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Ticket listesi - kart görünümü */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>Ticket bulunamadı.</div>
        )}
        {filtered.map(t => {
          const status = getStatus(t.status_id)
          const prio = PRIORITY_STYLE[t.priority]
          return (
            <div key={t.id} onClick={() => openTicket(t)}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.ticket_no}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {status && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', fontWeight: '600', background: status.bg_color, color: status.color }}>{status.name}</span>}
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '8px', fontWeight: '600', background: prio.bg, color: prio.color }}>{PRIORITY_LABEL[t.priority]}</span>
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.4' }}>{t.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {t.profiles?.full_name} · {t.departments?.name || '-'} · {new Date(t.created_at).toLocaleDateString('tr-TR')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
