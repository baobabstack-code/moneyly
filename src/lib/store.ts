import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'expense' | 'income';
  category_id?: number | null;
  category_name?: string | null;
  category_emoji?: string | null;
  note?: string | null;
  date: string;
  created_at?: string;
}

export interface Category {
  id: number;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'expense' | 'income';
}

export interface PendingMutation {
  id: string;
  type: 'CREATE_TRANSACTION' | 'DELETE_TRANSACTION' | 'UPDATE_TRANSACTION' | 'CREATE_CATEGORY' | 'UPDATE_PROFILE';
  payload: any;
  timestamp: number;
}

/**
 * Moneyly plan-builder store.
 * Tracks details for planned purchase, preferences, transactions, and offline sync queue.
 */
export interface ApplicationState {
  /** System notifications for user feedback */
  notifications: Array<{ id: string; message: string; type: 'success' | 'info' | 'error'; timestamp: number }>;
  addNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
  clearNotifications: () => void;

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
  setPurchaseDetails: (details: Partial<ApplicationState["purchaseDetails"]>) => void;

  /** Supporting File (receipt/quote/invoice) */
  fileUrl: string;
  setFileUrl: (url: string) => void;

  // NEW PERSONAL FINANCE FEATURES
  accentColor: "green" | "purple" | "blue" | "orange";
  currency: string;
  onboarded: boolean;
  startingBalance: number;
  transactions: Transaction[];
  categories: Category[];
  pendingMutations: PendingMutation[];

  setAccentColor: (color: "green" | "purple" | "blue" | "orange") => void;
  setCurrency: (currency: string) => void;
  setOnboarded: (onboarded: boolean) => void;
  setStartingBalance: (balance: number) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setCategories: (categories: Category[]) => void;
  
  // Offline-first actions
  syncOfflineData: () => Promise<void>;
  addTransactionLocal: (transaction: Omit<Transaction, "id"> & { id?: string }, skipSync?: boolean) => Promise<void>;
  deleteTransactionLocal: (id: string, skipSync?: boolean) => Promise<void>;
  updateTransactionLocal: (id: string, updates: Partial<Transaction>, skipSync?: boolean) => Promise<void>;
  addCategoryLocal: (category: Omit<Category, "id"> & { id?: number }, skipSync?: boolean) => Promise<void>;
  updateProfilePreferences: (updates: { starting_balance?: number; currency?: string; accent_color?: string; onboarded?: boolean }) => Promise<void>;

  /** Actions */
  resetStore: () => void;
}

const initialState = {
  notifications: [],
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
  transactions: [],
  categories: [],
  pendingMutations: [],
};

export const useApplicationStore = create<ApplicationState>()(
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
      clearNotifications: () => set({ notifications: [] }),
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
      setTransactions: (transactions) => set({ transactions }),
      setCategories: (categories) => set({ categories }),

      syncOfflineData: async () => {
        const state = get();
        if (typeof window === "undefined" || !navigator.onLine || !process.env.NEXT_PUBLIC_SUPABASE_URL || state.pendingMutations.length === 0) return;
        
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        
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
        const txId = transaction.id || crypto.randomUUID();
        const newTx = { ...transaction, id: txId } as Transaction;
        
        set((state) => ({
          transactions: [newTx, ...state.transactions],
        }));
        
        if (skipSync) return;
        
        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          const { error } = await supabase.from('transactions').insert(newTx);
          if (!error) return;
          console.error("Failed to insert transaction to DB, queueing offline mutation:", error);
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
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id),
        }));
        
        if (skipSync) return;
        
        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          const { error } = await supabase.from('transactions').delete().eq('id', id);
          if (!error) return;
          console.error("Failed to delete transaction from DB, queueing offline mutation:", error);
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
        set((state) => ({
          transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t),
        }));
        
        if (skipSync) return;
        
        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          const { error } = await supabase.from('transactions').update(updates).eq('id', id);
          if (!error) return;
          console.error("Failed to update transaction in DB, queueing offline mutation:", error);
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
          const { error } = await supabase.from('categories').insert(newCat);
          if (!error) return;
          console.error("Failed to insert category to DB, queueing offline mutation:", error);
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

      updateProfilePreferences: async (updates) => {
        set((state) => ({
          startingBalance: updates.starting_balance !== undefined ? updates.starting_balance : state.startingBalance,
          currency: updates.currency !== undefined ? updates.currency : state.currency,
          accentColor: (updates.accent_color !== undefined ? updates.accent_color : state.accentColor) as any,
          onboarded: updates.onboarded !== undefined ? updates.onboarded : state.onboarded,
        }));
        
        let synced = false;
        if (typeof window !== "undefined" && navigator.onLine && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
            if (!error) synced = true;
          }
        }
        
        if (!synced && typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
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
      },

      resetStore: () => set(initialState),
    }),
    {
      name: "moneyly-plan-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
