'use client'

import Link from "next/link";
import { useMemo, useState } from "react";

type SpendingPlan = {
  id: string;
  status: string | null;
  reference: string | null;
  created_at: string;
  store_name: string | null;
  product_name: string | null;
  planned_cost: string | number | null;
  saved_amount: string | number | null;
  tenure_months: number | null;
  file_url: string | null;
};

import { useApplicationStore } from "@/lib/store";

function parseAmount(n: string | number | null) {
  return typeof n === 'number' ? n : parseFloat(n ?? '');
}

function plannedCost(plan: SpendingPlan) {
  return Math.max(0, parseAmount(plan.planned_cost) || 0);
}

function savedTowardPlan(plan: SpendingPlan) {
  return Math.max(0, parseAmount(plan.saved_amount) || 0);
}

function remainingPlanCost(plan: SpendingPlan) {
  return Math.max(0, plannedCost(plan) - savedTowardPlan(plan));
}

function monthlyBill(plan: SpendingPlan) {
  const remaining = remainingPlanCost(plan);
  return plan.tenure_months && remaining > 0 ? remaining / plan.tenure_months : 0;
}

function percent(part: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((part / total) * 100)) : 0;
}

function getStatusStyles(status: string | null) {
  switch (status) {
    case 'completed':
      return 'bg-status-success-bg text-status-success';
    case 'paused':
      return 'bg-status-danger-bg text-status-danger';
    default:
      return 'bg-status-info-bg text-status-info';
  }
}

function getStatusIcon(status: string | null) {
  if (status === 'completed') return 'check_circle';
  if (status === 'paused') return 'pause_circle';
  return 'schedule';
}

function statusLabel(status: string | null) {
  if (status === 'completed') return 'completed';
  if (status === 'paused') return 'paused';
  return 'active';
}

interface ApplicationsViewProps {
  applications: SpendingPlan[];
  profileComplete: boolean;
}

