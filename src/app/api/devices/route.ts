import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const db = createServiceClient()
  await db
    .from('devices')
    .update({ is_online: false })
    .lt('last_seen', new Date(Date.now() - 2 * 60 * 1000).toISOString())
    .eq('is_online', true)
  const { data, error } = await db
    .from('devices').select('*, departments(name)').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const db = createServiceClient()
  const body = await request.json()
  const { data, error } = await db
    .from('devices').insert({ ...body, created_by: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const db = createServiceClient()
  const body = await request.json()
  const { id, ...updates } = body
  const { data, error } = await db
    .from('devices').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const db = createServiceClient()
  const { id } = await request.json()
  const { error } = await db.from('devices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}