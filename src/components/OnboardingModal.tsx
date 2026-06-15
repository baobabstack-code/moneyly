'use client';

import { useState } from 'react';
import { useApplicationStore } from '@/lib/store';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', emoji: '🍔', color: '#10b981', type: 'expense' as const },
  { name: 'Shopping', emoji: '🛍️', color: '#a855f7', type: 'expense' as const },
  { name: 'Transport', emoji: '🚗', color: '#3b82f6', type: 'expense' as const },
  { name: 'Bills & Utilities', emoji: '💡', color: '#f97316', type: 'expense' as const },
  { name: 'Entertainment', emoji: '🎬', color: '#ec4899', type: 'expense' as const },
  { name: 'Healthcare', emoji: '🏥', color: '#ef4444', type: 'expense' as const },
  { name: 'Salary', emoji: '💰', color: '#10b981', type: 'income' as const },
  { name: 'Freelance', emoji: '💻', color: '#3b82f6', type: 'income' as const },
  { name: 'Investments', emoji: '📈', color: '#a855f7', type: 'income' as const },
  { name: 'Savings Account', emoji: '🏦', color: '#3b82f6', type: 'savings' as const },
  { name: 'Emergency Fund', emoji: '🛡️', color: '#10b981', type: 'savings' as const },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'ZWL', symbol: 'Z$', name: 'Zimbabwean Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

const THEMES = [
  { name: 'green', label: 'Neon Green', color: '#10b981', bg: 'bg-[#10b981]' },
  { name: 'purple', label: 'Vibrant Purple', color: '#a855f7', bg: 'bg-[#a855f7]' },
  { name: 'blue', label: 'Electric Blue', color: '#3b82f6', bg: 'bg-[#3b82f6]' },
  { name: 'orange', label: 'Radiant Orange', color: '#f97316', bg: 'bg-[#f97316]' },
];

