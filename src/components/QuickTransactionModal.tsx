'use client';

import { useState, useEffect } from 'react';
import { useFinanceStore, Category } from '@/lib/financeStore';

interface Props {
  user_id: string;
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income' | 'savings' | 'transfer';
  defaultAccountId?: string;
  defaultToAccountId?: string;
}

export default function QuickTransactionModal({ 
  user_id, 
  isOpen, 
  onClose,
  defaultType,
  defaultAccountId,
  defaultToAccountId
}: Props) {
  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().substring(0, 10);
  };

  const categories = useFinanceStore(state => state.categories);
  const spendingPlans = useFinanceStore(state => state.spendingPlans);
  const accounts = useFinanceStore(state => state.accounts);
  const addTransactionLocal = useFinanceStore(state => state.addTransactionLocal);
  const accentColor = useFinanceStore(state => state.accentColor);
  const currencySymbol = useFinanceStore(state => {
    const code = state.currency;
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$', CAD: 'C$' };
    return map[code] || '$';
  });

  const [type, setType] = useState<'expense' | 'income' | 'savings' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getLocalDateString);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedToAccountId, setSelectedToAccountId] = useState<string | null>(null);

  // Filter categories by type
  const filteredCategories = categories.filter(c => c.type === (type === 'transfer' ? 'expense' : type));

  // Sync state when defaults change or modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultType) setType(defaultType);
      if (defaultAccountId) setSelectedAccountId(defaultAccountId);
      if (defaultToAccountId) setSelectedToAccountId(defaultToAccountId);
    }
  }, [isOpen, defaultType, defaultAccountId, defaultToAccountId]);

  // Auto-select first category when type or categories change
  useEffect(() => {
    if (type !== 'transfer' && filteredCategories.length > 0) {
      setSelectedCategoryId(filteredCategories[0].id);
    } else {
      setSelectedCategoryId(null);
    }
  }, [type, categories]);

  // Auto-select first account if available
  useEffect(() => {
    if (accounts.length > 0) {
      if (!selectedAccountId || !accounts.some(a => a.id === selectedAccountId)) {
        setSelectedAccountId(defaultAccountId && accounts.some(a => a.id === defaultAccountId) ? defaultAccountId : accounts[0].id);
      }
    } else {
      setSelectedAccountId(null);
    }
  }, [accounts, defaultAccountId, selectedAccountId]);

  // Auto-select destination account if transfer and destination is not set
  useEffect(() => {
    if (type === 'transfer' && accounts.length > 1) {
      if (!selectedToAccountId || selectedToAccountId === selectedAccountId) {
        if (defaultToAccountId && defaultToAccountId !== selectedAccountId && accounts.some(a => a.id === defaultToAccountId)) {
          setSelectedToAccountId(defaultToAccountId);
        } else {
          const otherAcc = accounts.find(a => a.id !== selectedAccountId);
          if (otherAcc) setSelectedToAccountId(otherAcc.id);
        }
      }
    }
  }, [type, selectedAccountId, accounts, selectedToAccountId, defaultToAccountId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) return;

    if (type === 'transfer') {
      if (!selectedAccountId || !selectedToAccountId) {
        alert("Please select both source and destination accounts for the transfer.");
        return;
      }
      if (selectedAccountId === selectedToAccountId) {
        alert("Source and destination accounts must be different.");
        return;
      }
    }

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    await addTransactionLocal({
      user_id,
      amount: finalAmount,
      type,
      category_id: type === 'transfer' ? null : selectedCategoryId,
      category_name: type === 'transfer' ? 'Transfer' : (selectedCategory?.name || null),
      category_emoji: type === 'transfer' ? '🔄' : (selectedCategory?.emoji || null),
      note: note.trim() || null,
      date: new Date(date).toISOString(),
      spending_plan_id: type === 'transfer' ? null : (selectedPlanId || null),
      account_id: selectedAccountId || null,
      to_account_id: type === 'transfer' ? selectedToAccountId : null,
    });

    // Reset and close
    setAmount('');
    setNote('');
    setSelectedPlanId(null);
    setSelectedAccountId(accounts[0]?.id || null);
    setSelectedToAccountId(accounts[1]?.id || null);
    setDate(getLocalDateString());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div 
        className="w-full rounded-t-3xl border border-outline-variant bg-surface p-6 shadow-2xl transition-all duration-300 sm:max-w-md sm:rounded-3xl"
        data-accent={accentColor}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
          <h2 className="text-xl font-black text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">add_circle</span>
            Add Transaction
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Income / Expense / Savings / Transfer Toggle */}
          <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-surface-container-low p-1 border border-outline-variant/40" title="Expense logs cash outflows, Income logs inflows, Savings logs funds put aside, and Transfer moves money between accounts.">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`rounded-xl py-2.5 text-xs font-black transition-all ${
                type === 'expense'
                  ? 'bg-secondary text-on-secondary shadow-md'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`rounded-xl py-2.5 text-xs font-black transition-all ${
                type === 'income'
                  ? 'bg-secondary text-on-secondary shadow-md'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('savings')}
              className={`rounded-xl py-2.5 text-xs font-black transition-all ${
                type === 'savings'
                  ? 'bg-secondary text-on-secondary shadow-md'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Savings
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`rounded-xl py-2.5 text-xs font-black transition-all ${
                type === 'transfer'
                  ? 'bg-secondary text-on-secondary shadow-md'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Amount input */}
          <div className="text-center">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">Amount</label>
            <div className="relative mt-2 flex items-center justify-center">
              <span className="absolute left-6 text-3xl font-black text-on-surface-variant/40">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full text-center rounded-2xl border border-outline-variant bg-surface-container-low py-4 pl-12 pr-6 text-3xl font-black text-primary focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
              />
            </div>
          </div>

          {/* Category Selector */}
          {type !== 'transfer' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">Category</label>
              {filteredCategories.length === 0 ? (
                <p className="mt-2 text-xs text-on-surface-variant">No categories found for this type. Please setup categories first.</p>
              ) : (
                <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto pb-2">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 shrink-0 min-w-[72px] transition-all ${
                        selectedCategoryId === cat.id
                          ? 'border-secondary bg-secondary/5 font-bold text-primary ring-2 ring-secondary/15'
                          : 'border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="mt-1 text-[10px] truncate max-w-[64px] font-semibold">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Link to Card / Account (or From Account for transfers) */}
          {accounts.length > 0 && (
            <div title={type === 'transfer' ? "Account to withdraw funds from." : "Optionally link this transaction to a card or cash account. Adjusts the card balance automatically."}>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                {type === 'transfer' ? "From Account / Card" : "Link to Card / Account (Optional)"}
              </label>
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(e.target.value || null)}
                className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm text-primary font-bold focus:outline-none focus:border-secondary"
                required={type === 'transfer'}
              >
                {type !== 'transfer' && <option value="">Do Not Link</option>}
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type}) — {currencySymbol}{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Transfer Destination Account */}
          {type === 'transfer' && accounts.length > 0 && (
            <div title="Account to deposit funds into.">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">To Account / Card</label>
              <select
                value={selectedToAccountId || ''}
                onChange={(e) => setSelectedToAccountId(e.target.value || null)}
                className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm text-primary font-bold focus:outline-none focus:border-secondary"
                required
              >
                <option value="">Select Destination Account</option>
                {accounts.filter(a => a.id !== selectedAccountId).map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type}) — {currencySymbol}{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Link to Spending Plan */}
          {type !== 'transfer' && spendingPlans.length > 0 && (
            <div title="Optionally link this transaction to a goal. Incomes/savings will increase the goal's saved amount; deleting/modifying them will adjust it.">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">Link to Goal / Milestone (Optional)</label>
              <select
                value={selectedPlanId || ''}
                onChange={(e) => setSelectedPlanId(e.target.value || null)}
                className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm text-primary font-bold focus:outline-none focus:border-secondary"
              >
                <option value="">Do Not Link</option>
                {spendingPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.product_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Note & Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-primary focus:outline-none focus:border-secondary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">Memo / Note</label>
              <input
                type="text"
                placeholder={type === 'transfer' ? "E.g., Transfer to Savings" : "E.g., Grocery shopping"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-primary focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-secondary py-3.5 font-bold text-on-secondary shadow-lg shadow-secondary/20 transition-all hover:opacity-90 active:scale-95"
            >
              Add Transaction
              <span className="material-symbols-outlined text-sm">done</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
