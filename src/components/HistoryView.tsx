'use client';

import { useState, useMemo } from 'react';
import { useApplicationStore, Transaction } from '@/lib/store';
import { generateStatementPDF } from '@/utils/pdf-generator';

export default function HistoryView() {
  const transactions = useApplicationStore(state => state.transactions);
  const categories = useApplicationStore(state => state.categories);
  const deleteTransactionLocal = useApplicationStore(state => state.deleteTransactionLocal);
  const updateTransactionLocal = useApplicationStore(state => state.updateTransactionLocal);
  const accentColor = useApplicationStore(state => state.accentColor);
  const currencyCode = useApplicationStore(state => state.currency);
  const startingBalance = useApplicationStore(state => state.startingBalance);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'savings'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editSpendingPlanId, setEditSpendingPlanId] = useState<string | null>(null);
  const spendingPlans = useApplicationStore(state => state.spendingPlans);

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

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        // 1. Text Search (note, category name)
        const matchesSearch = 
          !search.trim() || 
          t.note?.toLowerCase().includes(search.toLowerCase()) || 
          t.category_name?.toLowerCase().includes(search.toLowerCase());

        // 2. Type Filter
        const matchesType = filterType === 'all' || t.type === filterType;

        // 3. Category Filter
        const matchesCategory = filterCategory === 'all' || t.category_name === filterCategory;

        // 4. Date Filters
        const txDate = new Date(t.date).toISOString().substring(0, 10);
        const matchesStart = !startDate || txDate >= startDate;
        const matchesEnd = !endDate || txDate <= endDate;

        return matchesSearch && matchesType && matchesCategory && matchesStart && matchesEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, filterType, filterCategory, startDate, endDate]);

  const handleStartEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditAmount(t.amount.toString());
    setEditNote(t.note || '');
    setEditCategoryId(t.category_id || null);
    setEditDate(new Date(t.date).toISOString().substring(0, 10));
    setEditSpendingPlanId(t.spending_plan_id || null);
  };

  const handleSaveEdit = async (id: string) => {
    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const selectedCategory = categories.find(c => c.id === editCategoryId);

    await updateTransactionLocal(id, {
      amount: amountNum,
      note: editNote.trim() || null,
      category_id: editCategoryId,
      category_name: selectedCategory?.name || null,
      category_emoji: selectedCategory?.emoji || null,
      date: new Date(editDate).toISOString(),
      spending_plan_id: editSpendingPlanId || null,
    });

    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransactionLocal(id);
    }
  };

  // Unique list of category names for filter dropdown
  const categoryNames = useMemo(() => {
    return Array.from(new Set(categories.map(c => c.name)));
  }, [categories]);

  const handleDownloadPDF = async () => {
    try {
      let customerName = "Moneyly User";
      if (typeof window !== "undefined" && navigator.onLine) {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, first_name')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            customerName = profile.first_name || profile.full_name || session.user.email || "Moneyly User";
          } else {
            customerName = session.user.email || "Moneyly User";
          }
        }
      }
      
      const pdfDataUri = await generateStatementPDF({
        transactions: filteredTransactions,
        startingBalance,
        currency: currencyCode,
        customerName,
      });

      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `moneyly_statement_${new Date().toISOString().substring(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to generate statement PDF:", err);
      alert("Failed to generate statement PDF.");
    }
  };

  return (
    <div 
      className="font-manrope min-h-screen bg-slate-950/20 w-full"
      data-accent={accentColor}
    >
      <div className="w-full px-6 py-8 md:px-10 xl:px-12">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Moneyly Transactions</p>
            <h1 className="text-3xl font-black text-primary sm:text-4xl">History & Audit</h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Full ledger of your incomes and expenses. Search, filter, and modify transactions inline.
            </p>
          </div>
          <div>
            <button
              onClick={handleDownloadPDF}
              className="rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-on-secondary shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm font-black">download</span>
              Download Statement PDF
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
          
          {/* Filters Sidebar Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-3xl border border-outline-variant bg-surface p-5 shadow-sm space-y-4 sticky top-6">
              <h3 className="font-black text-primary text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-secondary">tune</span>
                Filter Ledger
              </h3>

              {/* Search Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">Search Memo / Tag</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/45">search</span>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-outline-variant/60 bg-surface-container-low text-xs focus:outline-none focus:border-secondary transition-all"
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">Category</label>
                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/60 bg-surface-container-low text-xs focus:outline-none focus:border-secondary transition-all font-bold text-on-surface-variant appearance-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {categoryNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Type Filters */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">Transaction Type</label>
                <div className="grid grid-cols-2 gap-1.5 bg-surface-container-low p-1 rounded-2xl border border-outline-variant/40">
                  {(['all', 'income', 'expense', 'savings'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`rounded-xl py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                        filterType === type
                          ? 'bg-secondary text-on-secondary shadow-md'
                          : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filters */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80">Date Boundaries</label>
                <div className="flex flex-col gap-2 text-xs font-bold text-on-surface-variant">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase opacity-60">From</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/60 bg-surface-container-low focus:outline-none text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase opacity-60">To</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/60 bg-surface-container-low focus:outline-none text-xs"
                    />
                  </div>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(''); setEndDate(''); }}
                      className="text-secondary hover:underline text-xs font-bold text-center mt-1"
                    >
                      Clear Range
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-primary">Ledger Entries</h2>
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'} found
                </span>
              </div>

              <div className="space-y-4">
                {filteredTransactions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-outline p-12 text-center bg-surface-container-low/40">
                    <span className="material-symbols-outlined mb-2 text-5xl text-on-surface-variant/35">receipt_long</span>
                    <p className="font-bold text-on-surface">No ledger entries match filters</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Try widening your search terms or date scope.</p>
                  </div>
                ) : (
                  filteredTransactions.map((t) => {
                    const isEditing = editingId === t.id;

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
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-primary font-bold"
                              />
                            </div>
                            {/* Date */}
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Date</label>
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-primary"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* Memo */}
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Note / Memo</label>
                              <input
                                type="text"
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-primary"
                              />
                            </div>
                            {/* Category */}
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Category</label>
                              <select
                                value={editCategoryId || ''}
                                onChange={(e) => setEditCategoryId(parseInt(e.target.value) || null)}
                                className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm text-primary font-bold"
                              >
                                <option value="">Select Category</option>
                                {categories.filter(c => c.type === t.type).map((c) => (
                                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Spending Plan Link */}
                          {spendingPlans.length > 0 && (
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Linked Spending Plan (Optional)</label>
                              <select
                                value={editSpendingPlanId || ''}
                                onChange={(e) => setEditSpendingPlanId(e.target.value || null)}
                                className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm text-primary font-bold"
                              >
                                <option value="">Do Not Link</option>
                                {spendingPlans.map((plan) => (
                                  <option key={plan.id} value={plan.id}>{plan.product_name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(t.id)}
                              className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-on-secondary shadow-md"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={t.id} className="flex items-center justify-between rounded-2xl bg-surface-container-low/40 p-4 border border-outline-variant/20 hover:border-outline-variant/55 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-highest text-xl">
                            {t.category_emoji || '🛒'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary">{t.note || t.category_name || 'Uncategorized'}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
                              <span>{t.category_name || t.type}</span>
                              <span className="opacity-40">•</span>
                              <span>{new Date(t.date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              {t.spending_plan_id && (() => {
                                const plan = spendingPlans.find(p => p.id === t.spending_plan_id);
                                return plan ? (
                                  <>
                                    <span className="opacity-40">•</span>
                                    <span className="text-secondary font-bold flex items-center gap-0.5 normal-case">
                                      <span className="material-symbols-outlined text-[12px] font-black">folder</span>
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
                              onClick={() => handleStartEdit(t)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                              title="Edit transaction"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(t.id)}
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
          </div>
        </div>
      </div>
    </div>
  );
}
