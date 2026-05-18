'use client'

import { useState, useEffect } from 'react'
import { Download, FileText, BarChart3, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Ticket {
  id: string
  ticket_no: string
  title: string
  priority: string
  created_at: string
  profiles: { full_name: string } | null
  departments: { name: string } | null
  ticket_statuses: { name: string } | null
}

interface Department {
  id: string
  name: string
}

const PRIORITY_LABEL: Record<string, string> = {
  high: 'Yüksek', medium: 'Orta', low: 'Düşük'
}

export default function ReportsPage() {
  const [tickets, setTickets]     = useState<Ticket[]>([])
  const [departments, setDepts]   = useState<Department[]>([])
  const [userRole, setUserRole]   = useState('')
  const [userDept, setUserDept]   = useState<string | null>(null)
  const [filterDept, setFilterDept] = useState('all')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd]   = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [statuses, setStatuses]   = useState<{id: string, name: string}[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role, department_id').eq('id', user.id).single()
      setUserRole(profile?.role || '')
      setUserDept(profile?.department_id || null)
      if (profile?.department_id && profile?.role !== 'admin') {
        setFilterDept(profile.department_id)
      }
    }

    const [tRes, dRes, sRes] = await Promise.all([
      fetch('/api/tickets'),
      fetch('/api/departments'),
      fetch('/api/statuses'),
    ])
    const [tData, dData, sData] = await Promise.all([tRes.json(), dRes.json(), sRes.json()])
    setTickets(Array.isArray(tData) ? tData : [])
    setDepts(Array.isArray(dData) ? dData : [])
    setStatuses(Array.isArray(sData) ? sData : [])
    setLoading(false)
  }

  const filtered = tickets.filter(t => {
    const deptOk = filterDept === 'all' || (t.departments && departments.find(d => d.id === filterDept)?.name === t.departments?.name)
    const statusOk = filterStatus === 'all' || t.ticket_statuses?.name === statuses.find(s => s.id === filterStatus)?.name
    const dateOk = (!filterStart || new Date(t.created_at) >= new Date(filterStart)) &&
                   (!filterEnd || new Date(t.created_at) <= new Date(filterEnd + 'T23:59:59'))
    return deptOk && statusOk && dateOk
  })

  // İstatistikler
  const stats = {
    total: filtered.length,
    high: filtered.filter(t => t.priority === 'high').length,
    medium: filtered.filter(t => t.priority === 'medium').length,
    low: filtered.filter(t => t.priority === 'low').length,
  }

  function exportCSV() {
    const headers = ['Ticket No', 'Başlık', 'Durum', 'Öncelik', 'Departman', 'Açan Kişi', 'Tarih']
    const rows = filtered.map(t => [
      t.ticket_no,
      t.title,
      t.ticket_statuses?.name || '-',
      PRIORITY_LABEL[t.priority] || t.priority,
      t.departments?.name || '-',
      t.profiles?.full_name || '-',
      new Date(t.created_at).toLocaleDateString('tr-TR'),
    ])

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bullbase-rapor-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportHTML() {
    const deptName = filterDept === 'all' ? 'Tüm Departmanlar' : departments.find(d => d.id === filterDept)?.name || '-'
    const dateRange = filterStart || filterEnd ? `${filterStart || '...'} - ${filterEnd || '...'}` : 'Tüm tarihler'

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>BullBase Ticket Raporu</title>
<style>
  body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; }
  .stats { display: flex; gap: 16px; margin-bottom: 24px; }
  .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; text-align: center; }
  .stat-val { font-size: 24px; font-weight: 700; color: #1e293b; }
  .stat-lbl { font-size: 12px; color: #64748b; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
  td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
  .high { background: #fee2e2; color: #991b1b; }
  .medium { background: #fef3c7; color: #92400e; }
  .low { background: #f1f5f9; color: #475569; }
  @media print { button { display: none; } }
</style>
</head>
<body>
<h1>🐂 BullBase — Ticket Raporu</h1>
<div class="meta">Departman: ${deptName} &nbsp;|&nbsp; Dönem: ${dateRange} &nbsp;|&nbsp; Oluşturulma: ${new Date().toLocaleString('tr-TR')}</div>

<div class="stats">
  <div class="stat"><div class="stat-val">${stats.total}</div><div class="stat-lbl">Toplam</div></div>
  <div class="stat"><div class="stat-val" style="color:#991b1b">${stats.high}</div><div class="stat-lbl">Yüksek Öncelik</div></div>
  <div class="stat"><div class="stat-val" style="color:#92400e">${stats.medium}</div><div class="stat-lbl">Orta Öncelik</div></div>
  <div class="stat"><div class="stat-val" style="color:#475569">${stats.low}</div><div class="stat-lbl">Düşük Öncelik</div></div>
</div>

<table>
<tr><th>Ticket No</th><th>Başlık</th><th>Durum</th><th>Öncelik</th><th>Departman</th><th>Açan Kişi</th><th>Tarih</th></tr>
${filtered.map(t => `<tr>
  <td><strong>${t.ticket_no}</strong></td>
  <td>${t.title}</td>
  <td>${t.ticket_statuses?.name || '-'}</td>
  <td><span class="badge ${t.priority}">${PRIORITY_LABEL[t.priority] || t.priority}</span></td>
  <td>${t.departments?.name || '-'}</td>
  <td>${t.profiles?.full_name || '-'}</td>
  <td>${new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
</tr>`).join('')}
</table>

<script>window.print()</script>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const cardStyle = {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: '14px', boxShadow: 'var(--card-shadow)',
  }

  const inputStyle = {
    padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px',
    fontSize: '13px', background: 'var(--bg-elevated)', color: 'var(--text-primary)',
    outline: 'none', fontFamily: 'inherit',
  }

  if (loading) return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: '60px', background: 'var(--border)', borderRadius: '12px', opacity: 0.4 }} />)}
    </div>
  )

  return (
    <div style={{ padding: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Raporlama</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Departman bazlı ticket raporu</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={exportHTML} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
            <FileText size={14} /> PDF / Yazdır
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div style={{ ...cardStyle, padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const, alignItems: 'flex-end' }}>
          {userRole === 'admin' && (
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Departman</label>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={inputStyle}>
                <option value="all">Tüm departmanlar</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Durum</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
              <option value="all">Tüm durumlar</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Başlangıç</label>
            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Bitiş</label>
            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} style={inputStyle} />
          </div>
          <button onClick={() => { setFilterStart(''); setFilterEnd(''); setFilterStatus('all'); if (userRole === 'admin') setFilterDept('all') }}
            style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Sıfırla
          </button>
        </div>
      </div>

      {/* İstatistik kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Toplam Ticket', value: stats.total, color: 'var(--accent)', bg: 'var(--accent-light)' },
          { label: 'Yüksek Öncelik', value: stats.high, color: '#991b1b', bg: '#fee2e2' },
          { label: 'Orta Öncelik', value: stats.medium, color: '#92400e', bg: '#fef3c7' },
          { label: 'Düşük Öncelik', value: stats.low, color: '#475569', bg: '#f1f5f9' },
        ].map((s, i) => (
          <div key={i} style={{ ...cardStyle, padding: '16px' }}>
            <div style={{ fontSize: '26px', fontWeight: '700', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tablo */}
      <div style={{ ...cardStyle, overflow: 'auto' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{filtered.length} ticket</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Filtrelerle eşleşen ticket bulunamadı
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {['Ticket No', 'Başlık', 'Durum', 'Öncelik', 'Departman', 'Açan Kişi', 'Tarih'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const prioStyle = t.priority === 'high' ? { bg: '#fee2e2', color: '#991b1b' } :
                                  t.priority === 'medium' ? { bg: '#fef3c7', color: '#92400e' } :
                                  { bg: '#f1f5f9', color: '#475569' }
                return (
                  <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{t.ticket_no}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-primary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{t.ticket_statuses?.name || '-'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', background: prioStyle.bg, color: prioStyle.color }}>
                        {PRIORITY_LABEL[t.priority] || t.priority}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{t.departments?.name || '-'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{t.profiles?.full_name || '-'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}