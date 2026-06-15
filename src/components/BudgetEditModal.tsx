'use client';

import { useState, useEffect } from 'react';
import { useApplicationStore } from '@/lib/store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BudgetEditModal({ isOpen, onClose }: Props) {
  const accentColor = useApplicationStore(state => state.accentColor);
  const currencySymbol = useApplicationStore(state => {
    const code = state.currency;
    const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$', CAD: 'C$' };
    return map[code] || '$';
  });

  const dailyBudget = useApplicationStore(state => state.dailyBudget);
  const weeklyBudget = useApplicationStore(state => state.weeklyBudget);
  const monthlyBudget = useApplicationStore(state => state.monthlyBudget);
  const updateProfilePreferences = useApplicationStore(state => state.updateProfilePreferences);
  const addNotification = useApplicationStore(state => state.addNotification);

  const [daily, setDaily] = useState('0.00');
  const [weekly, setWeekly] = useState('0.00');
  const [monthly, setMonthly] = useState('0.00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDaily(dailyBudget.toFixed(2));
    setWeekly(weeklyBudget.toFixed(2));
    setMonthly(monthlyBudget.toFixed(2));
  }, [dailyBudget, weeklyBudget, monthlyBudget, isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfilePreferences({
        daily_budget: parseFloat(daily) || 0,
        weekly_budget: parseFloat(weekly) || 0,
        monthly_budget: parseFloat(monthly) || 0,
      });
      addNotification('Budgets updated successfully!', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      addNotification('Failed to update budgets.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div 
        className="w-full rounded-t-3xl border border-outline-variant bg-surface p-6 shadow-2xl transition-all duration-300 sm:max-w-md sm:rounded-3xl"
        data-accent={accentColor}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
          <h2 className="text-xl font-black text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">tune</span>
            Set Budget Limits
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Specify spending thresholds. When your expenses exceed these limits in their respective periods, indicators on your dashboard will turn red.
          </p>

          {/* Daily Budget */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
              Daily Budget Limit
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={daily}
                onChange={(e) => setDaily(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
              />
            </div>
          </div>

          {/* Weekly Budget */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
              Weekly Budget Limit
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={weekly}
                onChange={(e) => setWeekly(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
              />
            </div>
          </div>

          {/* Monthly Budget */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/85 block mb-1">
              Monthly Budget Limit
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-bold"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-grow flex items-center justify-center gap-2 rounded-xl bg-secondary py-3.5 font-bold text-on-secondary shadow-lg shadow-secondary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Limits'}
              <span className="material-symbols-outlined text-sm">done</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
