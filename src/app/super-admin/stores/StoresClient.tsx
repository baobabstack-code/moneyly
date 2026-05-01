'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createStore, inviteAdmin } from '../actions'
import { startImpersonation } from '@/app/super-admin/impersonate/actions'

// ── types ──────────────────────────────────────────────────────────────────

type Store = {
  id: number
  name: string
  code: string | null
  location: string | null
  hours: string | null
  logo_url: string | null
  admin_id: string | null
  created_at: string
}

// ── shared input class ─────────────────────────────────────────────────────

const input = 'w-full rounded-2xl border border-outline-variant bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-manrope'

// ── component ──────────────────────────────────────────────────────────────

export default function StoresClient({ stores: initial }: { stores: Store[] }) {
  const [stores, setStores] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [createError, setCreateError] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null)

  const handleImpersonate = (s: Store) => {
    if (!s.admin_id) return
    setImpersonatingId(s.id)
    startTransition(() => {
      startImpersonation(s.admin_id!, s.name, '/super-admin/stores', 'admin')
    })
  }

  function handleCreateStore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreateError('')
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const result = await createStore(data)
      if (result.error) {
        setCreateError(result.error)
      } else {
        form.reset()
        setShowCreate(false)
        // Reload to show the newly created store in the list
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

      {/* ── Store cards list ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">All Stores</h2>
          <button
            type="button"
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-body-lg">
              {showCreate ? 'close' : 'add'}
            </span>
            {showCreate ? 'Cancel' : 'Add Store'}
          </button>
        </div>

        {/* ── Create store form (inline, collapsible) ── */}
        {showCreate && (
          <div className="rounded-2xl border border-outline-variant bg-surface p-6 space-y-4">
            <h3 className="font-bold text-on-surface">New Store</h3>
            <form onSubmit={handleCreateStore} className="space-y-4">
              {/* 2-col grid on sm+, single col on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                    Store Name *
                  </label>
                  <input name="name" required placeholder="e.g. TV Sales & Home" className={input} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                    Store Code
                  </label>
                  <input name="code" placeholder="e.g. TVS-001" className={input} />
                </div>
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
                <div className="sm:col-span-2">
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
                {isPending ? 'Saving…' : 'Save Store'}
              </button>
            </form>
          </div>
        )}

        {/* ── Store cards — same card style as customer store-selection page ── */}
        {!stores.length ? (
          <div className="max-w-md text-center py-10 px-6 bg-surface rounded-2xl border border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3 block">storefront</span>
            <p className="text-on-surface-variant font-medium">No stores yet.</p>
            <p className="text-on-surface-variant/60 text-sm mt-1">Click "Add Store" to create the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stores.map(s => (
              <div
                key={s.id}
                className="rounded-2xl bg-surface border border-outline-variant p-5 sm:p-6 flex flex-col gap-4"
              >
                {/* Top row: logo + name + code */}
                <div className="flex items-start gap-4">
                  {s.logo_url ? (
                    <div className="w-14 h-14 rounded-xl bg-white border border-outline-variant overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                      <img src={s.logo_url} alt={s.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant">storefront</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-lg text-primary leading-tight truncate">{s.name}</h3>
                      {/* Admin-assigned badge */}
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${s.admin_id ? 'bg-status-success-bg text-status-success' : 'bg-status-warning-bg text-status-warning'}`}>
                        {s.admin_id ? 'Admin assigned' : 'No admin'}
                      </span>
                    </div>
                    {s.code && (
                      <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest">{s.code}</p>
                    )}
                  </div>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 gap-3">
                  {s.location && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">Location</p>
                      <p className="text-sm font-medium text-on-surface whitespace-pre-line">{s.location}</p>
                    </div>
                  )}
                  {s.hours && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">Hours</p>
                      <p className="text-sm font-medium text-on-surface">{s.hours}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/30 mt-auto flex-wrap">
                  <Link
                    href={`/super-admin/stores/${s.id}`}
                    className="flex items-center gap-1.5 text-sm font-bold text-secondary hover:opacity-80 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-body-lg">open_in_new</span>
                    View Applications
                  </Link>
                  {s.admin_id && (
                    <button
                      type="button"
                      onClick={() => handleImpersonate(s)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary disabled:opacity-50 transition-colors ml-auto"
                    >
                      <span className="material-symbols-outlined text-body-lg">
                        {impersonatingId === s.id && isPending ? 'hourglass_empty' : 'manage_accounts'}
                      </span>
                      {impersonatingId === s.id && isPending ? 'Opening…' : 'View as Admin'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Invite Admin section ── */}
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
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {inviteError && <p className="text-sm text-status-danger font-medium">{inviteError}</p>}
          {inviteSuccess && <p className="text-sm text-status-success font-medium">{inviteSuccess}</p>}

          <button
            type="submit"
            disabled={isPending || !stores.length}
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
