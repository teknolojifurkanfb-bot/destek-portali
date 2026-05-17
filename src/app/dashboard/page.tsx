'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Ticket, Clock, CheckCircle, TrendingUp, Users, AlertCircle } from 'lucide-react'

interface TicketData {
  id: string
  status_id: string
  priority: string
  created_at: string
  department_id: string
  departments: { name: string } | null
  ticket_statuses: { name: string; color: string; bg_color: string } | null
}

interface StatCard {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
  bg: string
  sub?: string
}

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export default function DashboardPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/tickets')
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: '100px', background: 'var(--border)', borderRadius: '14px', opacity: 0.4 }} />)}
    </div>
  )

  // İstatistikler
  const total      = tickets.length
  const open       = tickets.filter(t => !t.ticket_statuses?.name?.includes('Kapalı') && !t.ticket_statuses?.name?.includes('Çözüldü')).length
  const closed     = tickets.filter(t => t.ticket_statuses?.name?.includes('Kapalı') || t.ticket_statuses?.name?.includes('Çözüldü')).length
  const highPrio   = tickets.filter(t => t.priority === 'high').length

  // Son 7 günün ticket verisi
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const count = tickets.filter(t => t.created_at.startsWith(dateStr)).length
    return { gun: DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1], adet: count, tarih: dateStr }
  })

  // Durum dağılımı
  const statusMap: Record<string, { count: number; color: string }> = {}
  tickets.forEach(t => {
    const name = t.ticket_statuses?.name || 'Bilinmiyor'
    const color = t.ticket_statuses?.color || '#94a3b8'
    if (!statusMap[name]) statusMap[name] = { count: 0, color }
    statusMap[name].count++
  })
  const statusData = Object.entries(statusMap).map(([name, { count, color }]) => ({ name, value: count, color }))

  // Departman dağılımı
  const deptMap: Record<string, number> = {}
  tickets.forEach(t => {
    const name = t.departments?.name || 'Genel'
    deptMap[name] = (deptMap[name] || 0) + 1
  })
  const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }))

  // Öncelik dağılımı
  const prioData = [
    { name: 'Yüksek', value: tickets.filter(t => t.priority === 'high').length, color: '#ef4444' },
    { name: 'Orta',   value: tickets.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Düşük',  value: tickets.filter(t => t.priority === 'low').length, color: '#10b981' },
  ].filter(p => p.value > 0)

  const stats: StatCard[] = [
    { label: 'Toplam Ticket',  value: total,    icon: <Ticket size={20} />,       color: '#3b82f6', bg: '#dbeafe', sub: 'Tüm zamanlar' },
    { label: 'Açık Ticket',    value: open,     icon: <AlertCircle size={20} />,   color: '#f59e0b', bg: '#fef3c7', sub: 'Yanıt bekliyor' },
    { label: 'Çözülen',        value: closed,   icon: <CheckCircle size={20} />,   color: '#10b981', bg: '#d1fae5', sub: 'Tamamlandı' },
    { label: 'Yüksek Öncelik', value: highPrio, icon: <TrendingUp size={20} />,    color: '#ef4444', bg: '#fee2e2', sub: 'Acil' },
  ]

  const cardStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: 'var(--card-shadow)',
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Başlık */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Ticket istatistikleri ve genel bakış</p>
      </div>

      {/* Stat kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {stats.map((s, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: '20px' }}>{s.sub}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Haftalık trend grafiği */}
      <div style={cardStyle}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Son 7 Gün — Ticket Trendi</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Günlük açılan ticket sayısı</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={last7Days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAdet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="gun" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px' }}
              formatter={(value: number) => [value + ' ticket', 'Adet']}
            />
            <Area type="monotone" dataKey="adet" stroke="var(--accent)" strokeWidth={2.5} fill="url(#colorAdet)" dot={{ fill: 'var(--accent)', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alt grafikler */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>

        {/* Durum dağılımı - Pie */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Durum Dağılımı</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Ticket durumlarına göre</p>
          {statusData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>Veri yok</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {statusData.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                    </div>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Departman dağılımı - Bar */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Departman Dağılımı</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Departmana göre ticket sayısı</p>
          {deptData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>Veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Öncelik dağılımı */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Öncelik Dağılımı</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Ticket önceliklerine göre</p>
          {prioData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>Veri yok</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={prioData} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                    {prioData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {prioData.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.value}</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${total > 0 ? (p.value / total) * 100 : 0}%`, background: p.color, borderRadius: '2px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
