import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const department_id = formData.get('department_id') as string

  if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'bin'

  // Dosya adını temizle — boşluk ve özel karakter kaldır
  const safeName = file.name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase()

  const fileName = `${department_id}/${Date.now()}_${safeName}`

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(data.path)

  return NextResponse.json({
    file_url: urlData.publicUrl,
    file_path: data.path,
    file_type: ext.toUpperCase(),
    file_size: file.size,
  })
}