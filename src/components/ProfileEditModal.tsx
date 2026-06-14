'use client'

import { useEffect, useState } from 'react'
import { saveProfile, type UserProfile } from '@/lib/profile'
import { useApplicationStore } from '@/lib/store'

interface Props {
  section: 'personal'
  profile: UserProfile | null
  onClose: () => void
  onSaved: (updated: Partial<UserProfile>) => void
}

export default function ProfileEditModal({ profile, onClose, onSaved }: Props) {
  const currencyCode = useApplicationStore(state => state.currency);
  const currencySymbol = (() => {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$' };
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
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Card */}
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/40">
          <span className="material-symbols-outlined text-secondary text-xl">settings</span>
          <h2 className="font-bold text-on-surface flex-1">Profile Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-bold text-on-surface-variant mb-1.5">
              First Name <span className="text-error">*</span>
            </label>
            <input
              id="first_name"
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
              value={form.first_name}
              onChange={e => upd('first_name', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-bold text-on-surface-variant mb-1.5">
              Last Name <span className="text-error">*</span>
            </label>
            <input
              id="last_name"
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
              value={form.last_name}
              onChange={e => upd('last_name', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="monthly_income" className="block text-sm font-bold text-on-surface-variant mb-1.5">
              Monthly Income <span className="text-on-surface-variant/50 font-normal ml-1 text-xs">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">{currencySymbol}</span>
              <input
                id="monthly_income"
                type="number"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                placeholder="0.00"
                value={form.monthly_income}
                onChange={e => upd('monthly_income', e.target.value)}
              />
            </div>
            <p className="text-[10px] text-on-surface-variant/60 mt-1">
              Used for cash-flow planning and budget forecasts on your dashboard.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-outline-variant/40 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.first_name.trim() || !form.last_name.trim()}
            className="flex-1 py-3 bg-secondary text-on-secondary rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">
              {saving ? 'hourglass_empty' : 'save'}
            </span>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
