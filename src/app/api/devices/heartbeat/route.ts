import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { agent_key, ip_address, hostname } = body

  if (!agent_key) return NextResponse.json({ error: 'agent_key gerekli' }, { status: 400 })

  // agent_key ile cihazı bul ve güncelle
  const { data, error } = await supabase
    .from('devices')
    .update({
      ip_address,
      hostname,
      last_seen: new Date().toISOString(),
      is_online: true,
    })
    .eq('agent_key', agent_key)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, device: data })
}