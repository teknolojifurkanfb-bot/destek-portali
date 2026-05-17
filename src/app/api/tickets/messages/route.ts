import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const ticket_id = searchParams.get('ticket_id')

  if (!ticket_id) return NextResponse.json({ error: 'ticket_id gerekli' }, { status: 400 })

  const { data, error } = await supabase
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

  const body = await request.json()

  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: body.ticket_id,
      sender_id: user.id,
      content: body.content,
      is_internal: body.is_internal || false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}