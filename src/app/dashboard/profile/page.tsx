'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    department_id: '',
  })
  const [userId, setUserId]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [savingPwd, setSavingPwd]   = useState(false)
  const [success, setSuccess]       = useState('')
  const [error, setError]           = useState('')
  const [password, setPassword]     = useState({ current: '', new: '', confirm: '' })
  const [showPwd, setShowPwd]       = useState({ current: false, new: false, confirm: false })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          role: data.role || '',
          department_id: data.department_id || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        company: profile.company,
      })
      .eq('id', userId)

    if (error) {
      setError('Bilgiler kaydedilemedi: ' + error.message)
    } else {
      setSuccess('Bilgiler başarıyla güncellendi.')
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  async function handlePasswordChange() {
    setError('')
    setSuccess('')

    if (!password.new || !password.confirm) {
      setError('Lütfen tüm şifre alanlarını doldurun.')
      return
    }
    if (password.new.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır.')
      return
    }
    if (password.new !== password.confirm) {
      setError('Yeni şifreler eşleşmiyor.')
      return
    }

    setSavingPwd(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: password.new })

    if (error) {
      setError('Şifre değiştirilemedi: ' + error.message)
    } else {
      setSuccess('Şifre başarıyla değiştirildi.')
      setPassword({ current: '', new: '', confirm: '' })
      setTimeout(() => setSuccess(''), 3000)
    }
    setSavingPwd(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '14px', background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', boxSizing: 'border-box' as const, outline: 'none',
    fontFamily: 'inherit',
  }

  const cardStyle = {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px', boxShadow: 'var(--card-shadow)',
  }

  const ROLE_LABEL: Record<string, string> = {
    customer: 'Müşteri',
    agent: 'Destek Temsilcisi',
    admin: 'Yönetici',
  }

  if (loading) return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1, 2].map(i => <div key={i} style={{ height: '200px', background: 'var(--border)', borderRadius: '16px', opacity: 0.4 }} />)}
    </div>
  )

  return (
    <div style={{ padding: '24px', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Profilim</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Kişisel bilgilerinizi ve şifrenizi yönetin</p>
      </div>

      {success && (
        <div style={{ background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✕ {error}
        </div>
      )}

      {/* Profil bilgileri */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="var(--accent-light-text)" />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Kişisel Bilgiler</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ad, telefon ve şirket bilgileriniz</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', color: '#fff' }}>
              {profile.full_name.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{profile.full_name || 'İsimsiz'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                <span style={{ padding: '2px 8px', borderRadius: '20px', background: 'var(--accent-light)', color: 'var(--accent-light-text)', fontWeight: '500' }}>
                  {ROLE_LABEL[profile.role] || profile.role}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Ad Soyad</label>
            <input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} placeholder="Adınız Soyadınız" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>E-posta</label>
            <input value={profile.email.replace('@destek.local', '')} disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>E-posta değiştirilemez</p>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Telefon</label>
            <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="0532 000 00 00" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>Şirket</label>
            <input value={profile.company} onChange={e => setProfile({ ...profile, company: e.target.value })} placeholder="Şirket adı" style={inputStyle} />
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '11px', background: saving ? 'var(--border)' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: '600', marginTop: '4px',
          }}>
            <Save size={15} />
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
          </button>
        </div>
      </div>

      {/* Şifre değiştir */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={18} color="#dc2626" />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Şifre Değiştir</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Güvenli bir şifre belirleyin</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {(['new', 'confirm'] as const).map(field => (
            <div key={field}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                {field === 'new' ? 'Yeni şifre' : 'Yeni şifre tekrar'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd[field] ? 'text' : 'password'}
                  value={password[field]}
                  onChange={e => setPassword({ ...password, [field]: e.target.value })}
                  placeholder="••••••"
                  style={{ ...inputStyle, paddingRight: '44px' }}
                />
                <button onClick={() => setShowPwd(p => ({ ...p, [field]: !p[field] }))} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {showPwd[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          <button onClick={handlePasswordChange} disabled={savingPwd} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '11px', background: savingPwd ? 'var(--border)' : '#dc2626',
            color: '#fff', border: 'none', borderRadius: '8px', cursor: savingPwd ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: '600',
          }}>
            <Lock size={15} />
            {savingPwd ? 'Değiştiriliyor...' : 'Şifreyi değiştir'}
          </button>
        </div>
      </div>
    </div>
  )
}
