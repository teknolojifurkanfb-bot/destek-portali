import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { user_id, password } = await request.json()

  if (!user_id || !password) {
    return NextResponse.json({ error: 'Kullanıcı ID ve şifre gerekli' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.auth.admin.updateUserById(user_id, { password })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}