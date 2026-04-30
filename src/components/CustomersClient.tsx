'use client'

import { useState } from 'react'

type Customer = {
  id: string
  first_name: string | null
  last_name: string | null
  email_address: string | null
  mobile_number: string | null
  national_id: string | null
  is_profile_complete: boolean | null
  created_at: string
  employer_name: string | null
  ministry: string | null
  is_civil_servant: boolean | null
  physical_address: string | null
}

export default function CustomersClient({ customers, storeName }: { customers: Customer[]; storeName?: string }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? customers.filter(c =>
        c.national_id?.toLowerCase().includes(query.trim().toLowerCase())
      )
    : customers

  return (
    <div className="max-w-4xl space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-1">Customers</h1>
        <p className="text-on-surface-variant text-sm">
          {storeName ? `${customers.length} customer${customers.length !== 1 ? 's' : ''} for ${storeName}` : `${customers.length} customer${customers.length !== 1 ? 's' : ''} across all stores`}
        </p>
      </div>

      {/* National ID search */}
      <div className="relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant/50 pointer-events-none">
          badge
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by National ID…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Results count when searching */}
      {query.trim() && (
        <p className="text-sm text-on-surface-variant -mt-4">
          {filtered.length === 0
            ? 'No customers match that National ID.'
            : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query.trim()}"`}
        </p>
      )}

      {/* Empty state — no customers at all */}
      {!customers.length ? (
        <div className="max-w-md text-center py-10 px-6 bg-surface rounded-2xl border border-outline-variant">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3 block">group</span>
          <p className="text-on-surface-variant font-medium text-base">No customers yet.</p>
          <p className="text-on-surface-variant/60 text-sm mt-1">
            Customers appear here once they submit an application.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => (
            <div
              key={c.id}
              className="rounded-2xl bg-surface border border-outline-variant p-5 sm:p-6"
            >
              {/* Top row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl text-on-surface-variant">person</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary leading-tight">
                      {c.first_name} {c.last_name}
                    </h3>
                    {/* Highlight national ID when it matches search */}
                    <p className="text-xs text-on-surface-variant font-mono">
                      {c.national_id
                        ? query.trim() && c.national_id.toLowerCase().includes(query.trim().toLowerCase())
                          ? <><span className="bg-secondary/20 text-secondary rounded px-0.5">{c.national_id}</span></>
                          : c.national_id
                        : '—'}
                    </p>
                  </div>
                </div>

                <span className={`self-start sm:self-auto inline-block px-3 py-0.5 text-xs font-bold rounded-full uppercase ${
                  c.is_profile_complete
                    ? 'bg-status-success-bg text-status-success'
                    : 'bg-status-warning-bg text-status-warning'
                }`}>
                  {c.is_profile_complete ? 'Profile complete' : 'Incomplete profile'}
                </span>
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Email',    value: c.email_address },
                  { label: 'Mobile',   value: c.mobile_number },
                  { label: 'Address',  value: c.physical_address },
                  { label: 'Employer', value: c.is_civil_servant ? (c.ministry || 'Civil Servant') : c.employer_name },
                  { label: 'Joined',   value: new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                ].filter((r): r is { label: string; value: string } => Boolean(r.value)).map(r => (
                  <div key={r.label}>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">{r.label}</p>
                    <p className="text-sm font-medium text-on-surface break-words">{r.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
