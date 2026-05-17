# DestekHub — Auth Sistemi

## Kurulum

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Dosya yapısı

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx        # Giriş sayfası
│   │   └── register/page.tsx     # Kayıt sayfası
│   ├── auth/callback/route.ts    # OAuth / e-posta doğrulama
│   └── api/auth/
│       ├── login/route.ts        # POST /api/auth/login
│       ├── register/route.ts     # POST /api/auth/register
│       └── logout/route.ts       # POST /api/auth/logout
├── components/auth/
│   └── AuthProvider.tsx          # useAuth, useRequireRole hook'ları
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Tarayıcı istemcisi
│   │   └── server.ts             # Sunucu istemcisi (cookies)
│   └── auth.ts                   # requireAuth, requireRole yardımcıları
├── middleware/index.ts            # Route koruması
└── types/auth.ts                 # TypeScript tipleri
supabase/migrations/
└── 001_auth_setup.sql            # Profil tablosu + RLS
```

## Supabase kurulumu

1. [supabase.com](https://supabase.com) → yeni proje oluşturun
2. SQL Editor'de `supabase/migrations/001_auth_setup.sql` çalıştırın
3. `.env.example` dosyasını `.env.local` olarak kopyalayın, değerleri girin:
   - `NEXT_PUBLIC_SUPABASE_URL` → Project Settings > API > URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Project Settings > API > anon key
   - `SUPABASE_SERVICE_ROLE_KEY` → Project Settings > API > service_role key

## Rol sistemi

| Rol       | Erişim                                      |
|-----------|---------------------------------------------|
| customer  | /dashboard, /tickets, /chat, /kb            |
| agent     | + /agent (ticket yönetimi)                  |
| admin     | + /admin (kullanıcı ve ayar yönetimi)       |

## Kullanım örnekleri

### Server Component'te kullanıcı al:
```tsx
import { requireAuth, requireRole } from '@/lib/auth'

// Sadece giriş kontrolü
export default async function Page() {
  const user = await requireAuth()
  return <div>Merhaba {user.profile.full_name}</div>
}

// Rol kontrolü
export default async function AgentPage() {
  const user = await requireRole(['agent', 'admin'])
  return <div>Agent paneli</div>
}
```

### Client Component'te:
```tsx
'use client'
import { useAuth, useRequireRole } from '@/components/auth/AuthProvider'

export default function AgentPanel() {
  const { user, loading } = useRequireRole(['agent', 'admin'])
  const { logout, isRole } = useAuth()

  if (loading) return <div>Yükleniyor...</div>

  return (
    <div>
      {isRole('admin') && <button>Admin ayarları</button>}
      <button onClick={logout}>Çıkış yap</button>
    </div>
  )
}
```

### Middleware otomatik çalışır:
- Korumalı sayfalara giriş yapmadan erişilince `/login?redirect=/o-sayfa` yönlenir
- Yanlış roldeki kullanıcı kendi dashboard'una yönlenir
- OAuth callback `/auth/callback` ile işlenir
