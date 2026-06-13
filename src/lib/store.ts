import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Moneyly plan-builder store.
 * Tracks details for a new planned purchase or spending plan.
 */
export interface ApplicationState {
  /** System notifications for user feedback */
  notifications: Array<{ id: string; message: string; type: 'success' | 'info' | 'error'; timestamp: number }>;
  addNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
  clearNotifications: () => void;

  /** Last saved spending plan reference number */
  lastReference: string;
  setLastReference: (ref: string) => void;
  
  /** Purchase Source (Store/Category) */
  selectedStoreId: number | null;
  selectedStoreName: string;
  setSelectedStore: (id: number, name: string) => void;

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

  /** Actions */
  resetStore: () => void;
}

const initialState = {
  notifications: [],
  lastReference: '',
  selectedStoreId: null,
  selectedStoreName: "",
  purchaseDetails: {
    productName: "",
    plannedCost: "",
    savedAmount: "",
    tenureMonths: "",
  },
  fileUrl: "",
};

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set) => ({
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
      setSelectedStore: (id, name) =>
        set({ selectedStoreId: id, selectedStoreName: name }),
      setPurchaseDetails: (details) =>
        set((state) => ({
          purchaseDetails: { ...state.purchaseDetails, ...details },
        })),
      setFileUrl: (url) => set({ fileUrl: url }),
      resetStore: () => set(initialState),
    }),
    {
      name: "moneyly-plan-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
