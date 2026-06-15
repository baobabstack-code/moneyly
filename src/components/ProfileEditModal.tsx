'use client'

import { useEffect, useState } from 'react'
import { saveProfile, type UserProfile } from '@/lib/profile'
import { useFinanceStore } from '@/lib/financeStore'

interface Props {
  section: 'personal'
  profile: UserProfile | null
  onClose: () => void
  onSaved: (updated: Partial<UserProfile>) => void
}

export default function ProfileEditModal({ profile, onClose, onSaved }: Props) {
  const currencyCode = useFinanceStore(state => state.currency);
  const accentColor = useFinanceStore(state => state.accentColor);
  const currencySymbol = (() => {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$', CAD: 'C$' };
    return map[currencyCode] || '$';
  })();
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    first_name:             profile?.first_name || '',
    last_name:              profile?.last_name || '',
    monthly_income:         profile?.monthly_income || '',
  })

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const upd = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const handleSave = async () => {
    setSaving(true)
    const data = {
      first_name: form.first_name,
      last_name: form.last_name,
      monthly_income: form.monthly_income,
    }

    const ok = await saveProfile(data)
    setSaving(false)
    if (ok) {
      onSaved(data as Partial<UserProfile>)
      onClose()
    } else {
      alert('Failed to save. Please try again.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div 
        className="w-full rounded-t-3xl border border-outline-variant bg-surface p-6 shadow-2xl transition-all duration-300 sm:max-w-md sm:rounded-3xl flex flex-col max-h-[90vh]"
        data-accent={accentColor}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
          <h2 className="text-xl font-black text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">settings</span>
            Profile Settings
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 py-5 space-y-4 pr-1">
          <div>
            <label htmlFor="first_name" className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="first_name"
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
              value={form.first_name}
              onChange={e => upd('first_name', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="last_name" className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="last_name"
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
              value={form.last_name}
              onChange={e => upd('last_name', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="monthly_income" className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
              Monthly Income <span className="text-on-surface-variant/50 font-normal ml-1 text-[10px] lowercase italic">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">{currencySymbol}</span>
              <input
                id="monthly_income"
                type="number"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
                placeholder="0.00"
                value={form.monthly_income}
                onChange={e => upd('monthly_income', e.target.value)}
              />
            </div>
            <p className="text-[10px] text-on-surface-variant/60 mt-1.5 leading-relaxed">
              Used for cash-flow planning and budget forecasts on your dashboard.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-outline-variant/30 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3.5 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.first_name.trim() || !form.last_name.trim()}
            className="flex-grow flex items-center justify-center gap-2 rounded-xl bg-secondary py-3.5 font-bold text-on-secondary shadow-lg shadow-secondary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
            <span className="material-symbols-outlined text-sm">done</span>
          </button>
        </div>
      </div>
    </div>
  )
}
