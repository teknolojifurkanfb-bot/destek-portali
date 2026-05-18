import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const db = createServiceClient()
  const { data, error } = await db
    .from('documents')
    .select('*, profiles(full_name), departments(name)')
    .order('created_at', { ascending: false })
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
    .from('documents')
    .insert({
      name: body.name, description: body.description,
      file_url: body.file_url, file_type: body.file_type,
      file_size: body.file_size, department_id: body.department_id,
      created_by: user.id,
    })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const db = createServiceClient()
  const { id, file_url } = await request.json()
  if (file_url) {
    const path = file_url.split('/documents/')[1]
    if (path) await db.storage.from('documents').remove([path])
  }
  const { error } = await db.from('documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}