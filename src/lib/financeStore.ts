import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'expense' | 'income' | 'savings';
  category_id?: number | null;
  category_name?: string | null;
  category_emoji?: string | null;
  note?: string | null;
  date: string;
  created_at?: string;
  spending_plan_id?: string | null;
  account_id?: string | null;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash';
  balance: number;
  color: string;
  created_at?: string;
}

export interface Category {
  id: number;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'expense' | 'income' | 'savings';
  budget_limit?: number;
}

export interface PendingMutation {
  id: string;
  type: 'CREATE_TRANSACTION' | 'DELETE_TRANSACTION' | 'UPDATE_TRANSACTION' | 'CREATE_CATEGORY' | 'UPDATE_PROFILE' | 'CREATE_SPENDING_PLAN' | 'UPDATE_CATEGORY' | 'DELETE_SPENDING_PLAN' | 'UPDATE_SPENDING_PLAN' | 'CREATE_ACCOUNT' | 'UPDATE_ACCOUNT' | 'DELETE_ACCOUNT';
  payload: any;
  timestamp: number;
}

export interface SpendingPlan {
  id: string;
  user_id: string | null;
  status: 'active' | 'paused' | 'completed' | string;
  reference: string;
  created_at: string;
  store_name?: string | null;
  product_name: string;
  planned_cost: number;
  saved_amount: number;
  tenure_months: number;
  file_url?: string | null;
}

/**
 * Moneyly plan-builder store.
 * Tracks details for planned purchase, preferences, transactions, and offline sync queue.
 */
export interface FinanceState {
  /** System notifications for user feedback */
  notifications: Array<{ id: string; message: string; type: 'success' | 'info' | 'error'; timestamp: number }>;
  addNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  confettiTrigger: number;
  triggerConfetti: () => void;

  /** Last saved spending plan reference number */
  lastReference: string;
  setLastReference: (ref: string) => void;

  /** Planned Purchase Details */
  purchaseDetails: {
    productName: string;
    plannedCost: string;
    savedAmount: string;
    tenureMonths: string;
  };
  setPurchaseDetails: (details: Partial<FinanceState["purchaseDetails"]>) => void;

  /** Supporting File (receipt/quote/invoice) */
  fileUrl: string;
  setFileUrl: (url: string) => void;

  // NEW PERSONAL FINANCE FEATURES
  accentColor: "green" | "purple" | "blue" | "orange";
  currency: string;
  onboarded: boolean;
  startingBalance: number;
  dailyBudget: number;
  weeklyBudget: number;
  monthlyBudget: number;
  transactions: Transaction[];
  categories: Category[];
  spendingPlans: SpendingPlan[];
  accounts: Account[];
  pendingMutations: PendingMutation[];

  setAccentColor: (color: "green" | "purple" | "blue" | "orange") => void;
  setCurrency: (currency: string) => void;
  setOnboarded: (onboarded: boolean) => void;
  setStartingBalance: (balance: number) => void;
  setDailyBudget: (budget: number) => void;
  setWeeklyBudget: (budget: number) => void;
  setMonthlyBudget: (budget: number) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setCategories: (categories: Category[]) => void;
  setSpendingPlans: (plans: SpendingPlan[]) => void;
  setAccounts: (accounts: Account[]) => void;
  
  // Offline-first actions
  syncOfflineData: () => Promise<void>;
  addTransactionLocal: (transaction: Omit<Transaction, "id"> & { id?: string }, skipSync?: boolean) => Promise<void>;
  deleteTransactionLocal: (id: string, skipSync?: boolean) => Promise<void>;
  updateTransactionLocal: (id: string, updates: Partial<Transaction>, skipSync?: boolean) => Promise<void>;
  addCategoryLocal: (category: Omit<Category, "id"> & { id?: number }, skipSync?: boolean) => Promise<void>;
  updateCategoryLocal: (id: number, updates: Partial<Category>, skipSync?: boolean) => Promise<void>;
  addSpendingPlanLocal: (plan: Omit<SpendingPlan, "id" | "created_at"> & { id?: string; created_at?: string }, skipSync?: boolean) => Promise<void>;
  deleteSpendingPlanLocal: (id: string, skipSync?: boolean) => Promise<void>;
  updateSpendingPlanLocal: (id: string, updates: Partial<SpendingPlan>, skipSync?: boolean) => Promise<void>;
  addAccountLocal: (account: Omit<Account, "id" | "created_at"> & { id?: string; created_at?: string }, skipSync?: boolean) => Promise<void>;
  deleteAccountLocal: (id: string, skipSync?: boolean) => Promise<void>;
  updateAccountLocal: (id: string, updates: Partial<Account>, skipSync?: boolean) => Promise<void>;
  updateProfilePreferences: (updates: { starting_balance?: number; currency?: string; accent_color?: string; onboarded?: boolean; daily_budget?: number; weekly_budget?: number; monthly_budget?: number }) => Promise<void>;

