'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Trash2, User } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Merhaba! Ben DestekHub AI asistanıyım. Size nasıl yardımcı olabilirim? Teknik sorunlar, ticket işlemleri veya genel sorularınız için buradayım.',
      time: now(),
    }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  function now() {
    return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      time: now(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            parts: [{ text: m.content }],
          })),
        }),
      })

      const data = await res.json()

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Bir hata oluştu, lütfen tekrar deneyin.',
        time: now(),
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.',
        time: now(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Sohbet temizlendi. Size nasıl yardımcı olabilirim?',
      time: now(),
    }])
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>AI Asistan</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Gemini • Çevrimiçi</span>
            </div>
          </div>
        </div>
        <button onClick={clearChat} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <Trash2 size={13} />
          Temizle
        </button>
      </div>

      {/* Mesajlar */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: '10px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {msg.role === 'user'
                ? <User size={15} color="#fff" />
                : <Bot size={15} color="var(--accent-light-text)" />
              }
            </div>
            <div style={{ maxWidth: '72%' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-surface)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                fontSize: '14px', lineHeight: '1.6',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                boxShadow: 'var(--card-shadow)',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {/* Yazıyor animasyonu */}
        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={15} color="var(--accent-light-text)" />
            </div>
            <div style={{ padding: '14px 18px', borderRadius: '4px 16px 16px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', gap: '5px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '7px', height: '7px', borderRadius: '50%', background: 'var(--text-muted)',
                  animation: 'bounce 1.2s infinite',
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-end', boxShadow: 'var(--card-shadow)' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mesajınızı yazın... (Enter ile gönderin)"
          rows={1}
          style={{
            flex: 1, border: 'none', outline: 'none', resize: 'none',
            fontSize: '14px', lineHeight: '1.5', background: 'transparent',
            color: 'var(--text-primary)', fontFamily: 'inherit',
            maxHeight: '120px', overflowY: 'auto',
          }}
          onInput={e => {
            const t = e.target as HTMLTextAreaElement
            t.style.height = 'auto'
            t.style.height = Math.min(t.scrollHeight, 120) + 'px'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            width: '36px', height: '36px', borderRadius: '10px', border: 'none',
            background: loading || !input.trim() ? 'var(--border)' : 'var(--accent)',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          <Send size={15} color={loading || !input.trim() ? 'var(--text-muted)' : '#fff'} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