export default function OnboardingModal({ user_id }: { user_id: string }) {
  const [step, setStep] = useState(1);
  const [balance, setBalance] = useState('0.00');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedTheme, setSelectedTheme] = useState<'green' | 'purple' | 'blue' | 'orange'>('green');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES.map(c => ({ ...c, checked: true })));
  
  // Custom Category Input
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('💰');
  const [customType, setCustomType] = useState<'expense' | 'income' | 'savings'>('expense');

  const updateProfilePreferences = useApplicationStore(state => state.updateProfilePreferences);
  const addCategoryLocal = useApplicationStore(state => state.addCategoryLocal);
  const addNotification = useApplicationStore(state => state.addNotification);

  const handleAddCustomCategory = () => {
    if (!customName.trim()) return;
    setCategories([
      ...categories,
      {
        name: customName.trim(),
        emoji: customEmoji,
        color: selectedTheme === 'green' ? '#10b981' : selectedTheme === 'purple' ? '#a855f7' : selectedTheme === 'blue' ? '#3b82f6' : '#f97316',
        type: customType,
        checked: true
      }
    ]);
    setCustomName('');
  };

  const handleCompleteOnboarding = async () => {
    const finalBalance = parseFloat(balance) || 0;
    
    // 1. Update Profile Settings
    await updateProfilePreferences({
      starting_balance: finalBalance,
      currency: selectedCurrency,
      accent_color: selectedTheme,
      onboarded: true
    });

    // 2. Add Selected Categories
    const selectedCats = categories.filter(c => c.checked);
    for (const cat of selectedCats) {
      await addCategoryLocal({
        user_id,
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        type: cat.type
      });
    }

    addNotification('Welcome to Moneyly! Onboarding completed successfully.', 'success');
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div 
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl transition-all duration-300 md:p-8"
        data-accent={selectedTheme}
      >
        {/* Progress Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl animate-bounce-subtle">account_balance_wallet</span>
            <span className="text-sm font-black uppercase tracking-widest text-primary">Moneyly Onboarding</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${s <= step ? 'bg-secondary' : 'bg-surface-container-highest'}`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Currency & Starting Balance */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black tracking-tight text-primary sm:text-3xl">Set Your Starting Balance</h2>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              Enter your current cash and account holdings. This balance will form the base of your financial health.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">Preferred Currency</label>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCurrency(c.code)}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                        selectedCurrency === c.code
                          ? 'border-secondary bg-secondary/5 font-bold text-secondary'
                          : 'border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      <span className="text-lg font-black">{c.symbol}</span>
                      <span className="mt-1 text-[10px] uppercase font-bold tracking-wide">{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">Initial Balance</label>
                <div className="relative mt-2 flex items-center">
                  <span className="absolute left-5 text-2xl font-black text-on-surface-variant/50">
                    {CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full rounded-2xl border border-outline-variant bg-surface-container-low py-4 pl-12 pr-6 text-2xl font-black text-primary focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-2xl bg-secondary px-6 py-3.5 font-bold text-on-secondary shadow-lg shadow-secondary/20 transition-all hover:opacity-90 active:scale-95"
              >
                Continue
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Accent Theme Selector */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black tracking-tight text-primary sm:text-3xl">Choose Accent Theme</h2>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              Personalize your dashboard with premium color palettes. Accent highlights and interactive widgets will adopt this color.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {THEMES.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => setSelectedTheme(theme.name as any)}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                    selectedTheme === theme.name
                      ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/20'
                      : 'border-outline-variant bg-surface hover:bg-surface-container-low'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full shadow-inner ${theme.bg} flex items-center justify-center`}>
                    {selectedTheme === theme.name && (
                      <span className="material-symbols-outlined text-white text-sm font-bold">check</span>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${selectedTheme === theme.name ? 'text-primary' : 'text-on-surface-variant'}`}>{theme.label}</p>
                    <p className="text-[10px] text-on-surface-variant/60 font-semibold uppercase tracking-wider">{theme.name}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Accent Theme Live Preview Mockup Card */}
            <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Theme Preview</p>
                  <p className="mt-1 text-lg font-black text-primary">Interactive Card</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-on-secondary shadow-md shadow-secondary/35">
                  <span className="material-symbols-outlined text-lg">trending_up</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="h-1.5 w-2/3 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full bg-secondary w-3/4 rounded-full" />
                </div>
                <span className="text-xs font-bold text-secondary">75%</span>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-2xl border border-outline-variant px-5 py-3.5 font-bold text-on-surface hover:bg-surface-container transition-all active:scale-95"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-2xl bg-secondary px-6 py-3.5 font-bold text-on-secondary shadow-lg shadow-secondary/20 transition-all hover:opacity-90 active:scale-95"
              >
                Continue
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Category Selection & Customisation */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black tracking-tight text-primary sm:text-3xl">Setup Your Categories</h2>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              Verify your transaction categories. Tap to toggle default categories or add your own custom ones below.
            </p>

            {/* List of categories */}
            <div className="scrollbar-hide mt-6 max-h-48 overflow-y-auto rounded-2xl border border-outline-variant bg-surface-container-low p-3 space-y-1">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const next = [...categories];
                    next[idx].checked = !next[idx].checked;
                    setCategories(next);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all ${
                    cat.checked
                      ? 'bg-secondary/5 text-primary'
                      : 'opacity-50 hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-sm font-bold">{cat.name}</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60">({cat.type})</span>
                  </div>
                  <span className={`material-symbols-outlined text-lg ${cat.checked ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>
                    {cat.checked ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Category Adder */}
            <div className="mt-4 rounded-2xl border border-outline-variant/60 bg-surface-container/50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant/80">Add Custom Category</p>
              <div className="mt-3 flex gap-2">
                <select
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  className="rounded-xl border border-outline-variant bg-surface px-2.5 py-2 text-lg focus:outline-none focus:border-secondary"
                >
                  <option value="💰">💰</option>
                  <option value="🍔">🍔</option>
                  <option value="🛍️">🛍️</option>
                  <option value="🚗">🚗</option>
                  <option value="💡">💡</option>
                  <option value="🎬">🎬</option>
                  <option value="🏥">🏥</option>
                  <option value="💻">💻</option>
                  <option value="📈">📈</option>
                  <option value="🎁">🎁</option>
                  <option value="✈️">✈️</option>
                  <option value="📚">📚</option>
                  <option value="🏠">🏠</option>
                  <option value="🏋️">🏋️</option>
                </select>

                <input
                  type="text"
                  placeholder="Category Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-secondary"
                />

                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as any)}
                  className="rounded-xl border border-outline-variant bg-surface px-2.5 py-2 text-xs font-bold text-on-surface-variant focus:outline-none focus:border-secondary"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="savings">Savings</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="rounded-xl bg-secondary px-3 text-on-secondary font-bold hover:opacity-90 active:scale-95"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-2xl border border-outline-variant px-5 py-3.5 font-bold text-on-surface hover:bg-surface-container transition-all active:scale-95"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                className="flex items-center gap-2 rounded-2xl bg-secondary px-6 py-3.5 font-bold text-on-secondary shadow-lg shadow-secondary/20 transition-all hover:opacity-90 active:scale-95"
              >
                Complete Setup
                <span className="material-symbols-outlined text-sm">done</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
