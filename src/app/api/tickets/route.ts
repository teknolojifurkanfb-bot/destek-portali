import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function createNotification(supabase: any, user_id: string, title: string, message: string, link: string, type = 'info') {
  await supabase.from('notifications').insert({ user_id, title, message, link, type })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, department_id')
    .eq('id', user.id)
    .single()

  let query = supabase
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
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await request.json()

  // Ticket no oluştur
  const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true })
  const ticket_no = `TKT-${String((count || 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      ticket_no,
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

  // Departmandaki agent ve adminlere bildirim gönder
  if (body.department_id) {
    const { data: agents } = await supabase
      .from('profiles')
      .select('id')
      .eq('department_id', body.department_id)
      .in('role', ['agent', 'admin'])

    for (const agent of agents || []) {
      await createNotification(
        supabase,
        agent.id,
        '🎫 Yeni Ticket',
        `${data?.ticket_no}: ${body.title}`,
        `/dashboard/tickets`,
        'info'
      )
    }
  }

  // Tüm adminlere bildirim gönder
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  for (const admin of admins || []) {
    await createNotification(
      supabase,
      admin.id,
      '🎫 Yeni Ticket',
      `${data?.ticket_no}: ${body.title}`,
      `/dashboard/tickets`,
      'info'
    )
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body

  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select('*, profiles(full_name), ticket_statuses(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Ticket sahibine durum değişikliği bildirimi
  if (updates.status_id && data?.profiles) {
    const { data: ticket } = await supabase
      .from('tickets')
      .select('created_by, ticket_no, title')
      .eq('id', id)
      .single()

    if (ticket) {
      await createNotification(
        supabase,
        ticket.created_by,
        '🔄 Ticket Güncellendi',
        `${ticket.ticket_no}: ${ticket.title}`,
        `/dashboard/tickets`,
        'success'
      )
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { id } = await request.json()
  const { error } = await supabase.from('tickets').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}