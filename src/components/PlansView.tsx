'use client'

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

import { useFinanceStore, SpendingPlan } from "@/lib/financeStore";

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

interface PlansViewProps {
  initialSpendingPlans: SpendingPlan[];
  profileComplete: boolean;
}

export default function PlansView({ initialSpendingPlans, profileComplete }: PlansViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const currencyCode = useFinanceStore(state => state.currency);
  const spendingPlans = useFinanceStore(state => state.spendingPlans);
  const setSpendingPlans = useFinanceStore(state => state.setSpendingPlans);
  
  const transactions = useFinanceStore(state => state.transactions);
  const deleteSpendingPlanLocal = useFinanceStore(state => state.deleteSpendingPlanLocal);
  const updateSpendingPlanLocal = useFinanceStore(state => state.updateSpendingPlanLocal);
  const addNotification = useFinanceStore(state => state.addNotification);

  useEffect(() => {
    if (spendingPlans.length === 0 && initialSpendingPlans.length > 0) {
      setSpendingPlans(initialSpendingPlans);
    }
  }, [initialSpendingPlans, spendingPlans, setSpendingPlans]);

  useEffect(() => {
    const loadPlans = async () => {
      if (typeof window !== "undefined" && navigator.onLine) {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        const { data: plans } = await supabase.from('spending_plans').select('*').order('created_at', { ascending: false });
        if (plans) setSpendingPlans(plans);
      }
    };
    loadPlans();
  }, [setSpendingPlans]);

  // Spending Plan editing state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanCost, setEditPlanCost] = useState('');
  const [editPlanSaved, setEditPlanSaved] = useState('');
  const [editPlanTenure, setEditPlanTenure] = useState('');
  const [editPlanStatus, setEditPlanStatus] = useState('active');

  const handleStartEdit = (plan: SpendingPlan) => {
    setEditingPlanId(plan.id);
    setEditPlanName(plan.product_name);
    setEditPlanCost(plan.planned_cost.toString());
    setEditPlanSaved(plan.saved_amount.toString());
    setEditPlanTenure(plan.tenure_months.toString());
    setEditPlanStatus(plan.status);
  };

  const handleSaveEdit = async (id: string) => {
    const costNum = parseFloat(editPlanCost);
    const savedNum = parseFloat(editPlanSaved);
    const tenureNum = parseInt(editPlanTenure);
    if (!editPlanName.trim() || isNaN(costNum) || costNum < 0 || isNaN(savedNum) || savedNum < 0 || isNaN(tenureNum) || tenureNum <= 0) {
      addNotification("Please check all fields are valid.", "error");
      return;
    }

    await updateSpendingPlanLocal(id, {
      product_name: editPlanName.trim(),
      planned_cost: costNum,
      saved_amount: savedNum,
      tenure_months: tenureNum,
      status: editPlanStatus,
    });

    setEditingPlanId(null);
    addNotification("Spending plan updated!", "success");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this spending plan?")) {
      await deleteSpendingPlanLocal(id);
      addNotification("Spending plan deleted!", "success");
    }
  };

  const currencySymbol = useMemo(() => {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$', CAD: 'C$' };
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
    const activePlans = spendingPlans.filter((plan) => plan.status !== 'paused');
    const planned = activePlans.reduce((sum, plan) => sum + plannedCost(plan), 0);
    const saved = activePlans.reduce((sum, plan) => sum + savedTowardPlan(plan), 0);
    const monthly = activePlans.reduce((sum, plan) => sum + monthlyBill(plan), 0);
    const progress = percent(saved, planned);

    return { activePlans, planned, saved, monthly, progress };
  }, [spendingPlans]);

  if (!profileComplete) {
    return (
      <div className="font-manrope pb-20 lg:pb-0">
        <div className="w-full px-6 py-10 md:px-10 xl:px-12">
          <div className="max-w-xl rounded-3xl border border-outline-variant bg-surface p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-status-warning-bg text-status-warning">
                <span className="material-symbols-outlined text-2xl">person_add</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-primary">Complete your money profile</h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Add your profile details before creating spending plans, savings goals, and cash-flow forecasts.
                </p>
                <Link
                  href="/profile-setup"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-on-secondary shadow-lg shadow-secondary/20 transition-all hover:opacity-90 active:scale-95"
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

        {/* Responsive Grid for Widescreen Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
          
          {/* Main Area: Spending Plans Feed (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            {spendingPlans.length === 0 ? (
              <div className="max-w-xl rounded-3xl border border-dashed border-outline bg-surface p-8 text-center">
                <span className="material-symbols-outlined mb-3 text-5xl text-on-surface-variant/30">playlist_add</span>
                <p className="text-lg font-black text-primary">No spending plans yet.</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
                  Add a planned purchase and Moneyly will track its budget, saved amount, monthly bill, and goal progress.
                </p>
                <Link
                  href="/plan/details"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-on-secondary"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Create Plan
                </Link>
              </div>
            ) : (
              spendingPlans.map((plan) => {
                const isOpen = expanded === plan.id;
                const cost = plannedCost(plan);
                const saved = savedTowardPlan(plan);
                const remaining = remainingPlanCost(plan);
                const monthly = monthlyBill(plan);
                const progress = percent(saved, cost);
                const hasDoc = Boolean(plan.file_url);
                const isEditing = editingPlanId === plan.id;
                const linkedTransactions = transactions.filter(t => t.spending_plan_id === plan.id);

                if (isEditing) {
                  return (
                    <div key={plan.id} className="rounded-3xl border border-secondary/40 bg-surface p-5 shadow-lg space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                        <h3 className="font-bold text-primary text-sm">Edit Spending Plan</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Goal/Item Name</label>
                          <input
                            type="text"
                            value={editPlanName}
                            onChange={(e) => setEditPlanName(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-primary font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Status</label>
                          <select
                            value={editPlanStatus}
                            onChange={(e) => setEditPlanStatus(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm text-primary font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20"
                          >
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Budget Cost</label>
                          <input
                            type="number"
                            value={editPlanCost}
                            onChange={(e) => setEditPlanCost(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-primary font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Saved Amt</label>
                          <input
                            type="number"
                            value={editPlanSaved}
                            onChange={(e) => setEditPlanSaved(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-primary font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Months</label>
                          <input
                            type="number"
                            value={editPlanTenure}
                            onChange={(e) => setEditPlanTenure(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-primary font-bold focus:outline-none focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
                        <button
                          type="button"
                          onClick={() => setEditingPlanId(null)}
                          className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(plan.id)}
                          className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-on-secondary shadow-md"
                        >
                          Save Plan
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={plan.id}
                    className="overflow-hidden rounded-3xl border border-outline-variant bg-surface shadow-md"
                  >
                    <div className="grid gap-4 p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container">
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
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-bold text-on-surface transition-all hover:bg-surface-container"
                      >
                        {isOpen ? 'Hide' : 'View'}
                        <span className="material-symbols-outlined text-lg">{isOpen ? 'expand_less' : 'expand_more'}</span>
                      </button>
                    </div>

                    {isOpen && (
                      <div className="border-t border-outline-variant bg-surface-container-low px-5 py-5">
                        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="rounded-2xl bg-surface p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Budget</p>
                            <p className="mt-3 text-sm text-on-surface-variant">
                              Planned cost {formatCurrency(cost)} with {formatCurrency(saved)} already saved.
                            </p>
                          </div>
                          <div className="rounded-2xl bg-surface p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Bill Forecast</p>
                            <p className="mt-3 text-sm text-on-surface-variant">
                              {formatCurrency(monthly)} per month over {plan.tenure_months || 0} months for cash-flow planning.
                            </p>
                          </div>
                          <div className="rounded-2xl bg-surface p-4">
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

                        {/* Linked Transactions Section */}
                        <div className="border-t border-outline-variant/30 pt-4 mt-5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-3 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm font-black">link</span>
                            Linked Transactions Audit Trail
                          </h4>
                          {linkedTransactions.length === 0 ? (
                            <p className="text-xs text-on-surface-variant/60 italic pl-1">No transactions linked to this plan yet.</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {linkedTransactions.map(t => (
                                <div key={t.id} className="flex justify-between items-center text-xs bg-surface p-3 rounded-xl border border-outline-variant/20">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-primary">{t.note || t.category_name || 'Uncategorized'}</span>
                                    <span className="text-[9px] text-on-surface-variant/65 uppercase tracking-wide mt-0.5">
                                      {t.type} • {new Date(t.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                    </span>
                                  </div>
                                  <span className={`font-black ${t.type === 'income' ? 'text-emerald-500' : t.type === 'savings' ? 'text-blue-500' : 'text-rose-500'}`}>
                                    {t.type === 'income' ? '+' : t.type === 'savings' ? '' : '-'}{formatCurrency(t.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Management Controls */}
                        <div className="border-t border-outline-variant/30 pt-4 mt-5 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(plan)}
                            className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-bold text-secondary flex items-center gap-1.5 hover:bg-surface-container transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit Plan Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(plan.id)}
                            className="rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 px-4 py-2 text-xs font-bold text-red-500 flex items-center gap-1.5 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Delete Plan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Column (Right 1 Column) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cash-Flow Readiness Card */}
            <div className="rounded-3xl border border-outline-variant bg-surface p-5 shadow-lg sticky top-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-primary">Cash-Flow Readiness</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Your planned purchase data is reused here as a money-manager forecast.</p>
                </div>
                <span className="material-symbols-outlined text-2xl text-secondary">waterfall_chart</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full rounded-full bg-secondary" style={{ width: `${summary.progress}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-on-surface-variant">
                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                  <span className="opacity-75">Active Plans:</span>
                  <span className="font-black text-primary">{summary.activePlans.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-75">Cash Needed:</span>
                  <span className="font-black text-emerald-500">{formatCurrency(Math.max(0, summary.planned - summary.saved))}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
