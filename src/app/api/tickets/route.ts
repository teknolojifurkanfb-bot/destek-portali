import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    .select('*, profiles!tickets_created_by_fkey(full_name, email), departments(name), ticket_statuses(name, color, bg_color)')
    .order('created_at', { ascending: false })

  if (profile?.role === 'customer') {
    query = query.eq('created_by', user.id)
  } else if (profile?.role === 'agent' && profile?.department_id) {
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

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      title: body.title,
      description: body.description,
      priority: body.priority,
      category: body.category,
      department_id: body.department_id,
      created_by: user.id,
      status_id: body.status_id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { id, ...updates } = body

  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}