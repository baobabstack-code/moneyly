'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFinanceStore } from '@/lib/financeStore';
import { saveProfile, type UserProfile } from '@/lib/profile';
import Papa from 'papaparse';
import { useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Props {
  profile: UserProfile | null;
  userId: string;
  email: string;
}

const ACCENT_COLORS = [
  { value: 'green', hex: '#10b981', name: 'Emerald Green' },
  { value: 'purple', hex: '#a855f7', name: 'Royal Purple' },
  { value: 'blue', hex: '#3b82f6', name: 'Ocean Blue' },
  { value: 'orange', hex: '#f97316', name: 'Sunset Orange' },
] as const;

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'ZWL', symbol: 'Z$', name: 'Zimbabwean Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
] as const;

const CURRENCY_MAP = { USD: '$', EUR: '€', GBP: '£', ZWL: 'Z$', CAD: 'C$' } as Record<string, string>;

export default function SettingsClient({ profile, userId, email }: Props) {
  const router = useRouter();

  // Store actions
  const updateProfilePreferences = useFinanceStore(state => state.updateProfilePreferences);
  const addNotification = useFinanceStore(state => state.addNotification);
  const transactions = useFinanceStore(state => state.transactions);
  const addTransactionLocal = useFinanceStore(state => state.addTransactionLocal);

  // Form State
  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    username: profile?.username || '',
    monthly_income: profile?.monthly_income || '',
    daily_budget: profile?.daily_budget ? String(profile.daily_budget) : '0.00',
    weekly_budget: profile?.weekly_budget ? String(profile.weekly_budget) : '0.00',
    monthly_budget: profile?.monthly_budget ? String(profile.monthly_budget) : '0.00',
    currency: profile?.currency || 'USD',
    accent_color: (profile?.accent_color || 'green') as 'green' | 'purple' | 'blue' | 'orange',
    reminder_email_enabled: profile?.reminder_email_enabled ?? true,
    reminder_sms_enabled: profile?.reminder_sms_enabled ?? false,
    phone_number: profile?.phone_number || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invitations State
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  useEffect(() => {
    async function fetchInvites() {
      if (!email) return;
      const supabase = createClient();
      if (!supabase) return;
      setLoadingInvites(true);
      const { data } = await supabase
        .from('account_invitations')
        .select(`
          id,
          account_id,
          status,
          created_at,
          inviter:inviter_id(first_name, full_name, email),
          account:account_id(name)
        `)
        .eq('invitee_email', email)
        .eq('status', 'pending');
      if (data) setInvitations(data);
      setLoadingInvites(false);
    }
    fetchInvites();
  }, [email]);

  const handleAcceptInvite = async (inviteId: string, accountId: string) => {
    if (!profile?.id) return;
    const supabase = createClient();
    if (!supabase) return;
    try {
      await supabase.from('shared_accounts').insert({
        account_id: accountId,
        user_id: profile.id,
        role: 'member'
      });
      await supabase.from('account_invitations').update({ status: 'accepted' }).eq('id', inviteId);
      
      setInvitations(prev => prev.filter(i => i.id !== inviteId));
      addNotification("Wallet invitation accepted! Shared account added.", "success");
      // Force sync
      useFinanceStore.getState().syncOfflineData();
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      addNotification("Failed to accept invite: " + err.message, "error");
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    const supabase = createClient();
    if (!supabase) return;
    try {
      await supabase.from('account_invitations').update({ status: 'rejected' }).eq('id', inviteId);
      setInvitations(prev => prev.filter(i => i.id !== inviteId));
      addNotification("Invitation declined", "info");
    } catch (err) {
      console.error(err);
    }
  };

  // Synchronize dynamic preview of accent theme on selection change
  const activeAccent = form.accent_color;

  const handleFieldChange = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim()) {
      setError('First name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Save to Supabase via server helper
      const updated = await saveProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || null,
        username: form.username.trim() || null,
        monthly_income: form.monthly_income ? String(parseFloat(form.monthly_income)) : null,
        reminder_email_enabled: form.reminder_email_enabled,
        reminder_sms_enabled: form.reminder_sms_enabled,
        phone_number: form.phone_number.trim() || null,
        daily_budget: parseFloat(form.daily_budget) || 0,
        weekly_budget: parseFloat(form.weekly_budget) || 0,
        monthly_budget: parseFloat(form.monthly_budget) || 0,
        accent_color: form.accent_color,
        currency: form.currency,
      });

      if (!updated) {
        throw new Error('Database save failed');
      }

      // 2. Sync client-side Zustand store properties
      await updateProfilePreferences({
        currency: form.currency,
        accent_color: form.accent_color,
        daily_budget: parseFloat(form.daily_budget) || 0,
        weekly_budget: parseFloat(form.weekly_budget) || 0,
        monthly_budget: parseFloat(form.monthly_budget) || 0,
      });

      addNotification('Settings saved successfully!', 'success');
      router.refresh();
    } catch (err) {
      console.error('[Settings] Save error:', err);
      setError('Failed to update settings. Please try again.');
      addNotification('Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      category_name: t.category_name || '',
      note: t.note || '',
      date: t.date
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneyly_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Transactions exported successfully!', 'success');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        let imported = 0;
        for (const row of rows) {
          const amount = parseFloat(row.amount);
          if (isNaN(amount) || !row.type || !row.date) continue;
          
          await addTransactionLocal({
            amount,
            type: row.type as any,
            category_name: row.category_name || null,
            note: row.note || null,
            date: row.date,
            user_id: profile?.id || '',
          }, true); // pass skipSync=true to avoid rate limits if many
          imported++;
        }
        // Then trigger sync once
        useFinanceStore.getState().syncOfflineData();
        addNotification(`Imported ${imported} transactions!`, 'success');
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error: any) => {
        addNotification(`Error parsing CSV: ${error.message}`, 'error');
      }
    });
  };

  const currentCurrencySymbol = CURRENCY_MAP[form.currency] || '$';

  return (
    <div 
      className="font-manrope px-6 py-8 md:px-10 xl:px-12 min-h-screen bg-slate-950/20"
      data-accent={activeAccent}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary">Preferences & Customization</p>
          <h1 className="text-3xl font-black text-primary sm:text-4xl">System Settings</h1>
          <p className="text-sm text-on-surface-variant max-w-2xl">
            Update your account details, financial boundaries, email alerts, and color themes.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-status-danger-bg p-4 text-sm text-status-danger border border-status-danger/25">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Profile Info */}
            <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-secondary font-black">person</span>
                <h2 className="text-lg font-black text-primary">Profile Information</h2>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label htmlFor="first_name" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    required
                    value={form.first_name}
                    onChange={e => handleFieldChange('first_name', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-semibold"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    value={form.last_name}
                    onChange={e => handleFieldChange('last_name', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-semibold"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={form.username}
                    onChange={e => handleFieldChange('username', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-semibold"
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="text"
                    disabled
                    value={email}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container/30 text-on-surface-variant/60 font-semibold cursor-not-allowed"
                    title="Account email address cannot be changed."
                  />
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5">
                    Phone Number (for SMS Alerts)
                  </label>
                  <input
                    id="phone_number"
                    type="tel"
                    value={form.phone_number}
                    onChange={e => handleFieldChange('phone_number', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-semibold"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Financial Limits */}
            <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-secondary font-black">payments</span>
                <h2 className="text-lg font-black text-primary">Financial Planning</h2>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label htmlFor="monthly_income" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5">
                    Monthly Income
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">
                      {currentCurrencySymbol}
                    </span>
                    <input
                      id="monthly_income"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.monthly_income}
                      onChange={e => handleFieldChange('monthly_income', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="daily_budget" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5">
                    Daily Budget Limit
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">
                      {currentCurrencySymbol}
                    </span>
                    <input
                      id="daily_budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.daily_budget}
                      onChange={e => handleFieldChange('daily_budget', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="weekly_budget" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5">
                    Weekly Budget Limit
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">
                      {currentCurrencySymbol}
                    </span>
                    <input
                      id="weekly_budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.weekly_budget}
                      onChange={e => handleFieldChange('weekly_budget', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="monthly_budget" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5">
                    Monthly Budget Limit
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">
                      {currentCurrencySymbol}
                    </span>
                    <input
                      id="monthly_budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.monthly_budget}
                      onChange={e => handleFieldChange('monthly_budget', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: App Customization */}
            <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-secondary font-black">palette</span>
                <h2 className="text-lg font-black text-primary">App Customization</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-2.5">
                    Active Color Accent
                  </label>
                  <div className="flex items-center gap-4">
                    {ACCENT_COLORS.map(color => {
                      const isSelected = form.accent_color === color.value;
                      return (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => handleFieldChange('accent_color', color.value)}
                          className={`relative h-10 w-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                            isSelected ? 'ring-4 ring-offset-2 ring-secondary/50 scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {isSelected && (
                            <span className="material-symbols-outlined text-white text-base font-black">
                              done
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="currency" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5">
                    Base Currency
                  </label>
                  <select
                    id="currency"
                    value={form.currency}
                    onChange={e => handleFieldChange('currency', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all font-semibold"
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} ({curr.symbol}) — {curr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Card 4: Notifications */}
            <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-secondary font-black">notifications</span>
                <h2 className="text-lg font-black text-primary">Notification Preferences</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface-container-low/40 p-4 transition-all">
                  <div className="flex flex-col flex-1">
                    <p className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-secondary font-black">mail</span>
                      Daily Email Reminder
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                      Receive a daily email nudge to keep your spending journals updated.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.reminder_email_enabled}
                    onClick={() => handleFieldChange('reminder_email_enabled', !form.reminder_email_enabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 ${
                      form.reminder_email_enabled ? 'bg-secondary' : 'bg-outline-variant'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                        form.reminder_email_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface-container-low/40 p-4 transition-all">
                  <div className="flex flex-col flex-1">
                    <p className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-secondary font-black">sms</span>
                      Daily SMS Reminder
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                      Receive a daily text message nudge. Requires phone number in Profile.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.reminder_sms_enabled}
                    onClick={() => handleFieldChange('reminder_sms_enabled', !form.reminder_sms_enabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 ${
                      form.reminder_sms_enabled ? 'bg-secondary' : 'bg-outline-variant'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                        form.reminder_sms_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface-container-low/20 p-4 opacity-70">
                  <div className="flex flex-col flex-1">
                    <p className="text-sm font-semibold text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm font-black">warning</span>
                      Budget Exceeded Alerts
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                      Sends immediate alerts when spending hits 80% and 100% of monthly budgets.
                    </p>
                  </div>
                  <span className="text-[10px] bg-secondary/15 text-secondary border border-secondary/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Always On
                  </span>
                </div>
              </div>
            </div>

            {/* Card: Wallet Invitations */}
            <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary font-black">mark_email_unread</span>
                  <h2 className="text-lg font-black text-primary">Wallet Invitations</h2>
                </div>
                {invitations.length > 0 && (
                  <span className="bg-secondary text-on-secondary text-xs font-bold px-2 py-0.5 rounded-full">
                    {invitations.length} Pending
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                {loadingInvites ? (
                  <p className="text-sm text-on-surface-variant animate-pulse">Loading invitations...</p>
                ) : invitations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-outline p-6 text-center bg-surface-container-low/20">
                    <span className="material-symbols-outlined mb-2 text-3xl text-on-surface-variant/45">drafts</span>
                    <p className="text-xs text-on-surface-variant font-bold">No pending invitations.</p>
                  </div>
                ) : (
                  invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-2xl bg-surface-container-low p-4 border border-outline-variant/40">
                      <div>
                        <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-secondary text-sm">account_balance_wallet</span>
                          {inv.account?.name || 'Shared Wallet'}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Invited by <span className="font-semibold text-on-surface">{inv.inviter?.first_name || inv.inviter?.email || 'Someone'}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleDeclineInvite(inv.id)}
                          className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 text-xs font-bold transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptInvite(inv.id, inv.account_id)}
                          className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Card 5: Data Management */}
            <div className="rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined text-secondary font-black">database</span>
                <h2 className="text-lg font-black text-primary">Data Management</h2>
              </div>
              <p className="text-sm text-on-surface-variant">
                Take control of your data. Export your transactions as a CSV for use in spreadsheets, or import transactions from a previous export.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-6 py-3 rounded-xl bg-secondary/10 text-secondary font-bold text-sm hover:bg-secondary/20 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export as CSV
                </button>
                
                <div>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImportCSV}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Import from CSV
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3.5 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 rounded-xl bg-secondary text-on-secondary font-bold text-sm shadow-lg shadow-secondary/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? 'Saving...' : 'Save Settings'}
              <span className="material-symbols-outlined text-sm">done</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