  /** Actions */
  resetStore: () => void;
  clearPurchaseDetails: () => void;
}

const initialState = {
  notifications: [],
  confettiTrigger: 0,
  lastReference: '',
  purchaseDetails: {
    productName: "",
    plannedCost: "",
    savedAmount: "",
    tenureMonths: "",
  },
  fileUrl: "",
  accentColor: "green" as const,
  currency: "USD",
  onboarded: false,
  startingBalance: 0,
  dailyBudget: 0,
  weeklyBudget: 0,
  monthlyBudget: 0,
  transactions: [],
  categories: [],
  spendingPlans: [],
  accounts: [],
  pendingMutations: [],
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      ...initialState,
      addNotification: (message, type = 'info') =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { id: Math.random().toString(36).substring(7), message, type, timestamp: Date.now() }
          ]
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),
      triggerConfetti: () => set((state) => ({ confettiTrigger: state.confettiTrigger + 1 })),
      setLastReference: (ref) => set({ lastReference: ref }),
      setPurchaseDetails: (details) =>
        set((state) => ({
          purchaseDetails: { ...state.purchaseDetails, ...details },
        })),
      setFileUrl: (url) => set({ fileUrl: url }),
      
      setAccentColor: (color) => set({ accentColor: color }),
      setCurrency: (currency) => set({ currency }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setStartingBalance: (startingBalance) => set({ startingBalance }),
      setDailyBudget: (dailyBudget) => set({ dailyBudget }),
      setWeeklyBudget: (weeklyBudget) => set({ weeklyBudget }),
      setMonthlyBudget: (monthlyBudget) => set({ monthlyBudget }),
      setTransactions: (transactions) => set({ transactions }),
      setCategories: (categories) => set({ categories }),
      setSpendingPlans: (spendingPlans) => set({ spendingPlans }),
      setAccounts: (accounts) => set({ accounts }),

      syncOfflineData: async () => {
        const state = get();
        if (typeof window === "undefined" || !navigator.onLine || !process.env.NEXT_PUBLIC_SUPABASE_URL || state.pendingMutations.length === 0) return;
        
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        if (!supabase) return;
        
        const mutations = [...state.pendingMutations];
        const failedMutations: typeof mutations = [];
        
        for (const mutation of mutations) {
          try {
            if (mutation.type === 'CREATE_TRANSACTION') {
              const { error } = await supabase.from('transactions').insert(mutation.payload);
              if (error) throw error;
            } else if (mutation.type === 'DELETE_TRANSACTION') {
              const { error } = await supabase.from('transactions').delete().eq('id', mutation.payload.id);
              if (error) throw error;
            } else if (mutation.type === 'UPDATE_TRANSACTION') {
              const { error } = await supabase.from('transactions').update(mutation.payload.updates).eq('id', mutation.payload.id);
              if (error) throw error;
            } else if (mutation.type === 'CREATE_CATEGORY') {
              const { error } = await supabase.from('categories').insert(mutation.payload);
              if (error) throw error;
            } else if (mutation.type === 'UPDATE_PROFILE') {
              const { error } = await supabase.from('profiles').update(mutation.payload.updates).eq('id', mutation.payload.id);
              if (error) throw error;
            } else if (mutation.type === 'CREATE_SPENDING_PLAN') {
              const { error } = await supabase.from('spending_plans').insert(mutation.payload);
              if (error) throw error;
            } else if (mutation.type === 'UPDATE_CATEGORY') {
              const { error } = await supabase.from('categories').update(mutation.payload.updates).eq('id', mutation.payload.id);
              if (error) throw error;
            } else if (mutation.type === 'DELETE_SPENDING_PLAN') {
              const { error } = await supabase.from('spending_plans').delete().eq('id', mutation.payload.id);
              if (error) throw error;
            } else if (mutation.type === 'UPDATE_SPENDING_PLAN') {
              const { error } = await supabase.from('spending_plans').update(mutation.payload.updates).eq('id', mutation.payload.id);
              if (error) throw error;
            } else if (mutation.type === 'CREATE_ACCOUNT') {
              const { error } = await supabase.from('accounts').insert(mutation.payload);
              if (error) throw error;
            } else if (mutation.type === 'UPDATE_ACCOUNT') {
              const { error } = await supabase.from('accounts').update(mutation.payload.updates).eq('id', mutation.payload.id);
              if (error) throw error;
            } else if (mutation.type === 'DELETE_ACCOUNT') {
              const { error } = await supabase.from('accounts').delete().eq('id', mutation.payload.id);
              if (error) throw error;
            }
          } catch (err) {
            console.error("Failed to sync mutation:", mutation, err);
            failedMutations.push(mutation);
          }
        }
        
        set({ pendingMutations: failedMutations });
        if (failedMutations.length === 0) {
          state.addNotification("Offline changes synced successfully!", "success");
        }
      },

      addTransactionLocal: async (transaction, skipSync = false) => {
        const txId = transaction.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
        const newTx = { ...transaction, id: txId } as Transaction;
        
        set((state) => ({
          transactions: [newTx, ...state.transactions],
        }));
        
        if (newTx.spending_plan_id && (newTx.type === 'savings' || newTx.type === 'income')) {
          const plans = get().spendingPlans;
          const plan = plans.find(p => p.id === newTx.spending_plan_id);
          if (plan) {
            const currentSaved = parseFloat(plan.saved_amount as any) || 0;
            const txAmount = parseFloat(newTx.amount as any) || 0;
            const newSaved = currentSaved + txAmount;
            await get().updateSpendingPlanLocal(plan.id, { saved_amount: newSaved }, skipSync);
          }
        }

        // Adjust linked account balance
        if (newTx.account_id) {
          const accs = get().accounts;
          const targetAcc = accs.find(a => a.id === newTx.account_id);
          if (targetAcc) {
            const currentBal = parseFloat(targetAcc.balance as any) || 0;
            const txAmt = parseFloat(newTx.amount as any) || 0;
            let newBal = currentBal;
            if (targetAcc.type === 'credit') {
              // Expense on a credit card increases the debt balance; income/savings decreases it
              newBal = newTx.type === 'expense' ? currentBal + txAmt : currentBal - txAmt;
            } else {
              newBal = newTx.type === 'expense' ? currentBal - txAmt : currentBal + txAmt;
            }
            await get().updateAccountLocal(targetAcc.id, { balance: newBal }, skipSync);
          }
        }

        get().addNotification(
          `${newTx.type.toUpperCase()}: logged ${newTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${newTx.note ? `for "${newTx.note}"` : ''}`,
          'success'
        );
        get().triggerConfetti();

        if (skipSync) return;
        
        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { error } = await supabase.from('transactions').insert(newTx);
            if (!error) return;
            console.error("Failed to insert transaction to DB, queueing offline mutation:", error);
          }
        }
        
        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: Math.random().toString(36).substring(7),
              type: 'CREATE_TRANSACTION',
              payload: newTx,
              timestamp: Date.now()
            }
          ]
        }));
      },

      deleteTransactionLocal: async (id, skipSync = false) => {
        const tx = get().transactions.find(t => t.id === id);

        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id),
        }));
        
        if (tx && tx.spending_plan_id && (tx.type === 'savings' || tx.type === 'income')) {
          const plans = get().spendingPlans;
          const plan = plans.find(p => p.id === tx.spending_plan_id);
          if (plan) {
            const currentSaved = parseFloat(plan.saved_amount as any) || 0;
            const txAmount = parseFloat(tx.amount as any) || 0;
            const newSaved = Math.max(0, currentSaved - txAmount);
            await get().updateSpendingPlanLocal(plan.id, { saved_amount: newSaved }, skipSync);
          }
        }

        // Revert linked account balance
        if (tx && tx.account_id) {
          const accs = get().accounts;
          const targetAcc = accs.find(a => a.id === tx.account_id);
          if (targetAcc) {
            const currentBal = parseFloat(targetAcc.balance as any) || 0;
            const txAmt = parseFloat(tx.amount as any) || 0;
            let revertedBal = currentBal;
            if (targetAcc.type === 'credit') {
              // Revert credit balance: expense decreases debt; income/savings increases it
              revertedBal = tx.type === 'expense' ? currentBal - txAmt : currentBal + txAmt;
            } else {
              revertedBal = tx.type === 'expense' ? currentBal + txAmt : currentBal - txAmt;
            }
            await get().updateAccountLocal(targetAcc.id, { balance: revertedBal }, skipSync);
          }
        }

        if (tx) {
          get().addNotification(`Transaction deleted.`, 'info');
        }

        if (skipSync) return;
        
        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (!error) return;
            console.error("Failed to delete transaction from DB, queueing offline mutation:", error);
          }
        }
        
        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: Math.random().toString(36).substring(7),
              type: 'DELETE_TRANSACTION',
              payload: { id },
              timestamp: Date.now()
            }
          ]
        }));
      },

      updateTransactionLocal: async (id, updates, skipSync = false) => {
        const oldTx = get().transactions.find(t => t.id === id);
        if (!oldTx) return;

        set((state) => ({
          transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t),
        }));
        
        const newTx = { ...oldTx, ...updates } as Transaction;

        const amountChanged = oldTx.amount !== newTx.amount;
        const typeChanged = oldTx.type !== newTx.type;
        const planChanged = oldTx.spending_plan_id !== newTx.spending_plan_id;

        if (amountChanged || typeChanged || planChanged) {
          const plans = get().spendingPlans;
          
          if (oldTx.spending_plan_id && (oldTx.type === 'savings' || oldTx.type === 'income')) {
            const oldPlan = plans.find(p => p.id === oldTx.spending_plan_id);
            if (oldPlan) {
              const currentSaved = parseFloat(oldPlan.saved_amount as any) || 0;
              const txAmount = parseFloat(oldTx.amount as any) || 0;
              const revertedSaved = Math.max(0, currentSaved - txAmount);
              await get().updateSpendingPlanLocal(oldPlan.id, { saved_amount: revertedSaved }, skipSync);
            }
          }

          if (newTx.spending_plan_id && (newTx.type === 'savings' || newTx.type === 'income')) {
            const latestPlans = get().spendingPlans;
            const newPlan = latestPlans.find(p => p.id === newTx.spending_plan_id);
            if (newPlan) {
              const currentSaved = parseFloat(newPlan.saved_amount as any) || 0;
              const txAmount = parseFloat(newTx.amount as any) || 0;
              const updatedSaved = currentSaved + txAmount;
              await get().updateSpendingPlanLocal(newPlan.id, { saved_amount: updatedSaved }, skipSync);
            }
          }
        }

        // Revert old transaction account balance
        if (oldTx.account_id) {
          const accs = get().accounts;
          const targetAcc = accs.find(a => a.id === oldTx.account_id);
          if (targetAcc) {
            const currentBal = parseFloat(targetAcc.balance as any) || 0;
            const txAmt = parseFloat(oldTx.amount as any) || 0;
            let revertedBal = currentBal;
            if (targetAcc.type === 'credit') {
              revertedBal = oldTx.type === 'expense' ? currentBal - txAmt : currentBal + txAmt;
            } else {
              revertedBal = oldTx.type === 'expense' ? currentBal + txAmt : currentBal - txAmt;
            }
            await get().updateAccountLocal(targetAcc.id, { balance: revertedBal }, skipSync);
          }
        }

        // Apply new transaction account balance
        if (newTx.account_id) {
          const accs = get().accounts; // Read again to get the reverted balance
          const targetAcc = accs.find(a => a.id === newTx.account_id);
          if (targetAcc) {
            const currentBal = parseFloat(targetAcc.balance as any) || 0;
            const txAmt = parseFloat(newTx.amount as any) || 0;
            let newBal = currentBal;
            if (targetAcc.type === 'credit') {
              newBal = newTx.type === 'expense' ? currentBal + txAmt : currentBal - txAmt;
            } else {
              newBal = newTx.type === 'expense' ? currentBal - txAmt : currentBal + txAmt;
            }
            await get().updateAccountLocal(targetAcc.id, { balance: newBal }, skipSync);
          }
        }

        get().addNotification(`Transaction updated.`, 'success');

        if (skipSync) return;
        
        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { error } = await supabase.from('transactions').update(updates).eq('id', id);
            if (!error) return;
            console.error("Failed to update transaction in DB, queueing offline mutation:", error);
          }
        }
        
        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: Math.random().toString(36).substring(7),
              type: 'UPDATE_TRANSACTION',
              payload: { id, updates },
              timestamp: Date.now()
            }
          ]
        }));
      },

      addCategoryLocal: async (category, skipSync = false) => {
        const catId = category.id || Math.floor(Math.random() * 1000000);
        const newCat = { ...category, id: catId } as Category;

        set((state) => ({
          categories: [...state.categories, newCat],
        }));
        
        if (skipSync) return;
        
        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { error } = await supabase.from('categories').insert(newCat);
            if (!error) return;
            console.error("Failed to insert category to DB, queueing offline mutation:", error);
          }
        }
        
        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: Math.random().toString(36).substring(7),
              type: 'CREATE_CATEGORY',
              payload: newCat,
              timestamp: Date.now()
            }
          ]
        }));
      },

      updateCategoryLocal: async (id, updates, skipSync = false) => {
        set((state) => ({
          categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c),
        }));
        
        if (skipSync) return;
        
        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { error } = await supabase.from('categories').update(updates).eq('id', id);
            if (!error) return;
            console.error("Failed to update category in DB, queueing offline mutation:", error);
          }
        }
        
        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: Math.random().toString(36).substring(7),
              type: 'UPDATE_CATEGORY',
              payload: { id, updates },
              timestamp: Date.now()
            }
          ]
        }));
      },

      addSpendingPlanLocal: async (plan, skipSync = false) => {
        const planId = plan.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
        const createdAt = plan.created_at || new Date().toISOString();
        const newPlan = { ...plan, id: planId, created_at: createdAt } as SpendingPlan;
        
        set((state) => ({
          spendingPlans: [newPlan, ...state.spendingPlans],
        }));

        get().triggerConfetti();
        
        if (skipSync) return;
        
        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { error } = await supabase.from('spending_plans').insert(newPlan);
            if (!error) return;
            console.error("Failed to insert plan to DB, queueing offline mutation:", error);
          }
        }
        
        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: Math.random().toString(36).substring(7),
              type: 'CREATE_SPENDING_PLAN',
              payload: newPlan,
              timestamp: Date.now()
            }
          ]
        }));
      },

      deleteSpendingPlanLocal: async (id, skipSync = false) => {
        set((state) => ({
          spendingPlans: state.spendingPlans.filter(p => p.id !== id),
          // Disassociate plan from any linked transactions locally
          transactions: state.transactions.map(t => t.spending_plan_id === id ? { ...t, spending_plan_id: null } : t)
        }));

        if (skipSync) return;

        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { error } = await supabase.from('spending_plans').delete().eq('id', id);
            if (!error) return;
            console.error("Failed to delete spending plan from DB, queueing offline mutation:", error);
          }
        }

        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: Math.random().toString(36).substring(7),
              type: 'DELETE_SPENDING_PLAN',
              payload: { id },
              timestamp: Date.now()
            }
          ]
        }));
      },

      updateSpendingPlanLocal: async (id, updates, skipSync = false) => {
        const oldPlan = get().spendingPlans.find(p => p.id === id);
        
        set((state) => ({
          spendingPlans: state.spendingPlans.map(p => p.id === id ? { ...p, ...updates } : p)
        }));

        const newPlan = { ...oldPlan, ...updates } as SpendingPlan;

        if (oldPlan && 
            ((updates.status === 'completed' && oldPlan.status !== 'completed') || 
             (newPlan.saved_amount >= newPlan.planned_cost && oldPlan.saved_amount < oldPlan.planned_cost && newPlan.planned_cost > 0))
        ) {
          get().triggerConfetti();
          get().addNotification(`Congratulations! Your goal "${newPlan.product_name}" is fully funded! 🎉`, "success");
        }

        if (skipSync) return;

        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { error } = await supabase.from('spending_plans').update(updates).eq('id', id);
            if (!error) return;
            console.error("Failed to update spending plan in DB, queueing offline mutation:", error);
          }
        }

        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: Math.random().toString(36).substring(7),
              type: 'UPDATE_SPENDING_PLAN',
              payload: { id, updates },
              timestamp: Date.now()
            }
          ]
        }));
      },

      addAccountLocal: async (account, skipSync = false) => {
        const accId = account.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
        const createdAt = account.created_at || new Date().toISOString();
        const newAcc = { ...account, id: accId, created_at: createdAt } as Account;

        set((state) => ({
          accounts: [...state.accounts, newAcc],
        }));

        get().addNotification(`Account "${newAcc.name}" created successfully.`, 'success');
        get().triggerConfetti();

        if (skipSync) return;

        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { error } = await supabase.from('accounts').insert(newAcc);
            if (!error) return;
            console.error("Failed to insert account to DB, queueing offline mutation:", error);
          }
        }

        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: Math.random().toString(36).substring(7),
              type: 'CREATE_ACCOUNT',
              payload: newAcc,
              timestamp: Date.now()
            }
          ]
        }));
      },

      deleteAccountLocal: async (id, skipSync = false) => {
        const acc = get().accounts.find(a => a.id === id);

        set((state) => ({
          accounts: state.accounts.filter(a => a.id !== id),
          // Disassociate account from any linked transactions locally
          transactions: state.transactions.map(t => t.account_id === id ? { ...t, account_id: null } : t)
        }));

        if (acc) {
          get().addNotification(`Account "${acc.name}" deleted.`, 'info');
        }

        if (skipSync) return;

        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { error } = await supabase.from('accounts').delete().eq('id', id);
            if (!error) return;
            console.error("Failed to delete account from DB, queueing offline mutation:", error);
          }
        }

        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: Math.random().toString(36).substring(7),
              type: 'DELETE_ACCOUNT',
              payload: { id },
              timestamp: Date.now()
            }
          ]
        }));
      },

      updateAccountLocal: async (id, updates, skipSync = false) => {
        set((state) => ({
          accounts: state.accounts.map(a => a.id === id ? { ...a, ...updates } : a)
        }));

        if (skipSync) return;

        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { error } = await supabase.from('accounts').update(updates).eq('id', id);
            if (!error) return;
            console.error("Failed to update account in DB, queueing offline mutation:", error);
          }
        }

        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              id: Math.random().toString(36).substring(7),
              type: 'UPDATE_ACCOUNT',
              payload: { id, updates },
              timestamp: Date.now()
            }
          ]
        }));
      },

      updateProfilePreferences: async (updates) => {
        set((state) => ({
          startingBalance: updates.starting_balance !== undefined ? updates.starting_balance : state.startingBalance,
          currency: updates.currency !== undefined ? updates.currency : state.currency,
          accentColor: (updates.accent_color !== undefined ? updates.accent_color : state.accentColor) as any,
          onboarded: updates.onboarded !== undefined ? updates.onboarded : state.onboarded,
          dailyBudget: updates.daily_budget !== undefined ? updates.daily_budget : state.dailyBudget,
          weeklyBudget: updates.weekly_budget !== undefined ? updates.weekly_budget : state.weeklyBudget,
          monthlyBudget: updates.monthly_budget !== undefined ? updates.monthly_budget : state.monthlyBudget,
        }));
        
        let synced = false;
        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
              const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
              if (!error) synced = true;
            }
          }
        }
        
        if (!synced && typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
              set((state) => ({
                pendingMutations: [
                  ...state.pendingMutations,
                  {
                    id: Math.random().toString(36).substring(7),
                    type: 'UPDATE_PROFILE',
                    payload: { id: session.user.id, updates },
                    timestamp: Date.now()
                  }
                ]
              }));
            }
          }
        }
      },

      resetStore: () => set(initialState),
      clearPurchaseDetails: () => set({
        purchaseDetails: {
          productName: "",
          plannedCost: "",
          savedAmount: "",
          tenureMonths: "",
        },
        fileUrl: ""
      }),
    }),
    {
      name: "moneyly-finance-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
