'use client';

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { UserProfile } from "@/lib/profile";
import { useApplicationStore, Transaction, SpendingPlan } from "@/lib/store";
import OnboardingModal from "./OnboardingModal";
import QuickTransactionModal from "./QuickTransactionModal";
import BudgetEditModal from "./BudgetEditModal";

interface Props {
  email: string;
  displayName: string;
  profile: UserProfile | null;
  applications: SpendingPlan[];
  profileComplete: boolean;
}

export default function DashboardView({ email, displayName, profile, applications }: Props) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'balance' | 'control' | 'analyze'>('expenses');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; balance: number; date: Date } | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Zustand Store Hooks
  const setTransactions = useApplicationStore(state => state.setTransactions);
  const setCategories = useApplicationStore(state => state.setCategories);
  const updateProfilePreferences = useApplicationStore(state => state.updateProfilePreferences);
  const transactions = useApplicationStore(state => state.transactions);
  const categories = useApplicationStore(state => state.categories);
  const accentColor = useApplicationStore(state => state.accentColor);
  const currencyCode = useApplicationStore(state => state.currency);
  const onboarded = useApplicationStore(state => state.onboarded);
  const startingBalance = useApplicationStore(state => state.startingBalance);
  const syncOfflineData = useApplicationStore(state => state.syncOfflineData);
  const addNotification = useApplicationStore(state => state.addNotification);
  const updateCategoryLocal = useApplicationStore(state => state.updateCategoryLocal);
  const setSpendingPlans = useApplicationStore(state => state.setSpendingPlans);

  // Sync Supabase categories and transactions on mount
  useEffect(() => {
    if (profile) {
      updateProfilePreferences({
        starting_balance: parseFloat((profile as any).starting_balance) || 0,
        currency: (profile as any).currency || 'USD',
        accent_color: (profile as any).accent_color || 'green',
        onboarded: !!(profile as any).onboarded,
        daily_budget: parseFloat((profile as any).daily_budget) || 0,
        weekly_budget: parseFloat((profile as any).weekly_budget) || 0,
        monthly_budget: parseFloat((profile as any).monthly_budget) || 0,
      });
    }

    const loadData = async () => {
      if (typeof window !== "undefined" && navigator.onLine) {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        
        const { data: cats } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
        if (cats) setCategories(cats);

        const { data: txs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        if (txs) setTransactions(txs);

        const { data: plans } = await supabase.from('spending_plans').select('*').order('created_at', { ascending: false });
        if (plans) setSpendingPlans(plans);

        await syncOfflineData();
      }
    };
    
    loadData();

    const handleOnline = () => {
      syncOfflineData();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [profile]);

  const currencySymbol = useMemo(() => {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$' };
    return map[currencyCode] || '$';
  }, [currencyCode]);

  const formatCurrency = (n: number) => {
    const v = Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${n < 0 ? '-' : ''}${currencySymbol}${v}`;
  };

  const stats = useMemo(() => {
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalIndependentSavings = transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = startingBalance + totalIncome - totalExpenses;
    
    // Group expenses by category
    const expenseGroup: Record<string, { amount: number; emoji: string; name: string }> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const catName = t.category_name || 'Other';
      if (!expenseGroup[catName]) {
        expenseGroup[catName] = { amount: 0, emoji: t.category_emoji || '🛍️', name: catName };
      }
      expenseGroup[catName].amount += t.amount;
    });

    const expensesByCategory = Object.values(expenseGroup).sort((a, b) => b.amount - a.amount);

    return {
      totalExpenses,
      totalIncome,
      totalIndependentSavings,
      currentBalance,
      expensesByCategory
    };
  }, [transactions, startingBalance]);

  // Compute spending plans metrics
  const money = useMemo(() => {
    const activePlans = applications.filter((plan) => plan.status !== 'paused');
    const completedPlans = applications.filter((plan) => plan.status === 'completed');
    
    const plannedSpend = activePlans.reduce((sum, plan) => {
      const val = typeof plan.planned_cost === 'number' ? plan.planned_cost : parseFloat(plan.planned_cost || '0');
      return sum + (val || 0);
    }, 0);

    const savedForGoals = activePlans.reduce((sum, plan) => {
      const val = typeof plan.saved_amount === 'number' ? plan.saved_amount : parseFloat(plan.saved_amount || '0');
      return sum + (val || 0);
    }, 0);

    const remainingToFund = Math.max(0, plannedSpend - savedForGoals);
    const savingsProgress = plannedSpend > 0 ? Math.min(100, Math.round((savedForGoals / plannedSpend) * 100)) : 0;

    return {
      activePlans,
      completedPlans,
      plannedSpend,
      savedForGoals,
      remainingToFund,
      savingsProgress,
    };
  }, [applications]);

  const totalIndependentSavings = stats.totalIndependentSavings;
  const totalSavings = money.savedForGoals + totalIndependentSavings;

  // Compute budgets and current spending
  const dailyBudget = useApplicationStore(state => state.dailyBudget);
  const weeklyBudget = useApplicationStore(state => state.weeklyBudget);
  const monthlyBudget = useApplicationStore(state => state.monthlyBudget);
  const budgetLimits = useMemo(() => ({
    daily: dailyBudget,
    weekly: weeklyBudget,
    monthly: monthlyBudget
  }), [dailyBudget, weeklyBudget, monthlyBudget]);

  const budgetSpending = useMemo(() => {
    const now = new Date();
    
    // Start of today (local time)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of this week (Monday)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Start of this month (1st)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailyExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= startOfToday)
      .reduce((sum, t) => sum + t.amount, 0);

    const weeklyExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= startOfWeek)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      daily: dailyExpenses,
      weekly: weeklyExpenses,
      monthly: monthlyExpenses
    };
  }, [transactions]);

  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || displayName;

  const netWorthTrend = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      d.setHours(23, 59, 59, 999);
      days.push(d);
    }

    const firstDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    firstDayStart.setHours(0, 0, 0, 0);

    let baseline = startingBalance;
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate < firstDayStart) {
        if (t.type === 'income') {
          baseline += t.amount;
        } else if (t.type === 'expense') {
          baseline -= t.amount;
        }
      }
    });

    const windowTx = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate >= firstDayStart;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const trendData = days.map(day => {
      let balance = baseline;
      windowTx.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate <= day) {
          if (t.type === 'income') {
            balance += t.amount;
          } else if (t.type === 'expense') {
            balance -= t.amount;
          }
        }
      });
      return {
        date: day,
        balance
      };
    });

    return trendData;
  }, [transactions, startingBalance]);

  const { minVal, maxVal } = useMemo(() => {
    if (netWorthTrend.length === 0) return { minVal: 0, maxVal: 100 };
    const balances = netWorthTrend.map(d => d.balance);
    let min = Math.min(...balances);
    let max = Math.max(...balances);
    if (min === max) {
      min -= 100;
      max += 100;
    }
    const padding = (max - min) * 0.1 || 10;
    return { minVal: min - padding, maxVal: max + padding };
  }, [netWorthTrend]);

  const chartPoints = useMemo(() => {
    const width = 500;
    const height = 180;
    const paddingX = 20;
    const paddingY = 20;

    return netWorthTrend.map((d, index) => {
      const x = paddingX + (index / 29) * (width - 2 * paddingX);
      const y = height - paddingY - ((d.balance - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
      return {
        x,
        y,
        balance: d.balance,
        date: d.date
      };
    });
  }, [netWorthTrend, minVal, maxVal]);

  const linePath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return chartPoints.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [chartPoints]);

  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    const startX = chartPoints[0].x;
    const endX = chartPoints[chartPoints.length - 1].x;
    const height = 180;
    const paddingY = 20;
    const bottomY = height - paddingY;
    return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  }, [chartPoints, linePath]);

  const gridLines = useMemo(() => {
    const height = 180;
    const paddingY = 20;
    const range = maxVal - minVal;
    
    return [0.25, 0.5, 0.75].map((ratio) => {
      const val = minVal + ratio * range;
      const y = height - paddingY - ratio * (height - 2 * paddingY);
      return { y, val };
    });
  }, [minVal, maxVal]);

  const monthlyCategorySpent = useMemo(() => {
    const map: Record<string, number> = {};
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth)
      .forEach(t => {
        const key = t.category_id ? String(t.category_id) : (t.category_name || 'Other');
        map[key] = (map[key] || 0) + t.amount;
      });
    return map;
  }, [transactions]);

  const handleSaveCategoryBudget = async (categoryId: number) => {
    try {
      const val = parseFloat(editValue) || 0;
      await updateCategoryLocal(categoryId, { budget_limit: val });
      addNotification("Category budget updated!", "success");
    } catch (err) {
      console.error(err);
      addNotification("Failed to update budget.", "error");
    } finally {
      setEditingCategoryId(null);
    }
  };

  return (
    <div 
      className="font-manrope pb-20 lg:pb-0 min-h-screen bg-slate-950/20"
      data-accent={accentColor}
    >
      <section className="w-full px-6 py-8 md:px-10 xl:px-12">
        {/* Onboarding Trigger Check */}
        {!onboarded && profile?.id && (
          <OnboardingModal user_id={profile.id} />
        )}

        {/* Welcome Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Moneyly Money Manager</p>
            <h1 className="text-3xl font-black text-primary sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 max-w-2xl text-on-surface-variant">
              Track your net worth, transaction history, categories, accents, and offline syncing.
            </p>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm shadow-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary">wifi</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Status</p>
              <p className="font-bold text-on-surface">Offline Sync Capable</p>
            </div>
          </div>
        </div>

        {/* Dashboard Stat Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Net Worth */}
          <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Net Worth Balance</p>
                <h3 className="mt-3 text-2xl font-black text-primary">{formatCurrency(stats.currentBalance)}</h3>
                <p className="mt-1 text-[10px] text-on-surface-variant">
                  Everyday Cash: <span className="font-bold text-on-surface">{formatCurrency(stats.currentBalance - totalIndependentSavings)}</span>
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              </div>
            </div>
          </div>

          {/* Income */}
          <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Total Income</p>
                <h3 className="mt-3 text-2xl font-black text-emerald-500">{formatCurrency(stats.totalIncome)}</h3>
                <p className="mt-1 text-xs text-on-surface-variant">Logged salaries & windfalls</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <span className="material-symbols-outlined text-2xl">trending_up</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Total Expenses</p>
                <h3 className="mt-3 text-2xl font-black text-rose-500">{formatCurrency(stats.totalExpenses)}</h3>
                <p className="mt-1 text-xs text-on-surface-variant">Food, bills, transport, shopping</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <span className="material-symbols-outlined text-2xl">trending_down</span>
              </div>
            </div>
          </div>

          {/* Total Savings */}
          <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Total Savings Vault</p>
                <h3 className="mt-3 text-2xl font-black text-secondary">{formatCurrency(totalSavings)}</h3>
                <p className="mt-1 text-[10px] text-on-surface-variant">
                  Goal: {formatCurrency(money.savedForGoals)} | Cash: {formatCurrency(totalIndependentSavings)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-2xl">savings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="mb-6 flex gap-2 border-b border-outline-variant/30 pb-3 overflow-x-auto scrollbar-hide">
          {(['expenses', 'balance', 'control', 'analyze'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-secondary text-on-secondary shadow-md shadow-secondary/25'
                  : 'text-on-surface-variant hover:text-primary bg-surface/50 border border-outline-variant/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Active Tab View */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Main Sub-view content */}
          <div className="lg:col-span-2 space-y-6">

            {activeTab === 'expenses' && (
              <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-primary">Recent Transactions</h2>
                    <p className="text-xs text-on-surface-variant">Log changes in real-time or offline</p>
                  </div>
                  {profile?.id && (
                    <button
                      onClick={() => setTxModalOpen(true)}
                      className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-on-secondary shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm font-black">add</span>
                      Add Transaction
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline p-8 text-center bg-surface-container-low/40">
                      <span className="material-symbols-outlined mb-2 text-4xl text-on-surface-variant/30">receipt_long</span>
                      <p className="font-bold text-on-surface text-sm">No transactions logged</p>
                      <p className="mt-1 text-xs text-on-surface-variant">Tap Add in the nav bar below to log your first transaction.</p>
                    </div>
                  ) : (
                    transactions.slice(0, 10).map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-2xl bg-surface-container-low/45 p-4 border border-outline-variant/20 hover:border-outline-variant/60 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-highest text-xl">
                            {t.category_emoji || '🛒'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary">{t.note || t.category_name || 'Uncategorized'}</p>
                            <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">{t.category_name || t.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-500' : t.type === 'savings' ? 'text-blue-500' : 'text-rose-500'}`}>
                            {t.type === 'income' ? '+' : t.type === 'savings' ? '' : '-'}{formatCurrency(t.amount)}
                          </p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">
                            {new Date(t.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'balance' && (
              <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-primary">Financial Net Worth</h2>
                  <p className="text-xs text-on-surface-variant">Summary of current cash-flow balances and holdings</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Starting Balance</p>
                    <p className="mt-2 text-xl font-black text-primary">{formatCurrency(startingBalance)}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Cash Inflows</p>
                    <p className="mt-2 text-xl font-black text-emerald-500">+{formatCurrency(stats.totalIncome)}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Cash Outflows</p>
                    <p className="mt-2 text-xl font-black text-rose-500">-{formatCurrency(stats.totalExpenses)}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-surface-container-low p-5 border border-outline-variant/35 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-primary text-sm">Offline Synchronization log</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Pending mutations queued: {useApplicationStore.getState().pendingMutations.length}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!navigator.onLine) {
                        addNotification("You are currently offline. Connect to internet to sync.", "error");
                        return;
                      }
                      await syncOfflineData();
                    }}
                    className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-on-secondary shadow-md"
                  >
                    Sync Now
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'control' && (
              <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-primary">Spending Plans</h2>
                    <p className="text-xs text-on-surface-variant font-medium">Control goals, commitments and purchases</p>
                  </div>
                  <Link 
                    href="/plan/details"
                    className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-on-secondary shadow-md"
                  >
                    Add Plan
                  </Link>
                </div>

                <div className="space-y-3">
                  {applications.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline p-8 text-center bg-surface-container-low/40">
                      <span className="material-symbols-outlined mb-2 text-4xl text-on-surface-variant/30">playlist_add</span>
                      <p className="font-bold text-on-surface text-sm">No spending plans yet</p>
                      <p className="mt-1 text-xs text-on-surface-variant">Create plans to forecast budgets and savings goals.</p>
                    </div>
                  ) : (
                    applications.map((plan) => {
                      const cost = typeof plan.planned_cost === 'number' ? plan.planned_cost : parseFloat(plan.planned_cost || '0') || 0;
                      const saved = typeof plan.saved_amount === 'number' ? plan.saved_amount : parseFloat(plan.saved_amount || '0') || 0;
                      const progress = cost > 0 ? Math.min(100, Math.round((saved / cost) * 100)) : 0;
                      const isExpanded = expandedPlan === plan.id;

                      return (
                        <div key={plan.id} className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low/30">
                          <div className="flex items-center justify-between p-4">
                            <div>
                              <p className="font-black text-primary text-sm">{plan.product_name || 'Planned Purchase'}</p>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">Budget: {formatCurrency(cost)} | Saved: {formatCurrency(saved)}</p>
                            </div>
                            <button
                              onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                              className="rounded-xl border border-outline-variant px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
                            >
                              {isExpanded ? 'Hide' : 'Details'}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-outline-variant/35 bg-surface-container-low/60 p-4 space-y-3 animate-in fade-in duration-200">
                              <div>
                                <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant/80 mb-1.5">
                                  <span>Goal Progress</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                                  <div className="h-full bg-secondary rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                              <div className="text-xs text-on-surface-variant">
                                <div>Tenure: <strong className="text-primary">{plan.tenure_months ? `${plan.tenure_months} months` : 'N/A'}</strong></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analyze' && (
              <div className="space-y-6">
                {/* 1. Net Worth Trend SVG Line Chart */}
                <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-primary">Net Worth Trend</h2>
                    <p className="text-xs text-on-surface-variant font-medium">30-day cumulative net worth progression</p>
                  </div>
                  <div className="relative h-48 w-full bg-slate-950/15 rounded-2xl p-4 border border-outline-variant/30 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      {gridLines.map((line, idx) => (
                        <g key={idx}>
                          <line
                            x1="20"
                            y1={line.y}
                            x2="480"
                            y2={line.y}
                            stroke="var(--color-outline-variant)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.25"
                          />
                          <text
                            x="22"
                            y={line.y - 4}
                            fill="var(--color-on-surface-variant)"
                            fontSize="8"
                            opacity="0.4"
                            fontWeight="bold"
                          >
                            {formatCurrency(line.val)}
                          </text>
                        </g>
                      ))}
                      
                      {/* Area under curve */}
                      {areaPath && (
                        <path d={areaPath} fill="url(#netWorthGrad)" />
                      )}
                      
                      {/* Line */}
                      {linePath && (
                        <path
                          d={linePath}
                          fill="none"
                          stroke="var(--color-secondary)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ filter: "drop-shadow(0 0 4px var(--color-secondary-glow))" }}
                        />
                      )}
                      
                      {/* Points */}
                      {chartPoints.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={hoveredPoint?.date.getTime() === p.date.getTime() ? 5.5 : 2.5}
                          fill="var(--color-secondary)"
                          stroke="var(--color-surface)"
                          strokeWidth={hoveredPoint?.date.getTime() === p.date.getTime() ? 1.5 : 0.5}
                          className="transition-all duration-150 cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(p)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}
                    </svg>
                    
                    {/* Hover Tooltip */}
                    {hoveredPoint && (
                      <div 
                        className="absolute bg-slate-900 border border-outline-variant/65 rounded-xl px-2.5 py-1.5 text-xs text-on-surface shadow-xl pointer-events-none z-10"
                        style={{ 
                          left: `${(hoveredPoint.x / 500) * 100}%`, 
                          top: `${(hoveredPoint.y / 180) * 100 - 32}%`, 
                          transform: 'translate(-50%, -50%)' 
                        }}
                      >
                        <p className="text-[8px] uppercase tracking-wider text-on-surface-variant/70 font-bold">{hoveredPoint.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                        <p className="text-xs font-black text-primary">{formatCurrency(hoveredPoint.balance)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Category Budgets Tracker */}
                <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-primary">Category Budgets</h2>
                    <p className="text-xs text-on-surface-variant font-medium">Configure and track category-specific monthly spending limits</p>
                  </div>
                  
                  <div className="space-y-4">
                    {categories.filter(c => c.type === 'expense').length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-outline p-6 text-center bg-surface-container-low/40">
                        <span className="material-symbols-outlined mb-2 text-3xl text-on-surface-variant/30">category</span>
                        <p className="font-bold text-on-surface text-xs">No expense categories</p>
                        <p className="mt-1 text-[10px] text-on-surface-variant">Create expense categories to track budgets.</p>
                      </div>
                    ) : (
                      categories.filter(c => c.type === 'expense').map((cat) => {
                        const spent = monthlyCategorySpent[String(cat.id)] || monthlyCategorySpent[cat.name] || 0;
                        const limit = cat.budget_limit || 0;
                        const progress = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
                        const isOver = limit > 0 && spent > limit;
                        
                        return (
                          <div key={cat.id} className="rounded-2xl bg-surface-container-low/30 p-4 border border-outline-variant/20 hover:border-outline-variant/55 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-highest text-lg">
                                  {cat.emoji}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-primary">{cat.name}</p>
                                  <p className="text-[10px] text-on-surface-variant font-medium">
                                    Spent this month: <span className="font-bold text-on-surface">{formatCurrency(spent)}</span>
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                {editingCategoryId === cat.id ? (
                                  <div className="flex items-center gap-1 justify-end">
                                    <span className="text-xs font-bold text-on-surface-variant">{currencySymbol}</span>
                                    <input
                                      type="number"
                                      step="1"
                                      min="0"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={() => handleSaveCategoryBudget(cat.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveCategoryBudget(cat.id);
                                        if (e.key === 'Escape') setEditingCategoryId(null);
                                      }}
                                      autoFocus
                                      className="w-16 bg-surface-container-high border border-secondary rounded px-1.5 py-0.5 text-xs text-primary font-bold focus:outline-none focus:ring-1 focus:ring-secondary/40"
                                    />
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingCategoryId(cat.id);
                                      setEditValue(limit > 0 ? String(limit) : '');
                                    }}
                                    className="text-xs font-bold text-on-surface hover:text-secondary flex items-center gap-1 ml-auto group transition-all"
                                    title="Edit Category Budget"
                                  >
                                    <span className="text-[10px] text-on-surface-variant/70 font-medium mr-0.5">Limit:</span>
                                    <span className="text-primary font-black underline decoration-dotted decoration-secondary underline-offset-2">
                                      {limit > 0 ? formatCurrency(limit) : 'Set Limit'}
                                    </span>
                                    <span className="material-symbols-outlined text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                                  </button>
                                )}
                                
                                {limit > 0 && isOver && (
                                  <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider block mt-0.5 animate-pulse">
                                    Over Budget!
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {limit > 0 && (
                              <div className="mt-3">
                                <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isOver 
                                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                                        : 'bg-secondary'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-on-surface-variant/60 mt-1">
                                  <span>{progress}% of limit</span>
                                  <span>Remaining: {formatCurrency(Math.max(0, limit - spent))}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 3. Interactive Expenses Distribution */}
                <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-primary">Interactive Expenses Distribution</h2>
                    <p className="text-xs text-on-surface-variant font-medium">Hover over bars to inspect detailed spending totals</p>
                  </div>

                  {stats.expensesByCategory.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline p-8 text-center bg-surface-container-low/40">
                      <span className="material-symbols-outlined mb-2 text-4xl text-on-surface-variant/30">bar_chart</span>
                      <p className="font-bold text-on-surface text-sm">No expense history</p>
                      <p className="mt-1 text-xs text-on-surface-variant font-medium">Log expenses to populate analytics visualization.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* SVG Bar Chart */}
                      <div className="relative h-64 w-full bg-slate-950/15 rounded-2xl p-4 border border-outline-variant/30 flex flex-col justify-end">
                        <svg className="w-full h-48" viewBox="0 0 400 200" preserveAspectRatio="none">
                          {(() => {
                            const data = stats.expensesByCategory.slice(0, 5);
                            const maxAmount = Math.max(...data.map(d => d.amount), 1);
                            const barWidth = 50;
                            const gap = 20;
                            const totalWidth = data.length * barWidth + (data.length - 1) * gap;
                            const startX = (400 - totalWidth) / 2;

                            return data.map((d, index) => {
                              const barHeight = (d.amount / maxAmount) * 150;
                              const x = startX + index * (barWidth + gap);
                              const y = 170 - barHeight;

                              return (
                                <g 
                                  key={index}
                                  onMouseEnter={() => setHoveredBar(index)}
                                  onMouseLeave={() => setHoveredBar(null)}
                                  className="cursor-pointer"
                                >
                                  {/* Glow Filter */}
                                  <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    rx={8}
                                    fill="var(--color-secondary)"
                                    opacity={hoveredBar === index ? 0.35 : 0.1}
                                    className="transition-all duration-300"
                                  />
                                  {/* Solid Bar */}
                                  <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    rx={8}
                                    fill="var(--color-secondary)"
                                    opacity={hoveredBar === index ? 1 : 0.85}
                                    className="transition-all duration-300"
                                  />
                                  {/* Value Label inside chart when hovered */}
                                  {hoveredBar === index && (
                                    <text
                                      x={x + barWidth / 2}
                                      y={y - 10}
                                      textAnchor="middle"
                                      fill="var(--color-on-surface)"
                                      fontSize="10"
                                      fontWeight="bold"
                                    >
                                      {formatCurrency(d.amount)}
                                    </text>
                                  )}
                                </g>
                              );
                            });
                          })()}
                        </svg>
                        
                        {/* Bar Labels (Emojis) */}
                        <div className="flex justify-center gap-[20px] mt-2">
                          {stats.expensesByCategory.slice(0, 5).map((d, index) => (
                            <div key={index} className="w-[50px] text-center flex flex-col items-center">
                              <span className="text-lg">{d.emoji}</span>
                              <span className="text-[9px] text-on-surface-variant truncate w-full font-bold uppercase mt-0.5">{d.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Breakdown List */}
                      <div className="space-y-2.5">
                        {stats.expensesByCategory.map((cat, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl bg-surface-container-low p-3.5 border border-outline-variant/20">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{cat.emoji}</span>
                              <span className="text-xs font-bold text-primary">{cat.name}</span>
                            </div>
                            <span className="text-xs font-black text-rose-500">{formatCurrency(cat.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: Savings goal Circular Progress Gauge & Info */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm text-center flex flex-col items-center">
              <h3 className="text-lg font-black text-primary self-start">Savings Gauge</h3>
              <p className="text-xs text-on-surface-variant self-start mt-0.5">Budget goal coverage overview</p>

              {/* Circular Gauge */}
              <div className="relative my-8 flex items-center justify-center">
                <svg className="h-44 w-44 transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    stroke="var(--color-surface-container-highest)"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    stroke="var(--color-secondary)"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 76}
                    strokeDashoffset={2 * Math.PI * 76 * (1 - money.savingsProgress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                    style={{ filter: "drop-shadow(0 0 6px var(--color-secondary-glow))" }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-primary">{money.savingsProgress}%</span>
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mt-1">Saved</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 border-t border-outline-variant/30 pt-4 text-xs font-bold text-on-surface-variant">
                <div className="text-left border-r border-outline-variant/30 pr-2">
                  <p className="text-[10px] uppercase opacity-75 font-semibold">Total Planned</p>
                  <p className="text-sm font-black text-primary mt-1">{formatCurrency(money.plannedSpend)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase opacity-75 font-semibold">Total Saved</p>
                  <p className="text-sm font-black text-emerald-500 mt-1">{formatCurrency(money.savedForGoals)}</p>
                </div>
              </div>
            </div>

            {/* Budgets Tracker Widget */}
            <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="text-left">
                  <h3 className="text-lg font-black text-primary">Budgets & Limits</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Live spending thresholds tracking</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(true)}
                  className="p-2 rounded-xl border border-outline-variant hover:bg-surface-container transition-colors flex items-center justify-center text-on-surface-variant hover:text-primary"
                  title="Configure budget limits"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                </button>
              </div>

              <div className="space-y-4 text-left">
                {/* Daily Budget */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant/80 mb-1.5">
                    <span className="flex items-center gap-1">
                      Daily Limit
                      {budgetLimits.daily > 0 && budgetSpending.daily > budgetLimits.daily && (
                        <span className="text-rose-500 text-[10px] font-black uppercase flex items-center gap-0.5 animate-pulse">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          Over
                        </span>
                      )}
                    </span>
                    <span>
                      {formatCurrency(budgetSpending.daily)} / {budgetLimits.daily > 0 ? formatCurrency(budgetLimits.daily) : 'Not set'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetLimits.daily > 0 && budgetSpending.daily > budgetLimits.daily 
                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                          : 'bg-secondary'
                      }`}
                      style={{ 
                        width: `${budgetLimits.daily > 0 ? Math.min(100, (budgetSpending.daily / budgetLimits.daily) * 100) : 0}%` 
                      }} 
                    />
                  </div>
                </div>

                {/* Weekly Budget */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant/80 mb-1.5">
                    <span className="flex items-center gap-1">
                      Weekly Limit
                      {budgetLimits.weekly > 0 && budgetSpending.weekly > budgetLimits.weekly && (
                        <span className="text-rose-500 text-[10px] font-black uppercase flex items-center gap-0.5 animate-pulse">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          Over
                        </span>
                      )}
                    </span>
                    <span>
                      {formatCurrency(budgetSpending.weekly)} / {budgetLimits.weekly > 0 ? formatCurrency(budgetLimits.weekly) : 'Not set'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetLimits.weekly > 0 && budgetSpending.weekly > budgetLimits.weekly 
                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                          : 'bg-secondary'
                      }`}
                      style={{ 
                        width: `${budgetLimits.weekly > 0 ? Math.min(100, (budgetSpending.weekly / budgetLimits.weekly) * 100) : 0}%` 
                      }} 
                    />
                  </div>
                </div>

                {/* Monthly Budget */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant/80 mb-1.5">
                    <span className="flex items-center gap-1">
                      Monthly Limit
                      {budgetLimits.monthly > 0 && budgetSpending.monthly > budgetLimits.monthly && (
                        <span className="text-rose-500 text-[10px] font-black uppercase flex items-center gap-0.5 animate-pulse">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          Over
                        </span>
                      )}
                    </span>
                    <span>
                      {formatCurrency(budgetSpending.monthly)} / {budgetLimits.monthly > 0 ? formatCurrency(budgetLimits.monthly) : 'Not set'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetLimits.monthly > 0 && budgetSpending.monthly > budgetLimits.monthly 
                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                          : 'bg-secondary'
                      }`}
                      style={{ 
                        width: `${budgetLimits.monthly > 0 ? Math.min(100, (budgetSpending.monthly / budgetLimits.monthly) * 100) : 0}%` 
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div className="rounded-3xl border border-outline-variant bg-gradient-to-br from-secondary/5 to-secondary/15 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-xl">tips_and_updates</span>
              </div>
              <h4 className="font-black text-primary text-sm">Need help budgeting?</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Moneyly synchronizes details directly to cookies and Supabase, maintaining full functionality even when offline. Track balances, update goals, and switch accents at any time.
              </p>
            </div>
          </div>
        </div>
      </section>
      {txModalOpen && profile?.id && (
        <QuickTransactionModal
          user_id={profile.id}
          isOpen={txModalOpen}
          onClose={() => setTxModalOpen(false)}
        />
      )}
      {budgetModalOpen && (
        <BudgetEditModal
          isOpen={budgetModalOpen}
          onClose={() => setBudgetModalOpen(false)}
        />
      )}
    </div>
  );
}
