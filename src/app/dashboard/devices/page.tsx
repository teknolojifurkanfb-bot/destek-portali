'use client'

import { useState, useEffect } from 'react'
import { Monitor, Plus, Trash2, ExternalLink, X, Copy, Key } from 'lucide-react'

interface Device {
  id: string
  name: string
  ip_address: string
  description: string | null
  department_id: string | null
  is_active: boolean
  is_online: boolean
  last_seen: string | null
  hostname: string | null
  agent_key: string | null
  created_at: string
  departments: { name: string } | null
}

interface Department {
  id: string
  name: string
}

export default function DevicesPage() {
  const [devices, setDevices]      = useState<Device[]>([])
  const [departments, setDepts]    = useState<Department[]>([])
  const [loading, setLoading]      = useState(true)
  const [showNew, setShowNew]      = useState(false)
  const [deleteConfirm, setDel]    = useState<string | null>(null)
  const [filterDept, setFilter]    = useState('all')
  const [filterStatus, setFilterS] = useState<'all' | 'online' | 'offline'>('all')
  const [showKey, setShowKey]      = useState<string | null>(null)
  const [toast, setToast]          = useState('')
  const [newDevice, setNew]        = useState({ name: '', ip_address: '', description: '', department_id: '' })
  const [saving, setSaving]        = useState(false)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const [dRes, depRes] = await Promise.all([fetch('/api/devices'), fetch('/api/departments')])
    const [dData, depData] = await Promise.all([dRes.json(), depRes.json()])
    setDevices(Array.isArray(dData) ? dData : [])
    setDepts(Array.isArray(depData) ? depData : [])
    setLoading(false)
  }

  async function addDevice() {
    if (!newDevice.name) return
    setSaving(true)
    await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDevice),
    })
    await loadData()
    setNew({ name: '', ip_address: '', description: '', department_id: '' })
    setShowNew(false)
    setSaving(false)
  }

  async function deleteDevice(id: string) {
    await fetch('/api/devices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadData()
    setDel(null)
  }

  function connectTightVNC(device: Device) {
    // bullbase:// protokolü ile BullBaseLauncher.exe'yi çağır
    // Launcher TightVNC'yi otomatik açar
    window.location.href = `bullbase://${device.ip_address}`
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    showToastMsg('Agent key kopyalandı!')
  }

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function getLastSeen(last_seen: string | null) {
    if (!last_seen) return 'Hiç bağlanmadı'
    const diff = Date.now() - new Date(last_seen).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Az önce'
    if (mins < 60) return `${mins} dk önce`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} saat önce`
    return `${Math.floor(hours / 24)} gün önce`
  }

  const filtered = devices.filter(d => {
    const deptOk = filterDept === 'all' || d.department_id === filterDept
    const statusOk = filterStatus === 'all' ? true : filterStatus === 'online' ? d.is_online : !d.is_online
    return deptOk && statusOk
  })

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '14px', background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'inherit',
  }

  const cardStyle = {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '20px', boxShadow: 'var(--card-shadow)',
  }

  if (loading) return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '12px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: '180px', background: 'var(--border)', borderRadius: '14px', opacity: 0.4 }} />)}
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

      {/* Agent Key Modal */}
      {showKey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '90%', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Key size={20} color="var(--accent-light-text)" />
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Agent Key</h2>
              </div>
              <button onClick={() => setShowKey(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
              Bu key'i <strong>bullbase_agent.py</strong> dosyasındaki <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>AGENT_KEY</code> satırına yapıştırın.
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
              <code style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', wordBreak: 'break-all' as const, fontFamily: 'monospace' }}>{showKey}</code>
              <button onClick={() => copyKey(showKey)} style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <Copy size={12} /> Kopyala
              </button>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '10px', padding: '14px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Kurulum adımları:</strong><br />
              1. <code style={{ background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: '3px' }}>bullbase_agent.py</code> dosyasını indirin<br />
              2. <code style={{ background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: '3px' }}>AGENT_KEY</code> ve <code style={{ background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: '3px' }}>PORTAL_URL</code> ayarlayın<br />
              3. <code style={{ background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: '3px' }}>build_agent.bat</code> ile EXE oluşturun<br />
              4. EXE'yi PC'ye kopyalayın ve çalıştırın<br />
              5. Birkaç saniye içinde bu sayfada <span style={{ color: '#10b981', fontWeight: '600' }}>Online</span> görünür
            </div>
          </div>
        </div>
      )}

      {/* Silme onayı */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '90%', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Cihazı sil</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Bu cihazı silmek istediğinize emin misiniz?</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDel(null)} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>İptal</button>
              <button onClick={() => deleteDevice(deleteConfirm)} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Cihaz Yönetimi</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            <span style={{ color: '#10b981', fontWeight: '600' }}>{devices.filter(d => d.is_online).length} online</span>
            {' · '}{devices.length} toplam cihaz
          </p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
          <Plus size={15} /> Cihaz ekle
        </button>
      </div>

      {/* Yeni cihaz formu */}
      {showNew && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Yeni cihaz ekle</h2>
            <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Cihaz adı *</label>
                <input value={newDevice.name} onChange={e => setNew({ ...newDevice, name: e.target.value })}
                  placeholder="örn. Muhasebe PC-1" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>IP Adresi (isteğe bağlı)</label>
                <input value={newDevice.ip_address} onChange={e => setNew({ ...newDevice, ip_address: e.target.value })}
                  placeholder="Agent kurulunca otomatik gelir" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Departman</label>
                <select value={newDevice.department_id} onChange={e => setNew({ ...newDevice, department_id: e.target.value })} style={inputStyle}>
                  <option value="">Seçin</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Açıklama</label>
                <input value={newDevice.description} onChange={e => setNew({ ...newDevice, description: e.target.value })}
                  placeholder="Kullanıcı adı, konum..." style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addDevice} disabled={saving} style={{ padding: '10px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                {saving ? 'Ekleniyor...' : 'Ekle'}
              </button>
              <button onClick={() => setShowNew(false)} style={{ padding: '10px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
        <button onClick={() => setFilterS('all')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: filterStatus === 'all' ? 'var(--accent)' : 'var(--bg-surface)', color: filterStatus === 'all' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
          Tümü ({devices.length})
        </button>
        <button onClick={() => setFilterS('online')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: filterStatus === 'online' ? '#d1fae5' : 'var(--bg-surface)', color: filterStatus === 'online' ? '#065f46' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
          🟢 Online ({devices.filter(d => d.is_online).length})
        </button>
        <button onClick={() => setFilterS('offline')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: filterStatus === 'offline' ? 'var(--bg-elevated)' : 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
          ⚫ Offline ({devices.filter(d => !d.is_online).length})
        </button>
        {departments.map(d => (
          <button key={d.id} onClick={() => setFilter(filterDept === d.id ? 'all' : d.id)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: filterDept === d.id ? 'var(--accent)' : 'var(--bg-surface)', color: filterDept === d.id ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
            {d.name}
          </button>
        ))}
      </div>

      {/* Cihaz grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Monitor size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: '14px' }}>Cihaz bulunamadı</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {filtered.map(device => (
            <div key={device.id} style={{
              ...cardStyle,
              borderColor: device.is_online ? 'rgba(16,185,129,0.3)' : 'var(--border)',
              transition: 'transform 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: device.is_online ? '#d1fae5' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                  <Monitor size={22} color={device.is_online ? '#065f46' : 'var(--text-muted)'} />
                  {device.is_online && (
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid var(--bg-surface)' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.name}</div>
                  {device.hostname && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{device.hostname}</div>}
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '600', background: device.is_online ? '#d1fae5' : 'var(--bg-elevated)', color: device.is_online ? '#065f46' : 'var(--text-muted)', flexShrink: 0 }}>
                  {device.is_online ? '● Online' : '○ Offline'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: '60px' }}>IP:</span>
                  <code style={{ background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', color: 'var(--accent-light-text)', fontFamily: 'monospace' }}>
                    {device.ip_address || 'Bekleniyor...'}
                  </code>
                </div>
                {device.departments && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', minWidth: '60px' }}>Dept:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{device.departments.name}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: '60px' }}>Son:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{getLastSeen(device.last_seen)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => connectTightVNC(device)} disabled={!device.is_online}
                  style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: device.is_online ? 'var(--accent)' : 'var(--border)', color: device.is_online ? '#fff' : 'var(--text-muted)', cursor: device.is_online ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <ExternalLink size={13} /> Bağlan
                </button>
                <button onClick={() => setShowKey(device.agent_key || '')}
                  style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                  <Key size={13} /> Key
                </button>
                <button onClick={() => setDel(device.id)}
                  style={{ padding: '8px 10px', border: '1px solid #fecaca', borderRadius: '8px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '24px', padding: '14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        <strong style={{ color: 'var(--text-primary)' }}>💡 Bağlantı hakkında:</strong><br />
        Bağlan butonuna tıklayınca <strong>BullBaseLauncher</strong> devreye girer ve TightVNC'yi otomatik açar. 
        Launcher'ı ilk kez çalıştırmanız gerekir (<code style={{ background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: '3px' }}>BullBaseLauncher.exe</code>). 
        Karşı PC'de TightVNC Server kurulu ve çalışıyor olmalıdır.
      </div>
    </div>
  )
}
