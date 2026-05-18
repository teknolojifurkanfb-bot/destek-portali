import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const db = createServiceClient()
  const { data, error } = await db
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const db = createServiceClient()
  const { id } = await request.json()
  if (id === 'all') {
    await db.from('notifications').update({ is_read: true }).eq('user_id', user.id)
  } else {
    await db.from('notifications').update({ is_read: true }).eq('id', id)
  }
  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const db = createServiceClient()
  await db.from('notifications').delete().eq('user_id', user.id)
  return NextResponse.json({ success: true })
}