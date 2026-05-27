'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createBusinessPartner, inviteAdmin } from '../actions'
import { startImpersonation } from '@/app/super-admin/impersonate/actions'

// ── types ──────────────────────────────────────────────────────────────────

type Partner = {
  id: number
  uuid: string
  name: string
  code: string | null
  location: string | null
  hours: string | null
  logo_url: string | null
  partner_type: 'store' | 'funder'
  funder_type: string | null
  contact_email: string | null
  admin_id: string | null
  created_at: string
}

type TabFilter = 'all' | 'store' | 'funder'

// ── shared input class ─────────────────────────────────────────────────────

const input = 'w-full rounded-2xl border border-outline-variant bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-manrope'

// ── component ──────────────────────────────────────────────────────────────

export default function BusinessPartnersClient({ partners: initial }: { partners: Partner[] }) {
  const [partners, setPartners] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [createError, setCreateError] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null)
  const [tab, setTab] = useState<TabFilter>('all')
  const [newPartnerType, setNewPartnerType] = useState<'store' | 'funder'>('store')

  const filtered = tab === 'all' ? partners : partners.filter(p => p.partner_type === tab)
  const storePartners = partners.filter(p => p.partner_type === 'store')

  const handleImpersonate = (p: Partner) => {
    if (!p.admin_id) return
    setImpersonatingId(p.id)
    startTransition(() => {
      startImpersonation(p.admin_id!, p.name, '/super-admin/business-partners', 'admin')
    })
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreateError('')
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const result = await createBusinessPartner(data)
      if (result.error) {
        setCreateError(result.error)
      } else {
        form.reset()
        setShowCreate(false)
        setNewPartnerType('store')
        window.location.reload()
      }
    })
  }

  function handleInviteAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const result = await inviteAdmin(data)
      if (result.error) {
        setInviteError(result.error)
      } else {
        setInviteSuccess('Invite sent! The admin will receive an email link.')
        form.reset()
        setSelectedStore(null)
      }
    })
  }

  return (
    <div className="font-manrope space-y-10">

      {/* ── Header row with tabs + add button ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Tab filter pills */}
          <div className="flex items-center gap-2">
            {(['all', 'store', 'funder'] as TabFilter[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  tab === t
                    ? t === 'funder'
                      ? 'bg-secondary text-on-secondary'
                      : t === 'store'
                      ? 'bg-primary text-on-primary'
                      : 'bg-on-surface text-surface'
                    : 'bg-surface border border-outline-variant text-on-surface-variant hover:border-primary'
                }`}
              >
                {t === 'all' ? 'All' : t === 'store' ? 'Stores' : 'Funders'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-body-lg">
              {showCreate ? 'close' : 'add'}
            </span>
            {showCreate ? 'Cancel' : 'Add Partner'}
          </button>
        </div>

        {/* ── Create form (inline, collapsible) ── */}
        {showCreate && (
          <div className="rounded-2xl border border-outline-variant bg-surface p-6 space-y-4">
            <h3 className="font-bold text-on-surface">New Business Partner</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Partner type selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-2">
                  Partner Type *
                </label>
                <div className="flex gap-3">
                  {(['store', 'funder'] as const).map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="partner_type"
                        value={t}
                        checked={newPartnerType === t}
                        onChange={() => setNewPartnerType(t)}
                        className="accent-secondary"
                      />
                      <span className="text-sm font-medium capitalize text-on-surface">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                    Name *
                  </label>
                  <input name="name" required placeholder={newPartnerType === 'store' ? 'e.g. TV Sales & Home' : 'e.g. First Capital Bank'} className={input} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                    Code
                  </label>
                  <input name="code" placeholder="e.g. FCB-001" className={input} />
                </div>

                {/* Store-only fields */}
                {newPartnerType === 'store' && (
                  <>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                        Location
                      </label>
                      <input name="location" placeholder="e.g. Sam Levy's Village, Harare" className={input} />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                        Opening Hours
                      </label>
                      <input name="hours" placeholder="e.g. 8:00 AM - 6:00 PM" className={input} />
                    </div>
                  </>
                )}

                {/* Funder-only fields */}
                {newPartnerType === 'funder' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                      Funder Type
                    </label>
                    <input name="funder_type" placeholder="e.g. Bank, Microfinance, Private Investor" className={input} />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                    Contact Email
                  </label>
                  <input name="contact_email" type="email" placeholder="contact@example.com" className={input} />
                </div>

                <div className={newPartnerType === 'store' ? 'sm:col-span-2' : ''}>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                    Logo URL
                  </label>
                  <input name="logo_url" type="url" placeholder="https://…" className={input} />
                </div>
              </div>

              {createError && (
                <p className="text-sm text-status-danger font-medium">{createError}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <span className="material-symbols-outlined text-body-lg">save</span>
                {isPending ? 'Saving…' : 'Save Partner'}
              </button>
            </form>
          </div>
        )}

        {/* ── Partner cards ── */}
        {!filtered.length ? (
          <div className="max-w-md text-center py-10 px-6 bg-surface rounded-2xl border border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3 block">
              {tab === 'funder' ? 'account_balance' : 'storefront'}
            </span>
            <p className="text-on-surface-variant font-medium">
              {tab === 'all' ? 'No partners yet.' : tab === 'store' ? 'No stores yet.' : 'No funders yet.'}
            </p>
            <p className="text-on-surface-variant/60 text-sm mt-1">Click "Add Partner" to create the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map(p => (
              <div
                key={p.id}
                className="rounded-2xl bg-surface border border-outline-variant p-5 sm:p-6 flex flex-col gap-4"
              >
                {/* Top row: logo + name + type badge */}
                <div className="flex items-start gap-4">
                  {p.logo_url ? (
                    <div className="w-14 h-14 rounded-xl bg-white border border-outline-variant overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                      <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                        {p.partner_type === 'funder' ? 'account_balance' : 'storefront'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-lg text-primary leading-tight truncate">{p.name}</h3>
                      {/* Partner type badge */}
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        p.partner_type === 'funder'
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {p.partner_type === 'funder' ? 'Funder' : 'Store'}
                      </span>
                      {/* Admin / funder status badge */}
                      {p.partner_type === 'store' && (
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${p.admin_id ? 'bg-status-success-bg text-status-success' : 'bg-status-warning-bg text-status-warning'}`}>
                          {p.admin_id ? 'Admin assigned' : 'No admin'}
                        </span>
                      )}
                    </div>
                    {p.code && (
                      <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest">{p.code}</p>
                    )}
                  </div>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 gap-3">
                  {p.partner_type === 'store' && (
                    <>
                      {p.location && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">Location</p>
                          <p className="text-sm font-medium text-on-surface whitespace-pre-line">{p.location}</p>
                        </div>
                      )}
                      {p.hours && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">Hours</p>
                          <p className="text-sm font-medium text-on-surface">{p.hours}</p>
                        </div>
                      )}
                    </>
                  )}
                  {p.partner_type === 'funder' && (
                    <>
                      {p.funder_type && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">Funder Type</p>
                          <p className="text-sm font-medium text-on-surface">{p.funder_type}</p>
                        </div>
                      )}
                      {p.contact_email && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">Contact Email</p>
                          <p className="text-sm font-medium text-on-surface truncate">{p.contact_email}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/30 mt-auto flex-wrap">
                  {p.partner_type === 'store' && (
                    <Link
                      href={`/super-admin/stores/${p.uuid}`}
                      className="flex items-center gap-1.5 text-sm font-bold text-secondary hover:opacity-80 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-body-lg">open_in_new</span>
                      View Applications
                    </Link>
                  )}
                  {p.partner_type === 'store' && p.admin_id && (
                    <button
                      type="button"
                      onClick={() => handleImpersonate(p)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary disabled:opacity-50 transition-colors ml-auto"
                    >
                      <span className="material-symbols-outlined text-body-lg">
                        {impersonatingId === p.id && isPending ? 'hourglass_empty' : 'manage_accounts'}
                      </span>
                      {impersonatingId === p.id && isPending ? 'Opening…' : 'View as Admin'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Invite Store Admin section ── */}
      <section className="rounded-2xl border border-outline-variant bg-surface p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-primary mb-1">Invite Store Admin</h2>
          <p className="text-sm text-on-surface-variant">
            Send an invite email to a store owner — they'll get a magic link to set up their account.
          </p>
        </div>

        <form onSubmit={handleInviteAdmin} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                Admin Email *
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="admin@example.com"
                className={input}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                Assign to Store *
              </label>
              <select
                name="storeId"
                required
                aria-label="Assign to Store"
                value={selectedStore ?? ''}
                onChange={e => setSelectedStore(Number(e.target.value))}
                className={input}
              >
                <option value="" disabled>Select a store…</option>
                {storePartners.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {inviteError && <p className="text-sm text-status-danger font-medium">{inviteError}</p>}
          {inviteSuccess && <p className="text-sm text-status-success font-medium">{inviteSuccess}</p>}

          <button
            type="submit"
            disabled={isPending || !storePartners.length}
            className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <span className="material-symbols-outlined text-body-lg">send</span>
            {isPending ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
      </section>
    </div>
  )
}
