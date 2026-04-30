'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'

// ── types ──────────────────────────────────────────────────────────────────

type Application = {
  id: string
  reference: string
  status: string
  created_at: string
  store_name: string | null
  first_name: string | null
  last_name: string | null
  email_address: string | null
  mobile_number: string | null
  national_id: string | null
  physical_address: string | null
  product_name: string | null
  retail_price: number | null
  deposit_amount: number | null
  balance_amount: number | null
  tenure_months: number | null
  employer_name: string | null
  employer_no: string | null
  ministry: string | null
  is_civil_servant: boolean | null
  employer_phone: string | null
  employer_contact_person: string | null
  employer_email: string | null
  employer_address: string | null
  kin_full_name: string | null
  kin_relationship: string | null
  kin_mobile: string | null
  kin_address: string | null
  id_copy_url: string | null
  payslip_url: string | null
}

// ── helpers ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['submitted', 'approved', 'rejected', 'draft'] as const

// Maps application status to the same colour tokens used in the customer views
function statusBadge(status: string) {
  const map: Record<string, string> = {
    submitted: 'bg-status-info-bg text-status-info',
    approved:  'bg-status-success-bg text-status-success',
    rejected:  'bg-status-danger-bg text-status-danger',
    draft:     'bg-status-warning-bg text-status-warning',
  }
  return map[status] ?? 'bg-status-warning-bg text-status-warning'
}

// Status icon mirrors the customer ApplicationsView icon logic
function statusIcon(status: string) {
  switch (status) {
    case 'submitted': return 'hourglass_empty'
    case 'approved':  return 'check_circle'
    case 'rejected':  return 'cancel'
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
}: {
  applications: Application[]
  statusFilter?: string
}) {
  // Track which application card is expanded (null = all collapsed)
  const [expanded, setExpanded] = useState<string | null>(null)
  // Optimistic local state so status updates feel instant without a page reload
  const [applications, setApplications] = useState(initial)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    startTransition(async () => {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id)

      if (!error) {
        // Reflect new status immediately in the UI without a full reload
        setApplications(prev => prev.map(a => (a.id === id ? { ...a, status } : a)))
      }
      setUpdatingId(null)
    })
  }

  return (
    <div className="w-full space-y-8">

        {/* Page header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-1">Applications</h1>
          <p className="text-on-surface-variant text-sm">
            {applications.length} {statusFilter ? `${statusFilter} ` : ''}application{applications.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Status filter pills — mirrors the expandable-card approach from ApplicationsView */}
        <div className="flex gap-2 flex-wrap mb-6">
          <a
            href="/admin/applications"
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
              href={`/admin/applications?status=${s}`}
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
            <p className="text-on-surface-variant font-medium text-base">No applications found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => {
              const isOpen = expanded === app.id
              const loanAmount = parseAmount(app.retail_price) - parseAmount(app.deposit_amount)
              const monthly = app.tenure_months && loanAmount > 0 ? loanAmount / app.tenure_months : null

              // Detail rows rendered inside the expanded panel — same pattern as DashboardView
              const details = [
                { label: 'Store',             value: app.store_name },
                { label: 'Product',           value: app.product_name },
                { label: 'Retail Price',      value: fmt(app.retail_price) },
                { label: 'Deposit',           value: fmt(app.deposit_amount) },
                { label: 'Loan Amount',       value: fmt(loanAmount) },
                { label: 'Tenure',            value: app.tenure_months ? `${app.tenure_months} months` : null },
                { label: 'Monthly Payment',   value: monthly ? fmt(monthly) : null },
                { label: 'National ID',       value: app.national_id },
                { label: 'Mobile',            value: app.mobile_number },
                { label: 'Email',             value: app.email_address },
                { label: 'Address',           value: app.physical_address },
                { label: 'Civil Servant',     value: app.is_civil_servant ? 'Yes' : 'No' },
                { label: 'Employer',          value: app.is_civil_servant ? (app.ministry || '') : app.employer_name },
                ...(app.is_civil_servant && app.employer_no ? [{ label: 'EC Number', value: app.employer_no }] : []),
                { label: 'Employer Phone',    value: app.employer_phone },
                { label: 'Employer Contact',  value: app.employer_contact_person },
                { label: 'Employer Email',    value: app.employer_email },
                { label: 'Employer Address',  value: app.employer_address },
                { label: 'Next of Kin',       value: app.kin_full_name },
                { label: 'Relationship',      value: app.kin_relationship },
                { label: 'NOK Mobile',        value: app.kin_mobile },
                { label: 'NOK Address',       value: app.kin_address },
                { label: 'ID Copy',           value: app.id_copy_url ? '✅ Uploaded' : '❌ Not uploaded' },
                { label: 'Payslip',           value: app.payslip_url ? '✅ Uploaded' : '❌ Not uploaded' },
              ].filter((r): r is { label: string; value: string } => Boolean(r.value))

              return (
                <div
                  key={app.id}
                  className="rounded-2xl bg-surface border border-outline-variant overflow-hidden transition-colors"
                >
                  {/* ── Summary row (always visible) ── */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 sm:p-6">

                    {/* Status icon */}
                    <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center shrink-0">
                      <span className={`material-symbols-outlined text-xl ${
                        app.status === 'approved' ? 'text-status-success' :
                        app.status === 'rejected' ? 'text-status-danger' :
                        'text-on-surface-variant'
                      }`}>
                        {statusIcon(app.status)}
                      </span>
                    </div>

                    {/* Customer name, reference, loan amount */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                        <h3 className="font-bold text-lg text-primary leading-tight">
                          {app.first_name} {app.last_name}
                        </h3>
                        <span className={`inline-block px-3 py-0.5 text-xs font-bold rounded-full uppercase ${statusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-on-surface-variant">
                        <span>Ref: <span className="font-mono font-bold text-on-surface">{app.reference}</span></span>
                        {app.product_name && <span>{app.product_name}</span>}
                        {loanAmount > 0 && <span className="font-bold text-secondary">{fmt(loanAmount)}</span>}
                        <span>{new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Status select + expand toggle — stacked on mobile, side-by-side on sm+ */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Inline status updater — admin can change without opening a modal */}
                      <select
                        aria-label={`Change status for application ${app.reference}`}
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
                        aria-expanded={isOpen}
                      >
                        {isOpen ? 'Hide' : 'View'}
                        <span className="material-symbols-outlined text-sm">
                          {isOpen ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded detail panel ── */}
                  {isOpen && (
                    <div className="border-t border-outline-variant/50 bg-surface-container-low px-5 sm:px-6 py-5">
                      {/* Responsive grid: 2 cols on mobile → 3 on sm → 4 on lg */}
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
