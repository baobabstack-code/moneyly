'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { saveProfile, type UserProfile } from '@/lib/profile'

// ── types ────────────────────────────────────────────────────────────────────

type Section = 'photo' | 'personal' | 'contact' | 'nok' | 'employment'

interface Props {
  section: Section
  profile: UserProfile | null
  onClose: () => void
  onSaved: (updated: Partial<UserProfile>) => void
}

// ── constants ─────────────────────────────────────────────────────────────────

const SECTION_META: Record<Section, { title: string; icon: string }> = {
  photo:      { title: 'Profile Photo',   icon: 'photo_camera' },
  personal:   { title: 'Personal Info',   icon: 'person' },
  contact:    { title: 'Contact Details', icon: 'contact_page' },
  nok:        { title: 'Next of Kin',     icon: 'family_restroom' },
  employment: { title: 'Employment',      icon: 'business_center' },
}

const MINISTRIES = [
  'Finance & Economic Development','Health & Child Care','Education, Sport, Arts & Culture',
  'Agriculture, Fisheries, Water & Rural Development','Home Affairs & Cultural Heritage',
  'Justice, Legal & Parliamentary Affairs','Foreign Affairs & International Trade','Defence',
  'Lands, Agriculture, Fisheries, Water & Rural Resettlement','Public Service, Labour & Social Welfare',
  'Transport & Infrastructural Development','Energy & Power Development','Mines & Mining Development',
  'Environment, Climate, Tourism & Hospitality Industry','Information, Publicity & Broadcasting Services',
  'Primary & Secondary Education','Higher & Tertiary Education, Innovation, Science & Technology Development',
  'Local Government & Public Works','Women Affairs, Community, Small & Medium Enterprises Development',
  'Youth, Sport, Arts & Recreation','ICT, Postal & Courier Services','National Housing & Social Amenities',
]

// ── component ─────────────────────────────────────────────────────────────────

