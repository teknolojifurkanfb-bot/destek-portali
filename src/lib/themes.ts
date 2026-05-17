// lib/themes.ts

export type ThemeName = 'light' | 'dark' | 'purple' | 'navy' | 'green' | 'orange'

export interface Theme {
  name: ThemeName
  label: string
  emoji: string
  vars: Record<string, string>
}

export const THEMES: Theme[] = [
  {
    name: 'light',
    label: 'Açık',
    emoji: '☀️',
    vars: {
      '--bg-base':       '#f1f5f9',
      '--bg-surface':    '#ffffff',
      '--bg-elevated':   '#f8fafc',
      '--bg-sidebar':    '#0f172a',
      '--sidebar-text':  '#94a3b8',
      '--sidebar-hover': '#1e293b',
      '--sidebar-active':'#3b82f6',
      '--sidebar-active-bg': '#1d3a6e',
      '--text-primary':  '#0f172a',
      '--text-secondary':'#64748b',
      '--text-muted':    '#94a3b8',
      '--border':        '#e2e8f0',
      '--border-focus':  '#3b82f6',
      '--accent':        '#3b82f6',
      '--accent-hover':  '#2563eb',
      '--accent-text':   '#ffffff',
      '--accent-light':  '#dbeafe',
      '--accent-light-text': '#1d4ed8',
      '--success':       '#10b981',
      '--warning':       '#f59e0b',
      '--danger':        '#ef4444',
      '--card-shadow':   '0 1px 3px rgba(0,0,0,0.06)',
    }
  },
  {
    name: 'dark',
    label: 'Karanlık',
    emoji: '🌙',
    vars: {
      '--bg-base':       '#0a0a0f',
      '--bg-surface':    '#13131a',
      '--bg-elevated':   '#1a1a24',
      '--bg-sidebar':    '#080810',
      '--sidebar-text':  '#6b7280',
      '--sidebar-hover': '#1a1a24',
      '--sidebar-active':'#6366f1',
      '--sidebar-active-bg': '#1e1b4b',
      '--text-primary':  '#f1f5f9',
      '--text-secondary':'#94a3b8',
      '--text-muted':    '#4b5563',
      '--border':        '#1f2937',
      '--border-focus':  '#6366f1',
      '--accent':        '#6366f1',
      '--accent-hover':  '#4f46e5',
      '--accent-text':   '#ffffff',
      '--accent-light':  '#1e1b4b',
      '--accent-light-text': '#a5b4fc',
      '--success':       '#10b981',
      '--warning':       '#f59e0b',
      '--danger':        '#ef4444',
      '--card-shadow':   '0 1px 3px rgba(0,0,0,0.4)',
    }
  },
  {
    name: 'purple',
    label: 'Mor',
    emoji: '💜',
    vars: {
      '--bg-base':       '#faf5ff',
      '--bg-surface':    '#ffffff',
      '--bg-elevated':   '#f5f0fe',
      '--bg-sidebar':    '#3b0764',
      '--sidebar-text':  '#c4b5fd',
      '--sidebar-hover': '#4c1d95',
      '--sidebar-active':'#e879f9',
      '--sidebar-active-bg': '#581c87',
      '--text-primary':  '#1e0a3c',
      '--text-secondary':'#7c3aed',
      '--text-muted':    '#a78bfa',
      '--border':        '#e9d5ff',
      '--border-focus':  '#a855f7',
      '--accent':        '#9333ea',
      '--accent-hover':  '#7e22ce',
      '--accent-text':   '#ffffff',
      '--accent-light':  '#f3e8ff',
      '--accent-light-text': '#7e22ce',
      '--success':       '#10b981',
      '--warning':       '#f59e0b',
      '--danger':        '#ef4444',
      '--card-shadow':   '0 1px 3px rgba(147,51,234,0.1)',
    }
  },
  {
    name: 'navy',
    label: 'Lacivert',
    emoji: '🌊',
    vars: {
      '--bg-base':       '#f0f4ff',
      '--bg-surface':    '#ffffff',
      '--bg-elevated':   '#e8eeff',
      '--bg-sidebar':    '#0a1628',
      '--sidebar-text':  '#7fa3c8',
      '--sidebar-hover': '#0f2040',
      '--sidebar-active':'#38bdf8',
      '--sidebar-active-bg': '#0c2a4a',
      '--text-primary':  '#0a1628',
      '--text-secondary':'#1e40af',
      '--text-muted':    '#93c5fd',
      '--border':        '#bfdbfe',
      '--border-focus':  '#3b82f6',
      '--accent':        '#1d4ed8',
      '--accent-hover':  '#1e40af',
      '--accent-text':   '#ffffff',
      '--accent-light':  '#dbeafe',
      '--accent-light-text': '#1e40af',
      '--success':       '#10b981',
      '--warning':       '#f59e0b',
      '--danger':        '#ef4444',
      '--card-shadow':   '0 1px 3px rgba(29,78,216,0.08)',
    }
  },
  {
    name: 'green',
    label: 'Yeşil',
    emoji: '🌿',
    vars: {
      '--bg-base':       '#f0fdf4',
      '--bg-surface':    '#ffffff',
      '--bg-elevated':   '#dcfce7',
      '--bg-sidebar':    '#052e16',
      '--sidebar-text':  '#6ee7b7',
      '--sidebar-hover': '#064e3b',
      '--sidebar-active':'#34d399',
      '--sidebar-active-bg': '#065f46',
      '--text-primary':  '#052e16',
      '--text-secondary':'#065f46',
      '--text-muted':    '#6ee7b7',
      '--border':        '#bbf7d0',
      '--border-focus':  '#10b981',
      '--accent':        '#059669',
      '--accent-hover':  '#047857',
      '--accent-text':   '#ffffff',
      '--accent-light':  '#d1fae5',
      '--accent-light-text': '#065f46',
      '--success':       '#10b981',
      '--warning':       '#f59e0b',
      '--danger':        '#ef4444',
      '--card-shadow':   '0 1px 3px rgba(5,150,105,0.08)',
    }
  },
  {
    name: 'orange',
    label: 'Turuncu',
    emoji: '🔥',
    vars: {
      '--bg-base':       '#fff7ed',
      '--bg-surface':    '#ffffff',
      '--bg-elevated':   '#ffedd5',
      '--bg-sidebar':    '#1c0a00',
      '--sidebar-text':  '#fb923c',
      '--sidebar-hover': '#2c1200',
      '--sidebar-active':'#fb923c',
      '--sidebar-active-bg': '#431407',
      '--text-primary':  '#1c0a00',
      '--text-secondary':'#c2410c',
      '--text-muted':    '#fdba74',
      '--border':        '#fed7aa',
      '--border-focus':  '#f97316',
      '--accent':        '#ea580c',
      '--accent-hover':  '#c2410c',
      '--accent-text':   '#ffffff',
      '--accent-light':  '#ffedd5',
      '--accent-light-text': '#c2410c',
      '--success':       '#10b981',
      '--warning':       '#f59e0b',
      '--danger':        '#ef4444',
      '--card-shadow':   '0 1px 3px rgba(234,88,12,0.08)',
    }
  },
]

export function applyTheme(themeName: ThemeName) {
  const theme = THEMES.find(t => t.name === themeName) || THEMES[0]
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  localStorage.setItem('theme', themeName)
}

export function getStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return 'light'
  return (localStorage.getItem('theme') as ThemeName) || 'light'
} 
