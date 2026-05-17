'use client'
import { useState, useEffect, useRef } from 'react'
import { Download, Upload, Trash2, ChevronDown, ChevronUp, X, Plus, Edit2, Image } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface KBFile {
  id: string
  name: string
  description: string
  file_url: string
  file_size: number
  file_type: string
  category: string
  created_at: string
}

interface KBItem {
  id: string
  type: 'faq' | 'step'
  title: string | null
  content: string
  category: string | null
  sort_order: number
  image_url?: string | null
  image_urls?: string[]
}

const DEFAULT_STEPS: KBItem[] = [
  { id: 's1', type: 'step', title: 'BullBase Agent\'ı indirin', content: 'Aşağıdaki "İndirilenler" bölümünden BullBaseAgent.exe dosyasını indirin.', category: null, sort_order: 1 },
  { id: 's2', type: 'step', title: 'EXE\'yi çalıştırın', content: 'İndirilen BullBaseAgent.exe dosyasına çift tıklayın. Windows güvenlik uyarısı çıkarsa "Yine de çalıştır" seçeneğine tıklayın.', category: null, sort_order: 2 },
  { id: 's3', type: 'step', title: 'Otomatik kayıt', content: 'Agent çalışmaya başladıktan sonra birkaç saniye içinde BullBase portalında "Cihazlar" sayfasında otomatik olarak görünür.', category: null, sort_order: 3 },
  { id: 's4', type: 'step', title: 'Windows başlangıcına eklenir', content: 'Agent kendini Windows başlangıcına otomatik ekler. Bilgisayar her açıldığında otomatik çalışır.', category: null, sort_order: 4 },
  { id: 's5', type: 'step', title: 'TightVNC Server kurun (isteğe bağlı)', content: 'Uzak masaüstü desteği için karşı PC\'ye TightVNC Server kurun. tightvnc.com adresinden ücretsiz indirebilirsiniz.', category: null, sort_order: 5 },
]

const DEFAULT_FAQS: KBItem[] = [
  { id: 'f1', type: 'faq', title: 'BullBase Agent nedir?', content: 'BullBase Agent, bilgisayarınızın durumunu BullBase portalına bildiren küçük bir programdır. Her 30 saniyede bir portala sinyal göndererek bilgisayarınızın online olduğunu bildirir ve IP adresinizi otomatik günceller.', category: 'Agent', sort_order: 1 },
  { id: 'f2', type: 'faq', title: 'Agent çalışıyor mu nasıl anlarım?', content: 'BullBase portalında "Cihazlar" sayfasını açın. Bilgisayarınız yeşil "Online" ikonuyla görünüyorsa agent çalışıyordur.', category: 'Agent', sort_order: 2 },
  { id: 'f3', type: 'faq', title: 'Ticket nasıl oluştururum?', content: 'Sol menüden "Ticketlar" sayfasına gidin, sağ üstteki "Yeni" butonuna tıklayın.', category: 'Ticket', sort_order: 1 },
  { id: 'f4', type: 'faq', title: 'Şifremi nasıl değiştiririm?', content: 'Sol alttaki profil alanınıza tıklayın, "Profil" sayfasına gidin.', category: 'Hesap', sort_order: 1 },
]

