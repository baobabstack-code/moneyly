'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createBusinessPartner } from '../actions'

// ── types ──────────────────────────────────────────────────────────────────

type Store = {
  id: number
  name: string
  code: string | null
  location: string | null
  hours: string | null
  logo_url: string | null
  created_at: string
}

// ── shared input class ─────────────────────────────────────────────────────

const input = 'w-full rounded-2xl border border-outline-variant bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-manrope'

// ── component ──────────────────────────────────────────────────────────────

export default function BusinessPartnersClient({ partners: initial }: { partners: Store[] }) {
  const [partners, setPartners] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [createError, setCreateError] = useState('')
  const [showCreate, setShowCreate] = useState(false)

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
        window.location.reload()
      }
    })
  }

  return (
    <div className="font-manrope space-y-10">

      {/* Header row with add button */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-primary">Plan Sources</h1>
            <p className="mt-1 text-sm text-on-surface-variant">Manage the stores, categories, or purchase sources that plans can belong to.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-body-lg">
              {showCreate ? 'close' : 'add'}
            </span>
            {showCreate ? 'Cancel' : 'Add Source'}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded-2xl border border-outline-variant bg-surface p-6 space-y-4">
            <h3 className="font-bold text-on-surface">New Plan Source</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                    Name *
                  </label>
                  <input name="name" required placeholder="e.g. Grocery, Appliances, School Fees" className={input} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                    Code
                  </label>
                  <input name="code" placeholder="e.g. HOME-001" className={input} />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                    Location or Notes
                  </label>
                  <input name="location" placeholder="e.g. Sam Levy's Village, Borrowdale" className={input} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 block mb-1">
                    Availability
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
                {isPending ? 'Saving...' : 'Save Source'}
              </button>
            </form>
          </div>
        )}

        {/* Source cards */}
        {!partners.length ? (
          <div className="max-w-md text-center py-10 px-6 bg-surface rounded-2xl border border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3 block">
              storefront
            </span>
            <p className="text-on-surface-variant font-medium">
              No plan sources yet.
            </p>
            <p className="text-on-surface-variant/60 text-sm mt-1">Click "Add Source" to create the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {partners.map(p => (
              <div
                key={p.id}
                className="rounded-2xl bg-surface border border-outline-variant p-5 sm:p-6 flex flex-col gap-4"
              >
                {/* Top row: logo + name */}
                <div className="flex items-start gap-4">
                  {p.logo_url ? (
                    <div className="w-14 h-14 rounded-xl bg-white border border-outline-variant overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                      <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                        storefront
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-lg text-primary leading-tight truncate">{p.name}</h3>
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase bg-primary/10 text-primary">
                        Source
                      </span>
                    </div>
                    {p.code && (
                      <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest">{p.code}</p>
                    )}
                  </div>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 gap-3">
                  {p.location && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">Location or Notes</p>
                      <p className="text-sm font-medium text-on-surface whitespace-pre-line">{p.location}</p>
                    </div>
                  )}
                  {p.hours && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">Availability</p>
                      <p className="text-sm font-medium text-on-surface">{p.hours}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/30 mt-auto flex-wrap">
                  <Link
                    href={`/super-admin/stores/${p.id}`}
                    className="flex items-center gap-1.5 text-sm font-bold text-secondary hover:opacity-80 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-body-lg">open_in_new</span>
                    View Plans
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
