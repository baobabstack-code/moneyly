'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { UserProfile } from "@/lib/profile";

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

type MetricCardProps = {
  icon: string;
  label: string;
  value: string;
  detail: string;
  tone: string;
};

function parseAmount(n: string | number | null) {
  return typeof n === 'number' ? n : parseFloat(n ?? '');
}

function currency(n: string | number | null) {
  const v = parseAmount(n);
  if (!Number.isFinite(v)) return "$0.00";

  const amount = Math.abs(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${v < 0 ? '-' : ''}$${amount}`;
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

function statusBadge(status: string | null) {
  const map: Record<string, string> = {
    completed: 'bg-status-success-bg text-status-success',
    paused: 'bg-status-danger-bg text-status-danger',
  };
  return map[status ?? ''] ?? 'bg-status-info-bg text-status-info';
}

function statusIcon(status: string | null) {
  if (status === 'completed') return 'check_circle';
  if (status === 'paused') return 'pause_circle';
  return 'schedule';
}

function statusLabel(status: string | null) {
  if (status === 'completed') return 'completed';
  if (status === 'paused') return 'paused';
  return 'active';
}

function MetricCard({ icon, label, value, detail, tone }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">{label}</p>
          <p className="mt-3 text-2xl font-black text-primary">{value}</p>
          <p className="mt-1 text-sm text-on-surface-variant">{detail}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  email: string;
  displayName: string;
  profile: UserProfile | null;
  applications: SpendingPlan[]; // maps to the backend query result
  profileComplete: boolean;
}

export default function DashboardView({ email, displayName, profile, applications }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || displayName;

  const money = useMemo(() => {
    const activePlans = applications.filter((plan) => plan.status !== 'paused');
    const pausedPlans = applications.filter((plan) => plan.status === 'paused');
    const completedPlans = applications.filter((plan) => plan.status === 'completed');
    const plannedSpend = activePlans.reduce((sum, plan) => sum + plannedCost(plan), 0);
    const savedForGoals = activePlans.reduce((sum, plan) => sum + savedTowardPlan(plan), 0);
    const remainingToFund = activePlans.reduce((sum, plan) => sum + remainingPlanCost(plan), 0);
    const monthlyBills = activePlans.reduce((sum, plan) => sum + monthlyBill(plan), 0);
    const documentsReady = activePlans.filter((plan) => plan.file_url).length;
    const averagePlanLength = activePlans.length
      ? Math.round(activePlans.reduce((sum, plan) => sum + (plan.tenure_months || 0), 0) / activePlans.length)
      : 0;
    const monthlyIncome = parseAmount(profile?.monthly_income ?? null);
    const hasIncome = Number.isFinite(monthlyIncome) && monthlyIncome > 0;
    const cashFlow = hasIncome ? monthlyIncome - monthlyBills : -monthlyBills;
    const budgetLoad = hasIncome ? percent(monthlyBills, monthlyIncome) : percent(savedForGoals, plannedSpend);
    const savingsProgress = percent(savedForGoals, plannedSpend);

    const insights = [
      hasIncome
        ? `Planned monthly commitments use ${budgetLoad}% of your monthly income.`
        : 'Add your monthly income in profile settings to turn this into a real cash-flow forecast.',
      activePlans.length
        ? `${activePlans.length} active spending plan${activePlans.length === 1 ? '' : 's'} shape your current budget.`
        : 'Create a spending plan to start tracking budgets, bills, and goals.',
      completedPlans.length > 0
        ? `You have successfully completed ${completedPlans.length} plan${completedPlans.length === 1 ? '' : 's'}!`
        : 'Complete your savings targets to mark plans as finished.',
      savingsProgress >= 50
        ? 'Your saved goal contributions cover at least half of planned costs.'
        : 'Small recurring deposits will improve your net worth snapshot over time.',
    ];

    return {
      activePlans,
      pausedPlans,
      completedPlans,
      plannedSpend,
      savedForGoals,
      remainingToFund,
      monthlyBills,
      documentsReady,
      averagePlanLength,
      monthlyIncome,
      hasIncome,
      cashFlow,
      budgetLoad,
      savingsProgress,
      insights,
    };
  }, [applications, profile?.monthly_income]);

  return (
    <div className="font-manrope pb-20 lg:pb-0">
      <section className="w-full px-6 py-8 md:px-10 xl:px-12">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Moneyly Money Manager</p>
            <h1 className="text-3xl font-black text-primary sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 max-w-2xl text-on-surface-variant">
              Track net worth, budgets, commitments, savings goals, spending plans, insights, and cash-flow from one place.
            </p>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Account</p>
            <p className="mt-1 max-w-[260px] truncate font-bold text-on-surface">{email}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon="account_balance_wallet"
              label="Net Worth"
              value={currency(money.savedForGoals)}
              detail="Tracked from saved goal contributions"
              tone="bg-status-success-bg text-status-success"
            />
            <MetricCard
              icon="waterfall_chart"
              label="Cash-Flow"
              value={currency(money.cashFlow)}
              detail={money.hasIncome ? "After planned monthly commitments" : "Planned outgoing until income is added"}
              tone="bg-secondary/10 text-secondary"
            />
            <MetricCard
              icon="receipt_long"
              label="Commitments"
              value={currency(money.monthlyBills)}
              detail={`${money.activePlans.length} recurring planned item${money.activePlans.length === 1 ? '' : 's'}`}
              tone="bg-status-warning-bg text-status-warning"
            />
            <MetricCard
              icon="savings"
              label="Savings Goals"
              value={`${money.savingsProgress}%`}
              detail={`${currency(money.savedForGoals)} saved toward ${currency(money.plannedSpend)}`}
              tone="bg-status-info-bg text-status-info"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="rounded-lg border border-outline-variant bg-surface p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-primary">Budget Snapshot</h2>
                  <p className="text-sm text-on-surface-variant">A simple view of planned purchases, goal savings, monthly commitments, and cash needed.</p>
                </div>
                <Link
                  href="/plan/store"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-on-secondary transition-all hover:opacity-90 active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  New Plan
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Budgets</p>
                  <p className="mt-3 text-3xl font-black text-primary">{currency(money.plannedSpend)}</p>
                  <p className="text-sm text-on-surface-variant">planned across spending plans</p>
                </div>
                <div className="rounded-lg bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Cash Needed</p>
                  <p className="mt-3 text-3xl font-black text-primary">{currency(money.remainingToFund)}</p>
                  <p className="text-sm text-on-surface-variant">left after goal deposits</p>
                </div>
                <div className="rounded-lg bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Plan Length</p>
                  <p className="mt-3 text-3xl font-black text-primary">{money.averagePlanLength || 0}</p>
                  <p className="text-sm text-on-surface-variant">average months</p>
                </div>
                <div className="rounded-lg bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Docs Ready</p>
                  <p className="mt-3 text-3xl font-black text-primary">{money.documentsReady}/{money.activePlans.length || 0}</p>
                  <p className="text-sm text-on-surface-variant">supporting documents attached</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-outline-variant bg-primary p-5 text-on-primary shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">Cash-Flow</h2>
                  <p className="text-sm text-on-primary/70">Forecast from profile income and planned commitments.</p>
                </div>
                <span className="material-symbols-outlined text-3xl text-on-primary/70">monitoring</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-on-primary/70">
                    <span>Budget Load</span>
                    <span>{money.budgetLoad}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-white" style={{ width: `${money.budgetLoad}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs text-on-primary/70">Income tracked</p>
                    <p className="mt-1 font-black">{money.hasIncome ? currency(money.monthlyIncome) : 'Add in settings'}</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs text-on-primary/70">Monthly commit</p>
                    <p className="mt-1 font-black">{currency(money.monthlyBills)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
            <div className="rounded-lg border border-outline-variant bg-surface p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-primary">Insights</h2>
                  <p className="text-sm text-on-surface-variant">Signals from your active plans.</p>
                </div>
                <span className="material-symbols-outlined text-2xl text-secondary">tips_and_updates</span>
              </div>
              <div className="space-y-3">
                {money.insights.map((insight) => (
                  <div key={insight} className="rounded-lg bg-surface-container-low p-4">
                    <p className="text-sm font-bold leading-relaxed text-on-surface">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-primary">Spending Plans</h2>
                  <p className="text-sm text-on-surface-variant">List of your active planned purchases and savings goals.</p>
                </div>
                <Link href="/applications" className="hidden text-sm font-bold text-secondary sm:inline-flex">
                  View all
                </Link>
              </div>

              <div className="space-y-3">
                {applications.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-outline p-8 text-center">
                    <span className="material-symbols-outlined mb-3 text-5xl text-on-surface-variant/30">playlist_add</span>
                    <p className="font-bold text-on-surface">No spending plans yet.</p>
                    <p className="mt-1 text-sm text-on-surface-variant">Add a planned purchase to start shaping budgets, goals, and cash-flow.</p>
                    <Link
                      href="/plan/store"
                      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                      Create Plan
                    </Link>
                  </div>
                ) : (
                  applications.slice(0, 6).map((plan) => {
                    const isOpen = expanded === plan.id;
                    const cost = plannedCost(plan);
                    const saved = savedTowardPlan(plan);
                    const remaining = remainingPlanCost(plan);
                    const bill = monthlyBill(plan);
                    const progress = percent(saved, cost);

                    return (
                      <div key={plan.id} className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
                        <div className="grid gap-4 p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
                            <span className="material-symbols-outlined text-xl">{statusIcon(plan.status)}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <p className="truncate font-black text-primary">{plan.product_name || 'Planned purchase'}</p>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusBadge(plan.status)}`}>
                                {statusLabel(plan.status)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm text-on-surface-variant sm:grid-cols-4">
                              <span><strong className="block text-on-surface">{currency(cost)}</strong>Budget</span>
                              <span><strong className="block text-on-surface">{currency(saved)}</strong>Saved</span>
                              <span><strong className="block text-on-surface">{currency(bill)}</strong>Monthly commit</span>
                              <span><strong className="block text-on-surface">{progress}%</strong>Goal progress</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : plan.id)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container"
                          >
                            {isOpen ? 'Hide' : 'Details'}
                            <span className="material-symbols-outlined text-lg">{isOpen ? 'expand_less' : 'expand_more'}</span>
                          </button>
                        </div>

                        {isOpen && (
                          <div className="border-t border-outline-variant bg-surface-container-low p-4">
                            <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-container-highest">
                              <div className="h-full rounded-full bg-secondary" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                              {[
                                { label: 'Category / Store', value: plan.store_name || 'Personal plan' },
                                { label: 'Budget', value: currency(cost) },
                                { label: 'Saved', value: currency(saved) },
                                { label: 'Cash Needed', value: currency(remaining) },
                                { label: 'Monthly Commit', value: currency(bill) },
                                { label: 'Plan Length', value: plan.tenure_months ? `${plan.tenure_months} months` : null },
                                { label: 'Created', value: new Date(plan.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                                { label: 'Reference', value: plan.reference },
                                { label: 'Receipt / Invoice', value: plan.file_url ? 'Attached' : 'None' },
                              ].filter((row) => Boolean(row.value)).map((row) => (
                                <div key={row.label}>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{row.label}</p>
                                  <p className="mt-1 text-sm font-bold text-on-surface wrap-break-word">{row.value}</p>
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
