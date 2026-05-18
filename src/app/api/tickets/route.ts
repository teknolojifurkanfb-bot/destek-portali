import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 200 })

  const db = createServiceClient()
  const { data: profile } = await db
    .from('profiles').select('role, department_id').eq('id', user.id).single()

  let query = db
    .from('tickets')
    .select('*, profiles(full_name, email), departments(name), ticket_statuses(name, color, bg_color)')
    .order('created_at', { ascending: false })

  if (profile?.role === 'customer') {
    query = query.eq('created_by', user.id)
  } else if (profile?.role === 'agent') {
    query = query.eq('department_id', profile.department_id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const db = createServiceClient()
  const body = await request.json()

  const { data, error } = await db
    .from('tickets')
    .insert({
      title: body.title,
      description: body.description,
      priority: body.priority || 'medium',
      category: body.category,
      department_id: body.department_id,
      status_id: body.status_id,
      created_by: user.id,
    })
    .select('*, profiles(full_name), departments(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.department_id) {
    const { data: agents } = await db
      .from('profiles').select('id')
      .eq('department_id', body.department_id)
      .in('role', ['agent', 'admin'])
    for (const agent of (agents || [])) {
      await db.from('notifications').insert({
        user_id: agent.id,
        title: '🎫 Yeni Ticket',
        message: body.title,
        link: '/dashboard/tickets',
        type: 'info',
      })
    }
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const db = createServiceClient()
  const body = await request.json()
  const { id, ...updates } = body

  const { data, error } = await db
    .from('tickets').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const db = createServiceClient()
  const { id } = await request.json()
  const { error } = await db.from('tickets').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}