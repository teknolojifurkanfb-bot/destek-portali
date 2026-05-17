'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    password: '',
    password_confirm: '',
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function update(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.full_name || !form.username || !form.password) {
      setError('Lütfen tüm alanları doldurun.')
      return
    }

    if (form.username.length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalıdır.')
      return
    }

    if (/[^a-zA-Z0-9_]/.test(form.username)) {
      setError('Kullanıcı adı sadece harf, rakam ve _ içerebilir.')
      return
    }

    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      return
    }

    if (form.password !== form.password_confirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `${form.username.toLowerCase()}@destek.local`,
          password: form.password,
          full_name: form.full_name,
          username: form.username.toLowerCase(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error?.includes('already registered')) {
          setError('Bu kullanıcı adı zaten alınmış.')
        } else {
          setError(data.error || 'Bir hata oluştu.')
        }
        return
      }

      router.push('/login?registered=1')
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', background: '#1d4ed8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 12px' }}>🎧</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>BullBase</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Yeni hesap oluşturun</p>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px' }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>Ad Soyad</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => update('full_name', e.target.value)}
                placeholder="Ahmet Yılmaz"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as any, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>Kullanıcı adı</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}>@</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => update('username', e.target.value.toLowerCase())}
                  placeholder="kullanici_adi"
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 28px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as any, outline: 'none' }}
                />
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Harf, rakam ve _ kullanabilirsiniz</p>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>Şifre</label>
              <input
                type="password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="En az 6 karakter"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as any, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>Şifre tekrar</label>
              <input
                type="password"
                value={form.password_confirm}
                onChange={e => update('password_confirm', e.target.value)}
                placeholder="••••••"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as any, outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '11px', background: loading ? '#93c5fd' : '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px' }}
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt ol'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '20px' }}>
            Zaten hesabınız var mı?{' '}
            <Link href="/login" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: '500' }}>Giriş yapın</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
