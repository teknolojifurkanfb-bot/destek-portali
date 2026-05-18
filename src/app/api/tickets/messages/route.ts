import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const db = createServiceClient()
  const { searchParams } = new URL(request.url)
  const ticket_id = searchParams.get('ticket_id')
  if (!ticket_id) return NextResponse.json({ error: 'ticket_id gerekli' }, { status: 400 })
  const { data, error } = await db
    .from('ticket_messages')
    .select('*, profiles(full_name, email, role)')
    .eq('ticket_id', ticket_id)
    .order('created_at')
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
    .from('ticket_messages')
    .insert({
      ticket_id: body.ticket_id,
      sender_id: user.id,
      content: body.content,
      is_internal: body.is_internal || false,
      file_url: body.file_url || null,
      file_name: body.file_name || null,
      file_type: body.file_type || null,
    })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: ticket } = await db
    .from('tickets')
    .select('ticket_no, title, created_by, department_id')
    .eq('id', body.ticket_id).single()

  if (ticket) {
    const { data: sender } = await db
      .from('profiles').select('full_name, role').eq('id', user.id).single()

    if (sender?.role !== 'customer' && ticket.created_by !== user.id) {
      await db.from('notifications').insert({
        user_id: ticket.created_by,
        title: '💬 Yeni Mesaj',
        message: `${ticket.ticket_no}: ${sender?.full_name} yanıt verdi`,
        link: '/dashboard/tickets',
        type: 'info',
      })
    }

    if (sender?.role === 'customer') {
      const { data: agents } = await db
        .from('profiles').select('id')
        .eq('department_id', ticket.department_id)
        .in('role', ['agent', 'admin'])
      for (const agent of agents || []) {
        if (agent.id !== user.id) {
          await db.from('notifications').insert({
            user_id: agent.id,
            title: '💬 Yeni Mesaj',
            message: `${ticket.ticket_no}: Müşteri yanıt verdi`,
            link: '/dashboard/tickets',
            type: 'info',
          })
        }
      }
    }
  }

  return NextResponse.json(data)
}