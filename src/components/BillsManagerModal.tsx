import React, { useState } from 'react';
import { useFinanceStore, RecurringBill } from '@/lib/financeStore';

interface BillsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user_id: string;
}

export default function BillsManagerModal({ isOpen, onClose, user_id }: BillsManagerModalProps) {
  const recurringBills = useFinanceStore(state => state.recurringBills);
  const addRecurringBillLocal = useFinanceStore(state => state.addRecurringBillLocal);
  const updateRecurringBillLocal = useFinanceStore(state => state.updateRecurringBillLocal);
  const deleteRecurringBillLocal = useFinanceStore(state => state.deleteRecurringBillLocal);
  const categories = useFinanceStore(state => state.categories);
  const currencySymbol = useFinanceStore(state => {
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$', CAD: 'C$' };
    return map[state.currency] || '$';
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [nextDueDate, setNextDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setAmount('');
    setType('expense');
    setFrequency('monthly');
    setNextDueDate('');
    setCategoryId('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (bill: RecurringBill) => {
    setName(bill.name);
    setAmount(bill.amount.toString());
    setType(bill.type);
    setFrequency(bill.frequency);
    setNextDueDate(bill.next_due_date.split('T')[0]);
    setCategoryId(bill.category_id ? bill.category_id.toString() : '');
    setEditingId(bill.id);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !nextDueDate) return;

    const selectedCat = categories.find(c => c.id.toString() === categoryId);

    if (editingId) {
      await updateRecurringBillLocal(editingId, {
        name,
        amount: parseFloat(amount),
        type,
        frequency,
        next_due_date: new Date(nextDueDate).toISOString(),
        category_id: selectedCat?.id || null,
        category_name: selectedCat?.name || null,
        category_emoji: selectedCat?.emoji || null,
      });
    } else {
      await addRecurringBillLocal({
        user_id,
        name,
        amount: parseFloat(amount),
        type,
        frequency,
        next_due_date: new Date(nextDueDate).toISOString(),
        category_id: selectedCat?.id || null,
        category_name: selectedCat?.name || null,
        category_emoji: selectedCat?.emoji || null,
        is_active: true,
      });
    }

    resetForm();
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await updateRecurringBillLocal(id, { is_active: !currentStatus });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recurring bill?')) {
      await deleteRecurringBillLocal(id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full rounded-t-3xl border border-outline-variant bg-surface shadow-2xl transition-all duration-300 sm:max-w-xl sm:rounded-3xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 p-6">
          <h2 className="text-xl font-black text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">event_repeat</span>
            Manage Recurring Bills
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          
          {!isAdding ? (
            <>
              <button
                onClick={() => setIsAdding(true)}
                className="w-full py-3 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary font-bold hover:bg-secondary hover:text-on-secondary transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Add New Bill or Subscription
              </button>

              <div className="space-y-3">
                {recurringBills.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-5xl mb-2">receipt_long</span>
                    <p className="text-sm font-medium">No recurring bills set up yet.</p>
                  </div>
                ) : (
                  recurringBills.map((bill) => (
                    <div 
                      key={bill.id} 
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        bill.is_active ? 'bg-surface-container-low border-outline-variant/30 hover:border-secondary/40' : 'bg-surface-container-highest/30 border-outline-variant/10 opacity-60 grayscale'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-highest text-lg">
                          {bill.category_emoji || '🧾'}
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface text-sm">{bill.name}</h4>
                          <p className="text-[10px] text-on-surface-variant flex items-center gap-1 font-medium mt-0.5">
                            <span className="capitalize">{bill.frequency}</span> • 
                            <span className={bill.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}>
                              {bill.type === 'expense' ? '-' : '+'}{currencySymbol}{bill.amount.toFixed(2)}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(bill.id, bill.is_active)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            bill.is_active ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                          }`}
                        >
                          {bill.is_active ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          onClick={() => handleEdit(bill)}
                          className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(bill.id)}
                          className="p-1.5 rounded-lg bg-surface-container-high text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-on-surface">{editingId ? 'Edit Bill' : 'New Recurring Bill'}</h3>
                <button type="button" onClick={resetForm} className="text-xs text-on-surface-variant hover:text-primary font-bold">Cancel</button>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Name / Merchant</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Netflix, Rent, Gym..."
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
                  >
                    <option value="expense">Expense (Bill)</option>
                    <option value="income">Income (Salary)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold capitalize"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Next Due Date</label>
                  <input
                    type="date"
                    required
                    value={nextDueDate}
                    onChange={e => setNextDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Category (Optional)</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
                >
                  <option value="">No Category</option>
                  {categories.filter(c => c.type === type).map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-2 rounded-2xl bg-secondary text-on-secondary font-black text-sm shadow-lg shadow-secondary/30 hover:scale-[1.02] hover:shadow-secondary/40 transition-all"
              >
                {editingId ? 'Save Changes' : 'Add Bill'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