export default function ProfileEditModal({ section, profile, onClose, onSaved }: Props) {
  const supabase = createClient()
  const userIdRef = useRef<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photo, setPhoto] = useState(profile?.photo_url || '')

  const [form, setForm] = useState({
    first_name:             profile?.first_name || '',
    last_name:              profile?.last_name || '',
    national_id:            profile?.national_id || '',
    date_of_birth:          profile?.date_of_birth || '',
    gender:                 profile?.gender || '',
    physical_address:       profile?.physical_address || '',
    mobile_number:          profile?.mobile_number || '',
    email_address:          profile?.email_address || '',
    nok_full_name:          profile?.nok_full_name || '',
    nok_address:            profile?.nok_address || '',
    nok_mobile_number:      profile?.nok_mobile_number || '',
    nok_relationship:       profile?.nok_relationship || '',
    is_civil_servant:       profile?.is_civil_servant ?? false,
    employer_name:          profile?.employer_name || '',
    employer_no:            profile?.employer_no || '',
    ministry:               profile?.ministry || '',
    employment_phone:       profile?.employment_phone || '',
    employer_contact_person:profile?.employer_contact_person || '',
    employer_email:         profile?.employer_email || '',
    employer_address:       profile?.employer_address || '',
    monthly_income:         profile?.monthly_income || '',
  })

  // Prefetch user id
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) userIdRef.current = session.user.id
    })
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const upd = (f: string, v: string | boolean) => setForm(p => ({ ...p, [f]: v }))

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    setPhoto(localUrl)
    setUploading(true)
    let userId = userIdRef.current
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setUploading(false); return }
      userId = session.user.id
      userIdRef.current = userId
    }
    const ext = file.name.split('.').pop()
    const path = `${userId}/photo.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
      setPhoto(publicUrl)
      URL.revokeObjectURL(localUrl)
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    let data: Record<string, string | boolean | undefined> = {}

    if (section === 'photo') {
      data.photo_url = photo || undefined
    } else if (section === 'personal') {
      data = { first_name: form.first_name, last_name: form.last_name, national_id: form.national_id, date_of_birth: form.date_of_birth, gender: form.gender }
    } else if (section === 'contact') {
      data = { physical_address: form.physical_address, mobile_number: form.mobile_number, email_address: form.email_address }
    } else if (section === 'nok') {
      data = { nok_full_name: form.nok_full_name, nok_address: form.nok_address, nok_mobile_number: form.nok_mobile_number, nok_relationship: form.nok_relationship }
    } else if (section === 'employment') {
      data = {
        is_civil_servant: form.is_civil_servant,
        employer_name: form.employer_name,
        employer_no: form.employer_no,
        ministry: form.ministry,
        employment_phone: form.employment_phone,
        employer_contact_person: form.employer_contact_person,
        employer_email: form.employer_email,
        employer_address: form.employer_address,
        monthly_income: form.monthly_income,
      }
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

  const meta = SECTION_META[section]

  // ── field helper ────────────────────────────────────────────────────────────
  const Field = ({ name, label, type = 'text', optional = false }: { name: string; label: string; type?: string; optional?: boolean }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-bold text-on-surface-variant mb-1.5">
        {label}{!optional && <span className="text-error ml-0.5">*</span>}
        {optional && <span className="text-on-surface-variant/50 font-normal ml-1 text-xs">(optional)</span>}
      </label>
      <input
        id={name}
        type={type}
        className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        value={String(form[name as keyof typeof form] || '')}
        onChange={e => upd(name, name === 'national_id' ? e.target.value.toUpperCase() : e.target.value)}
      />
    </div>
  )

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
          <span className="material-symbols-outlined text-secondary text-xl">{meta.icon}</span>
          <h2 className="font-bold text-on-surface flex-1">{meta.title}</h2>
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

          {section === 'photo' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-28 h-28 rounded-full bg-surface-container border-4 border-outline-variant flex items-center justify-center overflow-hidden shadow-lg">
                {photo
                  ? <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">person</span>}
              </div>
              <label className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all ${uploading ? 'bg-surface-container text-on-surface-variant pointer-events-none' : 'bg-secondary text-on-secondary hover:opacity-90'}`}>
                <span className="material-symbols-outlined text-base">upload</span>
                {uploading ? 'Uploading…' : photo ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
              {photo && !photo.startsWith('blob:') && (
                <p className="text-sm text-status-success flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>Photo saved
                </p>
              )}
            </div>
          )}

          {section === 'personal' && (
            <>
              <Field name="first_name" label="First Name" />
              <Field name="last_name" label="Last Name" />
              <Field name="national_id" label="National ID" />
              <Field name="date_of_birth" label="Date of Birth" type="date" />
              <div>
                <p className="text-sm font-bold text-on-surface-variant mb-2">Gender<span className="text-error ml-0.5">*</span></p>
                <div className="grid grid-cols-2 gap-3">
                  {['Male', 'Female'].map(g => (
                    <button key={g} type="button"
                      onClick={() => upd('gender', g)}
                      className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${form.gender === g ? 'bg-secondary text-on-secondary border-secondary' : 'border-outline-variant text-on-surface hover:bg-surface-container'}`}>
                      <span className="material-symbols-outlined text-base">{g === 'Male' ? 'male' : 'female'}</span>{g}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {section === 'contact' && (
            <>
              <Field name="physical_address" label="Physical Address" />
              <Field name="mobile_number" label="Mobile Number" type="tel" />
              <Field name="email_address" label="Email Address" type="email" />
            </>
          )}

          {section === 'nok' && (
            <>
              <Field name="nok_full_name" label="Full Name" />
              <Field name="nok_address" label="Address" />
              <Field name="nok_mobile_number" label="Mobile Number" type="tel" />
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1.5">
                  Relationship<span className="text-error ml-0.5">*</span>
                </label>
                <select
                  title="Relationship"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                  value={form.nok_relationship}
                  onChange={e => upd('nok_relationship', e.target.value)}
                >
                  <option value="">Select relationship</option>
                  {['Spouse', 'Parent', 'Sibling', 'Child', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </>
          )}

          {section === 'employment' && (
            <>
              <div>
                <p className="text-sm font-bold text-on-surface-variant mb-2">Civil Servant?<span className="text-error ml-0.5">*</span></p>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map(opt => (
                    <button key={opt.label} type="button"
                      onClick={() => upd('is_civil_servant', opt.val)}
                      className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${form.is_civil_servant === opt.val ? 'bg-secondary text-on-secondary border-secondary' : 'border-outline-variant text-on-surface hover:bg-surface-container'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {form.is_civil_servant ? (
                <>
                  <Field name="employer_no" label="EC Number" />
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1.5">Ministry<span className="text-error ml-0.5">*</span></label>
                    <select title="Ministry"
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                      value={form.ministry} onChange={e => upd('ministry', e.target.value)}>
                      <option value="">Select Ministry</option>
                      {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <Field name="employer_name" label="Employer Name" />
              )}
              <Field name="employment_phone" label="Employer Phone" type="tel" />
              <Field name="employer_contact_person" label="Contact Person" />
              <Field name="employer_email" label="Employer Email" type="email" optional />
              <Field name="employer_address" label="Employer Address" />
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1.5">
                  Monthly Income <span className="text-on-surface-variant/50 font-normal text-xs">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">$</span>
                  <input type="number" min="0" step="0.01"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                    placeholder="0.00"
                    value={form.monthly_income}
                    onChange={e => upd('monthly_income', e.target.value)} />
                </div>
              </div>
            </>
          )}
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
            disabled={saving || uploading}
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
