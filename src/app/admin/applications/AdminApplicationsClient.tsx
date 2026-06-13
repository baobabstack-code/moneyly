'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'

// ── types ──────────────────────────────────────────────────────────────────

type SpendingPlan = {
  id: string
  reference: string
  status: string
  created_at: string
  store_name: string | null
  product_name: string | null
  planned_cost: number | null
  saved_amount: number | null
  tenure_months: number | null
  file_url: string | null
  profiles?: {
    full_name: string | null
  } | null
}

// ── helpers ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['active', 'paused', 'completed'] as const

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active:     'bg-status-info-bg text-status-info',
    paused:     'bg-status-danger-bg text-status-danger',
    completed:  'bg-status-success-bg text-status-success',
  }
  return map[status] ?? 'bg-status-info-bg text-status-info'
}

function statusIcon(status: string) {
  switch (status) {
    case 'active':    return 'schedule'
    case 'paused':    return 'pause_circle'
    case 'completed': return 'check_circle'
    default:          return 'pending'
  }
}

function parseAmount(n: number | null): number {
  return n ?? 0
}

function fmt(n: number | null): string | null {
  const v = parseAmount(n)
  return v > 0
    ? `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null
}

// ── component ──────────────────────────────────────────────────────────────

export default function AdminApplicationsClient({
  applications: initial,
  statusFilter,
  basePath = '/admin/applications',
}: {
  applications: SpendingPlan[]
  statusFilter?: string
  basePath?: string
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [applications, setApplications] = useState(initial)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    startTransition(async () => {
      const { error } = await supabase
        .from('spending_plans')
        .update({ status })
        .eq('id', id)

      if (!error) {
        setApplications(prev => prev.map(a => (a.id === id ? { ...a, status } : a)))
      }
      setUpdatingId(null)
    })
  }

  return (
    <div className="w-full space-y-8 font-manrope">

        {/* Page header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-1">Spending Plans</h1>
          <p className="text-on-surface-variant text-sm">
            {applications.length} {statusFilter ? `${statusFilter} ` : ''}plan{applications.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          <a
            href={basePath}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
              !statusFilter
                ? 'bg-primary text-on-primary border-primary'
                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            All
          </a>
          {STATUS_OPTIONS.map(s => (
            <a
              key={s}
              href={`${basePath}?status=${s}`}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-on-primary border-primary'
                  : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {s}
            </a>
          ))}
        </div>

        {/* Empty state */}
        {applications.length === 0 ? (
          <div className="max-w-md text-center py-10 px-6 bg-surface rounded-2xl border border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3 block">
              description
            </span>
            <p className="text-on-surface-variant font-medium text-base">No plans found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => {
              const isOpen = expanded === app.id
              const cashNeeded = Math.max(0, parseAmount(app.planned_cost) - parseAmount(app.saved_amount))
              const monthly = app.tenure_months && cashNeeded > 0 ? cashNeeded / app.tenure_months : null

              const details = [
                { label: 'Source',            value: app.store_name },
                { label: 'Planned Item',      value: app.product_name },
                { label: 'Planned Cost',      value: fmt(app.planned_cost) },
                { label: 'Saved Amount',      value: fmt(app.saved_amount) },
                { label: 'Cash Needed',       value: fmt(cashNeeded) },
                { label: 'Plan Length',       value: app.tenure_months ? `${app.tenure_months} months` : null },
                { label: 'Monthly Bill',      value: monthly ? fmt(monthly) : null },
              ].filter((r): r is { label: string; value: string } => Boolean(r.value))

              return (
                <div
                  key={app.id}
                  className="rounded-2xl bg-surface border border-outline-variant overflow-hidden transition-colors"
                >
                  {/* Summary row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 sm:p-6">

                    {/* Status icon */}
                    <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                      <span className={`material-symbols-outlined text-xl ${
                        app.status === 'completed' ? 'text-status-success' :
                        app.status === 'paused' ? 'text-status-danger' :
                        'text-on-surface-variant'
                      }`}>
                        {statusIcon(app.status)}
                      </span>
                    </div>

                    {/* Customer name, reference, and planned purchase */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                        <h3 className="font-bold text-lg text-primary leading-tight">
                          {app.profiles?.full_name || 'Customer'}
                        </h3>
                        <span className={`inline-block px-3 py-0.5 text-xs font-bold rounded-full uppercase ${statusBadge(app.status)}`}>
                          {app.status}
                        </span>
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase bg-primary/10 text-primary">
                          Plan
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-on-surface-variant">
                        <span>Ref: <span className="font-mono font-bold text-on-surface">{app.reference}</span></span>
                        {app.product_name && <span>{app.product_name}</span>}
                        {cashNeeded > 0 && <span className="font-bold text-secondary">{fmt(cashNeeded)}</span>}
                        <span>{new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Status select + expand toggle */}
                    <div className="flex items-center gap-3 shrink-0">
                      <select
                        aria-label={`Change status for plan ${app.reference}`}
                        value={app.status}
                        disabled={updatingId === app.id || isPending}
                        onChange={e => updateStatus(app.id, e.target.value)}
                        className={`text-xs font-bold rounded-xl px-3 py-1.5 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${statusBadge(app.status)}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : app.id)}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:bg-surface-container transition-all"
                        aria-expanded={isOpen ? "true" : "false"}
                      >
                        {isOpen ? 'Hide' : 'View'}
                        <span className="material-symbols-outlined text-sm">
                          {isOpen ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {isOpen && (
                    <div className="border-t border-outline-variant/50 bg-surface-container-low px-5 sm:px-6 py-5 space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {details.map(r => (
                          <div key={r.label}>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 mb-0.5">
                              {r.label}
                            </p>
                            <p className="text-sm font-medium text-on-surface wrap-break-word">{r.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Files */}
                      {app.file_url && (
                        <div className="flex flex-wrap gap-3 pt-3 border-t border-outline-variant/30">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/50 w-full">Files</p>
                          <a href={app.file_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface text-sm font-bold text-secondary hover:bg-surface-container transition-colors">
                            <span className="material-symbols-outlined text-base">receipt_long</span>
                            Attached Invoice / Receipt
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}