function formatSize(bytes: number) {
  if (!bytes) return '-'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const STEP_ICONS = ['⬇️', '▶️', '✅', '🔄', '🖥️', '⚙️', '📋', '🔧', '💡', '🎯']

export default function KBPage() {
  const [files, setFiles]             = useState<KBFile[]>([])
  const [steps, setSteps]             = useState<KBItem[]>([])
  const [faqs, setFaqs]               = useState<KBItem[]>([])
  const [userRole, setUserRole]       = useState('')
  const [uploading, setUploading]     = useState(false)
  const [openFaq, setOpenFaq]         = useState<string | null>(null)
  const [activeTab, setActiveTab]     = useState<'guide' | 'downloads' | 'faq'>('guide')
  const [showUpload, setShowUpload]   = useState(false)
  const [newFile, setNewFile]         = useState({ name: '', description: '', category: 'Agent' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteConfirm, setDel]       = useState<string | null>(null)
  const [editItem, setEditItem]       = useState<KBItem | null>(null)
  const [editForm, setEditForm]       = useState({ title: '', content: '', category: '' })
  const [editImages, setEditImages]   = useState<File[]>([])
  const [editExistingImgs, setEditExistingImgs] = useState<string[]>([])
  const [showAddStep, setShowAddStep] = useState(false)
  const [showAddFaq, setShowAddFaq]   = useState(false)
  const [newStep, setNewStep]         = useState({ title: '', content: '' })
  const [newStepImages, setNewStepImages] = useState<File[]>([])
  const [newFaq, setNewFaq]           = useState({ title: '', content: '', category: 'Agent' })
  const [saving, setSaving]           = useState(false)
  const [lightbox, setLightbox]       = useState<string | null>(null)
  const fileRef       = useRef<HTMLInputElement>(null)
  const editImgRef    = useRef<HTMLInputElement>(null)
  const newStepImgRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setUserRole(profile?.role || '')
    }
    try {
      const { data } = await supabase.from('kb_files').select('*').order('created_at', { ascending: false })
      setFiles(Array.isArray(data) ? data : [])
    } catch { setFiles([]) }
    try {
      const { data } = await supabase.from('kb_content').select('*').order('sort_order')
      if (data && data.length > 0) {
        setSteps(data.filter((d: KBItem) => d.type === 'step'))
        setFaqs(data.filter((d: KBItem) => d.type === 'faq'))
      } else {
        setSteps(DEFAULT_STEPS)
        setFaqs(DEFAULT_FAQS)
      }
    } catch {
      setSteps(DEFAULT_STEPS)
      setFaqs(DEFAULT_FAQS)
    }
  }

  async function uploadImages(imgs: File[]): Promise<string[]> {
    const supabase = createClient()
    const urls: string[] = []
    for (const file of imgs) {
      const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase()
      const path = `steps/${Date.now()}_${safeName}`
      const { data, error } = await supabase.storage.from('kb-files').upload(path, file, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('kb-files').getPublicUrl(data.path)
        urls.push(urlData.publicUrl)
      }
    }
    return urls
  }

  async function handleUpload() {
    if (!selectedFile || !newFile.name) return
    setUploading(true)
    const supabase = createClient()
    const safeName = selectedFile.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase()
    const { data, error } = await supabase.storage.from('kb-files').upload(safeName, selectedFile, { upsert: true })
    if (error) { alert('Yükleme hatası: ' + error.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('kb-files').getPublicUrl(data.path)
    await supabase.from('kb_files').insert({
      name: newFile.name, description: newFile.description,
      file_url: urlData.publicUrl, file_size: selectedFile.size,
      file_type: selectedFile.name.split('.').pop()?.toUpperCase() || 'EXE',
      category: newFile.category,
    })
    await loadData()
    setShowUpload(false)
    setNewFile({ name: '', description: '', category: 'Agent' })
    setSelectedFile(null)
    setUploading(false)
  }

  async function handleDeleteFile(id: string, file_url: string) {
    const supabase = createClient()
    const path = file_url.split('/kb-files/')[1]
    if (path) await supabase.storage.from('kb-files').remove([path])
    await supabase.from('kb_files').delete().eq('id', id)
    await loadData()
    setDel(null)
  }

  function handleDownload(file: KBFile) {
    window.open(file.file_url, '_blank')
  }

  async function addStep() {
    if (!newStep.title || !newStep.content) return
    setSaving(true)
    const supabase = createClient()
    const image_urls = newStepImages.length > 0 ? await uploadImages(newStepImages) : []
    await supabase.from('kb_content').insert({
      type: 'step', title: newStep.title, content: newStep.content,
      sort_order: steps.length + 1, image_urls,
    })
    setNewStep({ title: '', content: '' })
    setNewStepImages([])
    setShowAddStep(false)
    await loadData()
    setSaving(false)
  }

  async function addFaq() {
    if (!newFaq.title || !newFaq.content) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('kb_content').insert({
      type: 'faq', title: newFaq.title, content: newFaq.content,
      category: newFaq.category,
      sort_order: faqs.filter(f => f.category === newFaq.category).length + 1,
    })
    setNewFaq({ title: '', content: '', category: 'Agent' })
    setShowAddFaq(false)
    await loadData()
    setSaving(false)
  }

  async function saveEdit() {
    if (!editItem) return
    setSaving(true)
    const supabase = createClient()
    const newUrls = editImages.length > 0 ? await uploadImages(editImages) : []
    const image_urls = [...editExistingImgs, ...newUrls]

    if (editItem.id.length < 10) {
      await supabase.from('kb_content').insert({
        type: editItem.type, title: editForm.title, content: editForm.content,
        category: editForm.category || null, sort_order: editItem.sort_order, image_urls,
      })
    } else {
      await supabase.from('kb_content').update({
        title: editForm.title, content: editForm.content,
        category: editForm.category || null, image_urls,
      }).eq('id', editItem.id)
    }
    setEditItem(null)
    setEditImages([])
    setEditExistingImgs([])
    await loadData()
    setSaving(false)
  }

  async function deleteItem(item: KBItem) {
    if (item.id.length < 10) return
    const supabase = createClient()
    await supabase.from('kb_content').delete().eq('id', item.id)
    await loadData()
  }

  function openEdit(item: KBItem) {
    setEditItem(item)
    setEditForm({ title: item.title || '', content: item.content, category: item.category || '' })
    setEditExistingImgs(item.image_urls && item.image_urls.length > 0 ? item.image_urls : (item.image_url ? [item.image_url] : []))
    setEditImages([])
  }

  const isAdmin = userRole === 'admin'
  const faqCategories = [...new Set(faqs.map(f => f.category).filter(Boolean))]

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '14px', background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'inherit',
  }

  const cardStyle = {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: '14px', boxShadow: 'var(--card-shadow)',
  }

  return (
    <div style={{ padding: '16px' }}>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px', cursor: 'zoom-out' }}>
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Düzenleme modalı */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '520px', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {editItem.type === 'step' ? 'Adımı Düzenle' : 'SSS Düzenle'}
              </h2>
              <button onClick={() => setEditItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  {editItem.type === 'step' ? 'Adım başlığı' : 'Soru'}
                </label>
                <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} style={inputStyle} />
              </div>
              {editItem.type === 'faq' && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Kategori</label>
                  <input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} placeholder="Agent, Ticket, Hesap..." style={inputStyle} />
                </div>
              )}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  {editItem.type === 'step' ? 'Açıklama' : 'Cevap'}
                </label>
                <textarea value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} rows={3}
                  style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>

              {editItem.type === 'step' && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Görseller</label>
                  {editExistingImgs.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '8px' }}>
                      {editExistingImgs.map((url, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={url} alt="" style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                          <button onClick={() => setEditExistingImgs(prev => prev.filter(u => u !== url))}
                            style={{ position: 'absolute', top: '3px', right: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#dc2626', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {editImages.length > 0 && (
                    <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)', padding: '8px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                      📷 {editImages.length} yeni görsel: {editImages.map(f => f.name).join(', ')}
                    </div>
                  )}
                  <input ref={editImgRef} type="file" accept="image/*" multiple onChange={e => setEditImages(Array.from(e.target.files || []))} style={{ display: 'none' }} />
                  <button onClick={() => editImgRef.current?.click()}
                    style={{ width: '100%', padding: '9px', border: '1px dashed var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Image size={14} /> Görsel ekle (birden fazla seçebilirsiniz)
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveEdit} disabled={saving} style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button onClick={() => setEditItem(null)} style={{ padding: '10px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Silme onayı */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Dosyayı sil</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Bu dosya kalıcı olarak silinecek.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setDel(null)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>İptal</button>
              <button onClick={() => { const f = files.find(f => f.id === deleteConfirm); if (f) handleDeleteFile(f.id, f.file_url) }} style={{ flex: 1, padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Bilgi Bankası</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Kurulum rehberi, indirmeler ve SSS</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowUpload(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
            <Upload size={14} /> Dosya yükle
          </button>
        )}
      </div>

      {/* Upload formu */}
      {showUpload && isAdmin && (
        <div style={{ ...cardStyle, padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Dosya yükle</h2>
            <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${selectedFile ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: selectedFile ? 'var(--accent-light)' : 'var(--bg-elevated)' }}>
              <input ref={fileRef} type="file" onChange={e => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); if (!newFile.name) setNewFile(n => ({ ...n, name: f.name.split('.')[0] })) } }} style={{ display: 'none' }} />
              {selectedFile ? (
                <div>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>📦</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatSize(selectedFile.size)}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>📂</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Dosya seçmek için tıklayın</div>
                </div>
              )}
            </div>
            <input value={newFile.name} onChange={e => setNewFile({ ...newFile, name: e.target.value })} placeholder="Dosya adı" style={inputStyle} />
            <input value={newFile.description} onChange={e => setNewFile({ ...newFile, description: e.target.value })} placeholder="Açıklama" style={inputStyle} />
            <select value={newFile.category} onChange={e => setNewFile({ ...newFile, category: e.target.value })} style={inputStyle}>
              <option value="Agent">Agent</option>
              <option value="Kurulum">Kurulum</option>
              <option value="Araçlar">Araçlar</option>
              <option value="Diğer">Diğer</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleUpload} disabled={uploading || !selectedFile || !newFile.name}
                style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                {uploading ? 'Yükleniyor...' : 'Yükle'}
              </button>
              <button onClick={() => setShowUpload(false)} style={{ padding: '10px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Sekmeler */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '4px' }}>
        {([
          { key: 'guide', label: '📋 Kurulum' },
          { key: 'downloads', label: '⬇️ İndirilenler' },
          { key: 'faq', label: '❓ SSS' },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ flex: 1, padding: '9px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: activeTab === tab.key ? '600' : '400', background: activeTab === tab.key ? 'var(--bg-surface)' : 'transparent', color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: activeTab === tab.key ? 'var(--card-shadow)' : 'none', transition: 'all 0.15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Kurulum Rehberi */}
      {activeTab === 'guide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ ...cardStyle, padding: '20px', background: 'var(--accent)' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖥️</div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>BullBase Agent Kurulum Rehberi</h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Aşağıdaki adımları takip ederek agent'ı kurabilirsiniz</p>
          </div>

          {steps.map((step, idx) => {
            const imgs = step.image_urls && step.image_urls.length > 0 ? step.image_urls : (step.image_url ? [step.image_url] : [])
            return (
              <div key={step.id} style={{ ...cardStyle, overflow: 'hidden' }}>
                <div style={{ padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                    {STEP_ICONS[idx] || '📋'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-light-text)', background: 'var(--accent-light)', padding: '2px 8px', borderRadius: '20px', display: 'inline-block', marginBottom: '4px' }}>Adım {idx + 1}</span>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{step.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{step.content}</div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => openEdit(step)}
                        style={{ padding: '5px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                        <Edit2 size={13} />
                      </button>
                      {step.id.length >= 10 && (
                        <button onClick={() => deleteItem(step)}
                          style={{ padding: '5px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', color: '#dc2626', display: 'flex' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {imgs.length > 0 && (
                  <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: imgs.length === 1 ? '1fr' : 'repeat(2,1fr)', gap: '8px' }}>
                    {imgs.map((url, i) => (
                      <img key={i} src={url} alt="" onClick={() => setLightbox(url)}
                        style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border)', cursor: 'zoom-in', maxHeight: imgs.length === 1 ? '280px' : '160px' }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {isAdmin && (
            showAddStep ? (
              <div style={{ ...cardStyle, padding: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>Yeni adım ekle</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input value={newStep.title} onChange={e => setNewStep({ ...newStep, title: e.target.value })} placeholder="Adım başlığı" style={inputStyle} />
                  <textarea value={newStep.content} onChange={e => setNewStep({ ...newStep, content: e.target.value })} placeholder="Açıklama" rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                  <input ref={newStepImgRef} type="file" accept="image/*" multiple onChange={e => setNewStepImages(Array.from(e.target.files || []))} style={{ display: 'none' }} />
                  {newStepImages.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                      📷 {newStepImages.length} görsel seçildi
                    </div>
                  )}
                  <button onClick={() => newStepImgRef.current?.click()}
                    style={{ padding: '9px', border: '1px dashed var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Image size={14} /> Görsel ekle (birden fazla seçebilirsiniz)
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={addStep} disabled={saving} style={{ flex: 1, padding: '9px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                      {saving ? '...' : 'Ekle'}
                    </button>
                    <button onClick={() => { setShowAddStep(false); setNewStepImages([]) }} style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>İptal</button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddStep(true)}
                style={{ padding: '12px', border: '2px dashed var(--border)', borderRadius: '14px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Plus size={15} /> Yeni adım ekle
              </button>
            )
          )}

          <div style={{ padding: '16px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>⚠️ Önemli Not</div>
            <div style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>
              Agent ilk çalıştığında Windows Defender veya antivirüs programı uyarı verebilir. Bu normaldir — "Yine de çalıştır" seçeneğini seçin.
            </div>
          </div>
        </div>
      )}

      {/* İndirilenler */}
      {activeTab === 'downloads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
              <div style={{ fontSize: '14px' }}>Henüz dosya yüklenmemiş</div>
              {isAdmin && <div style={{ fontSize: '12px', marginTop: '4px' }}>Sağ üstteki "Dosya yükle" butonuyla ekleyin</div>}
            </div>
          ) : (
            files.map(file => (
              <div key={file.id} style={{ ...cardStyle, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {file.file_type === 'EXE' ? '⚙️' : file.file_type === 'PDF' ? '📕' : '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                  {file.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{file.description}</div>}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{file.file_type} · {formatSize(file.file_size)}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => handleDownload(file)}
                    style={{ padding: '8px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Download size={13} /> İndir
                  </button>
                  {isAdmin && (
                    <button onClick={() => setDel(file.id)}
                      style={{ padding: '8px 10px', border: '1px solid #fecaca', borderRadius: '8px', background: '#fff5f5', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SSS */}
      {activeTab === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqCategories.map(cat => (
            <div key={cat as string}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', padding: '0 4px' }}>{cat}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {faqs.filter(f => f.category === cat).map(faq => (
                  <div key={faq.id} style={{ ...cardStyle, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                        style={{ flex: 1, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', textAlign: 'left' as const }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{faq.title}</span>
                        {openFaq === faq.id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      </button>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: '4px', padding: '0 12px', flexShrink: 0 }}>
                          <button onClick={() => openEdit(faq)}
                            style={{ padding: '5px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                            <Edit2 size={13} />
                          </button>
                          {faq.id.length >= 10 && (
                            <button onClick={() => deleteItem(faq)}
                              style={{ padding: '5px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', color: '#dc2626', display: 'flex' }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {openFaq === faq.id && (
                      <div style={{ padding: '0 16px 14px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', borderTop: '1px solid var(--border)' }}>
                        <div style={{ paddingTop: '12px' }}>{faq.content}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {isAdmin && (
            showAddFaq ? (
              <div style={{ ...cardStyle, padding: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>Yeni SSS ekle</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input value={newFaq.title} onChange={e => setNewFaq({ ...newFaq, title: e.target.value })} placeholder="Soru" style={inputStyle} />
                  <input value={newFaq.category} onChange={e => setNewFaq({ ...newFaq, category: e.target.value })} placeholder="Kategori (Agent, Ticket, Hesap...)" style={inputStyle} />
                  <textarea value={newFaq.content} onChange={e => setNewFaq({ ...newFaq, content: e.target.value })} placeholder="Cevap" rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={addFaq} disabled={saving} style={{ flex: 1, padding: '9px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                      {saving ? '...' : 'Ekle'}
                    </button>
                    <button onClick={() => setShowAddFaq(false)} style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>İptal</button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddFaq(true)}
                style={{ padding: '12px', border: '2px dashed var(--border)', borderRadius: '14px', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Plus size={15} /> Yeni SSS ekle
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}