export default function ApplicationsView({ applications, profileComplete }: ApplicationsViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const currencyCode = useApplicationStore(state => state.currency);

  const currencySymbol = useMemo(() => {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$' };
    return map[currencyCode] || '$';
  }, [currencyCode]);

  const formatCurrency = (n: string | number | null) => {
    const v = parseAmount(n);
    if (!Number.isFinite(v)) return `${currencySymbol}0.00`;

    const amount = Math.abs(v).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${v < 0 ? '-' : ''}${currencySymbol}${amount}`;
  };

  const summary = useMemo(() => {
    const activePlans = applications.filter((plan) => plan.status !== 'paused');
    const planned = activePlans.reduce((sum, plan) => sum + plannedCost(plan), 0);
    const saved = activePlans.reduce((sum, plan) => sum + savedTowardPlan(plan), 0);
    const monthly = activePlans.reduce((sum, plan) => sum + monthlyBill(plan), 0);
    const progress = percent(saved, planned);

    return { activePlans, planned, saved, monthly, progress };
  }, [applications]);

  if (!profileComplete) {
    return (
      <div className="font-manrope pb-20 lg:pb-0">
        <div className="w-full px-6 py-10 md:px-10 xl:px-12">
          <div className="max-w-xl rounded-lg border border-outline-variant bg-surface p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-status-warning-bg text-status-warning">
                <span className="material-symbols-outlined text-2xl">person_add</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-primary">Complete your money profile</h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Add your profile details before creating spending plans, savings goals, and cash-flow forecasts.
                </p>
                <Link
                  href="/profile-setup"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
                >
                  <span className="material-symbols-outlined text-lg">verified_user</span>
                  Set Up Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-manrope pb-20 lg:pb-0">
      <section className="w-full px-6 py-8 md:px-10 xl:px-12">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Moneyly Spending Plans</p>
            <h1 className="text-3xl font-black text-primary sm:text-4xl">Planned Purchases</h1>
            <p className="mt-2 max-w-2xl text-on-surface-variant">
              Turn upcoming purchases into budgets, savings goals, monthly bills, and cash-flow signals.
            </p>
          </div>
          <Link
            href="/plan/details"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-on-secondary shadow-lg shadow-secondary/20 transition-all hover:opacity-90 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Plan
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'Budgeted Spend', value: formatCurrency(summary.planned), icon: 'account_balance_wallet' },
            { label: 'Saved Toward Goals', value: formatCurrency(summary.saved), icon: 'savings' },
            { label: 'Monthly Bills', value: formatCurrency(summary.monthly), icon: 'receipt_long' },
            { label: 'Goal Progress', value: `${summary.progress}%`, icon: 'trending_up' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">{item.label}</p>
                <span className="material-symbols-outlined text-xl text-secondary">{item.icon}</span>
              </div>
              <p className="text-2xl font-black text-primary">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-lg border border-outline-variant bg-surface p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-primary">Cash-Flow Readiness</h2>
              <p className="text-sm text-on-surface-variant">Your planned purchase data is reused here as a money-manager forecast.</p>
            </div>
            <span className="material-symbols-outlined text-2xl text-secondary">waterfall_chart</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-full rounded-full bg-secondary" style={{ width: `${summary.progress}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-on-surface-variant sm:grid-cols-3">
            <span><strong className="block text-on-surface">{summary.activePlans.length}</strong>active plans</span>
            <span><strong className="block text-on-surface">{formatCurrency(Math.max(0, summary.planned - summary.saved))}</strong>cash still needed</span>
          </div>
        </div>

        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="max-w-xl rounded-lg border border-dashed border-outline bg-surface p-8 text-center">
              <span className="material-symbols-outlined mb-3 text-5xl text-on-surface-variant/30">playlist_add</span>
              <p className="text-lg font-black text-primary">No spending plans yet.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
                Add a planned purchase and Moneyly will track its budget, saved amount, monthly bill, and goal progress.
              </p>
              <Link
                href="/plan/details"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Create Plan
              </Link>
            </div>
          ) : (
            applications.map((plan) => {
              const isOpen = expanded === plan.id;
              const cost = plannedCost(plan);
              const saved = savedTowardPlan(plan);
              const remaining = remainingPlanCost(plan);
              const monthly = monthlyBill(plan);
              const progress = percent(saved, cost);
              const hasDoc = Boolean(plan.file_url);

              return (
                <div
                  key={plan.id}
                  className="overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-sm"
                >
                  <div className="grid gap-4 p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container">
                      <span className={`material-symbols-outlined text-xl ${plan.status === 'completed' ? 'text-status-success' : plan.status === 'paused' ? 'text-status-danger' : 'text-on-surface-variant'}`}>
                        {getStatusIcon(plan.status)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-primary">{plan.product_name || 'Planned purchase'}</h3>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${getStatusStyles(plan.status)}`}>
                          {statusLabel(plan.status)}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${hasDoc ? 'bg-status-success-bg text-status-success' : 'bg-status-warning-bg text-status-warning'}`}>
                          {hasDoc ? 'File attached' : 'No file'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-on-surface-variant md:grid-cols-5">
                        <span><strong className="block text-on-surface">{formatCurrency(cost)}</strong>Budget</span>
                        <span><strong className="block text-on-surface">{formatCurrency(saved)}</strong>Saved</span>
                        <span><strong className="block text-on-surface">{formatCurrency(remaining)}</strong>Cash needed</span>
                        <span><strong className="block text-on-surface">{formatCurrency(monthly)}</strong>Monthly bill</span>
                        <span><strong className="block text-on-surface">{progress}%</strong>Goal progress</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : plan.id)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-bold text-on-surface transition-all hover:bg-surface-container"
                    >
                      {isOpen ? 'Hide' : 'View'}
                      <span className="material-symbols-outlined text-lg">{isOpen ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-outline-variant bg-surface-container-low px-5 py-5">
                      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-surface p-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Budget</p>
                          <p className="mt-3 text-sm text-on-surface-variant">
                            Planned cost {formatCurrency(cost)} with {formatCurrency(saved)} already saved.
                          </p>
                        </div>
                        <div className="rounded-lg bg-surface p-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Bill Forecast</p>
                          <p className="mt-3 text-sm text-on-surface-variant">
                            {formatCurrency(monthly)} per month over {plan.tenure_months || 0} months for cash-flow planning.
                          </p>
                        </div>
                        <div className="rounded-lg bg-surface p-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Savings Goal</p>
                          <p className="mt-3 text-sm text-on-surface-variant">
                            {progress}% complete with {formatCurrency(remaining)} still needed.
                          </p>
                        </div>
                      </div>

                      <div className="mb-5 h-2 overflow-hidden rounded-full bg-surface-container-highest">
                        <div className="h-full rounded-full bg-secondary" style={{ width: `${progress}%` }} />
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {[
                          { label: 'Reference', value: plan.reference },
                          { label: 'Created', value: new Date(plan.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                          { label: 'Plan Length', value: plan.tenure_months ? `${plan.tenure_months} months` : null },
                          { label: 'Receipt / Document', value: plan.file_url ? <a href={plan.file_url} target="_blank" rel="noreferrer" className="text-secondary hover:underline">View Attached Document</a> : 'None' },
                        ].filter((row) => Boolean(row.value)).map((row) => (
                          <div key={row.label}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{row.label}</p>
                            <div className="mt-1 text-sm font-bold text-on-surface wrap-break-word">{row.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
