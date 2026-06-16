'use client';

import Link from "next/link";
import { useMemo, useState, useEffect, useTransition } from "react";
import { UserProfile } from "@/lib/profile";
import { useFinanceStore, Transaction, SpendingPlan, Account } from "@/lib/financeStore";
import OnboardingModal from "./OnboardingModal";
import QuickTransactionModal from "./QuickTransactionModal";
import BudgetEditModal from "./BudgetEditModal";

interface Props {
  email: string;
  displayName: string;
  profile: UserProfile | null;
  initialSpendingPlans: SpendingPlan[];
  profileComplete: boolean;
}

export default function DashboardView({ email, displayName, profile, initialSpendingPlans }: Props) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'balance' | 'control' | 'analyze'>('expenses');
  const [isPendingTab, startTabTransition] = useTransition();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<'all' | 'expense' | 'income' | 'savings'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; balance: number; date: Date } | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxNote, setEditTxNote] = useState('');
  const [editTxCategoryId, setEditTxCategoryId] = useState<number | null>(null);
  const [editTxDate, setEditTxDate] = useState('');

  // Zustand Store Hooks
  const setTransactions = useFinanceStore(state => state.setTransactions);
  const setCategories = useFinanceStore(state => state.setCategories);
  const updateProfilePreferences = useFinanceStore(state => state.updateProfilePreferences);
  const transactions = useFinanceStore(state => state.transactions);
  const categories = useFinanceStore(state => state.categories);
  const accentColor = useFinanceStore(state => state.accentColor);
  const currencyCode = useFinanceStore(state => state.currency);
  const onboarded = useFinanceStore(state => state.onboarded);
  const startingBalance = useFinanceStore(state => state.startingBalance);
  const syncOfflineData = useFinanceStore(state => state.syncOfflineData);
  const addNotification = useFinanceStore(state => state.addNotification);
  const updateCategoryLocal = useFinanceStore(state => state.updateCategoryLocal);
  const setSpendingPlans = useFinanceStore(state => state.setSpendingPlans);
  const spendingPlans = useFinanceStore(state => state.spendingPlans);
  const deleteSpendingPlanLocal = useFinanceStore(state => state.deleteSpendingPlanLocal);
  const updateSpendingPlanLocal = useFinanceStore(state => state.updateSpendingPlanLocal);
  const setStartingBalance = useFinanceStore(state => state.setStartingBalance);
  const setCurrency = useFinanceStore(state => state.setCurrency);
  const setAccentColor = useFinanceStore(state => state.setAccentColor);
  const setOnboarded = useFinanceStore(state => state.setOnboarded);
  const setDailyBudget = useFinanceStore(state => state.setDailyBudget);
  const setWeeklyBudget = useFinanceStore(state => state.setWeeklyBudget);
  const setMonthlyBudget = useFinanceStore(state => state.setMonthlyBudget);
  const accounts = useFinanceStore(state => state.accounts);
  const setAccounts = useFinanceStore(state => state.setAccounts);
  const addAccountLocal = useFinanceStore(state => state.addAccountLocal);
  const updateAccountLocal = useFinanceStore(state => state.updateAccountLocal);
  const deleteAccountLocal = useFinanceStore(state => state.deleteAccountLocal);

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings' | 'credit' | 'cash'>('checking');
  const [accountBalance, setAccountBalance] = useState('');
  const [accountColor, setAccountColor] = useState('blue');

  const handleOpenAccountModal = (acc: Account | null = null) => {
    if (acc) {
      setEditingAccount(acc);
      setAccountName(acc.name);
      setAccountType(acc.type);
      setAccountBalance(acc.balance.toString());
      setAccountColor(acc.color);
    } else {
      setEditingAccount(null);
      setAccountName('');
      setAccountType('checking');
      setAccountBalance('');
      setAccountColor('blue');
    }
    setAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;
    const balanceNum = parseFloat(accountBalance) || 0;

    if (editingAccount) {
      await updateAccountLocal(editingAccount.id, {
        name: accountName.trim(),
        type: accountType,
        balance: balanceNum,
        color: accountColor,
      });
    } else {
      await addAccountLocal({
        user_id: profile?.id || '',
        name: accountName.trim(),
        type: accountType,
        balance: balanceNum,
        color: accountColor,
      });
    }
    setAccountModalOpen(false);
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm('Are you sure you want to delete this account? Any transactions linked to it will be disassociated.')) {
      await deleteAccountLocal(id);
      setAccountModalOpen(false);
    }
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const displayedTransactions = useMemo(() => {
    let list = sortedTransactions;
    if (quickFilter !== 'all') {
      list = list.filter(t => t.type === quickFilter);
    }
    return list;
  }, [sortedTransactions, quickFilter]);

  const updateTransactionLocal = useFinanceStore(state => state.updateTransactionLocal);
  const deleteTransactionLocal = useFinanceStore(state => state.deleteTransactionLocal);

  // Sync Supabase categories and transactions on mount
  useEffect(() => {
    if (profile) {
      setStartingBalance(parseFloat((profile as any).starting_balance) || 0);
      setCurrency((profile as any).currency || 'USD');
      setAccentColor(((profile as any).accent_color || 'green') as any);
      setOnboarded(!!(profile as any).onboarded);
      setDailyBudget(parseFloat((profile as any).daily_budget) || 0);
      setWeeklyBudget(parseFloat((profile as any).weekly_budget) || 0);
      setMonthlyBudget(parseFloat((profile as any).monthly_budget) || 0);
    }

    // Seeding store's spendingPlans from props if empty
    if (spendingPlans.length === 0 && initialSpendingPlans.length > 0) {
      setSpendingPlans(initialSpendingPlans);
    }

    const loadData = async () => {
      if (typeof window !== "undefined" && navigator.onLine) {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        if (!supabase) return;
        
        const { data: cats } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
        if (cats) setCategories(cats);

        const { data: txs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        if (txs) setTransactions(txs);

        const { data: plans } = await supabase.from('spending_plans').select('*').order('created_at', { ascending: false });
        if (plans) setSpendingPlans(plans);

        const { data: accs } = await supabase.from('accounts').select('*').order('created_at', { ascending: true });
        if (accs) setAccounts(accs);

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
  }, [profile, initialSpendingPlans, spendingPlans, setSpendingPlans, setAccounts, setCategories, setTransactions]);

  const currencySymbol = useMemo(() => {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$', CAD: 'C$' };
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

    let currentBalance = startingBalance + totalIncome - totalExpenses;
    if (accounts.length > 0) {
      currentBalance = accounts.reduce((sum, acc) => {
        const bal = parseFloat(acc.balance as any) || 0;
        return sum + (acc.type === 'credit' ? -bal : bal);
      }, 0);
    }

    return {
      totalExpenses,
      totalIncome,
      totalIndependentSavings,
      currentBalance,
      expensesByCategory
    };
  }, [transactions, startingBalance, accounts]);

  // Compute spending plans metrics
  const money = useMemo(() => {
    const activePlans = spendingPlans.filter((plan) => plan.status !== 'paused');
    const completedPlans = spendingPlans.filter((plan) => plan.status === 'completed');
    
    const plannedSpend = activePlans.reduce((sum, plan) => {
      const val = typeof plan.planned_cost === 'number' ? plan.planned_cost : parseFloat(plan.planned_cost || '0');
      return sum + (val || 0);
    }, 0);

    const savedForGoals = activePlans.reduce((sum, plan) => {
      const val = typeof plan.saved_amount === 'number' ? plan.saved_amount : parseFloat(plan.saved_amount || '0');
      return sum + (val || 0);
    }, 0);

    const totalSavingsVal = savedForGoals + stats.totalIndependentSavings;
    const remainingToFund = Math.max(0, plannedSpend - totalSavingsVal);
    const savingsProgress = plannedSpend > 0 ? Math.min(100, Math.round((totalSavingsVal / plannedSpend) * 100)) : 0;

    return {
      activePlans,
      completedPlans,
      plannedSpend,
      savedForGoals,
      remainingToFund,
      savingsProgress,
    };
  }, [spendingPlans, stats.totalIndependentSavings]);

  const totalIndependentSavings = stats.totalIndependentSavings;
  const totalSavings = accounts.length > 0
    ? accounts.filter(acc => acc.type === 'savings').reduce((sum, acc) => sum + (parseFloat(acc.balance as any) || 0), 0)
    : money.savedForGoals + totalIndependentSavings;

  // Compute budgets and current spending
  const dailyBudget = useFinanceStore(state => state.dailyBudget);
  const weeklyBudget = useFinanceStore(state => state.weeklyBudget);
  const monthlyBudget = useFinanceStore(state => state.monthlyBudget);
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

    let balance = baseline;
    let txIndex = 0;
    const trendData = days.map(day => {
      while (txIndex < windowTx.length) {
        const t = windowTx[txIndex];
        const tDate = new Date(t.date);
        if (tDate <= day) {
          if (t.type === 'income') {
            balance += t.amount;
          } else if (t.type === 'expense') {
            balance -= t.amount;
          }
          txIndex++;
        } else {
          break;
        }
      }
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

  const [editTxSpendingPlanId, setEditTxSpendingPlanId] = useState<string | null>(null);

  // Spending Plan editing state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanCost, setEditPlanCost] = useState('');
  const [editPlanSaved, setEditPlanSaved] = useState('');
  const [editPlanTenure, setEditPlanTenure] = useState('');
  const [editPlanStatus, setEditPlanStatus] = useState('active');

  const handleStartEditPlan = (plan: SpendingPlan) => {
    setEditingPlanId(plan.id);
    setEditPlanName(plan.product_name);
    setEditPlanCost(plan.planned_cost.toString());
    setEditPlanSaved(plan.saved_amount.toString());
    setEditPlanTenure(plan.tenure_months.toString());
    setEditPlanStatus(plan.status);
  };

  const handleSaveEditPlan = async (id: string) => {
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
    addNotification("Goal updated!", "success");
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      await deleteSpendingPlanLocal(id);
      addNotification("Goal deleted!", "success");
    }
  };

  const handleStartEditTx = (t: Transaction) => {
    setEditingTxId(t.id);
    setEditTxAmount(t.amount.toString());
    setEditTxNote(t.note || '');
    setEditTxCategoryId(t.category_id || null);
    setEditTxDate(new Date(t.date).toISOString().substring(0, 10));
    setEditTxSpendingPlanId(t.spending_plan_id || null);
  };

  const handleSaveEditTx = async (id: string) => {
    const amountNum = parseFloat(editTxAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const selectedCategory = categories.find(c => c.id === editTxCategoryId);

    await updateTransactionLocal(id, {
      amount: amountNum,
      note: editTxNote.trim() || null,
      category_id: editTxCategoryId,
      category_name: selectedCategory?.name || null,
      category_emoji: selectedCategory?.emoji || null,
      date: new Date(editTxDate).toISOString(),
      spending_plan_id: editTxSpendingPlanId || null,
    });

    setEditingTxId(null);
    addNotification("Transaction updated!", "success");
  };

  const handleDeleteTx = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransactionLocal(id);
      addNotification("Transaction deleted!", "success");
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
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Moneyly Money Manager</p>
          <h1 className="text-3xl font-black text-primary sm:text-4xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">
            Track your net worth, transaction history, categories, accents, and offline syncing.
          </p>
        </div>

        {/* Horizontal Cards & Accounts Carousel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-primary">My Cards & Accounts</h2>
              <p className="text-xs text-on-surface-variant font-medium">Swipe horizontally to manage your cash nodes</p>
            </div>
            <button
              onClick={() => handleOpenAccountModal()}
              className="rounded-xl border border-outline-variant px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5"
              title="Add new account or card"
            >
              <span className="material-symbols-outlined text-sm font-black">add</span>
              Add Card
            </button>
          </div>

          {accounts.length === 0 ? (
            <div 
              onClick={() => handleOpenAccountModal()}
              className="rounded-2xl border border-dashed border-outline-variant/60 bg-surface/30 hover:bg-surface/50 p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[120px]"
            >
              <span className="material-symbols-outlined mb-2 text-3xl text-on-surface-variant/45">credit_card</span>
              <p className="font-bold text-on-surface text-sm">No accounts or cards configured</p>
              <p className="mt-1 text-xs text-on-surface-variant">Click here to add your first checking, savings, or credit card.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x -mx-6 px-6 lg:mx-0 lg:px-0">
              {accounts.map((acc) => {
                const cardThemeMap: Record<string, { bg: string, text: string, shadow: string, border: string }> = {
                  blue: { 
                    bg: 'bg-gradient-to-br from-blue-600/90 to-cyan-500/90', 
                    text: 'text-white', 
                    shadow: 'shadow-blue-500/10',
                    border: 'border-blue-400/30'
                  },
                  green: { 
                    bg: 'bg-gradient-to-br from-emerald-600/90 to-teal-500/90', 
                    text: 'text-white', 
                    shadow: 'shadow-emerald-500/10',
                    border: 'border-emerald-400/30'
                  },
                  purple: { 
                    bg: 'bg-gradient-to-br from-purple-600/90 to-pink-500/90', 
                    text: 'text-white', 
                    shadow: 'shadow-purple-500/10',
                    border: 'border-purple-400/30'
                  },
                  orange: { 
                    bg: 'bg-gradient-to-br from-amber-600/90 to-orange-500/90', 
                    text: 'text-white', 
                    shadow: 'shadow-orange-500/10',
                    border: 'border-orange-400/30'
                  },
                  red: { 
                    bg: 'bg-gradient-to-br from-rose-600/90 to-red-500/90', 
                    text: 'text-white', 
                    shadow: 'shadow-rose-500/10',
                    border: 'border-rose-400/30'
                  }
                };

                const theme = cardThemeMap[acc.color] || cardThemeMap.blue;
                const typeIconMap: Record<string, string> = {
                  checking: 'payments',
                  savings: 'savings',
                  credit: 'credit_card',
                  cash: 'account_balance_wallet'
                };

                return (
                  <div 
                    key={acc.id}
                    onClick={() => handleOpenAccountModal(acc)}
                    className={`relative w-72 sm:w-80 shrink-0 rounded-2xl p-5 border ${theme.border} ${theme.bg} ${theme.text} shadow-lg ${theme.shadow} transition-all duration-300 hover:scale-[1.02] cursor-pointer group overflow-hidden snap-start`}
                  >
                    <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 h-24 w-24 rounded-full bg-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 h-16 w-16 rounded-full bg-white/5 pointer-events-none" />

                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest opacity-75 font-black">{acc.type}</p>
                        <h4 className="font-extrabold text-sm tracking-tight mt-0.5 truncate max-w-[180px]">{acc.name}</h4>
                      </div>
                      <span className="material-symbols-outlined text-lg opacity-85">
                        {typeIconMap[acc.type] || 'credit_card'}
                      </span>
                    </div>

                    <div className="mt-5 flex justify-between items-end">
                      <div>
                        <p className="text-[8px] opacity-75 uppercase font-bold tracking-wider">Current Balance</p>
                        <p className="text-lg font-black tracking-tight mt-0.5">{formatCurrency(acc.balance)}</p>
                      </div>
                      <div className="flex h-5 w-7 items-center justify-center rounded bg-amber-400/25 border border-amber-300/30">
                        <span className="material-symbols-outlined text-xs text-amber-200 opacity-60">grid_3x3</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Card horizontal card placeholder */}
              <div 
                onClick={() => handleOpenAccountModal()}
                className="relative w-72 sm:w-80 shrink-0 rounded-2xl p-5 border-2 border-dashed border-outline-variant/60 bg-surface/30 hover:bg-surface/50 hover:border-secondary/50 text-on-surface-variant hover:text-primary transition-all duration-300 flex flex-col items-center justify-center cursor-pointer snap-start min-h-[140px] group"
              >
                <span className="material-symbols-outlined text-3xl mb-1 text-on-surface-variant/45 group-hover:scale-110 transition-transform">add_circle</span>
                <span className="text-xs font-bold">Link New Card</span>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Stat Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Net Worth */}
          <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm" title="Your starting balance + total income - total expenses. Represents total net cash.">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Net Worth Balance</p>
                <h3 className="mt-3 text-2xl font-black text-primary">{formatCurrency(stats.currentBalance)}</h3>
                <p className="mt-1 text-[10px] text-on-surface-variant" title="Your starting balance + total income - total expenses - total savings vault. Represents your liquid cash available for daily spending.">
                  Everyday Cash: <span className="font-bold text-on-surface">{formatCurrency(stats.currentBalance - totalSavings)}</span>
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
          <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm" title="The sum of all savings allocated to goals plus any general/independent savings not linked to specific goals.">
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
              onClick={() => {
                startTabTransition(() => {
                  setActiveTab(tab);
                });
              }}
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

                {/* Quick Filter Toggle */}
                {sortedTransactions.length > 0 && (
                  <div className="mb-4 flex gap-1 rounded-xl bg-surface-container-low p-0.5 border border-outline-variant/30 w-fit">
                    {(['all', 'expense', 'income', 'savings'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setQuickFilter(filter)}
                        className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                          quickFilter === filter
                            ? 'bg-secondary text-on-secondary shadow-sm'
                            : 'text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        {filter === 'expense' ? 'Expenses' : filter === 'income' ? 'Income' : filter === 'savings' ? 'Savings' : 'All'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {displayedTransactions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline p-8 text-center bg-surface-container-low/40">
                      <span className="material-symbols-outlined mb-2 text-4xl text-on-surface-variant/30">receipt_long</span>
                      <p className="font-bold text-on-surface text-sm">No transactions logged</p>
                      <p className="mt-1 text-xs text-on-surface-variant">No transactions found matching this quick filter.</p>
                    </div>
                  ) : (
                    displayedTransactions.slice(0, 10).map((t) => {
                      const isEditing = editingTxId === t.id;

                      if (isEditing) {
                        return (
                          <div key={t.id} className="rounded-2xl bg-surface-container-low p-4 border border-secondary/40 space-y-4 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {/* Amount */}
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Amount</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editTxAmount}
                                  onChange={(e) => setEditTxAmount(e.target.value)}
                                  className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-primary font-bold focus:outline-none"
                                />
                              </div>
                              {/* Date */}
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Date</label>
                                <input
                                  type="date"
                                  value={editTxDate}
                                  onChange={(e) => setEditTxDate(e.target.value)}
                                  className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-primary focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {/* Memo */}
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Note / Memo</label>
                                <input
                                  type="text"
                                  value={editTxNote}
                                  onChange={(e) => setEditTxNote(e.target.value)}
                                  className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-primary focus:outline-none"
                                />
                              </div>
                              {/* Category */}
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Category</label>
                                <select
                                  value={editTxCategoryId || ''}
                                  onChange={(e) => setEditTxCategoryId(parseInt(e.target.value) || null)}
                                  className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm text-primary font-bold focus:outline-none"
                                >
                                  <option value="">Select Category</option>
                                  {categories.filter(c => c.type === t.type).map((c) => (
                                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {spendingPlans.length > 0 && (
                              <div className="grid grid-cols-1 mt-1">
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Linked Goal / Milestone (Optional)</label>
                                  <select
                                    value={editTxSpendingPlanId || ''}
                                    onChange={(e) => setEditTxSpendingPlanId(e.target.value || null)}
                                    className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm text-primary font-bold focus:outline-none"
                                  >
                                    <option value="">Do Not Link</option>
                                    {spendingPlans.map((plan) => (
                                      <option key={plan.id} value={plan.id}>{plan.product_name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
                              <button
                                type="button"
                                onClick={() => setEditingTxId(null)}
                                className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditTx(t.id)}
                                className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-on-secondary shadow-md"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={t.id} className="flex items-center justify-between rounded-2xl bg-surface-container-low/45 p-4 border border-outline-variant/20 hover:border-outline-variant/60 transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-highest text-xl">
                              {t.category_emoji || '🛒'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-primary">{t.note || t.category_name || 'Uncategorized'}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
                                <span>{t.category_name || t.type}</span>
                                <span className="opacity-40">•</span>
                                <span>{new Date(t.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                                {t.spending_plan_id && (() => {
                                  const plan = spendingPlans.find(p => p.id === t.spending_plan_id);
                                  return plan ? (
                                    <>
                                      <span className="opacity-40">•</span>
                                      <span className="text-secondary font-bold flex items-center gap-0.5 normal-case">
                                        <span className="material-symbols-outlined text-[12px] font-black">track_changes</span>
                                        {plan.product_name}
                                      </span>
                                    </>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-500' : t.type === 'savings' ? 'text-blue-500' : 'text-rose-500'}`}>
                                {t.type === 'income' ? '+' : t.type === 'savings' ? '' : '-'}{formatCurrency(t.amount)}
                              </p>
                            </div>
                            
                            {/* Inline Actions (edit/delete) */}
                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleStartEditTx(t)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                                title="Edit transaction"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTx(t.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition-colors"
                                title="Delete transaction"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
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

                {/* Account Details & Management Table */}
                <div className="space-y-4 pt-4 border-t border-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-primary">Itemized Accounts Summary</h3>
                      <p className="text-[10px] text-on-surface-variant">Linked transaction metrics per card</p>
                    </div>
                  </div>

                  {accounts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline p-6 text-center bg-surface-container-low/20">
                      <p className="text-xs text-on-surface-variant font-bold">No accounts configured yet.</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Use the "+ Add" button in the sidebar to create your first card.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant/40 text-on-surface-variant/70">
                            <th className="py-2.5 font-bold uppercase tracking-wider">Account Name</th>
                            <th className="py-2.5 font-bold uppercase tracking-wider">Type</th>
                            <th className="py-2.5 font-bold uppercase tracking-wider text-right">Balance</th>
                            <th className="py-2.5 font-bold uppercase tracking-wider text-right">Ledger Entries</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {accounts.map((acc) => (
                            <tr key={acc.id} className="text-primary hover:bg-surface-container-low/30 transition-colors cursor-pointer" onClick={() => handleOpenAccountModal(acc)}>
                              <td className="py-3 flex items-center gap-2 font-bold">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: acc.color === 'blue' ? '#2563eb' : acc.color === 'green' ? '#10b981' : acc.color === 'purple' ? '#9333ea' : acc.color === 'orange' ? '#d97706' : '#e11d48' }} />
                                {acc.name}
                              </td>
                              <td className="py-3 font-semibold uppercase tracking-wider text-[10px] text-on-surface-variant">{acc.type}</td>
                              <td className="py-3 font-black text-right">{formatCurrency(acc.balance)}</td>
                              <td className="py-3 font-bold text-right text-on-surface-variant/80">
                                {transactions.filter(t => t.account_id === acc.id).length} items
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-surface-container-low p-5 border border-outline-variant/35 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-primary text-sm">Offline Synchronization log</h4>
                    <p className="text-xs text-on-surface-variant mt-1">Pending mutations queued: {useFinanceStore.getState().pendingMutations.length}</p>
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
                    <h2 className="text-xl font-black text-primary">Goals & Milestones</h2>
                    <p className="text-xs text-on-surface-variant font-medium">Control goals, commitments and milestones</p>
                  </div>
                  <Link 
                    href="/plan/details"
                    className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-on-secondary shadow-md"
                  >
                    Add Goal
                  </Link>
                </div>

                <div className="space-y-3">
                  {spendingPlans.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline p-8 text-center bg-surface-container-low/40">
                      <span className="material-symbols-outlined mb-2 text-4xl text-on-surface-variant/30">playlist_add</span>
                      <p className="font-bold text-on-surface text-sm">No goals or milestones yet</p>
                      <p className="mt-1 text-xs text-on-surface-variant">Create goals to forecast budgets and milestones.</p>
                    </div>
                  ) : (
                    spendingPlans.map((plan) => {
                      const cost = typeof plan.planned_cost === 'number' ? plan.planned_cost : parseFloat(plan.planned_cost || '0') || 0;
                      const saved = typeof plan.saved_amount === 'number' ? plan.saved_amount : parseFloat(plan.saved_amount || '0') || 0;
                      const progress = cost > 0 ? Math.min(100, Math.round((saved / cost) * 100)) : 0;
                      const isExpanded = expandedPlan === plan.id;
                      const isEditing = editingPlanId === plan.id;

                      if (isEditing) {
                        return (
                          <div key={plan.id} className="p-4 bg-surface-container-low/60 border border-secondary/40 rounded-2xl space-y-3 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Goal/Item Name</label>
                                <input
                                  type="text"
                                  value={editPlanName}
                                  onChange={(e) => setEditPlanName(e.target.value)}
                                  className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-1.5 text-xs text-primary font-bold focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Status</label>
                                <select
                                  value={editPlanStatus}
                                  onChange={(e) => setEditPlanStatus(e.target.value)}
                                  className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-1.5 text-xs text-primary font-bold focus:outline-none"
                                >
                                  <option value="active">Active</option>
                                  <option value="paused">Paused</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Budget Cost</label>
                                <input
                                  type="number"
                                  value={editPlanCost}
                                  onChange={(e) => setEditPlanCost(e.target.value)}
                                  className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-1.5 text-xs text-primary font-bold focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Saved Amt</label>
                                <input
                                  type="number"
                                  value={editPlanSaved}
                                  onChange={(e) => setEditPlanSaved(e.target.value)}
                                  className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-1.5 text-xs text-primary font-bold focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Months</label>
                                <input
                                  type="number"
                                  value={editPlanTenure}
                                  onChange={(e) => setEditPlanTenure(e.target.value)}
                                  className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-1.5 text-xs text-primary font-bold focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
                              <button
                                type="button"
                                onClick={() => setEditingPlanId(null)}
                                className="rounded-xl border border-outline-variant px-3 py-1.5 text-[11px] font-bold text-on-surface hover:bg-surface-container transition-all"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditPlan(plan.id)}
                                className="rounded-xl bg-secondary px-3 py-1.5 text-[11px] font-bold text-on-secondary shadow-md"
                              >
                                Save Goal
                              </button>
                            </div>
                          </div>
                        );
                      }

                      const linkedTransactions = transactions.filter(t => t.spending_plan_id === plan.id);

                      return (
                        <div key={plan.id} className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low/30">
                          <div className="flex items-center justify-between p-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-primary text-sm">{plan.product_name || 'Goal / Milestone'}</p>
                                <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${
                                  plan.status === 'completed'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : plan.status === 'paused'
                                    ? 'bg-rose-500/10 text-rose-500'
                                    : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                  {plan.status}
                                </span>
                              </div>
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
                            <div className="border-t border-outline-variant/35 bg-surface-container-low/60 p-4 space-y-3.5 animate-in fade-in duration-200">
                              <div>
                                <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant/80 mb-1.5">
                                  <span>Goal Progress</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                                  <div className="h-full bg-secondary rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                              </div>

                              {/* Linked Transactions Section */}
                              <div className="border-t border-outline-variant/30 pt-3">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/75 mb-2 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs font-black">link</span>
                                  Linked Transactions History
                                </h4>
                                {linkedTransactions.length === 0 ? (
                                  <p className="text-[10px] text-on-surface-variant/60 italic pl-1">No transactions linked to this goal yet.</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {linkedTransactions.map(t => (
                                      <div key={t.id} className="flex justify-between items-center text-[11px] bg-slate-950/10 p-2 rounded-xl border border-outline-variant/20">
                                        <div className="flex flex-col">
                                          <span className="font-bold text-primary">{t.note || t.category_name || 'Uncategorized'}</span>
                                          <span className="text-[8px] text-on-surface-variant/65 uppercase tracking-wide mt-0.5">
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

                              <div className="flex justify-between items-center text-xs text-on-surface-variant border-t border-outline-variant/30 pt-3">
                                <div>Tenure: <strong className="text-primary">{plan.tenure_months ? `${plan.tenure_months} months` : 'N/A'}</strong></div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleStartEditPlan(plan)}
                                    className="rounded-lg hover:bg-surface-container px-2 py-1 text-[11px] font-bold text-secondary flex items-center gap-1 transition-all"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">edit</span>
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="rounded-lg hover:bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-500 flex items-center gap-1 transition-all"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                    Delete
                                  </button>
                                </div>
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
                <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6" title="Cumulative progression of starting balance plus all incomes minus all expenses over the last 30 days.">
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
                <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6" title="Set specific monthly spending caps for individual categories to manage targets dynamically.">
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
                <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-6" title="Breakdown of your total expenses grouped by category to visualize where your money goes.">
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
            <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm text-center flex flex-col items-center" title="Circular gauge showing your total savings progress against your total planned expenditure budgets.">
              <h3 className="text-lg font-black text-primary self-start">Savings Gauge</h3>
              <p className="text-xs text-on-surface-variant self-start mt-0.5">Budget goal coverage overview</p>

              {/* Circular Gauge */}
              <div className="relative my-8 flex items-center justify-center">
                <svg className="h-44 w-44 transform -rotate-90">
                  <defs>
                    <linearGradient id="savingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-secondary)" />
                      <stop offset="100%" stopColor="var(--color-secondary-container)" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="88"
                    cy="88"
                    r="74"
                    stroke="var(--color-surface-container-highest)"
                    strokeWidth="10"
                    fill="transparent"
                    className="opacity-75"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="74"
                    stroke="url(#savingsGrad)"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 74}
                    strokeDashoffset={2 * Math.PI * 74 * (1 - money.savingsProgress / 100)}
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
                  <p className="text-sm font-black text-emerald-500 mt-1">{formatCurrency(totalSavings)}</p>
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

              <div className="space-y-3.5 text-left">
                {/* Daily Budget */}
                {(() => {
                  const isOver = budgetLimits.daily > 0 && budgetSpending.daily > budgetLimits.daily;
                  const progress = budgetLimits.daily > 0 ? Math.min(100, (budgetSpending.daily / budgetLimits.daily) * 100) : 0;
                  return (
                    <div 
                      className={`rounded-2xl p-4 border transition-all duration-300 ${
                        isOver 
                          ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' 
                          : 'bg-surface-container-low/40 border-outline-variant/20 text-on-surface-variant'
                      }`}
                      title="Expenditures logged today against your configured daily limit."
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isOver ? 'text-rose-400' : 'text-on-surface-variant/70'}`}>Daily Limit</p>
                          <p className={`text-base font-black tracking-tight mt-1 ${isOver ? 'text-rose-400' : 'text-primary'}`}>
                            {formatCurrency(budgetSpending.daily)}
                            <span className={`text-[10px] font-medium ml-1 ${isOver ? 'text-rose-400/70' : 'text-on-surface-variant/60'}`}>
                              / {budgetLimits.daily > 0 ? formatCurrency(budgetLimits.daily) : 'N/A'}
                            </span>
                          </p>
                        </div>
                        {isOver ? (
                          <span className="material-symbols-outlined text-rose-500 text-lg animate-pulse">warning</span>
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">calendar_today</span>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-secondary'}`}
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                        {isOver && (
                          <p className="text-[9px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Over Limit!</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Weekly Budget */}
                {(() => {
                  const isOver = budgetLimits.weekly > 0 && budgetSpending.weekly > budgetLimits.weekly;
                  const progress = budgetLimits.weekly > 0 ? Math.min(100, (budgetSpending.weekly / budgetLimits.weekly) * 100) : 0;
                  return (
                    <div 
                      className={`rounded-2xl p-4 border transition-all duration-300 ${
                        isOver 
                          ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' 
                          : 'bg-surface-container-low/40 border-outline-variant/20 text-on-surface-variant'
                      }`}
                      title="Expenditures logged this week against your configured weekly limit."
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isOver ? 'text-rose-400' : 'text-on-surface-variant/70'}`}>Weekly Limit</p>
                          <p className={`text-base font-black tracking-tight mt-1 ${isOver ? 'text-rose-400' : 'text-primary'}`}>
                            {formatCurrency(budgetSpending.weekly)}
                            <span className={`text-[10px] font-medium ml-1 ${isOver ? 'text-rose-400/70' : 'text-on-surface-variant/60'}`}>
                              / {budgetLimits.weekly > 0 ? formatCurrency(budgetLimits.weekly) : 'N/A'}
                            </span>
                          </p>
                        </div>
                        {isOver ? (
                          <span className="material-symbols-outlined text-rose-500 text-lg animate-pulse">warning</span>
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">date_range</span>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-secondary'}`}
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                        {isOver && (
                          <p className="text-[9px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Over Limit!</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Monthly Budget */}
                {(() => {
                  const isOver = budgetLimits.monthly > 0 && budgetSpending.monthly > budgetLimits.monthly;
                  const progress = budgetLimits.monthly > 0 ? Math.min(100, (budgetSpending.monthly / budgetLimits.monthly) * 100) : 0;
                  return (
                    <div 
                      className={`rounded-2xl p-4 border transition-all duration-300 ${
                        isOver 
                          ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' 
                          : 'bg-surface-container-low/40 border-outline-variant/20 text-on-surface-variant'
                      }`}
                      title="Expenditures logged this month against your configured monthly limit."
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isOver ? 'text-rose-400' : 'text-on-surface-variant/70'}`}>Monthly Limit</p>
                          <p className={`text-base font-black tracking-tight mt-1 ${isOver ? 'text-rose-400' : 'text-primary'}`}>
                            {formatCurrency(budgetSpending.monthly)}
                            <span className={`text-[10px] font-medium ml-1 ${isOver ? 'text-rose-400/70' : 'text-on-surface-variant/60'}`}>
                              / {budgetLimits.monthly > 0 ? formatCurrency(budgetLimits.monthly) : 'N/A'}
                            </span>
                          </p>
                        </div>
                        {isOver ? (
                          <span className="material-symbols-outlined text-rose-500 text-lg animate-pulse">warning</span>
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">calendar_month</span>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-secondary'}`}
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                        {isOver && (
                          <p className="text-[9px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Over Limit!</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Cards & Accounts Sidebar Widget */}
            <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-lg font-black text-primary">Accounts & Cards</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Manage your active cash nodes</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAccountModal()}
                  className="p-2 rounded-xl border border-outline-variant hover:bg-surface-container transition-colors flex items-center justify-center text-on-surface-variant hover:text-primary"
                  title="Add new account or card"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>

              {accounts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline p-6 text-center bg-surface-container-low/40">
                  <span className="material-symbols-outlined mb-2 text-3xl text-on-surface-variant/30">credit_card</span>
                  <p className="font-bold text-on-surface text-xs">No active cards</p>
                  <p className="mt-1 text-[10px] text-on-surface-variant">Create checking, savings, credit, or cash nodes to link ledger entries.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto scrollbar-hide pr-0.5">
                  {accounts.map((acc) => {
                    const cardThemeMap: Record<string, { bg: string, text: string, shadow: string, border: string }> = {
                      blue: { 
                        bg: 'bg-gradient-to-br from-blue-600/90 to-cyan-500/90', 
                        text: 'text-white', 
                        shadow: 'shadow-blue-500/10',
                        border: 'border-blue-400/30'
                      },
                      green: { 
                        bg: 'bg-gradient-to-br from-emerald-600/90 to-teal-500/90', 
                        text: 'text-white', 
                        shadow: 'shadow-emerald-500/10',
                        border: 'border-emerald-400/30'
                      },
                      purple: { 
                        bg: 'bg-gradient-to-br from-purple-600/90 to-pink-500/90', 
                        text: 'text-white', 
                        shadow: 'shadow-purple-500/10',
                        border: 'border-purple-400/30'
                      },
                      orange: { 
                        bg: 'bg-gradient-to-br from-amber-600/90 to-orange-500/90', 
                        text: 'text-white', 
                        shadow: 'shadow-orange-500/10',
                        border: 'border-orange-400/30'
                      },
                      red: { 
                        bg: 'bg-gradient-to-br from-rose-600/90 to-red-500/90', 
                        text: 'text-white', 
                        shadow: 'shadow-rose-500/10',
                        border: 'border-rose-400/30'
                      }
                    };

                    const theme = cardThemeMap[acc.color] || cardThemeMap.blue;
                    const typeIconMap: Record<string, string> = {
                      checking: 'payments',
                      savings: 'savings',
                      credit: 'credit_card',
                      cash: 'account_balance_wallet'
                    };

                    return (
                      <div 
                        key={acc.id}
                        onClick={() => handleOpenAccountModal(acc)}
                        className={`relative w-full rounded-2xl p-4 border ${theme.border} ${theme.bg} ${theme.text} shadow-lg ${theme.shadow} transition-all duration-300 hover:scale-[1.02] cursor-pointer group overflow-hidden`}
                      >
                        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 h-24 w-24 rounded-full bg-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 h-16 w-16 rounded-full bg-white/5 pointer-events-none" />

                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest opacity-75 font-black">{acc.type}</p>
                            <h4 className="font-extrabold text-sm tracking-tight mt-0.5 truncate max-w-[150px]">{acc.name}</h4>
                          </div>
                          <span className="material-symbols-outlined text-lg opacity-85">
                            {typeIconMap[acc.type] || 'credit_card'}
                          </span>
                        </div>

                        <div className="mt-5 flex justify-between items-end">
                          <div>
                            <p className="text-[8px] opacity-75 uppercase font-bold tracking-wider">Current Balance</p>
                            <p className="text-lg font-black tracking-tight mt-0.5">{formatCurrency(acc.balance)}</p>
                          </div>
                          <div className="flex h-5 w-7 items-center justify-center rounded bg-amber-400/25 border border-amber-300/30">
                            <span className="material-symbols-outlined text-xs text-amber-200 opacity-60">grid_3x3</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
      {accountModalOpen && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setAccountModalOpen(false); }}
        >
          <div 
            className="w-full rounded-t-3xl border border-outline-variant bg-surface p-6 shadow-2xl transition-all duration-300 sm:max-w-md sm:rounded-3xl flex flex-col max-h-[90vh]"
            data-accent={accentColor}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <h2 className="text-xl font-black text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">credit_card</span>
                {editingAccount ? 'Edit Account / Card' : 'Add Account / Card'}
              </h2>
              <button 
                type="button" 
                onClick={() => setAccountModalOpen(false)} 
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveAccount} className="overflow-y-auto flex-1 py-5 space-y-4 pr-1">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
                  Card / Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Chase Sapphire, Wallet Cash"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                >
                  <option value="checking">Checking / Debit</option>
                  <option value="savings">Savings Vault</option>
                  <option value="credit">Credit Card</option>
                  <option value="cash">Physical Cash / Wallet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
                  Current Balance <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">{currencySymbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
                  Card Accent Color <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3 pt-1">
                  {['blue', 'green', 'purple', 'orange', 'red'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setAccountColor(col)}
                      className={`h-9 w-9 rounded-full border-2 transition-all ${
                        accountColor === col 
                          ? 'border-secondary scale-110 shadow-md' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ 
                        backgroundColor: col === 'blue' ? '#2563eb' :
                                         col === 'green' ? '#10b981' :
                                         col === 'purple' ? '#9333ea' :
                                         col === 'orange' ? '#d97706' : '#e11d48'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-outline-variant/30 flex gap-2">
                {editingAccount && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount(editingAccount.id)}
                    className="px-4 py-3 rounded-xl border border-rose-500/35 hover:bg-rose-500/10 text-rose-500 font-bold text-sm transition-all"
                  >
                    Delete Card
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-4 py-3 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 font-bold text-on-secondary shadow-lg shadow-secondary/20 transition-all hover:opacity-90 active:scale-95"
                >
                  {editingAccount ? 'Save Changes' : 'Create Card'}
                  <span className="material-symbols-outlined text-sm">done</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
