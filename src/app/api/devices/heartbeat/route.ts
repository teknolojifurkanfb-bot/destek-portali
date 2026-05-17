import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { ip_address, hostname } = body

  if (!hostname) return NextResponse.json({ error: 'hostname gerekli' }, { status: 400 })

  // Hostname ile cihazı ara
  const { data: existing } = await supabase
    .from('devices')
    .select('id')
    .eq('hostname', hostname)
    .single()

  if (existing) {
    // Varsa güncelle
    await supabase
      .from('devices')
      .update({
        ip_address,
        last_seen: new Date().toISOString(),
        is_online: true,
      })
      .eq('id', existing.id)
  } else {
    // Yoksa yeni cihaz olarak ekle
    await supabase
      .from('devices')
      .insert({
        name: hostname,
        hostname,
        ip_address,
        last_seen: new Date().toISOString(),
        is_online: true,
        is_active: true,
      })
  }

  return NextResponse.json({ success: true })
}