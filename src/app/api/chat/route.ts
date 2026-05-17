import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { messages } = await request.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key yok' }, { status: 500 })

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: 'Sen DestekHub isimli bir şirketin Türkçe konuşan AI destek asistanısın. Kısa, yardımcı ve samimi yanıtlar ver. Teknik sorunlar, ticket işlemleri ve genel sorular için yardım ediyorsun.',
        messages: messages.map((m: { role: string; parts: { text: string }[] }) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.parts[0].text,
        })),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Anthropic error:', data)
      return NextResponse.json({ error: data.error?.message || 'API hatası' }, { status: 500 })
    }

    const reply = data.content?.[0]?.text || 'Yanıt alınamadı.'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Fetch error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}