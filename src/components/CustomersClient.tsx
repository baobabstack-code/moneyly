'use client'

import { useState, useTransition } from 'react'
import { startImpersonation } from '@/app/super-admin/impersonate/actions'

type Customer = {
  id: string
  full_name: string | null
  avatar_url: string | null
  username: string | null
  monthly_income: string | null
  created_at: string
  role: string
  currency: string | null
}

function parseAmount(n: string | number | null) {
  return typeof n === 'number' ? n : parseFloat(n ?? '');
}

function currency(n: string | number | null, currencyCode?: string | null) {
  const v = parseAmount(n);
  if (!Number.isFinite(v)) return "$0.00";

  const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$', CAD: 'C$' };
  const symbol = map[currencyCode || 'USD'] || '$';

  const amount = Math.abs(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${v < 0 ? '-' : ''}${symbol}${amount}`;
}

export default function CustomersClient({ customers, storeName, showImpersonate }: { customers: Customer[]; storeName?: string; showImpersonate?: boolean }) {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)

  const handleImpersonate = (c: Customer) => {
    setImpersonatingId(c.id)
    startTransition(() => {
      const name = c.full_name || c.username || 'Customer'
      startImpersonation(c.id, name, '/super-admin/customers')
    })
  }

  const filtered = query.trim()
    ? customers.filter(c =>
        (c.full_name || '').toLowerCase().includes(query.trim().toLowerCase()) ||
        (c.username || '').toLowerCase().includes(query.trim().toLowerCase())
      )
    : customers

  return (
    <div className="w-full space-y-8 font-manrope">

      {/* Page header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-1">Customers</h1>
        <p className="text-on-surface-variant text-sm">
          {storeName ? `${customers.length} customer${customers.length !== 1 ? 's' : ''} for ${storeName}` : `${customers.length} customer${customers.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Name/Username search */}
      <div className="relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant/50 pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or username…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-body-lg">close</span>
          </button>
        )}
      </div>

      {/* Results count when searching */}
      {query.trim() && (
        <p className="text-sm text-on-surface-variant -mt-4">
          {filtered.length === 0
            ? 'No customers match that query.'
            : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query.trim()}"`}
        </p>
      )}

      {/* Empty state — no customers at all */}
      {!customers.length ? (
        <div className="max-w-md text-center py-10 px-6 bg-surface rounded-2xl border border-outline-variant">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3 block">group</span>
          <p className="text-on-surface-variant font-medium text-base">No customers yet.</p>
          <p className="text-on-surface-variant/60 text-sm mt-1">
            Customers appear here once they create an account and profile.
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
                  <div className="w-11 h-11 bg-surface-container rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-outline-variant">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-xl text-on-surface-variant">person</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary leading-tight">
                      {c.full_name || 'Anonymous User'}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-mono">
                      {c.username ? `@${c.username}` : 'No username set'}
                    </p>
                  </div>
                </div>

                <span className="self-start sm:self-auto inline-block px-3 py-0.5 text-xs font-bold rounded-full uppercase bg-primary/10 text-primary">
                  {c.role}
                </span>
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Monthly Income', value: c.monthly_income ? currency(c.monthly_income, c.currency) : 'Not specified' },
                  { label: 'Joined', value: new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                ].map(r => (
                  <div key={r.label}>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">{r.label}</p>
                    <p className="text-sm font-medium text-on-surface wrap-break-word">{r.value}</p>
                  </div>
                ))}
              </div>

              {/* Impersonate button — super admin only */}
              {showImpersonate && (
                <div className="pt-4 border-t border-outline-variant/30 mt-2">
                  <button
                    type="button"
                    onClick={() => handleImpersonate(c)}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 font-bold text-sm hover:bg-secondary/20 disabled:opacity-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">
                      {impersonatingId === c.id && isPending ? 'hourglass_empty' : 'visibility'}
                    </span>
                    {impersonatingId === c.id && isPending ? 'Opening…' : 'View as Customer'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
