// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email, password, full_name, company } = await request.json()

  if (!email || !password || !full_name) {
    return NextResponse.json(
      { error: 'Ad, e-posta ve şifre zorunludur.' },
      { status: 400 }
    )
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Şifre en az 8 karakter olmalıdır.' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, company, role: 'customer' },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return NextResponse.json(
        { error: 'Bu e-posta zaten kayıtlı.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    message: 'Kayıt başarılı. E-postanızı doğrulayın.',
    user_id: data.user?.id,
  })
}
